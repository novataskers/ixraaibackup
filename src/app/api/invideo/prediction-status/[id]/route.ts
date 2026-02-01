import { NextResponse } from "next/server";
import { activeJobs } from "@/lib/video-jobs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = (await params).id;

    if (id.startsWith("pika_")) {
      const taskId = id.replace("pika_", "");
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

    if (id.startsWith("kie_")) {
      const taskId = id.replace("kie_", "");
      const kieApiKey = process.env.KIE_AI_API_KEY;

      if (!kieApiKey) {
        return NextResponse.json({ error: "KIE_AI_API_KEY not configured" }, { status: 500 });
      }

      const response = await fetch(`https://api.kie.ai/api/v1/veo/record-info?taskId=${taskId}`, {
        headers: {
          "Authorization": `Bearer ${kieApiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Kie AI status");
      }

      const data = await response.json();
      const info = data.data;

      if (!info) {
        throw new Error("Task info not found");
      }

      let normalizedStatus = "processing";
      let output = null;
      let error = null;

      if (info.successFlag === 1) {
        normalizedStatus = "succeeded";
        const resultUrls = JSON.parse(info.resultUrls || "[]");
        output = resultUrls[0];
      } else if (info.successFlag === 2 || info.successFlag === 3) {
        normalizedStatus = "failed";
        error = info.errorMessage || "Generation failed on Kie AI";
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

      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          "Authorization": `Token ${replicateToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch Replicate status");
      }

      const prediction = await response.json();
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
