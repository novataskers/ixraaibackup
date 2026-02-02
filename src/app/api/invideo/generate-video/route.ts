import { NextResponse } from "next/server";
import { client } from "@gradio/client";
import { activeJobs } from "@/lib/video-jobs";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    console.log("Starting free Video Generation via Gradio (Wan-AI/Wan2.1)...");

    const taskId = uuidv4();
    activeJobs.set(taskId, { status: "processing" });

    // Launch the Gradio task in the background
    (async () => {
      try {
        const app = await client("Wan-AI/Wan2.1");
        
        // Wan2.1 T2V usually takes (prompt, resolution, watermark, seed)
        // We'll use 480P for stability and speed in a free space
        const result = await app.predict("/t2v_generation", [
          prompt,       // txt2vid_prompt
          "832x480",    // resolution
          false,        // watermark_wanx
          -1            // seed
        ]);

        if (result && result.data && result.data[1]) {
          // result.data[1] is the video URL
          activeJobs.set(taskId, {
            status: "succeeded",
            output: result.data[1].url || result.data[1]
          });
        } else {
          throw new Error("No video output in Gradio response");
        }
      } catch (err: any) {
        console.error(`Gradio Video Job ${taskId} failed:`, err);
        activeJobs.set(taskId, {
          status: "failed",
          error: err.message || "Video generation failed"
        });
      }
    })();

    return NextResponse.json({ 
      success: true, 
      status: "processing", 
      id: `gradio_${taskId}` 
    });

  } catch (error: any) {
    console.error("Free Video Generation Error:", error);
    return NextResponse.json({ 
      error: "Failed to start free video generation", 
      details: error.message 
    }, { status: 500 });
  }
}
