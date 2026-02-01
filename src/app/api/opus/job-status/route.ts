import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

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

  // If job is processing and has a vizard_project_id, poll Vizard.ai
    if (job.status === "processing" && job.vizard_project_id) {
      try {
        const vizardApiKey = process.env.VIZARDAI_API_KEY!;
        console.log(`[opus] Polling Vizard.ai status for project: ${job.vizard_project_id} using key: ${vizardApiKey.substring(0, 4)}...${vizardApiKey.substring(vizardApiKey.length - 4)}`);
        const vizardResponse = await fetch(`https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/query/${job.vizard_project_id}`, {
          headers: {
            "VIZARDAI_API_KEY": vizardApiKey,
          },
        });

      if (vizardResponse.ok) {
        const vizardData = await vizardResponse.json();
        console.log(`[opus] Vizard response code: ${vizardData.code}`);

          // code 2000 means processing is finished and clips are ready
          if (vizardData.code === 2000 && vizardData.videos) {
            const vizardClips = vizardData.videos;
            const generatedClips = vizardClips.map((clip: any, idx: number) => {
              const durationSeconds = (clip.videoMsDuration || 0) / 1000;
              return {
                id: idx + 1,
                filename: `clip_${idx + 1}.mp4`,
                downloadUrl: clip.videoUrl, 
                thumbnailUrl: clip.thumbnailUrl || job.thumbnail_url,
                start: clip.startTime || 0,
                end: clip.endTime || durationSeconds,
                duration: durationSeconds,
                text: clip.title || clip.viralReason || "",
                score: (parseFloat(clip.viralScore) || 0) * 10 || 10,
                vizard_clip_id: clip.id || idx
              };
            });

            await supabase
              .from("opus_jobs")
              .update({
                status: "completed",
                current_step: "done",
                progress: 100,
                clips: {
                  items: generatedClips,
                  videoId: job.video_id,
                  youtubeUrl: job.youtube_url,
                },
              })
              .eq("id", jobId);
            
            // Update local job object for immediate response
            job.status = "completed";
            job.current_step = "done";
            job.progress = 100;
            job.clips = { items: generatedClips, videoId: job.video_id, youtubeUrl: job.youtube_url };
          } else if (vizardData.code === 4004 || vizardData.code === 5000 || vizardData.code === 4002 || vizardData.code === 4007) {
            // Error states (4007 is insufficient quota)
            const errorMsg = vizardData.code === 4007 
              ? "Insufficient Vizard.ai quota/minutes. Please check your Vizard account."
              : vizardData.message || vizardData.errMsg || "Vizard.ai processing failed";

            await supabase
              .from("opus_jobs")
              .update({
                status: "failed",
                current_step: "error",
                error_message: errorMsg,
              })
              .eq("id", jobId);
            
            job.status = "failed";
            job.current_step = "error";
            job.error_message = errorMsg;
          } else if (vizardData.code === 1000) {
            // Still processing
            console.log(`[opus] Vizard still processing: ${vizardData.message || "Working..."}`);
            
            // Increment progress slowly to show it's not stuck
            if (job.progress < 95) {
              const nextProgress = job.progress + 1;
              await supabase
                .from("opus_jobs")
                .update({ progress: nextProgress })
                .eq("id", jobId);
              job.progress = nextProgress;
            }
          } else {
            // Unknown code, log and treat as processing for now but with caution
            console.log(`[opus] Vizard returned unknown code ${vizardData.code}: ${vizardData.message || ""}`);
          }
      }
    } catch (e) {
      console.error("[opus] Error polling Vizard.ai:", e);
    }
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    currentStep: job.current_step,
    progress: job.progress,
    videoInfo: {
      title: job.video_title || job.file_name || "Video",
      duration: job.video_duration,
      thumbnail: job.thumbnail_url,
      videoId: job.video_id,
      fileUrl: job.file_url,
    },
    transcription: job.transcription,
    clips: job.clips,
    errorMessage: job.error_message,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  });
}
