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
 * Generates a transformed image based on input image and prompt.
 */
export const generateTransformedImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
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
            aspectRatio: "1:1", // Standard square for this UI layout
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