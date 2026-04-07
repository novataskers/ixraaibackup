import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImageToCloudinary(base64Image: string): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: "invideo-advanced-gen",
    resource_type: "image",
  });
  return result.secure_url;
}

export async function POST(req: Request) {
  try {
    const { prompt, image, duration } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    const clampedDuration = Math.min(12, Math.max(4, Number(duration) || 5));

    const apiKey = process.env.FREEPIK_SEEDANCE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "FREEPIK_SEEDANCE_API_KEY not configured" }, { status: 500 });

    let imageUrl: string | undefined;
    if (image) {
      imageUrl = await uploadImageToCloudinary(image);
    }

    const mode = imageUrl ? "Image-to-Video" : "Text-to-Video";
    console.log(`Starting Seedance 1.5 Pro ${mode} via Freepik...`);

    const body: Record<string, unknown> = {
      prompt,
      duration: clampedDuration,
      aspect_ratio: "widescreen_16_9",
      generate_audio: true,
      seed: -1,
    };

    if (imageUrl) {
      body.image = imageUrl;
    }

    const response = await fetch("https://api.freepik.com/v1/ai/video/seedance-1-5-pro-480p", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Freepik Seedance API Error:", JSON.stringify(data));
      return NextResponse.json({
        error: "Failed to start advanced video generation",
        details: JSON.stringify(data),
      }, { status: response.status });
    }

    console.log("Seedance task created:", JSON.stringify(data));

    const taskId = data.data?.task_id;
    if (!taskId) {
      return NextResponse.json({
        error: "No task_id returned from Freepik",
        details: JSON.stringify(data),
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: "processing",
      id: `seedance_${taskId}`,
    });
  } catch (error: any) {
    console.error("Seedance Video Generation Error:", error);
    return NextResponse.json({
      error: "Failed to start advanced video generation",
      details: error.message,
    }, { status: 500 });
  }
}
