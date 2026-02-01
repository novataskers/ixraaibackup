import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const oneMinAiApiKey = process.env.ONE_MIN_AI_API_KEY;
    if (!oneMinAiApiKey) {
      return NextResponse.json({ error: "1min.ai API key not configured" }, { status: 500 });
    }

    console.log("Video generation request received (via 1min.ai - Budget model):", { prompt });

    // Try the cheapest possible model
    const response = await fetch("https://api.1min.ai/api/features", {
      method: "POST",
      headers: {
        "API-KEY": oneMinAiApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "TEXT_TO_VIDEO",
        model: "cjwbw/damo-text-to-video:1e205ea73084bd17a0a3b43396e49ba0d6bc2e754e9283b2df49fad2dcf95755",
        conversationId: "TEXT_TO_VIDEO",
        promptObject: {
          prompt: prompt,
          num_frames: 20,
          fps: 8
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `1min.ai API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("1min.ai generate-video response:", JSON.stringify(data, null, 2));
    
    if (data.aiRecord && data.aiRecord.status === "SUCCESS" && data.aiRecord.temporaryUrl) {
      return NextResponse.json({ 
        success: true, 
        status: "succeeded", 
        output: data.aiRecord.temporaryUrl,
        id: `1min_sync_${Math.random().toString(36).substring(7)}`
      });
    }

    if (data.aiRecord && data.aiRecord.id) {
      return NextResponse.json({ 
        success: true, 
        status: "processing", 
        id: `1min_${data.aiRecord.id}` 
      });
    }

    throw new Error("Failed to start 1min.ai task - no record returned");

  } catch (error: any) {
    console.error("Video Generation Error:", error);
    return NextResponse.json({ 
      error: "Failed to start video generation", 
      details: error.message 
    }, { status: 500 });
  }
}
