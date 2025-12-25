
import { GoogleGenAI, Part } from "@google/genai";
import { GenerationConfig, DesignTask, AspectRatio } from "../types";

// Models
const MODEL_PRO = 'gemini-3-pro-image-preview'; 
const MODEL_TEXT = 'gemini-3-flash-preview'; 

/**
 * MASTER API KEYS CONFIGURATION
 * Dán 8 API Key của bạn vào mảng này.
 * Hệ thống sẽ tự động xoay vòng khi gặp lỗi 429.
 */
const MASTER_KEYS: string[] = [
  process.env.API_KEY || '', // Key mặc định (nếu có)
  'AIzaSyDJ9NMJNBGPoc-wNjKkWbsOJMgo2_KIiEk',
  'AIzaSyCYX7rDmq8-xAZllCmpYChgFfTZntiLEmo',
  'AIzaSyAkj-RuvyLHcVbAOB9OXywJaDGaaTL3z94',
  'AIzaSyAfkmc_ugzH5nR3BirZMcBODbLc0paMC24',
  'AIzaSyB1dPTRDSPXUwbPHHRMxhcl3aVVmBuRJy8',
  'AIzaSyAd0II56ntpmooEe4MLQcFiggOA4hn3JS8',
  'AIzaSyCKp500OB0GWdL8KqY29_JPv9ZbmSl9jsk',
];

// Lọc bỏ các key trống hoặc key placeholder
const ACTIVE_KEYS = MASTER_KEYS.filter(k => k && k !== '' && !k.startsWith('KEY_DU_PHONG_'));

// Global state for current key index
let currentKeyIndex = 0;

export const getStoredKeys = (): string[] => {
  return ACTIVE_KEYS.length > 0 ? ACTIVE_KEYS : [process.env.API_KEY || ''];
};

export const getActiveKeyInfo = () => {
  const keys = getStoredKeys();
  return {
    index: currentKeyIndex,
    total: keys.length,
    currentKey: keys[currentKeyIndex]
  };
};

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

// Internal wrapper to handle 429 rotation
const executeWithRotation = async <T>(operation: (ai: GoogleGenAI) => Promise<T>): Promise<T> => {
  const keys = getStoredKeys();
  let lastError: any;

  for (let i = 0; i < keys.length; i++) {
    const idx = (currentKeyIndex + i) % keys.length;
    const key = keys[idx];
    
    if (!key) continue;

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const result = await operation(ai);
      currentKeyIndex = idx;
      return result;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message || "";
      
      if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('too many requests')) {
        console.warn(`Đường truyền #${idx + 1} bị nghẽn (429). Đang tự động chuyển kênh...`);
        if (i === keys.length - 1) {
          throw new Error(`Tất cả ${keys.length} đường truyền dự phòng đều đang bận. Vui lòng thử lại sau 1 phút.`);
        }
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("Không tìm thấy đường truyền API khả dụng.");
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

export const generateDesignContent = async (config: GenerationConfig): Promise<{ type: 'image' | 'text', contents: string[] }> => {
  await ensureApiKeyForPro();

  return executeWithRotation(async (ai) => {
    let finalPrompt = config.prompt;
    const bgInstruction = config.useSolidBackground && config.backgroundColor
      ? `Background: Isolated on solid ${config.backgroundColor} background. Ensure clean edges.` 
      : ""; 

    // XỬ LÝ LOGIC 16:5 (BANNER)
    // API không hỗ trợ native 16:5, ta dùng 16:9 + Prompt định hướng bố cục ngang
    let effectiveRatio = config.aspectRatio;
    let panoramaInstruction = "";

    if (config.aspectRatio === AspectRatio.R16_5) {
        effectiveRatio = AspectRatio.R16_9; // Gửi 16:9 cho API
        panoramaInstruction = ". Wide panoramic composition (16:5 style), minimalist extended background on sides, subject centered, suitable for web banner cropping.";
    }

    // Tạo config mới với aspect ratio hợp lệ để gửi đi
    const apiRequestConfig = { ...config, aspectRatio: effectiveRatio };

    switch (config.task) {
      case DesignTask.DESIGN:
        // Đã xóa ràng buộc "Honda brand aesthetics" để hỗ trợ đa dạng thương hiệu
        finalPrompt = `Professional graphic design for Enterprise. Theme: "${config.prompt}". Cinematic lighting, high quality background texture or composition.${panoramaInstruction}`;
        break;
      case DesignTask.HEADLINE_STICKER:
        // Kết hợp Text + Sticker
        finalPrompt = `Isolated object or typography design. "${config.prompt}". Clean vector style or high-contrast typography, die-cut appearance. ${bgInstruction}`;
        break;
      default:
        finalPrompt = `${config.prompt}. High quality design.${panoramaInstruction}`;
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

    const numberOfVariations = 4;
    const promises = Array(numberOfVariations).fill(null).map(() => 
        // Sử dụng apiRequestConfig thay vì config gốc
        generateSingleImageRequest(ai, MODEL_PRO, parts, apiRequestConfig)
          .catch(() => null)
    );

    const results = await Promise.all(promises);
    const successfulImages = results.filter((img): img is string => img !== null);

    if (successfulImages.length === 0) {
         throw new Error("Không thể tạo hình ảnh trên kênh này. Đang thử kênh khác...");
    }

    return { type: 'image', contents: successfulImages };
  });
};

export const optimizeDesignPrompt = async (
  input: string,
  formData?: { subject: string; context: string; style: string; mood: string }
): Promise<string> => {
  return executeWithRotation(async (ai) => {
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
  });
};
