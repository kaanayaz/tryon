
import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageState, ClothingType } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const DEFAULT_PROMPT = `Analyze the person in the first image (user photo) and the clothing item in the second image. Your goal is to realistically dress the person in the clothing item from the second image.

Key instructions:
- **Preserve the Person and Background:** The original person's pose, body shape, and the entire background environment must remain unchanged.
- **Replace Clothing:** Only replace the clothes the person is currently wearing with the new item.
- **High-Fidelity Clothing:** Pay meticulous attention to the details of the new clothing item. Accurately render its texture, pattern, logos, colors, and how it drapes and fits the person's body naturally. The result should look like a real photograph.`;

export const virtualTryOn = async (
  userImage: ImageState,
  clothingImage: ImageState,
  prompt: string,
  clothingType: ClothingType,
): Promise<string | null> => {
  if (!userImage.base64 || !clothingImage.base64 || !userImage.mimeType || !clothingImage.mimeType) {
    throw new Error("Both user and clothing images with MIME types are required.");
  }

  let finalPrompt = prompt;
  switch (clothingType) {
    case 'top':
      finalPrompt += "\n- **Target Area:** Specifically replace the person's top (shirt, blouse, t-shirt, etc.).";
      break;
    case 'bottom':
      finalPrompt += "\n- **Target Area:** Specifically replace the person's bottom wear (pants, skirt, shorts, etc.).";
      break;
    case 'shoes':
      finalPrompt += "\n- **Target Area:** Specifically replace the person's shoes.";
      break;
    case 'everything':
      finalPrompt += "\n- **Target Area:** Replace the person's entire outfit (top, bottom, and shoes if applicable).";
      break;
  }


  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: userImage.base64,
            mimeType: userImage.mimeType,
          },
        },
        {
          inlineData: {
            data: clothingImage.base64,
            mimeType: clothingImage.mimeType,
          },
        },
        {
          text: finalPrompt,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }

  return null;
};
