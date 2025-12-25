
import { GoogleGenAI, Part } from "@google/genai";
import { GenerationConfig, DesignTask, AspectRatio } from "../types";

// Models
const MODEL_PRO = 'gemini-3-pro-image-preview'; 
const MODEL_TEXT = 'gemini-3-flash-preview'; 

/**
 * CHANNEL CONFIGURATION
 * Danh sách 5 Key cứng để đảm bảo hoạt động ổn định trên bản build (Dist).
 * Người dùng sẽ chọn kênh thủ công từ giao diện.
 */
const CHANNEL_KEYS: string[] = [
  'AIzaSyDJ9NMJNBGPoc-wNjKkWbsOJMgo2_KIiEk', // Kênh 1
  'AIzaSyCYX7rDmq8-xAZllCmpYChgFfTZntiLEmo', // Kênh 2
  'AIzaSyAkj-RuvyLHcVbAOB9OXywJaDGaaTL3z94', // Kênh 3
  'AIzaSyAfkmc_ugzH5nR3BirZMcBODbLc0paMC24', // Kênh 4
  'AIzaSyB1dPTRDSPXUwbPHHRMxhcl3aVVmBuRJy8', // Kênh 5
];

export const getTotalChannels = () => CHANNEL_KEYS.length;

const ensureApiKeyForPro = async () => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      return true;
    }
  }
  return true;
};

const generateSingleImageRequest = async (
  ai: GoogleGenAI, 
  model: string, 
  parts: Part[], 
  config: GenerationConfig
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: parts },
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio,
        imageSize: config.resolution 
      }
    }
  });

  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("Không có phản hồi hình ảnh.");
};

/**
 * Hàm tạo ảnh chính
 * @param config Cấu hình tạo ảnh
 * @param channelIndex Chỉ số kênh (0-4) được chọn từ UI
 */
export const generateDesignContent = async (config: GenerationConfig, channelIndex: number): Promise<{ type: 'image' | 'text', contents: string[] }> => {
  await ensureApiKeyForPro();

  // 1. Lấy API Key dựa trên kênh người dùng chọn
  // Fallback về kênh 0 nếu index không hợp lệ
  const selectedKey = CHANNEL_KEYS[channelIndex] || CHANNEL_KEYS[0];
  const ai = new GoogleGenAI({ apiKey: selectedKey });

  // 2. Xử lý Prompt
  let finalPrompt = config.prompt;
  const bgInstruction = config.useSolidBackground && config.backgroundColor
    ? `Background: Isolated on solid ${config.backgroundColor} background. Ensure clean edges.` 
    : ""; 

  switch (config.task) {
    case DesignTask.DESIGN:
      finalPrompt = `Professional graphic design for Enterprise. Theme: "${config.prompt}". Cinematic lighting, high quality background texture or composition.`;
      break;
    case DesignTask.HEADLINE_STICKER:
      finalPrompt = `Isolated object or typography design. "${config.prompt}". Clean vector style or high-contrast typography, die-cut appearance. ${bgInstruction}`;
      break;
    default:
      finalPrompt = `${config.prompt}. High quality design.`;
      break;
  }

  const parts: Part[] = [];
  if (config.referenceImages && config.referenceImages.length > 0) {
      config.referenceImages.forEach((base64String, index) => {
          const cleanBase64 = base64String.includes(',') ? base64String.split(',')[1] : base64String;
          const mime = config.referenceImageMimeTypes?.[index] || 'image/png';
          parts.push({ inlineData: { data: cleanBase64, mimeType: mime } });
      });
  }

  parts.push({ text: finalPrompt });

  // 3. Thực thi request
  const numberOfVariations = config.numberOfImages || 4;
  
  const promises = Array(numberOfVariations).fill(null).map(() => 
      generateSingleImageRequest(ai, MODEL_PRO, parts, config)
        .catch(() => null)
  );

  const results = await Promise.all(promises);
  const successfulImages = results.filter((img): img is string => img !== null);

  if (successfulImages.length === 0) {
       throw new Error(`Kênh số ${channelIndex + 1} đang bận hoặc gặp lỗi. Vui lòng chọn kênh khác trên thanh công cụ.`);
  }

  return { type: 'image', contents: successfulImages };
};

export const optimizeDesignPrompt = async (
  input: string,
  formData?: { subject: string; context: string; style: string; mood: string },
  channelIndex: number = 0
): Promise<string> => {
  
  const selectedKey = CHANNEL_KEYS[channelIndex] || CHANNEL_KEYS[0];
  const ai = new GoogleGenAI({ apiKey: selectedKey });

  let prompt = "";
  if (formData) {
     prompt = `Act as an expert Prompt Engineer. Create a descriptive English prompt:
     - Subject: ${formData.subject}
     - Context: ${formData.context}
     - Style: ${formData.style}
     - Mood: ${formData.mood}
     Output ONLY the prompt.`;
  } else {
     prompt = `Refine and expand into a professional English prompt: "${input}". Output ONLY the prompt.`;
  }

  const response = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: prompt,
  });

  return response.text?.trim() || "Lỗi tạo prompt.";
};
