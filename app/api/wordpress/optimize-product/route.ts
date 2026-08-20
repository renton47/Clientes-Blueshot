import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/provider';
export const maxDuration = 300;

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
- SEO Title: DEBE contener exactamente la keyword principal, respetando su forma singular/plural y contexto real. La keyword debe aparecer al principio del SEO Title siempre que sea natural y técnicamente posible. NUNCA fuerces números o power words si alteran la naturaleza del producto (ej. NUNCA conviertas "Gorro Gris" en "Las 5 Mejores Gorras Grises"). Máximo 60 caracteres.
- Meta Description: Atractiva, incluye beneficios reales y la keyword. Máximo 160 caracteres.
- Contenido (HTML): EXTREMADAMENTE IMPORTANTE: Tu respuesta DEBE SUPERAR ESTRICTAMENTE LAS 800 PALABRAS. Estructura la descripción en 6 secciones con etiquetas H2: 1. Introducción. 2. Características. 3. Beneficios. 4. Casos de uso. 5. Guía de uso. 6. Preguntas frecuentes (FAQ). NUNCA uses nombres genéricos en los H2, inventa subtítulos creativos y naturales. Extiende cada sección al máximo (mínimo 150 palabras/sección).
- FAQ (IMPORTANTE): Al final del HTML de la descripción, DEBES inyectar el FAQ renderizado como un acordeón funcional usando ETIQUETAS HTML NATIVAS (<details> y <summary>). NO uses bloques de Gutenberg ni clases de Elementor. Para asegurar que se vea profesional y coherente con cualquier web, DEBES usar ESTILOS EN LÍNEA (inline styles, ej. style="padding:10px; border:1px solid #ccc; cursor:pointer; margin-bottom:10px;") en las etiquetas <details> y <summary>. NO uses la etiqueta <style> general, ya que WordPress la eliminará. Esto lo hace 100% compatible e invisible para el usuario sin importar el maquetador activo.
- Keywords Secundarias: Propón al menos 2 a 3 keywords secundarias semánticamente relacionadas. NUNCA dejes el array vacío.
- Prioridad Absoluta: Exactitud del producto > Intención de búsqueda > Conversión > Naturalidad > SEO puro.
- AUTO-CHECKLIST INTERNO OBLIGATORIO: Antes de generar el JSON, asegúrate de que: a) El SEO Title no altera la cantidad del producto y usa la keyword al inicio. b) Los H2 NO son textos técnicos genéricos. c) Generaste más de 800 palabras. d) El FAQ usa <details> y tiene estilos CSS EN LÍNEA (inline styles) atractivos.`;

    let rankMathInstructions = '';
    if (seoProvider === 'rank_math') {
      rankMathInstructions = `
IMPORTANTE PARA RANK MATH:
- Título y Slug: Genera un "title" nuevo y poderoso. El slug debe incluir la keyword separada por guiones y NO superar 75 caracteres.
- Keyword principal y densidad: Úsala al inicio del contenido, en SEO Title, Meta Description y Slug. La densidad debe ser baja (2 o 3 veces en la descripción) para evitar penalizaciones por keyword stuffing.`;
    }

    const systemPrompt = `Eres un experto en Copywriting y SEO para WooCommerce. Tono: ${tone}.
Genera contenido optimizado para el producto basándote SÓLO en la información disponible. No inventes características ni datos que no existan.
${globalInstructions}
${rankMathInstructions}

Responde ÚNICAMENTE en JSON con la siguiente estructura (no envuelvas en markdown):
{
  "title": "Nuevo Título poderoso para el producto (H1)",
  "short_description": "Descripción corta de max 160 chars.",
  "description": "Descripción HTML súper larga (>800 palabras) con 6 secciones H2 inventados y NO genéricos. FAQ en formato <details>/<summary> con CSS incluido al final.",
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

    const response = await provider.complete({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    try {
      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json({ success: true, data: parsed });
    } catch (error) {
      console.error('Failed to parse AI response:', response.content);
      return NextResponse.json({ success: false, error: 'Invalid AI response' }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
