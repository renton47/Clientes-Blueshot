import { GoogleGenAI } from '@google/genai'
import type { AIProvider, AICompletionOptions, AICompletionResult, AIGenerateImageOptions, AIGenerateImageResult } from '@/types/ai'

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY no está configurada. Agrega la variable en .env.local o Vercel'
    )
  }

  return new GoogleGenAI({ apiKey })
}

export function createGeminiProvider(): AIProvider {
  const client = createGeminiClient()
  const defaultModel = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'

  return {
    name: 'gemini',

    async complete(options: AICompletionOptions): Promise<AICompletionResult> {
      const response = await client.models.generateContent({
        model: options.model ?? defaultModel,
        contents: options.messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : m.role,
          parts: [{ text: m.content }]
        }))
      })

      return {
        content: response.text ?? '',
        model: options.model ?? defaultModel,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      }
    },

    async *stream(options: AICompletionOptions): AsyncGenerator<string, void, unknown> {
      const response = await client.models.generateContentStream({
        model: options.model ?? defaultModel,
        contents: options.messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : m.role,
          parts: [{ text: m.content }]
        }))
      })

      for await (const chunk of response) {
        if (chunk.text) yield chunk.text
      }
    },

    async generateImage(options: AIGenerateImageOptions): Promise<AIGenerateImageResult> {
      const response = await client.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: options.prompt,
        config: {
          numberOfImages: options.number_of_images ?? 1,
          outputMimeType: options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
          aspectRatio: options.aspectRatio ?? '1:1',
        }
      })

      const images = response.generatedImages?.map(img => {
        return {
          url: `data:${options.format === 'jpeg' ? 'image/jpeg' : 'image/png'};base64,${img.image.imageBytes}`,
          base64: img.image.imageBytes
        }
      }) ?? []

      return { images }
    }
  }
}
