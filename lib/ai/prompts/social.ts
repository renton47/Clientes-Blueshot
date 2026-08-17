// =============================================================================
// PROMPTS REDES SOCIALES — Copy adaptado por plataforma
// =============================================================================
import type { SocialToolInput } from '@/types/ai'

const PLATFORM_SPECS = {
  instagram: {
    name: 'Instagram',
    maxChars: 2200,
    style: 'Visual, emotivo, storytelling. Emojis moderados. Hashtags al final.',
    callToAction: 'Link en bio / Ver más / Swipe up',
  },
  facebook: {
    name: 'Facebook',
    maxChars: 500,
    style: 'Conversacional, informativo. Menos hashtags. Más texto y contexto.',
    callToAction: 'Comentar / Compartir / Ver producto',
  },
  linkedin: {
    name: 'LinkedIn',
    maxChars: 3000,
    style: 'Profesional, reflexivo, orientado a valor de negocio. Sin emojis excesivos.',
    callToAction: 'Conectar / Aprender más / Visitar sitio',
  },
}

/**
 * Genera el prompt para la herramienta "Copy para Redes Sociales".
 */
export function buildSocialCopyPrompt(input: SocialToolInput): string {
  const platformDetails = input.platforms
    .map((p) => {
      const spec = PLATFORM_SPECS[p]
      return `### ${spec.name}
- Estilo: ${spec.style}
- Máximo: ~${spec.maxChars} caracteres
- CTA sugerido: ${spec.callToAction}`
    })
    .join('\n\n')

  return `Crea copy para redes sociales para el siguiente producto/servicio:

PRODUCTO/SERVICIO:
- Nombre: ${input.product_name}
- Descripción: ${input.description}
${input.tone ? `- Tono específico: ${input.tone}` : ''}
${input.promotion ? `- Promoción/Oferta: ${input.promotion}` : ''}
${input.hashtags ? '- Incluir hashtags relevantes' : '- Sin hashtags'}

PLATAFORMAS REQUERIDAS:
${platformDetails}

ENTREGA una sección separada para cada plataforma en este formato:

## [Nombre de Plataforma]

**Versión Principal:**
[Copy completo adaptado a la plataforma]

**Versión Alternativa:**
[Variación del copy para prueba A/B]

${input.hashtags ? '**Hashtags:**\n[Lista de hashtags relevantes]\n' : ''}
---

IMPORTANTE: 
- Adapta el tono y longitud a cada plataforma
- El copy debe ser directo y orientado a acción
- Incluye el elemento emocional o racional según corresponda a la plataforma`
}
