import { NextResponse } from 'next/server';
import { client } from "@gradio/client";

export async function POST(req: Request) {
  try {
    const { image, styleDescription } = await req.json();

    if (!image || !styleDescription) {
      return NextResponse.json({ error: 'Image and style description are required' }, { status: 400 });
    }

    console.log('Starting free AI Avatar generation via Gradio (multimodalart/face-to-all)...');

    // Use a free Gradio space for face-to-many/face-to-all
    // multimodalart/face-to-all is a reliable space for this
    const app = await client("multimodalart/face-to-all");
    
    // We need to convert the base64 image to a Blob for Gradio
    const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
    const blob = new Blob([Buffer.from(base64Data, 'base64')], { type: 'image/png' });

    // The face-to-all space usually takes (image, prompt, negative_prompt, lora_scale, etc.)
    // We'll use default values for most parameters
    const result = await app.predict("/predict", [
      blob,               // face_image
      styleDescription,   // prompt
      "bad quality, blurry, low resolution, distorted, ugly", // negative_prompt
      0.8,                // lora_scale
      0.85,               // face_strength
      0.15,               // image_strength
      7,                  // guidance_scale
      0.8                 // depth_scale
    ]);

    if (!result || !result.data || !result.data[0]) {
      throw new Error("Failed to generate avatar from Gradio space");
    }

    // result.data[0] is usually the generated image URL or object
    const outputImage = result.data[0].url || result.data[0];

    return NextResponse.json({
      success: true,
      output: outputImage,
      status: 'succeeded',
      note: "Generated via free Hugging Face Space"
    });

  } catch (error: any) {
    console.error('Free AI Avatar Creator Error:', error);
    
    // Fallback to a simpler message if Gradio fails
    return NextResponse.json({ 
      error: 'Failed to generate AI Avatar using free engine', 
      details: error.message 
    }, { status: 500 });
  }
}
