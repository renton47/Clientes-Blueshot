import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/provider';
export const maxDuration = 300;

function validateSEO(parsed: any, seoProvider: string): string[] {
  const errors: string[] = [];
  
  if (!parsed) return ['El JSON generado está vacío o es inválido.'];
  
  const seo = parsed.seo || {};
  const kw = (seo.focus_keyword || '').toLowerCase().trim();
  const title = (seo.seo_title || '').toLowerCase();
  const descHtml = (parsed.description || '').toLowerCase();
  const metaDesc = (seo.meta_description || '').toLowerCase();
  const slug = (parsed.slug || '').toLowerCase();

  if (!kw) {
    errors.push('Falta la Focus Keyword en el resultado.');
  } else {
    if (!title.includes(kw)) {
      errors.push(`El SEO Title DEBE contener exactamente la Focus Keyword ("${kw}").`);
    }
    
    if (!metaDesc.includes(kw)) {
      errors.push(`La Meta Description DEBE contener la Focus Keyword ("${kw}").`);
    }
    
    const textOnly = descHtml.replace(/<[^>]+>/g, ' ').trim();
    const words = textOnly.split(/\s+/).filter((w: string) => w.length > 0);
    const totalWords = words.length;
    
    // Contar ocurrencias aproximadas de la keyword
    const kwRegex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const kwMatches = textOnly.match(kwRegex) || [];
    const kwWords = kw.split(/\s+/).length;
    const density = totalWords > 0 ? (kwMatches.length * kwWords) / totalWords : 0;
    
    if (density > 0.025) {
      errors.push(`La densidad de la Focus Keyword es demasiado alta (${(density * 100).toFixed(1)}%). DEBE estar por debajo del 2.5% (ideal 1-1.5%). Reduce repeticiones y usa lenguaje natural.`);
    }
  }
  
  if (title.length > 65) {
     errors.push(`El SEO Title es demasiado largo (${title.length} chars). Mantenlo idealmente bajo 60 caracteres.`);
  }
  if (metaDesc.length > 165) {
     errors.push(`La Meta Description es demasiado larga (${metaDesc.length} chars). Mantenla idealmente bajo 160 caracteres.`);
  }

  if (!descHtml.includes('<h2') && !descHtml.includes('<h3')) {
     errors.push('La descripción HTML no contiene etiquetas H2 o H3. DEBES estructurar el contenido con subtítulos creativos.');
  }
  
  if (!descHtml.includes('<details') || !descHtml.includes('<summary')) {
     errors.push('Falta el FAQ estructurado. DEBES incluirlo al final de la descripción usando etiquetas HTML <details> y <summary> funcionales con estilos en línea.');
  }

  if (!seo.secondary_keywords || !Array.isArray(seo.secondary_keywords) || seo.secondary_keywords.length === 0) {
     errors.push('No proporcionaste keywords secundarias. DEBES sugerir keywords secundarias que aporten valor semántico.');
  }
  
  return errors;
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
    const builder = product?.builder || 'gutenberg';
    let globalInstructions = `
REGLAS ESTRICTAS DE SEO Y CONTENIDO:
- Producto y Contexto: NUNCA alteres el número, tipo o características del producto. Si el producto es singular (ej. "Gorro Gris"), mantén todo el contenido y SEO en singular. NO inventes cantidades, variedades, beneficios o especificaciones que no existan.
- SEO Title: DEBE contener exactamente la keyword principal, respetando su forma singular/plural y contexto real. La keyword debe aparecer al principio del SEO Title siempre que sea natural y técnicamente posible. INCLUYE al menos una Power Word o un Número SÓLO si resulta natural para la intención de búsqueda y NO altera la naturaleza del producto (ej. NUNCA conviertas "Gorro Gris" en "Las 5 Mejores Gorras Grises"). Máximo 60 caracteres.
- Meta Description: Atractiva, incluye beneficios reales y la keyword. Máximo 160 caracteres.
- Contenido (HTML): EXTREMADAMENTE IMPORTANTE: Tu respuesta DEBE SUPERAR ESTRICTAMENTE LAS 800 PALABRAS. Estructura la descripción en 6 secciones con etiquetas H2/H3. NUNCA uses nombres genéricos, inventa subtítulos creativos y naturales. Mantén párrafos cortos y legibles, evitando bloques excesivamente largos.
- FAQ (IMPORTANTE): Al final del HTML de la descripción, DEBES inyectar el FAQ renderizado como un acordeón funcional usando ETIQUETAS HTML NATIVAS (<details> y <summary>). NO uses bloques de Gutenberg ni clases de Elementor. Para asegurar que se vea profesional y coherente con cualquier web, DEBES usar ESTILOS EN LÍNEA (inline styles, ej. style="padding:10px; border:1px solid #ccc; cursor:pointer; margin-bottom:10px;") en las etiquetas <details> y <summary>. NO uses la etiqueta <style> general, ya que WordPress la eliminará. Esto lo hace 100% compatible e invisible para el usuario sin importar el maquetador activo.
- Keywords Secundarias: Propón al menos 2 a 3 keywords secundarias semánticamente relacionadas cuando aporten valor. NUNCA dejes el array vacío.
- Prioridad Absoluta: Exactitud del producto > Intención de búsqueda > Utilidad/Conversión > Naturalidad > SEO puro.
- Densidad de Keyword: Mantén la densidad de la Focus Keyword por debajo del 2.5%, idealmente 1-1.5% cuando sea natural. Si es excesiva, usa sinónimos y lenguaje natural sin hacer keyword stuffing.
- AUTO-CHECKLIST INTERNO OBLIGATORIO: Antes de generar el JSON, asegúrate de que: a) El SEO Title no altera la cantidad del producto y usa la keyword al inicio. b) Los H2 NO son textos genéricos y los párrafos son cortos. c) Generaste más de 800 palabras. d) El FAQ usa <details> y tiene estilos CSS EN LÍNEA atractivos.`;

    let rankMathInstructions = '';
    if (seoProvider === 'rank_math') {
      rankMathInstructions = `
IMPORTANTE PARA RANK MATH:
- Título y Slug: Genera un "title" nuevo y poderoso. El slug debe incluir la keyword separada por guiones y NO superar 75 caracteres.`;
    } else if (seoProvider === 'yoast') {
      rankMathInstructions = `
IMPORTANTE PARA YOAST SEO:
- Optimiza también los campos para Yoast garantizando legibilidad, oraciones cortas y buen uso de voz activa. El slug debe incluir la keyword separada por guiones y NO superar 75 caracteres.`;
    }

    const systemPrompt = `Eres un experto en Copywriting y SEO técnico avanzado para WooCommerce. Tono: ${tone}.
Genera contenido optimizado para el producto basándote SÓLO en la información disponible. No inventes características, datos ni URLs que no existan.
${globalInstructions}
${rankMathInstructions}

Responde ÚNICAMENTE en JSON con la siguiente estructura (no envuelvas en markdown):
{
  "title": "Nuevo Título poderoso para el producto (H1)",
  "short_description": "Descripción corta (atractiva, ideal para conversión).",
  "description": "Descripción HTML súper larga (>800 palabras) con 6 secciones H2 inventados y NO genéricos. Párrafos cortos. FAQ en formato <details>/<summary> con CSS incluido al final.",
  "slug": "slug-optimizado",
  "seo": {
    "provider": "${seoProvider}",
    "seo_title": "Meta title SEO (DEBE COMENZAR CON LA KEYWORD SI ES POSIBLE, RESPETANDO EL CONTEXTO. MAX 60 CHARS)",
    "meta_description": "Meta description",
    "focus_keyword": "keyword principal",
    "secondary_keywords": ["OBLIGATORIO_k1", "OBLIGATORIO_k2"],
    "canonical": ""
  },
  "faq": [{"question": "Q?", "answer": "A"}]
}`;

    const userPrompt = JSON.stringify({ product, seo_context }, null, 2);

    let messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    let currentAttempt = 1;
    const MAX_ATTEMPTS = 3;
    let finalParsed = null;
    let finalValidationErrors: string[] = [];

    while (currentAttempt <= MAX_ATTEMPTS) {
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
        const parsed = JSON.parse(jsonStr);
        const validationErrors = validateSEO(parsed, seoProvider);

        if (validationErrors.length === 0) {
          finalParsed = parsed;
          finalValidationErrors = [];
          break; // Todo correcto, terminamos el bucle
        }

        // Hubo errores de validación
        finalParsed = parsed; // Guardamos el intento fallido por si es el último
        finalValidationErrors = validationErrors;

        if (currentAttempt < MAX_ATTEMPTS) {
          messages.push({ role: 'assistant', content: jsonStr });
          const errorPrompt = `VALIDACIÓN FALLIDA. Tu propuesta anterior incumplió las siguientes reglas críticas de SEO y contenido:\n- ${validationErrors.join('\n- ')}\n\nESTRICTAMENTE OBLIGATORIO: Corrige estos errores SIN romper el resto del contenido y devuelve el JSON completo re-optimizado. Recuerda NO inventar información ni alterar la naturaleza del producto.`;
          messages.push({ role: 'user', content: errorPrompt });
          console.warn(`[Attempt ${currentAttempt}] SEO Validation failed. Retrying... Errors: ${validationErrors.join(' | ')}`);
        }
      } catch (error) {
        console.error('Failed to parse AI response:', response.content);
        if (currentAttempt === MAX_ATTEMPTS) {
          return NextResponse.json({ success: false, error: 'Invalid AI response' }, { status: 500 });
        }
        messages.push({ role: 'assistant', content: response.content });
        messages.push({ role: 'user', content: 'ERROR: Tu respuesta no es un JSON válido. Por favor devuelve ÚNICAMENTE el JSON sin formato Markdown adicional.' });
      }

      currentAttempt++;
    }

    if (!finalParsed) {
       return NextResponse.json({ success: false, error: 'Failed to generate valid content' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: finalParsed, validation_errors: finalValidationErrors });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
