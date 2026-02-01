"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  FileVideo,
  Loader2,
  ArrowLeft,
  Youtube,
  Sparkles,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Play,
  Scissors,
} from "lucide-react";
import Link from "next/link";

type VideoInfo = {
  title: string;
  duration: number;
  thumbnail: string;
  videoId?: string;
};

type GeneratedClip = {
  id: number;
  filename: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  start: number;
  end: number;
  duration: number;
  text: string;
  score: number;
  cobaltUrl?: string;
};

type JobStatus = {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  currentStep: string;
  progress: number;
  videoInfo: VideoInfo;
  transcription?: { text: string; segments: unknown[] };
  clips?: { items: GeneratedClip[]; zipUrl?: string; videoId?: string; youtubeUrl?: string };
  errorMessage?: string;
};

const STEP_CONFIG: Record<string, { label: string }> = {
  queued: { label: "Queued" },
  downloading_audio: { label: "Downloading Audio" },
  transcribing: { label: "AI Transcription" },
  finding_clips: { label: "Finding Best Parts" },
  downloading_video: { label: "Downloading Video" },
  cutting_clips: { label: "Cutting Clips" },
  done: { label: "Complete" },
  error: { label: "Error" },
};

const PROCESSING_STEPS = [
  "downloading_audio",
  "transcribing", 
  "finding_clips",
  "downloading_video",
  "cutting_clips",
  "done"
];

export default function OpusPage() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

    const [downloadingClipId, setDownloadingClipId] = useState<number | null>(null);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);

    const handleDownloadAll = async () => {
      if (!jobId) return;
      setIsDownloadingAll(true);
      try {
        window.location.href = `/api/opus/download-all?jobId=${jobId}`;
        // Reset state after a delay since we can't easily detect download completion
        setTimeout(() => setIsDownloadingAll(false), 3000);
      } catch (err) {
        console.error("Download all error:", err);
        setIsDownloadingAll(false);
      }
    };

    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const downloadFile = (url: string, filename: string) => {
    if (!url) return;
    
    // For external URLs, use the proxy to force download
    if (url.startsWith("http")) {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&download=true`;
      window.location.href = proxyUrl;
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pollJobStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/opus/job-status?jobId=${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch job status");
      }
      const data: JobStatus = await response.json();
      setJobStatus(data);

      if (data.status === "completed" || data.status === "failed") {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (data.status === "failed") {
          setErrorMessage(data.errorMessage || "Processing failed");
        }
      }
    } catch (error) {
      console.error("Poll error:", error);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const startPolling = (id: string) => {
    pollJobStatus(id);
    pollIntervalRef.current = setInterval(() => {
      pollJobStatus(id);
    }, 2000);
  };

  const resetState = () => {
    setYoutubeUrl("");
    setJobId(null);
    setJobStatus(null);
    setErrorMessage("");
    setIsSubmitting(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const handleSubmit = async () => {
    if (!youtubeUrl.trim()) {
      setErrorMessage("Please enter a YouTube URL");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/opus/create-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: youtubeUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create job");
      }

      const data = await response.json();
      setJobId(data.jobId);
      setIsSubmitting(false);
      startPolling(data.jobId);

      fetch("/api/opus/process-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: data.jobId }),
      }).catch((err) => console.error("Process job trigger error:", err));
    } catch (error) {
      setIsSubmitting(false);
      setErrorMessage(error instanceof Error ? error.message : "Failed to create job");
    }
  };

  const isProcessing = jobId !== null && jobStatus?.status === "processing";
  const isCompleted = jobStatus?.status === "completed";
  const isFailed = jobStatus?.status === "failed";
  const clips = jobStatus?.clips?.items || [];

  const getCurrentStepIndex = () => {
    if (!jobStatus) return -1;
    return PROCESSING_STEPS.indexOf(jobStatus.currentStep);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-purple-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-sm">Back to Dashboard</span>
        </Link>

            <div className="mb-10 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
              <div className="text-center group cursor-default">
                <div className="mb-4 inline-flex items-center justify-center rounded-[24px] bg-gradient-to-b from-[#A855F7] to-[#D946EF] p-5 shadow-[0_0_30px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-all duration-300">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h1 className="mb-2 text-4xl font-bold tracking-tight text-white">
                  Vizard Studio
                </h1>
                <p className="text-sm text-zinc-400">
                  Turn long YouTube videos into viral short clips with AI
                </p>
              </div>

              <a 
                href="https://orchids-video-splitter-tool-11111111ssxsxxs-production-6973.up.railway.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center group transition-all"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-[24px] bg-gradient-to-b from-[#A855F7] to-[#D946EF] p-5 shadow-[0_0_30px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-all duration-300">
                  <Scissors className="h-10 w-10 text-white" />
                </div>
                <h2 className="mb-2 text-4xl font-bold tracking-tight text-white">
                  Video Splitter
                </h2>
                <p className="text-sm text-zinc-400">
                  Split large videos without re-encoding
                </p>
              </a>
            </div>

        {!jobId && (
          <>
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm mb-6">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="youtube-url" className="font-mono text-sm text-zinc-400 flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-500" />
                    YouTube Video URL
                  </Label>
                  <Input
                    id="youtube-url"
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                    className="border-zinc-800 bg-zinc-950 font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500 focus:ring-purple-500 h-12"
                    disabled={isSubmitting}
                  />
                  <p className="font-mono text-xs text-zinc-600">
                    Paste any YouTube video link to generate viral clips
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !youtubeUrl.trim()}
              className="w-full bg-purple-600 font-mono text-white hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 h-14 text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating job...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Viral Clips
                </>
              )}
            </Button>
          </>
        )}

        {jobId && (
          <div className="space-y-6">
            {jobStatus?.videoInfo && (
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {jobStatus.videoInfo.thumbnail && (
                      <img
                        src={jobStatus.videoInfo.thumbnail}
                        alt={jobStatus.videoInfo.title}
                        className="w-40 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-mono text-sm font-medium text-zinc-200 line-clamp-2">
                        {jobStatus.videoInfo.title}
                      </h3>
                      {jobStatus.videoInfo.duration > 0 && (
                        <p className="mt-1 font-mono text-xs text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(jobStatus.videoInfo.duration)}
                        </p>
                      )}
                      {isProcessing && (
                        <p className="mt-2 font-mono text-xs text-purple-400">
                          Processing your video... This may take a few minutes.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 font-mono text-lg text-zinc-200">
                  {isProcessing && <Loader2 className="h-5 w-5 animate-spin text-purple-400" />}
                  {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                  {isFailed && <AlertCircle className="h-5 w-5 text-red-400" />}
                  Processing Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-zinc-400">Progress</span>
                    <span className="text-purple-400">{jobStatus?.progress || 0}%</span>
                  </div>
                  <Progress value={jobStatus?.progress || 0} className="h-2" />
                </div>

                <div className="space-y-2 pt-2">
                  {PROCESSING_STEPS.map((step, idx) => {
                    const currentIdx = getCurrentStepIndex();
                    const isActive = step === jobStatus?.currentStep && jobStatus?.status !== "completed";
                    const isComplete = idx < currentIdx || jobStatus?.status === "completed";

                    return (
                      <div
                        key={step}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                          isActive
                            ? "bg-purple-500/10 border border-purple-500/30"
                            : isComplete
                            ? "bg-emerald-500/5 border border-emerald-500/20"
                            : "bg-zinc-900/30 border border-zinc-800/50"
                        }`}
                      >
                        <div className="w-6 h-6 flex items-center justify-center">
                          {isActive ? (
                            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                          ) : isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                        <span
                          className={`font-mono text-sm ${
                            isActive
                              ? "text-purple-400"
                              : isComplete
                              ? "text-emerald-400"
                              : "text-zinc-600"
                          }`}
                        >
                          {STEP_CONFIG[step]?.label || step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {clips.length > 0 && (
              <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 font-mono text-lg text-zinc-200">
                        <FileVideo className="h-5 w-5 text-purple-400" />
                        Best Clips Found ({clips.length})
                      </CardTitle>
                      {isCompleted && clips.length > 0 && (
                        <Button
                          onClick={handleDownloadAll}
                          disabled={isDownloadingAll}
                          className="bg-purple-600 hover:bg-purple-500 font-mono text-xs h-8 px-3"
                        >
                          {isDownloadingAll ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-3 w-3" />
                          )}
                          Download All (ZIP)
                        </Button>
                      )}
                    </div>
                    <p className="font-mono text-xs text-zinc-500 mt-2">
                      AI found these engaging moments. Click to watch or download.
                    </p>
                  </CardHeader>
                <CardContent className="space-y-4">
                    {clips.map((clip) => {
                      const videoId = jobStatus?.clips?.videoId;
                      const youtubeWatchUrl = videoId 
                        ? `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(clip.start)}` 
                        : "#";
                      
                      return (
                        <div
                          key={clip.id}
                          className="flex items-start gap-4 rounded-lg bg-zinc-950 p-4 border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                          <div className="relative flex-shrink-0">
                            {clip.thumbnailUrl && (
                              <img
                                src={clip.thumbnailUrl}
                                alt={`Clip ${clip.id} preview`}
                                className="w-32 h-20 rounded-lg object-cover"
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black/60 rounded-full p-2">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </div>
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                              {formatDuration(clip.duration)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-mono text-sm font-medium text-purple-400">
                                Clip {clip.id}
                              </span>
                              <span className="font-mono text-xs text-zinc-600">
                                {formatDuration(clip.start)} - {formatDuration(clip.end)}
                              </span>
                              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                                Score: {clip.score.toFixed(1)}
                              </span>
                            </div>
                            {clip.text && (
                              <p className="font-mono text-xs text-zinc-500 line-clamp-2 mb-2">{clip.text}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <a
                                href={youtubeWatchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-mono hover:bg-red-500 transition-colors"
                              >
                                <Youtube className="h-3.5 w-3.5" />
                                Watch on YouTube
                              </a>
                                {videoId && (
                                      <button
                                        disabled={downloadingClipId === clip.id}
                                        onClick={async () => {
                                          setDownloadingClipId(clip.id);
                                          
                                            // If it's a direct Klap URL, use it
                                            if (clip.downloadUrl && (clip.downloadUrl.includes("klap.app") || clip.downloadUrl.includes("http"))) {
                                              downloadFile(clip.downloadUrl, clip.filename || `clip-${clip.id}.mp4`);
                                              setDownloadingClipId(null);
                                              return;
                                            }

                                            const downloadUrl = `/api/opus/download-clip?videoId=${videoId}&start=${Math.floor(clip.start)}&end=${Math.floor(clip.end)}&json=true`;
                                            try {
                                              const res = await fetch(downloadUrl);
                                              const data = await res.json();
                                              
                                              if (data.url) {
                                                // Direct link download
                                                downloadFile(data.url, `clip-${videoId}-${Math.floor(clip.start)}-${Math.floor(clip.end)}.mp4`);
                                              } else if (data.error) {
                                                alert(`Download failed: ${data.error}`);
                                              } else {
                                                // Fallback if it's still returning a stream
                                                const finalDownloadUrl = downloadUrl.replace("&json=true", "");
                                                downloadFile(finalDownloadUrl, `clip-${videoId}-${Math.floor(clip.start)}-${Math.floor(clip.end)}.mp4`);
                                              }
                                            } catch (err) {

                                            console.error("Download error:", err);
                                            alert("Download failed. Please try again.");
                                          } finally {
                                            setDownloadingClipId(null);
                                          }
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-mono hover:bg-purple-500 transition-colors disabled:opacity-50"
                                      >

                                      {downloadingClipId === clip.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Download className="h-3.5 w-3.5" />
                                      )}
                                      {downloadingClipId === clip.id ? "Downloading..." : "Download"}
                                    </button>
                                  )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
              </Card>
            )}

            {(isCompleted || isFailed) && (
              <Button
                onClick={resetState}
                variant="outline"
                className="w-full border-zinc-700 font-mono hover:bg-zinc-800"
              >
                Process Another Video
              </Button>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-center">
            <p className="font-mono text-sm text-red-400">{errorMessage}</p>
            <Button
              onClick={resetState}
              variant="outline"
              size="sm"
              className="mt-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Try Again
            </Button>
          </div>
        )}

        <p className="mt-8 text-center font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
          Powered by Vizard Studio
        </p>
      </div>
    </div>
  );
}
