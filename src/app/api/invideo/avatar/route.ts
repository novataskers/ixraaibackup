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

    console.log('Starting Freepik AI Avatar generation (Image Style Transfer)...');

    // Prepare style transfer payload
    // We try to match the engine based on user prompt
    let engine = "balanced";
    const promptLower = styleDescription.toLowerCase();
    
    if (promptLower.includes("anime") || promptLower.includes("ghibli") || promptLower.includes("manga")) {
      engine = "colorful_anime";
    } else if (promptLower.includes("caricature") || promptLower.includes("cartoon") || promptLower.includes("funny")) {
      engine = "caricature";
    } else if (promptLower.includes("realistic") || promptLower.includes("photo") || promptLower.includes("8k")) {
      engine = "super_real";
    } else if (promptLower.includes("3d") || promptLower.includes("pixar") || promptLower.includes("render")) {
      engine = "balanced"; // Balanced works best for 3D/Pixar in style transfer
    }

    const payload = {
      image: image, // Freepik accepts base64 data URIs
      prompt: styleDescription,
      is_portrait: true,
      portrait_style: "pop",
      portrait_beautifier: "beautify_face",
      engine: engine,
      style_strength: 85,
      structure_strength: 70
    };

    const response = await fetch("https://api.freepik.com/v1/ai/image-style-transfer", {
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
      id: `freepik_style_${taskId}`,
      status: 'processing',
      note: "Generating via Freepik Style Transfer"
    });

  } catch (error: any) {
    console.error('AI Avatar Creator Error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to generate AI Avatar using Freepik', 
      details: error.message 
    }, { status: 500 });
  }
}
