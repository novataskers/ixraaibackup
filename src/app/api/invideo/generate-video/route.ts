import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const kieApiKey = process.env.KIE_VIDEO_API_KEY;
    if (!kieApiKey) {
      return NextResponse.json({ error: "KIE_VIDEO_API_KEY not configured" }, { status: 500 });
    }

    console.log("Starting Video Generation via KIE AI (sora-2-text-to-video)...");

    // Using the lowest cost model: sora-2-text-to-video
    const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${kieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sora-2-text-to-video",
          input: {
            prompt: prompt,
            aspect_ratio: "landscape"
          }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || "Failed to create KIE AI task");
    }

    const data = await response.json();
    
    if (data.code !== 200 || !data.data?.taskId) {
      throw new Error(data.msg || "Invalid response from KIE AI");
    }

    return NextResponse.json({ 
      success: true, 
      status: "processing", 
      id: `kie_${data.data.taskId}` 
    });

  } catch (error: any) {
    console.error("KIE Video Generation Error:", error);
    return NextResponse.json({ 
      error: "Failed to start video generation", 
      details: error.message 
    }, { status: 500 });
  }
}
