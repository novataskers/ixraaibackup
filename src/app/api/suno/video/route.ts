import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { audioUrl } = body;

    if (!audioUrl) {
      return NextResponse.json({ error: "Audio URL is required" }, { status: 400 });
    }

    console.log("Waveform generation is currently disabled (Replicate removed).");

    return NextResponse.json({ 
      error: "Waveform video generation is currently unavailable. We are transitioning to our new Hugging Face engine.", 
      success: false 
    }, { status: 501 });

  } catch (error: any) {
    console.error("Video Generation Error:", error);
    return NextResponse.json({ 
      error: "Failed to generate video", 
      details: error.message 
    }, { status: 500 });
  }
}
