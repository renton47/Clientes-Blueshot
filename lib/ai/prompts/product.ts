// =============================================================================
// PROMPTS DE PRODUCTO — Ficha completa + Optimización
// =============================================================================
import type { ProductToolInput, OptimizationToolInput } from '@/types/ai'

/**
 * Genera el prompt para la herramienta "Ficha de Producto".
 */
export function buildProductCopyPrompt(input: ProductToolInput): string {
  return `Genera una ficha de producto completa y optimizada para e-commerce con la siguiente información:

DATOS DEL PRODUCTO:
- Nombre: ${input.name}
${input.brand ? `- Marca: ${input.brand}` : ''}
${input.model ? `- Modelo: ${input.model}` : ''}
- Características: ${input.features}
${input.benefits ? `- Beneficios: ${input.benefits}` : ''}
${input.target_audience ? `- Público objetivo: ${input.target_audience}` : ''}
${input.price ? `- Precio referencial: ${input.price}` : ''}
${input.additional_info ? `- Información adicional: ${input.additional_info}` : ''}

ENTREGA EN ESTE FORMATO EXACTO (usa Markdown con estos headers):

## Nombre Optimizado
[Nombre del producto mejorado para e-commerce]

## Descripción Corta
[2-3 oraciones, máximo 160 caracteres, destacando el beneficio principal]

## Descripción Larga
[3-4 párrafos completos, orientados a conversión, incluye beneficios clave]

## Beneficios Principales
[Lista de 4-6 beneficios en formato bullet]

## Características Técnicas
[Lista estructurada de características]

## Meta Title
[55-60 caracteres, incluye keyword principal]

## Meta Description
[150-160 caracteres, incluye keyword, llamada a acción]

## Slug URL
[slug-optimizado-para-seo]

## Keywords Sugeridas
Keyword principal: [keyword]
Keywords secundarias: [keyword1, keyword2, keyword3, keyword4]

## FAQ
[5 preguntas y respuestas frecuentes sobre el producto]

IMPORTANTE: Todo el contenido debe ser específico para este producto, no genérico. Orientado a conversión y optimizado para e-commerce.`
}

/**
 * Genera el prompt para la herramienta "Optimización de Producto".
 */
export function buildOptimizationPrompt(input: OptimizationToolInput): string {
  return `Analiza el siguiente contenido de ${input.content_type} y entrega un análisis completo con versión optimizada:

CONTENIDO EXISTENTE:
---
${input.existing_content}
---

ENTREGA EN ESTE FORMATO EXACTO:

## Diagnóstico
[Análisis de los principales problemas encontrados]

## Problemas Detectados
[Lista detallada de problemas: SEO, copywriting, estructura, legibilidad, etc.]

## Puntuación Actual
[Nota del 1 al 10 con justificación breve]

## Versión Optimizada
[Contenido completo mejorado, listo para usar]

## Cambios Realizados
[Lista de qué se cambió y por qué]

## Puntuación Nueva
[Nota estimada del 1 al 10 con justificación]

## Recomendaciones Adicionales
[3-5 sugerencias para mejorar aún más]`
}
