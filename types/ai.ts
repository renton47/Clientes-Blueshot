// =============================================================================
// TIPOS DE IA — Contratos para la capa AIProvider y herramientas
// =============================================================================
import { z } from 'zod'

// -----------------------------------------------------------------------------
// Provider abstraction
// -----------------------------------------------------------------------------

export type AIProviderName = 'openai' | 'anthropic' | 'gemini'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AICompletionOptions {
  messages: AIMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface AICompletionResult {
  content: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIProvider {
  name: AIProviderName
  complete(options: AICompletionOptions): Promise<AICompletionResult>
  stream(options: AICompletionOptions): AsyncGenerator<string, void, unknown>
}

// -----------------------------------------------------------------------------
// Tool schemas
// -----------------------------------------------------------------------------

export const ProductToolInputSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es requerido'),
  brand: z.string().optional(),
  model: z.string().optional(),
  features: z.string().min(1, 'Las características son requeridas'),
  benefits: z.string().optional(),
  target_audience: z.string().optional(),
  price: z.string().optional(),
  additional_info: z.string().optional(),
})

export const SEOToolInputSchema = z.object({
  product_name: z.string().min(1, 'El nombre del producto es requerido'),
  category: z.string().optional(),
  description: z.string().min(1, 'La descripción es requerida'),
  target_keywords: z.string().optional(),
  competitor_info: z.string().optional(),
})

export const SocialToolInputSchema = z.object({
  product_name: z.string().min(1, 'El nombre del producto es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  platforms: z.array(z.enum(['instagram', 'facebook', 'linkedin'])).min(1),
  tone: z.string().optional(),
  promotion: z.string().optional(),
  hashtags: z.boolean().default(true),
})

export const ShoppingToolInputSchema = z.object({
  product_name: z.string().min(1, 'El nombre del producto es requerido'),
  brand: z.string().optional(),
  gtin: z.string().optional(),
  mpn: z.string().optional(),
  category: z.string().optional(),
  description: z.string().min(1, 'La descripción es requerida'),
  price: z.string().optional(),
  currency: z.string().default('CLP'),
  condition: z.enum(['new', 'used', 'refurbished']).default('new'),
})

export const OptimizationToolInputSchema = z.object({
  existing_content: z.string().min(10, 'El contenido existente es requerido'),
  content_type: z.enum(['product', 'category', 'page']).default('product'),
})

export const ChatInputSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  message: z.string().min(1, 'El mensaje no puede estar vacío').max(4000),
  tool_id: z.string().optional(),
  tool_input: z.record(z.string(), z.unknown()).optional(),
})

// Tipos inferidos
export type ProductToolInput = z.infer<typeof ProductToolInputSchema>
export type SEOToolInput = z.infer<typeof SEOToolInputSchema>
export type SocialToolInput = z.infer<typeof SocialToolInputSchema>
export type ShoppingToolInput = z.infer<typeof ShoppingToolInputSchema>
export type OptimizationToolInput = z.infer<typeof OptimizationToolInputSchema>
export type ChatInput = z.infer<typeof ChatInputSchema>

// -----------------------------------------------------------------------------
// Client context para IA
// -----------------------------------------------------------------------------

export interface ClientAIContext {
  clientId: string
  companyName?: string
  industry?: string
  websiteUrl?: string
  ecommercePlatform?: string
  country?: string
  toneOfVoice?: string
  brandDescription?: string
  language?: string
  additionalInstructions?: string
}

// -----------------------------------------------------------------------------
// Tool definitions
// -----------------------------------------------------------------------------

export type ToolSlug =
  | 'product_copy'
  | 'seo_product'
  | 'google_shopping'
  | 'social_copy'
  | 'product_optimization'

export interface ToolDefinition {
  slug: ToolSlug
  name: string
  description: string
  category: 'producto' | 'seo' | 'redes' | 'shopping'
  icon: string
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    slug: 'product_copy',
    name: 'Ficha de Producto',
    description: 'Genera nombre, descripción corta, larga, meta title, meta description, slug, keywords y FAQ',
    category: 'producto',
    icon: 'package',
  },
  {
    slug: 'seo_product',
    name: 'SEO de Producto',
    description: 'Optimiza el contenido para motores de búsqueda con keywords, estructura y recomendaciones',
    category: 'seo',
    icon: 'search',
  },
  {
    slug: 'google_shopping',
    name: 'Google Shopping',
    description: 'Genera atributos optimizados para Google Merchant Center y campañas Shopping',
    category: 'shopping',
    icon: 'shopping-cart',
  },
  {
    slug: 'social_copy',
    name: 'Copy para Redes Sociales',
    description: 'Crea contenido adaptado para Instagram, Facebook y LinkedIn',
    category: 'redes',
    icon: 'share-2',
  },
  {
    slug: 'product_optimization',
    name: 'Optimización de Producto',
    description: 'Analiza una ficha existente, detecta problemas y entrega una versión mejorada',
    category: 'producto',
    icon: 'zap',
  },
]
