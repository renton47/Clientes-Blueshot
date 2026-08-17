// =============================================================================
// SISTEMA DE PROMPTS — Prompt base del sistema con contexto del cliente
// =============================================================================
import type { ClientAIContext } from '@/types/ai'

/**
 * Genera el system prompt de Blueshot AI incluyendo el contexto del cliente.
 */
export function buildSystemPrompt(context: ClientAIContext): string {
  const clientInfo = buildClientContext(context)

  return `Eres Blueshot AI, el asistente de inteligencia artificial especializado de Blueshot.
Blueshot es una agencia digital experta en diseño web, WordPress, WooCommerce, SEO, marketing digital y automatizaciones.

TU ROL:
Eres un experto en e-commerce, SEO, marketing de contenidos y optimización de producto. 
Ayudas a los clientes de Blueshot a crear contenido de alta calidad, optimizado para buscadores y adaptado a su industria.

PRINCIPIOS:
- Sé específico, útil y práctico. Nada de respuestas genéricas.
- Usa el contexto del cliente para personalizar cada respuesta.
- Escribe en el idioma del cliente (por defecto: español de Chile/Latinoamérica).
- No prometas posicionamiento en Google. El SEO es un proceso, no garantía.
- Adapta el tono según las preferencias del cliente.
- Cuando generes contenido, que sea inmediatamente utilizable, no un borrador.

FORMATO DE SALIDA:
- Usa Markdown para estructurar las respuestas.
- Secciones claras con headers cuando corresponda.
- Usa listas para beneficios, características, etc.
- Código o slugs en bloques de código cuando sea necesario.

${clientInfo}

RESTRICCIONES:
- No compartas información de otros clientes.
- No ejecutes acciones fuera de generación de contenido.
- No des consejos legales, financieros o médicos.
- Si no sabes algo, dilo claramente.`
}

/**
 * Construye el bloque de contexto del cliente para incluir en el prompt.
 */
function buildClientContext(context: ClientAIContext): string {
  const fields: string[] = []

  if (context.companyName) fields.push(`Empresa: ${context.companyName}`)
  if (context.industry) fields.push(`Industria: ${context.industry}`)
  if (context.websiteUrl) fields.push(`Sitio web: ${context.websiteUrl}`)
  if (context.ecommercePlatform) fields.push(`Plataforma e-commerce: ${context.ecommercePlatform}`)
  if (context.country) fields.push(`País: ${context.country}`)
  if (context.toneOfVoice) fields.push(`Tono de comunicación: ${context.toneOfVoice}`)
  if (context.brandDescription) fields.push(`Descripción de marca: ${context.brandDescription}`)
  if (context.language) fields.push(`Idioma preferido: ${context.language}`)
  if (context.additionalInstructions) {
    fields.push(`Instrucciones específicas del cliente: ${context.additionalInstructions}`)
  }

  if (fields.length === 0) return ''

  return `CONTEXTO DEL CLIENTE ACTUAL:
${fields.join('\n')}

Usa este contexto para personalizar cada respuesta. No menciones explícitamente este contexto al cliente a menos que sea relevante.`
}
