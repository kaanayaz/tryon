import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const { userImageData, clothingImageData, userImageType, clothingImageType } = await req.json()

    if (!userImageData || !clothingImageData || !userImageType || !clothingImageType) {
      throw new Error('Missing required image data')
    }

    // Construct the request body with safety settings and improved prompt
    const requestBody = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: userImageType,
                data: userImageData
              }
            },
            {
              inlineData: {
                mimeType: clothingImageType,
                data: clothingImageData
              }
            },
            {
              text: "Create a realistic virtual try-on by digitally placing the clothing item from the second image onto the person in the first image. This is for fashion e-commerce purposes. Instructions: 1) Keep the person's pose, body shape, and background completely unchanged. 2) Replace only the current clothing with the new item. 3) Ensure the clothing fits naturally with proper draping and realistic lighting. 4) Maintain a professional, modest appearance suitable for fashion retail. This is a standard virtual try-on service used by clothing retailers."
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"]
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH"
        }
      ]
    }

    console.log('Sending request to Gemini with body:', JSON.stringify({
      ...requestBody,
      contents: requestBody.contents.map(content => ({
        ...content,
        parts: content.parts.map(part => part.inlineData ? { inlineData: { mimeType: part.inlineData.mimeType, data: "..." } } : part)
      }))
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    )

    console.log('Gemini API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return new Response(
        JSON.stringify({ 
          error: `Gemini API error: ${response.status} - ${errorText}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    const result = await response.json()
    console.log('Gemini response structure:', JSON.stringify(result, null, 2))

    // Check for prohibited content or other finish reasons
    if (result.candidates && result.candidates.length > 0) {
      const candidate = result.candidates[0]
      
      // Handle prohibited content specifically
      if (candidate.finishReason === 'PROHIBITED_CONTENT') {
        return new Response(
          JSON.stringify({ 
            error: 'PROHIBITED_CONTENT',
            message: 'The AI safety system blocked this request. Please try with different images - ensure they are appropriate and clearly show a person and clothing item.',
            userMessage: 'Content blocked by AI safety filters. Please try different images.'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }
      
      // Handle other finish reasons
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        return new Response(
          JSON.stringify({ 
            error: 'GENERATION_FAILED',
            message: `Generation failed with reason: ${candidate.finishReason}`,
            userMessage: `Processing failed: ${candidate.finishReason}. Please try again with different images.`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }
      
      // Look for the generated image
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png'
            const imageDataUrl = `data:${mimeType};base64,${part.inlineData.data}`
            
            return new Response(
              JSON.stringify({ imageUrl: imageDataUrl }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      }
    }

    // If no image found, return error
    return new Response(
      JSON.stringify({ 
        error: 'NO_IMAGE_GENERATED',
        message: 'No image was generated in the response',
        userMessage: 'Failed to generate image. Please try again.',
        response: result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )

  } catch (error) {
    console.error('Virtual try-on error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})