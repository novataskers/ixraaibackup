import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

async function uploadToSupabase(buffer: Buffer | ArrayBuffer, fileName: string, contentType: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.storage
    .from('music')
    .upload(fileName, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('music')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function POST(req: Request) {
  try {
    const { image, styleDescription } = await req.json();

    if (!image || !styleDescription) {
      return NextResponse.json({ error: 'Image and style description are required' }, { status: 400 });
    }

    const replicateToken = process.env.REPLICATE_API_TOKEN;

    if (!replicateToken) {
      return NextResponse.json({ 
        error: 'API Configuration Error', 
        message: 'Missing Replicate API key' 
      }, { status: 500 });
    }

    const replicate = new Replicate({
      auth: replicateToken,
    });

    // 1. Handle Image (if base64)
    let imageUrl = image;
    if (image.startsWith('data:image')) {
      const base64Data = image.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      imageUrl = await uploadToSupabase(
        buffer, 
        `avatar_input_${Date.now()}.png`, 
        'image/png'
      );
    }

    // 2. Call Replicate (fofr/face-to-many)
    console.log('Starting Replicate face-to-many prediction...');
    const prediction = await replicate.predictions.create({
      version: "a07f252abbbd832009640b27f063ea52d87d7a23a185ca165bec23b5adc8deaf",
      input: {
        image: imageUrl,
        prompt: styleDescription,
        style: "3D", // Default to 3D, prompt will refine it
        instant_id_strength: 0.8,
        denoising_strength: 0.65,
        negative_prompt: "bad quality, blurry, low resolution, distorted, ugly",
      }
    });

    if (prediction.error) {
      throw new Error(`Replicate Error: ${prediction.error}`);
    }

    console.log('Replicate prediction started:', prediction.id);

    return NextResponse.json({
      success: true,
      id: `replicate_${prediction.id}`,
      status: 'processing'
    });

  } catch (error: any) {
    console.error('AI Avatar Creator Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate AI Avatar', 
      details: error.message 
    }, { status: 500 });
  }
}
