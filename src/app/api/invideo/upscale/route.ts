import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Use Fal AI for upscaling (ESRGAN)
    // We pass the base64 image directly or use fal.storage.upload if needed
    // The client handles data URLs automatically
    const result: any = await fal.subscribe('fal-ai/esrgan', {
      input: {
        image_url: image,
        scale: 4,
        model: 'RealESRGAN_x4plus',
      },
    });

    if (!result || !result.data || !result.data.image) {
      throw new Error('Failed to get upscaled image from Fal AI');
    }

    return NextResponse.json({ 
      success: true, 
      output: result.data.image.url,
      original: image.startsWith('http') ? image : undefined
    });

  } catch (error: any) {
    console.error('Fal AI Upscale Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upscale image' },
      { status: 500 }
    );
  }
}
