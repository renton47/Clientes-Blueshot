// =============================================================================
// OPENAI PROVIDER — Implementación concreta del AIProvider para OpenAI
// =============================================================================
// SEGURIDAD: La API key NUNCA sale del servidor. Este archivo solo se ejecuta
// en API Routes (Node.js runtime), nunca en el navegador.
// =============================================================================

import OpenAI from 'openai'
import type { AIProvider, AICompletionOptions, AICompletionResult, AIGenerateImageOptions, AIGenerateImageResult } from '@/types/ai'

function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY no está configurada. Agrega la variable en .env.local'
    )
  }

  return new OpenAI({ apiKey })
}

export function createOpenAIProvider(): AIProvider {
  const client = createOpenAIClient()
  const defaultModel = process.env.OPENAI_MODEL ?? 'gpt-4o'

  return {
    name: 'openai',

    async complete(options: AICompletionOptions): Promise<AICompletionResult> {
      const response = await client.chat.completions.create({
        model: options.model ?? defaultModel,
        messages: options.messages,
        temperature: 1,
        max_completion_tokens: options.maxTokens ?? 4096,
        stream: false,
      })

      const choice = response.choices[0]
      const content = choice.message.content ?? ''

      return {
        content,
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
      }
    },

    async *stream(options: AICompletionOptions): AsyncGenerator<string, void, unknown> {
      const stream = await client.chat.completions.create({
        model: options.model ?? defaultModel,
        messages: options.messages,
        temperature: 1,
        max_completion_tokens: options.maxTokens ?? 4096,
        stream: true,
      })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) yield delta
      }
    },

    async generateImage(options: AIGenerateImageOptions): Promise<AIGenerateImageResult> {
      try {
        const response = await client.images.generate({
          model: 'dall-e-3',
          prompt: options.prompt,
          n: 1,
          size: '1024x1024',
        })

        const images = response.data.map(img => {
          return {
            url: img.url ?? '',
            base64: ''
          }
        })

        return { images }
      } catch (error: any) {
        // Fallback to dall-e-2 if dall-e-3 is not available (e.g., Free Tier API keys)
        if (error?.message?.includes('does not exist') || error?.status === 404 || error?.status === 400) {
          const fallbackResponse = await client.images.generate({
            model: 'dall-e-2',
            prompt: options.prompt,
            n: 1,
            size: '1024x1024',
          })
          
          const images = fallbackResponse.data.map(img => ({
            url: img.url ?? '',
            base64: ''
          }))
          
          return { images }
        }
        throw error;
      }
    }
  }
}
