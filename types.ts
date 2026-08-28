export interface UploadedFile {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  resultImage: string | null;
}

export enum ModelType {
  NANO_BANANA_PRO = 'gemini-3-pro-image-preview',
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  credits: number;
}