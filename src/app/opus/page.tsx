"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const glassPanel = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.1) 100%)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08) inset",
} as React.CSSProperties;

const glassCard = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
  backdropFilter: "blur(20px) saturate(160%)",
  WebkitBackdropFilter: "blur(20px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.07) inset",
} as React.CSSProperties;

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
      if (!response.ok) throw new Error("Failed to fetch job status");
      const data: JobStatus = await response.json();
      setJobStatus(data);
      if (data.status === "completed" || data.status === "failed") {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (data.status === "failed") setErrorMessage(data.errorMessage || "Processing failed");
      }
    } catch (error) {
      console.error("Poll error:", error);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const startPolling = (id: string) => {
    pollJobStatus(id);
    pollIntervalRef.current = setInterval(() => pollJobStatus(id), 2000);
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
        body: JSON.stringify({ url: youtubeUrl }),
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
    <div className="min-h-screen text-white selection:bg-amber-500/30 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[500px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full bg-yellow-500/10 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-sm">Back to Dashboard</span>
        </Link>

        {/* Header icons */}
        <div className="mb-10 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
          <div className="text-center group cursor-default">
            <div className="mb-4 inline-flex items-center justify-center rounded-[24px] bg-gradient-to-b from-amber-500 to-yellow-600 p-5 shadow-[0_0_30px_rgba(245,158,11,0.35)] group-hover:shadow-[0_0_50px_rgba(245,158,11,0.55)] group-hover:scale-110 transition-all duration-300">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-white">Vizard Studio</h1>
            <p className="text-sm text-zinc-400">Turn long YouTube videos into viral short clips with AI</p>
          </div>

          <a
            href="https://orchids-video-splitter-tool-11111111ssxsxxs-production-c687.up.railway.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-center group transition-all"
          >
            <div className="mb-4 inline-flex items-center justify-center rounded-[24px] bg-gradient-to-b from-amber-500 to-yellow-600 p-5 shadow-[0_0_30px_rgba(245,158,11,0.35)] group-hover:shadow-[0_0_50px_rgba(245,158,11,0.55)] group-hover:scale-110 transition-all duration-300">
              <Scissors className="h-10 w-10 text-white" />
            </div>
            <h2 className="mb-2 text-4xl font-bold tracking-tight text-white">Video Splitter</h2>
            <p className="text-sm text-zinc-400">Split large videos without re-encoding</p>
          </a>
        </div>

        {!jobId && (
          <>
            <div className="rounded-2xl p-6 mb-6 relative overflow-hidden" style={glassPanel}>
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
              <div className="space-y-4">
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
                    className="font-mono text-zinc-200 placeholder:text-zinc-600 h-12 rounded-xl input-glass border-0 focus-visible:ring-1 focus-visible:ring-amber-500/50"
                    disabled={isSubmitting}
                  />
                  <p className="font-mono text-xs text-zinc-600">Paste any YouTube video link to generate viral clips</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !youtubeUrl.trim()}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 font-mono text-white disabled:opacity-40 h-14 text-lg rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Creating job...</>
              ) : (
                <><Sparkles className="mr-2 h-5 w-5" />Generate Viral Clips</>
              )}
            </Button>
          </>
        )}

        {jobId && (
          <div className="space-y-5">
            {jobStatus?.videoInfo && (
              <div className="rounded-2xl p-5 relative overflow-hidden" style={glassCard}>
                <div className="flex items-start gap-4">
                  {jobStatus.videoInfo.thumbnail && (
                    <img
                      src={jobStatus.videoInfo.thumbnail}
                      alt={jobStatus.videoInfo.title}
                      className="w-40 h-24 object-cover rounded-xl border border-white/10"
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
                      <p className="mt-2 font-mono text-xs text-amber-400">
                        Processing your video...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl p-6 relative overflow-hidden" style={glassPanel}>
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
              <div className="flex items-center gap-2 font-mono text-lg text-zinc-200 mb-5 font-bold">
                {isProcessing && <Loader2 className="h-5 w-5 animate-spin text-amber-400" />}
                {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                {isFailed && <AlertCircle className="h-5 w-5 text-red-400" />}
                Processing Status
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-zinc-400">Progress</span>
                    <span className="text-amber-400">{jobStatus?.progress || 0}%</span>
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
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                          isActive
                            ? "bg-amber-500/10 border border-amber-500/30"
                            : isComplete
                            ? "bg-emerald-500/5 border border-emerald-500/20"
                            : "bg-white/[0.02] border border-white/[0.05]"
                        }`}
                      >
                        <div className="w-6 h-6 flex items-center justify-center">
                          {isActive ? (
                            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          ) : isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                        <span className={`font-mono text-sm ${isActive ? "text-amber-400" : isComplete ? "text-emerald-400" : "text-zinc-600"}`}>
                          {STEP_CONFIG[step]?.label || step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {clips.length > 0 && (
              <div className="rounded-2xl p-6 relative overflow-hidden" style={glassPanel}>
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-mono text-lg text-zinc-200 font-bold">
                    <FileVideo className="h-5 w-5 text-amber-400" />
                    Best Clips Found ({clips.length})
                  </div>
                  {isCompleted && clips.length > 0 && (
                    <Button
                      onClick={handleDownloadAll}
                      disabled={isDownloadingAll}
                      className="bg-amber-600 hover:bg-amber-500 font-mono text-xs h-8 px-3 rounded-xl"
                    >
                      {isDownloadingAll ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Download className="mr-2 h-3 w-3" />}
                      Download All (ZIP)
                    </Button>
                  )}
                </div>
                <p className="font-mono text-xs text-zinc-500 mb-5">AI found these engaging moments. Click to watch or download.</p>
                <div className="space-y-4">
                  {clips.map((clip) => {
                    const videoId = jobStatus?.clips?.videoId;
                    const youtubeWatchUrl = videoId
                      ? `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(clip.start)}`
                      : "#";
                    return (
                      <div
                        key={clip.id}
                        className="flex items-start gap-4 rounded-xl p-4 transition-all"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      >
                        <div className="relative flex-shrink-0">
                          {clip.thumbnailUrl && (
                            <img
                              src={clip.thumbnailUrl}
                              alt={`Clip ${clip.id} preview`}
                              className="w-32 h-20 rounded-xl object-cover border border-white/10"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/60 backdrop-blur-sm rounded-full p-2">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                            {formatDuration(clip.duration)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-sm font-medium text-amber-400">Clip {clip.id}</span>
                            <span className="font-mono text-xs text-zinc-600">{formatDuration(clip.start)} - {formatDuration(clip.end)}</span>
                            <span className="font-mono text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Score: {clip.score.toFixed(1)}</span>
                          </div>
                          {clip.text && <p className="font-mono text-xs text-zinc-500 line-clamp-2 mb-2">{clip.text}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <a
                              href={youtubeWatchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/80 text-white text-xs font-mono hover:bg-red-500 transition-colors backdrop-blur-sm"
                            >
                              <Youtube className="h-3.5 w-3.5" />
                              Watch on YouTube
                            </a>
                            {videoId && (
                              <button
                                disabled={downloadingClipId === clip.id}
                                onClick={async () => {
                                  setDownloadingClipId(clip.id);
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
                                      downloadFile(data.url, `clip-${videoId}-${Math.floor(clip.start)}-${Math.floor(clip.end)}.mp4`);
                                    } else if (data.error) {
                                      alert(`Download failed: ${data.error}`);
                                    } else {
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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/100 text-white text-xs font-mono hover:bg-purple-500 transition-colors disabled:opacity-50 backdrop-blur-sm"
                              >
                                {downloadingClipId === clip.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                {downloadingClipId === clip.id ? "Downloading..." : "Download"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(isCompleted || isFailed) && (
              <Button
                onClick={resetState}
                variant="outline"
                className="w-full font-mono rounded-2xl btn-glass border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
              >
                Process Another Video
              </Button>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 rounded-2xl p-4 text-center" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", backdropFilter: "blur(12px)" }}>
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

        <div className="mt-8" />
      </div>
    </div>
  );
}
