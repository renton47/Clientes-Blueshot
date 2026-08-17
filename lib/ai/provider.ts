// =============================================================================
// AI PROVIDER — Abstracción agnóstica al proveedor LLM
// =============================================================================
// Para cambiar de OpenAI a Anthropic o Gemini, solo cambia la implementación
// registrada aquí. El resto de la aplicación no cambia.
// =============================================================================

import type { AIProvider, AIProviderName } from '@/types/ai'
import { createOpenAIProvider } from './openai'

let _provider: AIProvider | null = null

/**
 * Obtiene el proveedor de IA configurado.
 * Singleton — se crea una sola vez por proceso.
 */
export function getAIProvider(): AIProvider {
  if (_provider) return _provider

  const providerName = (process.env.AI_PROVIDER ?? 'openai') as AIProviderName

  switch (providerName) {
    case 'openai':
      _provider = createOpenAIProvider()
      break
    default:
      throw new Error(`Proveedor de IA no soportado: ${providerName}. Usa "openai".`)
  }

  return _provider
}

// Permite reemplazar el proveedor en tests
export function setAIProvider(provider: AIProvider): void {
  _provider = provider
}

export function resetAIProvider(): void {
  _provider = null
}
