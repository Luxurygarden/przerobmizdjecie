import { GoogleGenAI } from "@google/genai";
import { ModelType } from "../types";

/**
 * Checks if the user has selected an API key via the AI Studio integration.
 */
export const checkApiKeyStatus = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return false;
};

/**
 * Opens the API key selection dialog.
 */
export const requestApiKeySelection = async (): Promise<void> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  } else {
    console.warn("AI Studio integration not available.");
  }
};

/**
 * Analyzes the uploaded image to provide descriptions and prompt suggestions.
 */
export const analyzeImage = async (
  base64Image: string,
  mimeType: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Using gemini-2.5-flash as it is excellent for multimodal analysis (Image -> Text)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `Jesteś ekspertem od architektury krajobrazu i fotografii. Przeanalizuj to zdjęcie.
            Proszę o odpowiedź w formacie Markdown zawierającą dwie krótkie sekcje:
            
            1. **Co widzę**: Krótki, rzeczowy opis tego, co znajduje się na zdjęciu (styl domu, rodzaj ogrodu, oświetlenie, kluczowe elementy).
            2. **Sugestie do promptu**: Konkretne rady, jak najlepiej opisać zmianę tego zdjęcia dla modelu AI, aby uzyskać fotorealistyczny efekt. Wymień 3-4 słowa kluczowe, które warto użyć, oraz na co zwrócić uwagę (np. perspektywa, światło).`,
          },
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
        ],
      },
    });

    return response.text || "Nie udało się wygenerować opisu.";

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    if (error.message && error.message.includes("Requested entity was not found")) {
       throw new Error("KEY_ERROR"); 
    }
    throw error;
  }
};

/**
 * Aspect ratios accepted by the image model, as width/height values.
 */
const SUPPORTED_ASPECT_RATIOS: Array<[string, number]> = [
  ['21:9', 21 / 9],
  ['16:9', 16 / 9],
  ['3:2', 3 / 2],
  ['4:3', 4 / 3],
  ['5:4', 5 / 4],
  ['1:1', 1],
  ['4:5', 4 / 5],
  ['3:4', 3 / 4],
  ['2:3', 2 / 3],
  ['9:16', 9 / 16],
];

/**
 * Picks the supported aspect ratio closest to the source image, so a wide
 * garden photo is not squashed into a square.
 */
export const closestAspectRatio = (width: number, height: number): string => {
  if (!width || !height) return '1:1';
  const target = width / height;
  return SUPPORTED_ASPECT_RATIOS.reduce((best, current) =>
    Math.abs(current[1] - target) < Math.abs(best[1] - target) ? current : best
  )[0];
};

/**
 * Rewrites a short user prompt into a richer one for the image model.
 */
export const enhancePrompt = async (
  prompt: string,
  base64Image?: string,
  mimeType?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const parts: any[] = [
    {
      text: `Jesteś ekspertem od promptów do generowania obrazów AI oraz architektury krajobrazu.
Rozbuduj poniższy opis użytkownika w jeden zwięzły, konkretny prompt po polsku (maksymalnie 4 zdania).
Zachowaj intencję użytkownika, dodaj szczegóły materiałów, światła, pory dnia i perspektywy.
Zwróć WYŁĄCZNIE gotowy prompt, bez komentarzy i bez formatowania Markdown.

Opis użytkownika: ${prompt}`,
    },
  ];

  if (base64Image && mimeType) {
    parts.push({ inlineData: { data: base64Image, mimeType } });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });
    return response.text?.trim() || prompt;
  } catch (error: any) {
    console.error('Gemini Enhance Error:', error);
    if (error.message && error.message.includes('Requested entity was not found')) {
      throw new Error('KEY_ERROR');
    }
    throw error;
  }
};

/**
 * Generates a transformed image based on input image and prompt.
 */
export const generateTransformedImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string,
  width = 0,
  height = 0
): Promise<string> => {
  // Re-initialize per call to ensure latest key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: ModelType.NANO_BANANA_PRO,
      contents: {
        parts: [
          {
            text: `Transform the attached image based on this description: ${prompt}. Return ONLY the image.`,
          },
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
        ],
      },
      config: {
        imageConfig: {
            aspectRatio: closestAspectRatio(width, height),
            imageSize: "1K"
        },
      }
    });

    // Parse response for image data
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data found in response. The model might have refused the request.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message && error.message.includes("Requested entity was not found")) {
       // This often indicates an invalid key session in the specific environment
       throw new Error("KEY_ERROR"); 
    }
    throw error;
  }
};