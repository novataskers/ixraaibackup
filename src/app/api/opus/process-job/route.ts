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
      
        const vizardKeys = [
          process.env.VIZARDAI_API_KEY,
          process.env.VIZARDAI_API_KEY_2,
          process.env.VIZARDAI_API_KEY_3,
          process.env.VIZARDAI_API_KEY_4,
        ].filter(Boolean) as string[];

        if (vizardKeys.length === 0) {
          throw new Error("No Vizard API keys configured");
        }

        let vizardData: any = null;
        let lastError = "";
        for (const key of vizardKeys) {
          const vizardResponse = await fetch("https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/create", {
            method: "POST",
            headers: {
              "VIZARDAI_API_KEY": key,
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
          const data = await vizardResponse.json();
          if (vizardResponse.ok && data.code === 2000 && data.projectId) {
            vizardData = data;
            break;
          }
          lastError = data.errMsg || data.message || `HTTP ${vizardResponse.status}`;
        }

        if (!vizardData) {
          throw new Error(`Vizard.ai failed: ${lastError}`);
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
