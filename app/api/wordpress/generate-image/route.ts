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
      .select('client_id, active, clients(name, company_name, active)')
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
    const { prompt, type, niche, model_preference } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    // Force gemini if requested or fallback to default
    const providerName = model_preference === 'gemini' ? 'gemini' : 'openai';
    const provider = getAIProvider(providerName);

    if (!provider.generateImage) {
      return NextResponse.json({ success: false, error: `El proveedor actual (${providerName}) no soporta generación de imágenes.` }, { status: 400 });
    }

    const fullPrompt = `Crea una imagen de alta calidad, fotorrealista para el nicho de negocio: "${niche || 'General'}". 
Tipo de imagen solicitada: "${type || 'Producto'}". 
Descripción/Instrucciones: ${prompt}.
No incluyas texto en la imagen. La iluminación debe ser profesional.`;

    const result = await provider.generateImage({
      prompt: fullPrompt,
      aspectRatio: '1:1',
      format: 'jpeg',
      number_of_images: 1
    });

    if (result.images.length === 0) {
      return NextResponse.json({ success: false, error: 'No image generated' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        image_url: result.images[0].url,
        base64: result.images[0].base64 
      } 
    });
  } catch (error: any) {
    console.error(error);
    const errorMessage = error?.message || 'Internal Server Error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
