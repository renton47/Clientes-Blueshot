// =============================================================================
// PROMPTS GOOGLE SHOPPING — Atributos optimizados para Google Merchant Center
// =============================================================================
import type { ShoppingToolInput } from '@/types/ai'

/**
 * Genera el prompt para la herramienta "Google Shopping".
 */
export function buildShoppingPrompt(input: ShoppingToolInput): string {
  return `Genera atributos optimizados para Google Shopping / Google Merchant Center:

DATOS DEL PRODUCTO:
- Nombre: ${input.product_name}
${input.brand ? `- Marca: ${input.brand}` : ''}
${input.gtin ? `- GTIN/EAN: ${input.gtin}` : ''}
${input.mpn ? `- MPN: ${input.mpn}` : ''}
${input.category ? `- Categoría: ${input.category}` : ''}
- Descripción: ${input.description}
${input.price ? `- Precio: ${input.price} ${input.currency}` : ''}
- Condición: ${input.condition === 'new' ? 'Nuevo' : input.condition === 'used' ? 'Usado' : 'Reacondicionado'}

ENTREGA EN ESTE FORMATO EXACTO:

## Title (Título Google Shopping)
[Máximo 150 caracteres. Formato: Marca + Nombre + Modelo + Característica clave]

## Description (Descripción)
[Máximo 5000 caracteres. Primera oración es la más importante. Sin promociones ni precios.]

## Google Product Category
[Categoría de Google más específica para este producto]

## Product Type
[Jerarquía de categorías del sitio: Categoría > Subcategoría > Producto]

## Atributos Adicionales Recomendados
| Atributo | Valor sugerido |
|----------|---------------|
| Color | [si aplica] |
| Tamaño | [si aplica] |
| Material | [si aplica] |
| Género | [si aplica] |
| Edad | [si aplica] |

## Custom Labels (Etiquetas personalizadas)
- custom_label_0: [segmentación por margen, ej: alto_margen / bajo_margen]
- custom_label_1: [segmentación por temporada o campaña]
- custom_label_2: [segmentación por precio, ej: bajo_100 / 100_500 / sobre_500]

## Checklist de Calidad
[Lista de verificación de los requisitos mínimos de Google Merchant Center]

## Recomendaciones de Campaña
[2-3 sugerencias para estructurar la campaña Shopping con este producto]`
}
