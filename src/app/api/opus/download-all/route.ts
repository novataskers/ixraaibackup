import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import archiver from "archiver";
import { PassThrough, Readable } from "stream";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 300;

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

  const clips = job.clips?.items || [];
  if (clips.length === 0) {
    return NextResponse.json({ error: "No clips found for this job" }, { status: 400 });
  }

  const archive = archiver("zip", { zlib: { level: 9 } });
  const passThrough = new PassThrough();

  // We need to handle the archive stream correctly for Next.js response
  // Passing a stream to NextResponse works in Node.js runtime
  
  const streamResponse = new NextResponse(passThrough as any, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="vizard-clips-${jobId}.zip"`,
      "Cache-Control": "no-cache",
    },
  });

  // Start zipping process
  archive.pipe(passThrough);

  // Use a separate async block to avoid blocking the initial response return
  (async () => {
    try {
      for (const clip of clips) {
        if (!clip.downloadUrl) continue;

        try {
          console.log(`[download-all] Fetching clip: ${clip.filename || clip.id}`);
          const clipResponse = await fetch(clip.downloadUrl);
          
          if (clipResponse.ok && clipResponse.body) {
            // @ts-ignore - Readable.fromWeb exists in Node 18+
            const nodeStream = Readable.fromWeb(clipResponse.body);
            archive.append(nodeStream, { name: clip.filename || `clip-${clip.id}.mp4` });
          } else {
            console.error(`[download-all] Failed to fetch clip ${clip.id}: ${clipResponse.statusText}`);
          }
        } catch (fetchErr) {
          console.error(`[download-all] Error fetching clip ${clip.id}:`, fetchErr);
        }
      }
      console.log("[download-all] Finalizing archive...");
      await archive.finalize();
    } catch (archiveErr) {
      console.error(`[download-all] Archive error:`, archiveErr);
      passThrough.end();
    }
  })();

  return streamResponse;
}
