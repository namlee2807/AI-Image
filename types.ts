
export enum AspectRatio {
  R1_1 = "1:1",
  R2_3 = "2:3",
  R3_2 = "3:2",
  R3_4 = "3:4",
  R4_3 = "4:3",
  R4_5 = "4:5",
  R5_4 = "5:4",
  R9_16 = "9:16",
  R16_9 = "16:9",
  R21_9 = "21:9"
}

export type Resolution = '1K' | '2K' | '4K';

export enum DesignTask {
  DESIGN = "design", // Kết hợp Thiết kế tổng & Background
  HEADLINE_STICKER = "headline_sticker" // Kết hợp Headline & Sticker
}

export interface GeneratedContent {
  id: string;
  type: 'image' | 'text';
  contents: string[]; // Array of results (1 for text, up to 4 for images)
  prompt: string;
  timestamp: number;
  task: DesignTask;
}

export interface GenerationConfig {
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  numberOfImages: number; // Thêm trường số lượng ảnh
  task: DesignTask;
  referenceImages?: string[]; // Array of base64 strings
  referenceImageMimeTypes?: string[];
  backgroundColor?: string; 
  useSolidBackground: boolean; 
}

export type GenerationMode = 'CREATE' | 'EDIT';

export interface ApiKeyConfig {
  keys: string[];
  currentIndex: number;
}
