import { NextResponse } from "next/server";
import { activeJobs } from "@/lib/video-jobs";
import Replicate from "replicate";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = (await params).id;

    if (id.startsWith("pika_") || id.startsWith("gradio_")) {
      const taskId = id.replace("pika_", "").replace("gradio_", "");
      const job = activeJobs.get(taskId);

      if (!job) {
        return NextResponse.json({ status: "not_found", error: "Job not found" }, { status: 404 });
      }

      return NextResponse.json({
        status: job.status,
        output: job.output,
        error: job.error,
        success: true,
      });
    }

    if (id.startsWith("freepik_avatar_") || id.startsWith("freepik_style_")) {
      const isAvatar = id.startsWith("freepik_avatar_");
      const taskId = isAvatar ? id.replace("freepik_avatar_", "") : id.replace("freepik_style_", "");
      const freepikApiKey = process.env.FREEPIK_API_KEY;

      if (!freepikApiKey) {
        return NextResponse.json({ error: "FREEPIK_API_KEY not configured" }, { status: 500 });
      }

      // Use different status endpoint based on the task type
      const endpoint = isAvatar 
        ? `https://api.freepik.com/v1/ai/text-to-image/flux-kontext-pro/${taskId}`
        : `https://api.freepik.com/v1/ai/image-style-transfer/${taskId}`;

      const response = await fetch(endpoint, {
        headers: {
          "x-freepik-api-key": freepikApiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Freepik Status Error (${response.status}):`, errorText);
        throw new Error(`Failed to fetch Freepik status: ${response.status}`);
      }

      const data = await response.json();
      const taskData = data.data;

      let normalizedStatus = "processing";
      let output = null;
      let error = null;

      if (taskData.status === "COMPLETED") {
        normalizedStatus = "succeeded";
        output = taskData.generated[0];
      } else if (taskData.status === "FAILED") {
        normalizedStatus = "failed";
        error = taskData.error?.message || "Generation failed on Freepik";
      }

      return NextResponse.json({
        status: normalizedStatus,
        output,
        error,
        success: true,
      });
    }

    if (id.startsWith("kie_")) {
      const taskId = id.replace("kie_", "");
      const kieApiKey = process.env.KIE_AI_API_KEY;

      if (!kieApiKey) {
        return NextResponse.json({ error: "KIE API key not configured" }, { status: 500 });
      }

      // Using the general recordInfo endpoint as it works for all models including sora
      const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: {
          "Authorization": `Bearer ${kieApiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`KIE AI Status Error (${response.status}):`, errorText);
        throw new Error(`Failed to fetch Kie AI status: ${response.status}`);
      }

      const data = await response.json();
      const info = data.data;

      if (!info) {
        throw new Error("Task info not found");
      }

      console.log(`KIE AI raw status for ${taskId}:`, JSON.stringify(info));

      let normalizedStatus = "processing";
      let output = null;
      let error = null;
      let progress = info.progress || 0;
      let message = info.state === "waiting" ? "In queue..." : "Generating video...";

      // Sora 2 and modern KIE models use 'state'
      if (info.state === "success") {
        normalizedStatus = "succeeded";
        let resultUrls = [];
        try {
          const resultData = typeof info.resultJson === 'string' 
            ? JSON.parse(info.resultJson) 
            : info.resultJson;
          resultUrls = resultData?.resultUrls || [];
        } catch (e) {
          console.error("Failed to parse resultJson:", e);
        }
        output = resultUrls[0];
      } else if (info.state === "fail") {
        normalizedStatus = "failed";
        error = info.failMsg || "Generation failed on Kie AI";
      } 
      // Fallback to successFlag for older/image models
      else if (info.successFlag === 1) {
        normalizedStatus = "succeeded";
        let resultUrls = [];
        try {
          const source = info.response || info;
          if (typeof source.resultUrls === 'string') {
            resultUrls = JSON.parse(source.resultUrls || "[]");
          } else if (Array.isArray(source.resultUrls)) {
            resultUrls = source.resultUrls;
          }
        } catch (e) {
          console.error("Failed to parse resultUrls:", e);
        }
        output = resultUrls[0];
      } else if (info.successFlag === 2 || info.successFlag === 3) {
        normalizedStatus = "failed";
        error = info.errorMessage || "Generation failed on Kie AI";
      }

      return NextResponse.json({
        status: normalizedStatus,
        output,
        error,
        progress,
        message,
        success: true,
      });
    }

    if (id.startsWith("seedance_")) {
        const taskId = id.replace("seedance_", "");
        const freepikApiKey = process.env.FREEPIK_SEEDANCE_API_KEY;

        if (!freepikApiKey) {
          return NextResponse.json({ error: "FREEPIK_SEEDANCE_API_KEY not configured" }, { status: 500 });
        }

        const response = await fetch(`https://api.freepik.com/v1/ai/video/seedance-1-5-pro-480p/${taskId}`, {
          headers: {
            "x-freepik-api-key": freepikApiKey,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Seedance Status Error (${response.status}):`, errorText);
          throw new Error(`Failed to fetch Seedance status: ${response.status}`);
        }

        const data = await response.json();
        const taskData = data.data;
        console.log(`Seedance status for ${taskId}:`, JSON.stringify(taskData));

        let normalizedStatus = "processing";
        let output = null;
        let error = null;

        if (taskData.status === "COMPLETED") {
          normalizedStatus = "succeeded";
          output = taskData.generated?.[0];
        } else if (taskData.status === "FAILED") {
          normalizedStatus = "failed";
          error = "Generation failed on Seedance";
        }

        return NextResponse.json({
          status: normalizedStatus,
          output,
          error,
          success: true,
        });
      }

      if (id.startsWith("replicate_")) {
        const predictionId = id.replace("replicate_", "");
        const replicateToken = process.env.REPLICATE_API_TOKEN;

        if (!replicateToken) {
          return NextResponse.json({ error: "REPLICATE_API_TOKEN not configured" }, { status: 500 });
        }

        const replicate = new Replicate({
          auth: replicateToken,
        });

        const prediction = await replicate.predictions.get(predictionId);
        console.log(`Replicate status check for ${predictionId}:`, prediction.status);

        let normalizedStatus = "processing";
        let output = null;
        let error = null;

        if (prediction.status === "succeeded") {
          normalizedStatus = "succeeded";
          output = prediction.output;
        } else if (prediction.status === "failed") {
          normalizedStatus = "failed";
          error = prediction.error || "Generation failed on Replicate";
        } else if (prediction.status === "canceled") {
          normalizedStatus = "failed";
          error = "Generation was canceled";
        }

        return NextResponse.json({
          status: normalizedStatus,
          output,
          error,
          success: true,
        });
      }

    if (!id.startsWith("1min_")) {
      return NextResponse.json({ error: "Invalid prediction ID" }, { status: 400 });
    }

    if (id.startsWith("1min_sync_")) {
      return NextResponse.json({
        status: "succeeded",
        success: true,
      });
    }

    const uuid = id.replace("1min_", "");
    const oneMinAiApiKey = process.env.ONE_MIN_AI_API_KEY;

    if (!oneMinAiApiKey) {
      return NextResponse.json({ error: "1min.ai API key not configured" }, { status: 500 });
    }

    // Checking status via 1min.ai ai-records endpoint
    const response = await fetch(`https://api.1min.ai/api/ai-records/${uuid}`, {
      headers: {
        "API-KEY": oneMinAiApiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch 1min.ai status");
    }

    const data = await response.json();
    console.log(`1min.ai status check for ${uuid}:`, JSON.stringify(data, null, 2));
    const aiRecord = data.aiRecord;

    if (!aiRecord) {
      throw new Error("AI record not found");
    }

    // Map 1min.ai status to UI expectations
    let normalizedStatus = "processing";
    let error = null;

    if (aiRecord.status === "SUCCESS") {
      normalizedStatus = "succeeded";
    } else if (aiRecord.status === "FAILED") {
      normalizedStatus = "failed";
      error = "Generation failed on 1min.ai. Please try a different prompt.";
    }

    return NextResponse.json({
      status: normalizedStatus,
      output: aiRecord.temporaryUrl,
      error,
      success: true,
    });
  } catch (error: any) {
    console.error("Prediction Status Error:", error);
    return NextResponse.json(
      { error: "Failed to get prediction status", details: error.message },
      { status: 500 }
    );
  }
}
