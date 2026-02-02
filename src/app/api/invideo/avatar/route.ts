import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image, styleDescription } = await req.json();

    if (!image || !styleDescription) {
      return NextResponse.json({ error: 'Image and style description are required' }, { status: 400 });
    }

    const freepikApiKey = process.env.FREEPIK_API_KEY;
    if (!freepikApiKey) {
      return NextResponse.json({ error: 'Freepik API key not configured' }, { status: 500 });
    }

    console.log('Starting Freepik AI Avatar generation (Flux Kontext Pro)...');

    // Prepare enhanced prompt based on style
    let enhancedPrompt = styleDescription;
    const promptLower = styleDescription.toLowerCase();
    
    if (promptLower.includes("anime") || promptLower.includes("ghibli") || promptLower.includes("manga")) {
      enhancedPrompt = `Masterpiece anime style, ${styleDescription}, high resolution, vibrant colors, clean lines`;
    } else if (promptLower.includes("caricature") || promptLower.includes("cartoon") || promptLower.includes("funny")) {
      enhancedPrompt = `Funny caricature style, ${styleDescription}, expressive features, colorful, stylized 3d`;
    } else if (promptLower.includes("realistic") || promptLower.includes("photo") || promptLower.includes("8k")) {
      enhancedPrompt = `Photorealistic 8k portrait, ${styleDescription}, highly detailed, cinematic lighting, professional photography`;
    } else if (promptLower.includes("3d") || promptLower.includes("pixar") || promptLower.includes("render")) {
      enhancedPrompt = `High-end 3D render, Pixar style, ${styleDescription}, soft lighting, cute stylized proportions, 8k resolution`;
    }

    const payload = {
      prompt: enhancedPrompt,
      input_image: image, // Freepik accepts base64 data URIs
      prompt_upsampling: true,
      guidance: 3.5,
      steps: 30,
      aspect_ratio: "square_1_1"
    };

    const response = await fetch("https://api.freepik.com/v1/ai/text-to-image/flux-kontext-pro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": freepikApiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Freepik API Error:', errorData);
      throw new Error(errorData.error?.message || errorData.message || `Freepik API returned ${response.status}`);
    }

    const data = await response.json();
    const taskId = data.data.task_id;

    return NextResponse.json({
      success: true,
      id: `freepik_avatar_${taskId}`,
      status: 'processing',
      note: "Generating via Freepik Flux Kontext Pro"
    });

  } catch (error: any) {
    console.error('AI Avatar Creator Error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to generate AI Avatar using Freepik', 
      details: error.message 
    }, { status: 500 });
  }
}
