// =============================================================================
// PROMPTS SEO — Análisis y optimización SEO de producto
// =============================================================================
import type { SEOToolInput } from '@/types/ai'

/**
 * Genera el prompt para la herramienta "SEO de Producto".
 */
export function buildSEOPrompt(input: SEOToolInput): string {
  return `Realiza un análisis SEO completo y entrega recomendaciones accionables para el siguiente producto:

INFORMACIÓN DEL PRODUCTO:
- Nombre/Título: ${input.product_name}
${input.category ? `- Categoría: ${input.category}` : ''}
- Descripción: ${input.description}
${input.target_keywords ? `- Keywords objetivo del cliente: ${input.target_keywords}` : ''}
${input.competitor_info ? `- Información de competencia: ${input.competitor_info}` : ''}

IMPORTANTE: No prometas posiciones en Google. El SEO es un proceso continuo, no una garantía. Basa tus recomendaciones en buenas prácticas.

ENTREGA EN ESTE FORMATO EXACTO:

## SEO Title
[55-60 caracteres, incluye keyword principal al inicio]

## Meta Description
[150-160 caracteres, incluye keyword, llamada a acción clara]

## Keyword Principal
[Una sola keyword de mayor oportunidad]

## Keywords Secundarias
[Lista de 5-8 keywords relacionadas y de cola larga]

## Slug Optimizado
[slug-para-url]

## Análisis de Intención de Búsqueda
[Qué busca el usuario cuando escribe la keyword principal]

## Estructura de Contenido Recomendada
[H1, H2s, H3s sugeridos para la página del producto]

## Recomendaciones On-Page
[Lista de 5-8 mejoras específicas para implementar]

## Palabras Clave a Evitar
[Keywords muy competitivas o irrelevantes para este producto]

## Estrategia de Contenido Adicional
[Ideas de contenido complementario: blog, categorías, etc.]`
}
