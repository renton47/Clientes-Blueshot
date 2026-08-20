import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/provider';
export const maxDuration = 300;

interface ValidationResult {
  isValid: boolean;
  fieldsToRepair: string[];
  errorsByField: Record<string, string[]>;
}

const POWER_WORDS = [
  "mejor", "increíble", "garantizado", "oferta", "exclusivo", "único", "secreto",
  "definitivo", "esencial", "probado", "premium", "barato", "económico",
  "gratis", "nuevo", "original", "potente", "profesional", "rápido", "fácil",
  "completo", "seguro", "perfecto", "descubre", "poderoso"
];

// Validación Determinística del Código (NO DELEGAR SOLO AL LLM)
function validateSEO(parsed: any, seoProvider: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    fieldsToRepair: [],
    errorsByField: {}
  };

  const addError = (field: string, error: string) => {
    if (!result.errorsByField[field]) {
      result.errorsByField[field] = [];
      if (!result.fieldsToRepair.includes(field)) {
        result.fieldsToRepair.push(field);
      }
    }
    result.errorsByField[field].push(error);
    result.isValid = false;
  };

  if (!parsed || typeof parsed !== 'object') {
    addError('general', 'El JSON generado está vacío o es inválido.');
    return result;
  }

  const seo = parsed.seo || {};
  const kw = (seo.focus_keyword || '').toLowerCase().trim();
  const title = (parsed.title || '').trim(); // H1
  const seoTitle = (seo.seo_title || '').toLowerCase().trim();
  const descHtml = (parsed.description || '').toLowerCase();
  const shortDesc = (parsed.short_description || '').trim();
  const metaDesc = (seo.meta_description || '').toLowerCase().trim();
  const slug = (parsed.slug || '').toLowerCase().trim();

  // 1. Focus Keyword
  if (!kw) {
    addError('seo', 'Falta la Focus Keyword en el campo seo.focus_keyword.');
  }

  // 2. SEO Title
  if (!seoTitle) {
    addError('seo', 'Falta el SEO Title (seo.seo_title).');
  } else if (kw) {
    if (!seoTitle.includes(kw)) {
      addError('seo', `El SEO Title DEBE contener exactamente la Focus Keyword ("${kw}").`);
    }
    if (seoTitle.length > 60) {
      addError('seo', `El SEO Title es muy largo (${seoTitle.length} chars). Máximo ideal es 60.`);
    }
    if (seoProvider === 'rank_math') {
      const hasPowerWord = POWER_WORDS.some(pw => seoTitle.includes(pw));
      if (!hasPowerWord) {
        addError('seo', 'Para Rank Math, el SEO Title DEBE incluir al menos una Power Word (ej. "Mejor", "Increíble", "Exclusivo", "Perfecto", etc.) de forma natural.');
      }
      const hasNumber = /\d/.test(seoTitle);
      if (!hasNumber) {
        addError('seo', 'Para Rank Math, el SEO Title DEBE incluir un número (ej. "7 razones", "2024", etc.) de forma natural.');
      }
    }
  }

  // 3. Meta Description
  if (!metaDesc) {
    addError('seo', 'Falta la Meta Description (seo.meta_description).');
  } else if (kw) {
    if (!metaDesc.includes(kw)) {
      addError('seo', `La Meta Description DEBE contener la Focus Keyword ("${kw}").`);
    }
    if (metaDesc.length > 160) {
      addError('seo', `La Meta Description es muy larga (${metaDesc.length} chars). Máximo ideal es 160.`);
    }
  }

  // 4. Slug
  if (!slug) {
    addError('slug', 'El slug no puede estar vacío.');
  } else if (kw) {
    const kwSlug = kw.replace(/\s+/g, '-');
    if (!slug.includes(kwSlug) && !slug.includes(kw.split(' ')[0])) {
      addError('slug', `El slug DEBE contener la Focus Keyword o parte de ella ("${kwSlug}").`);
    }
  }

  // 5. Short Description
  if (!shortDesc) {
    addError('short_description', 'La descripción corta no puede estar vacía.');
  }

  // 6. Keywords Secundarias
  if (!seo.secondary_keywords || !Array.isArray(seo.secondary_keywords) || seo.secondary_keywords.length === 0) {
    addError('seo', 'Faltan las keywords secundarias. Agrega al menos 2 en seo.secondary_keywords.');
  }

  // 7. Descripción Larga (Validaciones Críticas)
  if (!descHtml) {
    addError('description', 'La descripción HTML larga no puede estar vacía.');
  } else if (kw) {
    const textOnly = descHtml.replace(/<[^>]+>/g, ' ').trim();
    const words = textOnly.split(/\s+/).filter((w: string) => w.length > 0);
    const totalWords = words.length;

    // Minimum words 650
    if (totalWords < 650) {
      addError('description', `La descripción es demasiado corta (${totalWords} palabras reales). DEBE superar las 650 palabras útiles, sin keyword stuffing.`);
    }

    // Density 1% - 2.5%
    const kwRegex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const kwMatches = textOnly.match(kwRegex) || [];
    const kwWordsCount = kw.split(/\s+/).length;
    const density = totalWords > 0 ? (kwMatches.length * kwWordsCount) / totalWords : 0;
    
    if (density > 0.025) {
      addError('description', `La densidad de la Focus Keyword es excesiva (${(density * 100).toFixed(1)}%). DEBE ser menor a 2.5% (ideal 1-1.5%). Reduce repeticiones.`);
    }

    // Keyword en introducción (primeros 15%)
    const firstPart = textOnly.substring(0, Math.floor(textOnly.length * 0.15));
    if (!firstPart.includes(kw)) {
      addError('description', 'La Focus Keyword DEBE aparecer de forma natural en la introducción (primeros párrafos) de la descripción.');
    }

    // H2 / H3 Presence and Keyword
    const headerRegex = /<h[23][^>]*>(.*?)<\/h[23]>/g;
    let headerMatches;
    let hasHeaders = false;
    let kwInHeader = false;
    while ((headerMatches = headerRegex.exec(descHtml)) !== null) {
      hasHeaders = true;
      if (headerMatches[1].includes(kw)) {
        kwInHeader = true;
      }
    }
    
    if (!hasHeaders) {
      addError('description', 'Faltan etiquetas H2 o H3. Debes estructurar el texto con encabezados útiles.');
    } else if (!kwInHeader) {
      addError('description', 'La Focus Keyword DEBE aparecer en al menos un encabezado H2 o H3 de forma natural.');
    }

    // FAQ Acordeón Funcional
    if (!descHtml.includes('<details') || !descHtml.includes('<summary')) {
      addError('description', 'Falta el FAQ al final de la descripción o no usa las etiquetas HTML <details> y <summary> para ser un acordeón funcional.');
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 401 });
    }
    const supabase = createServiceClient();

    const { data: installation, error } = await supabase
      .from('wordpress_installations')
      .select('client_id, active, clients(name, company_name, active, tone_of_voice)')
      .eq('token', token)
      .eq('active', true)
      .single();

    if (error || !installation) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const client = Array.isArray(installation.clients) ? installation.clients[0] : installation.clients;

    if (!client?.active) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { product, seo_context } = body;
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product data required' }, { status: 400 });
    }

    const tone = client.tone_of_voice || 'Profesional';
    const provider = getAIProvider();
    const seoProvider = seo_context?.provider || 'none';

    const globalInstructions = `
REGLAS ESTRICTAS DE SEO Y CONTENIDO PARA WOOCOMMERCE:
- Exactitud del Producto: NUNCA alteres características, cantidades o naturaleza del producto. Si es singular (ej. "Gorro Gris"), mantén TODO en singular. JAMÁS inventes cantidades (NO conviertas en "Las 5 Mejores...").
- SEO Title: DEBE contener la Focus Keyword (preferentemente al inicio). INCLUYE al menos una Power Word y un Número SÓLO SI es 100% natural, honesto y NO manipula la esencia del producto.
- Meta Description: Atractiva, describe realmente el producto y contiene la Focus Keyword.
- Slug: Corto, limpio, con la Focus Keyword. No rompas URLs existentes sin razón.
- Descripción Larga: OBJETIVO ESTRICTO >= 650 palabras reales (útiles, específicas, sin paja). Usa H2/H3 atractivos y párrafos cortos.
- Densidad de Keyword: 1% a 1.5% (MÁXIMO 2.5%). Usa variaciones semánticas para evitar keyword stuffing.
- Distribución Keyword: DEBE estar en la introducción y en al menos un encabezado H2/H3.
- FAQ (OBLIGATORIO): Al final de la descripción, inyecta un FAQ como ACORDEÓN VISUAL usando HTML5 nativo (<details> y <summary>). Usa ESTILOS EN LÍNEA (ej. style="padding:15px; border:1px solid #e2e8f0; border-radius:8px; cursor:pointer; margin-bottom:10px; background:#fff;") para que sea muy atractivo en cualquier maquetador (Gutenberg/Elementor) sin depender de scripts.
- Imágenes y Enlaces: Agrega atributos ALT a imágenes si corresponde. Usa URLs reales del contexto, NUNCA inventes URLs externas.
- Checklist Prioridad: Exactitud > Intención de búsqueda > Conversión > Naturalidad > SEO.`;

    const rankMathInstructions = (seoProvider === 'rank_math') 
      ? `\nIMPORTANTE PARA RANK MATH:\n- Asegura legibilidad perfecta, density balanceado y meta-datos compatibles al 100% con Rank Math.` 
      : (seoProvider === 'yoast')
      ? `\nIMPORTANTE PARA YOAST SEO:\n- Asegura voz activa, longitud de oraciones cortas y meta-datos 100% compatibles con Yoast.` 
      : '';

    const systemPrompt = `Eres el Arquitecto SEO AI para WooCommerce. Tono: ${tone}.
Genera contenido basándote SÓLO en la información del producto. NO INVENTES.
${globalInstructions}
${rankMathInstructions}

Responde ÚNICAMENTE en JSON con esta estructura exacta:
{
  "title": "Nuevo Título poderoso para el producto (H1)",
  "short_description": "Descripción corta (atractiva, ideal para conversión).",
  "description": "Descripción HTML súper larga (>=650 palabras útiles) con H2/H3 y FAQ en <details> estilizado al final.",
  "slug": "slug-optimizado",
  "seo": {
    "provider": "${seoProvider}",
    "seo_title": "Meta title SEO (con keyword exacta)",
    "meta_description": "Meta description",
    "focus_keyword": "keyword principal",
    "secondary_keywords": ["k1", "k2"],
    "canonical": ""
  }
}`;

    const userPrompt = JSON.stringify({ product, seo_context }, null, 2);

    let messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    let currentAttempt = 1;
    const MAX_ATTEMPTS = 4; // 1 Generación + 3 Reparaciones selectivas
    let currentParsed: any = {};
    let isFullyValid = false;
    let finalValidationErrors: string[] = [];

    while (currentAttempt <= MAX_ATTEMPTS && !isFullyValid) {
      const response = await provider.complete({
        model: 'gpt-4o-mini',
        messages: messages
      });

      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      try {
        const partialParsed = JSON.parse(jsonStr);

        // FUSIÓN (MERGE) SELECTIVA
        if (currentAttempt === 1) {
          currentParsed = partialParsed;
        } else {
          // Deep merge the repaired fields into the current state
          if (partialParsed.seo && typeof partialParsed.seo === 'object') {
             currentParsed.seo = { ...currentParsed.seo, ...partialParsed.seo };
          }
          const nonSeoKeys = Object.keys(partialParsed).filter(k => k !== 'seo');
          for (const key of nonSeoKeys) {
             currentParsed[key] = partialParsed[key];
          }
        }

        // VALIDACIÓN DETERMINÍSTICA
        const validation = validateSEO(currentParsed, seoProvider);

        if (validation.isValid) {
          isFullyValid = true;
          finalValidationErrors = [];
          break; // Cumplió el checklist obligatorio
        }

        // PREPARAR REPARACIÓN SELECTIVA
        finalValidationErrors = [];
        for (const field of validation.fieldsToRepair) {
           finalValidationErrors.push(...validation.errorsByField[field]);
        }

        if (currentAttempt < MAX_ATTEMPTS) {
          console.warn(`[Attempt ${currentAttempt}] SEO Validation failed. Triggering Selective Repair... Fields: ${validation.fieldsToRepair.join(', ')}`);
          
          let errorText = `Tu respuesta anterior incumplió requisitos críticos. DEBES REPARAR ÚNICAMENTE LOS SIGUIENTES CAMPOS. DEVUELVE UN JSON SÓLO CON LOS CAMPOS CORREGIDOS:\n\n`;
          
          for (const field of validation.fieldsToRepair) {
             errorText += `CAMPO [${field}]:\n- ${validation.errorsByField[field].join('\n- ')}\n\n`;
          }

          errorText += `ESTRICTAMENTE OBLIGATORIO: Tu JSON de respuesta debe incluir SÓLO las claves que necesitan reparación (${validation.fieldsToRepair.join(', ')}). No regeneres los campos correctos. Conserva el mismo formato JSON base.`;

          messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
            { role: 'assistant', content: JSON.stringify(currentParsed) },
            { role: 'user', content: errorText }
          ];
        }
      } catch (error) {
        console.error('Failed to parse AI response:', response.content);
        if (currentAttempt === MAX_ATTEMPTS) {
          if (!currentParsed.title) {
             return NextResponse.json({ success: false, error: 'Invalid AI response' }, { status: 500 });
          }
          break; // Fallback al mejor JSON disponible si ya había algo
        }
        messages.push({ role: 'assistant', content: response.content });
        messages.push({ role: 'user', content: 'ERROR: Tu respuesta no es un JSON válido. Devuelve ÚNICAMENTE el JSON.' });
      }

      currentAttempt++;
    }

    if (!currentParsed || Object.keys(currentParsed).length === 0) {
       return NextResponse.json({ success: false, error: 'Failed to generate content' }, { status: 500 });
    }

    // Retorna el JSON validado (o reparado hasta donde fue posible)
    return NextResponse.json({ 
      success: true, 
      data: currentParsed, 
      validation_errors: finalValidationErrors.length > 0 ? finalValidationErrors : undefined 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

