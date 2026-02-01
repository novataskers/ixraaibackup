import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateJob(jobId: string, updates: any) {
  try {
    const { error } = await supabase
      .from("opus_jobs")
      .update(updates)
      .eq("id", jobId);
    
    if (error) throw error;
  } catch (e) {
    console.error(`[opus] Error updating job ${jobId}:`, e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "No job ID provided" }, { status: 400 });
    }

    const { data: job, error } = await supabase
      .from("opus_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    try {
      // Step 1: Send directly to Vizard.ai API
      // We skip local transcription and audio download to make it much faster.
      await updateJob(jobId, { status: "processing", current_step: "finding_clips", progress: 20 });
      
        const vizardApiKey = process.env.VIZARDAI_API_KEY;
        if (!vizardApiKey) {
          throw new Error("VIZARDAI_API_KEY is missing from environment variables");
        }
        console.log(`[opus] Creating Vizard project using key: ${vizardApiKey.substring(0, 4)}...${vizardApiKey.substring(vizardApiKey.length - 4)}`);

          const vizardResponse = await fetch("https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/create", {
          method: "POST",
          headers: {
            "VIZARDAI_API_KEY": vizardApiKey,
            "Content-Type": "application/json",
          },
            body: JSON.stringify({
              videoUrl: job.youtube_url,
              videoType: 2,
              lang: "auto",
              projectName: job.video_title || `Project ${jobId}`,
              subtitleSwitch: job.add_captions ? 1 : 0,
            }),
        });

      const vizardData = await vizardResponse.json();
      console.log("[opus] Vizard API response:", JSON.stringify(vizardData, null, 2));

      if (!vizardResponse.ok) {
        throw new Error(`Vizard.ai API error: ${vizardResponse.status} ${vizardData.message || vizardData.errMsg || ""}`);
      }
      
      if (vizardData.code !== 2000 || !vizardData.projectId) {
        throw new Error(`Vizard.ai failed: ${vizardData.errMsg || vizardData.message || "No project ID returned"}`);
      }

      const vizardProjectId = vizardData.projectId;
      console.log(`[opus] Vizard project created: ${vizardProjectId}`);

      await updateJob(jobId, { 
        vizard_project_id: vizardProjectId,
        current_step: "cutting_clips", // We'll stay on this step while Vizard processes
        progress: 40 
      });

      return NextResponse.json({ success: true, jobId, vizardProjectId });

    } catch (processError) {
      console.error("Job processing error:", processError);
      await updateJob(jobId, {
        status: "failed",
        current_step: "error",
        error_message: processError instanceof Error ? processError.message : "Processing failed",
      });

      return NextResponse.json(
        { error: processError instanceof Error ? processError.message : "Processing failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Process job error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process job" },
      { status: 500 }
    );
  }
}

export const maxDuration = 300;
