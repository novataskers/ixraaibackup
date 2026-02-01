import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VOICE_MAP: Record<string, string> = {
  'Serena': '21m00Tcm4TlvDq8ikWAM', // Rachel
  'Marcus': 'pNInz6obpgDQGcFmaJgB', // Adam
  'Luna': 'EXAVITQu4vr4xnSDxMaL',   // Bella
};

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
    const { image, text, voiceName } = await req.json();

    if (!image || !text) {
      return NextResponse.json({ error: 'Image and text are required' }, { status: 400 });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const replicateToken = process.env.REPLICATE_API_TOKEN;

    if (!elevenLabsApiKey || !replicateToken) {
      return NextResponse.json({ 
        error: 'API Configuration Error', 
        message: 'Missing ElevenLabs or Replicate API key' 
      }, { status: 500 });
    }

    // 1. Generate Audio with ElevenLabs
    const voiceId = VOICE_MAP[voiceName] || VOICE_MAP['Serena'];
    console.log(`Generating voice: ${voiceName} (${voiceId})`);

    const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
        'accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      }),
    });

    if (!voiceResponse.ok) {
      const errorData = await voiceResponse.json().catch(() => ({}));
      throw new Error(`ElevenLabs Error: ${errorData.detail?.message || 'Failed to generate speech'}`);
    }

    const audioBuffer = await voiceResponse.arrayBuffer();
    const audioUrl = await uploadToSupabase(
      audioBuffer, 
      `audio_${Date.now()}.mp3`, 
      'audio/mpeg'
    );

    // 2. Handle Image (if base64)
    let imageUrl = image;
    if (image.startsWith('data:image')) {
      const base64Data = image.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      imageUrl = await uploadToSupabase(
        buffer, 
        `avatar_${Date.now()}.png`, 
        'image/png'
      );
    }

    // 3. Call Replicate SadTalker
    console.log('Starting Replicate SadTalker prediction...');
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "3aa3dac9353e149e7245c3d670b47b22e90ce9f481a511634b423f055ee1639d",
        input: {
          source_image: imageUrl,
          driven_audio: audioUrl,
          preprocess: "crop",
          still: true,
          enhancer: "gfpgan"
        }
      }),
    });

    if (!replicateResponse.ok) {
      const errorData = await replicateResponse.json();
      throw new Error(`Replicate Error: ${errorData.detail || 'Failed to start avatar generation'}`);
    }

    const prediction = await replicateResponse.json();
    console.log('Replicate prediction started:', prediction.id);

    return NextResponse.json({
      success: true,
      id: `replicate_${prediction.id}`,
      status: 'processing'
    });

  } catch (error: any) {
    console.error('AI Avatar Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate AI Avatar', 
      details: error.message 
    }, { status: 500 });
  }
}
