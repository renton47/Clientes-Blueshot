// =============================================================================
// AI PROVIDER — Abstracción agnóstica al proveedor LLM
// =============================================================================
// Para cambiar de OpenAI a Anthropic o Gemini, solo cambia la implementación
// registrada aquí. El resto de la aplicación no cambia.
// =============================================================================

import type { AIProvider, AIProviderName } from '@/types/ai'
import { createOpenAIProvider } from './openai'
import { createGeminiProvider } from './gemini'

let _openaiProvider: AIProvider | null = null
let _geminiProvider: AIProvider | null = null

/**
 * Obtiene el proveedor de IA configurado.
 * Singleton — se crea una sola vez por proceso para cada proveedor.
 */
export function getAIProvider(providerName?: AIProviderName): AIProvider {
  const name = providerName ?? ((process.env.AI_PROVIDER ?? 'openai') as AIProviderName)

  switch (name) {
    case 'openai':
      if (!_openaiProvider) _openaiProvider = createOpenAIProvider()
      return _openaiProvider
    case 'gemini':
      if (!_geminiProvider) _geminiProvider = createGeminiProvider()
      return _geminiProvider
    default:
      throw new Error(`Proveedor de IA no soportado: ${name}. Usa "openai" o "gemini".`)
  }
}

// Permite reemplazar el proveedor en tests (usualmente openai)
export function setAIProvider(provider: AIProvider): void {
  if (provider.name === 'gemini') {
    _geminiProvider = provider
  } else {
    _openaiProvider = provider
  }
}

export function resetAIProvider(): void {
  _openaiProvider = null
  _geminiProvider = null
}
