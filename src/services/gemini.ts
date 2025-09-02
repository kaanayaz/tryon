interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
}

const SYSTEM_PROMPT = `Analyze the person in the first image (user photo) and the clothing item in the second image. Your goal is to realistically dress the person in the clothing item from the second image.

Key instructions:
- **Preserve the Person and Background:** The original person's pose, body shape, and the entire background environment must remain unchanged.
- **Replace Clothing:** Only replace the clothes the person is currently wearing with the new item.
- **High-Fidelity Clothing:** Pay meticulous attention to the details of the new clothing item. Accurately render its texture, pattern, logos, colors, and how it drapes and fits the person's body naturally. The result should look like a real photograph.`;

export class GeminiService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async processVirtualTryOn(userImage: File, clothingImage: File): Promise<string> {
    try {
      // Convert images to base64
      const userImageBase64 = await this.fileToBase64(userImage);
      const clothingImageBase64 = await this.fileToBase64(clothingImage);

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: SYSTEM_PROMPT
              },
              {
                inlineData: {
                  mimeType: userImage.type,
                  data: userImageBase64
                }
              },
              {
                inlineData: {
                  mimeType: clothingImage.type,
                  data: clothingImageBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096
        }
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const result: GeminiResponse = await response.json();
      
      // Look for generated image in response
      const generatedPart = result.candidates?.[0]?.content?.parts?.find(
        part => part.inlineData?.mimeType?.startsWith('image/')
      );

      if (generatedPart?.inlineData) {
        return `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}`;
      }

      throw new Error('No generated image found in response');
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to process virtual try-on: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}