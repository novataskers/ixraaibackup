import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { sourceImage, targetImage } = await req.json();

    if (!sourceImage || !targetImage) {
      return NextResponse.json({ error: 'Both source and target images are required' }, { status: 400 });
    }

    const apiKey = process.env.SEGMIND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Segmind API key not configured' }, { status: 500 });
    }

    // Segmind Faceswap V4
    const response = await fetch('https://api.segmind.com/v1/faceswap-v4', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_image: sourceImage,
        target_image: targetImage,
        model_type: 'speed',
        swap_type: 'head',
        style_type: 'normal',
        image_format: 'png',
        image_quality: 90,
        hardware: 'fast',
        base64: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Segmind API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.output || !data.output[0]) {
      throw new Error('Failed to get output from Segmind');
    }

    return NextResponse.json({ 
      success: true, 
      output: data.output[0]
    });

  } catch (error: any) {
    console.error('Segmind Face Swap Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to swap face' },
      { status: 500 }
    );
  }
}
