"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Video,
  UserSquare2,
  Layers,
  Maximize2,
  Monitor,
  Zap,
  Sparkles,
  ArrowRight,
  Plus,
  Eraser,
  Wand2,
  Play,
  Upload,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCcw,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "text-video",
    name: "AI Video Generation",
    icon: Video,
    description: "Create cinematic videos using the world-class Grok Imagine engine.",
    color: "text-purple-400",
  },
  {
    id: "text-image",
    name: "AI Image Generation",
    icon: ImageIcon,
    description: "Generate high-fidelity images with premium models.",
    color: "text-blue-400",
  },
  {
    id: "avatars",
    name: "AI Avatar Creator",
    icon: UserSquare2,
    description: "Turn your photo into a stylized AI avatar.",
    color: "text-green-400",
  },
  {
    id: "background",
    name: "Background Remover",
    icon: Layers,
    description: "Remove image backgrounds instantly.",
    color: "text-orange-400",
  },
  {
    id: "upscale",
    name: "Image Upscaler",
    icon: Maximize2,
    description: "Enhance resolution up to 8K with AI.",
    color: "text-pink-400",
  },
  {
    id: "recorder",
    name: "Screen Recorder",
    icon: Monitor,
    description: "Professional screen capturing with AI enhancements.",
    color: "text-cyan-400",
  },
];

export default function InvideoPage() {
  const [activeTab, setActiveTab] = useState("text-video");

  // Video Generation State
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState<string>("any");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  // Fallback progress simulation for models that don't provide granular progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating && progress < 90) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) return prev + 1;
          return prev;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isGenerating, progress]);

  // Background Editor State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upscaler State
  const [upscaleImage, setUpscaleImage] = useState<string | null>(null);
  const [upscaledResult, setUpscaledResult] = useState<string | null>(null);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaleError, setUpscaleError] = useState<string | null>(null);
  const upscaleInputRef = useRef<HTMLInputElement>(null);

  // AI Avatar State
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [avatarStyle, setAvatarStyle] = useState("");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [avatarResult, setAvatarResult] = useState<string | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Screen Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : MediaRecorder.isTypeSupported('video/webm') 
          ? 'video/webm' 
          : 'video/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `screen-recording-${new Date().getTime()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setIsRecording(false);
        setRecordingDuration(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
      
    } catch (err) {
      console.error("Error starting screen recording:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerateVideo = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setProgress(0);
    setStatus("Initiating generation...");

    try {
      const response = await fetch("/api/invideo/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.details || data.error || "Failed to start generation");

      if (data.status === "succeeded") {
        setVideoUrl(data.output);
        setIsGenerating(false);
        setStatus("Success!");
        setProgress(100);
        return;
      }

      const taskId = data.id;
      setStatus("Generating video (usually 30-90 seconds)...");

      const checkStatus = async () => {
        try {
          const statusRes = await fetch(`/api/invideo/prediction-status/${taskId}`);
          const statusData = await statusRes.json();

          if (!statusRes.ok) throw new Error(statusData.error || "Failed to check status");

          if (statusData.progress !== undefined && statusData.progress > progress) {
            setProgress(statusData.progress);
          }

          if (statusData.message) {
            setStatus(statusData.message);
          }

          if (statusData.status === "succeeded") {
            setVideoUrl(statusData.output);
            setIsGenerating(false);
            setStatus("Success!");
            setProgress(100);
          } else if (statusData.status === "failed") {
            throw new Error(statusData.error || "Generation failed");
          } else if (statusData.status === "processing" || statusData.status === "pending") {
            setTimeout(checkStatus, 5000);
          } else {
            throw new Error("Unexpected status: " + statusData.status);
          }
        } catch (pollErr: any) {
          setError(pollErr.message);
          setIsGenerating(false);
        }
      };

      checkStatus();
    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;

    setIsGeneratingImage(true);
    setImageError(null);
    setGeneratedImages([]);

    try {
      const response = await fetch("/api/invideo/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: imagePrompt,
          style: imageStyle === "any" ? undefined : imageStyle
        }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to generate image");

      setGeneratedImages(data.output);
    } catch (err: any) {
      setImageError(err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setProcessedImage(null);
        setImgError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = async () => {
    if (!uploadedImage) return;

    setIsProcessingImg(true);
    setImgError(null);

    try {
      const response = await fetch("/api/invideo/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploadedImage }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to remove background");

      setProcessedImage(data.output);
    } catch (err: any) {
      setImgError(err.message);
    } finally {
      setIsProcessingImg(false);
    }
  };

  const handleUpscaleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpscaleImage(reader.result as string);
        setUpscaledResult(null);
        setUpscaleError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpscale = async () => {
    if (!upscaleImage) return;

    setIsUpscaling(true);
    setUpscaleError(null);

    try {
      const response = await fetch("/api/invideo/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: upscaleImage }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to upscale image");

      setUpscaledResult(data.output);
    } catch (err: any) {
      setUpscaleError(err.message);
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleAvatarImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarImage(reader.result as string);
        setAvatarResult(null);
        setAvatarError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!avatarImage || !avatarStyle) return;

    setIsGeneratingAvatar(true);
    setAvatarError(null);
    setAvatarResult(null);
    setAvatarStatus("Analyzing face & preparing style...");

    try {
      const response = await fetch("/api/invideo/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: avatarImage,
          styleDescription: avatarStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.details || data.error || "Failed to start generation");

      const taskId = data.id;
      setAvatarStatus("Generating stylized avatar (30-60 seconds)...");

      const checkAvatarStatus = async () => {
        try {
          const statusRes = await fetch(`/api/invideo/prediction-status/${taskId}`);
          const statusData = await statusRes.json();

          if (!statusRes.ok) throw new Error(statusData.error || "Failed to check status");

          if (statusData.status === "succeeded") {
            const output = statusData.output;
            const finalUrl = Array.isArray(output) ? output[0] : output;
            
            setAvatarResult(finalUrl);
            setIsGeneratingAvatar(false);
            setAvatarStatus("Success!");
          } else if (statusData.status === "failed") {
            throw new Error(statusData.error || "Generation failed");
          } else {
            setTimeout(checkAvatarStatus, 5000);
          }
        } catch (pollErr: any) {
          setAvatarError(pollErr.message);
          setIsGeneratingAvatar(false);
        }
      };

      checkAvatarStatus();
    } catch (err: any) {
      setAvatarError(err.message);
      setIsGeneratingAvatar(false);
    }
  };

  const downloadFile = (url: string, filename: string) => {
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

  return (
    <div className="p-4 sm:p-6 lg:p-12 overflow-x-hidden">
      <header className="mb-6 sm:mb-8 lg:mb-12">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Badge
            variant="outline"
            className="border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs"
          >
            <Zap className="w-3 h-3 mr-1" /> AI Powered Hub
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-4">
          Invideo AI Studio
        </h1>
        <p className="text-zinc-400 max-w-2xl text-sm sm:text-base">
          A unified workspace for AI video generation, image enhancement, and
          professional editing tools.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:overflow-visible scrollbar-hide">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveTab(feature.id)}
              className={cn(
                "flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border transition-all duration-200 text-left whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink lg:w-full",
                activeTab === feature.id
                  ? "bg-purple-500/10 border-purple-500/50 text-white"
                  : "bg-zinc-900/30 border-zinc-800/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/50",
              )}
            >
              <feature.icon
                className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0",
                  activeTab === feature.id ? feature.color : "",
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-semibold truncate lg:whitespace-normal">{feature.name}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-9">
          <Card className="bg-zinc-900/50 border-zinc-800 p-4 sm:p-6 lg:p-8 h-full min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col"
              >
                {activeTab === "text-video" && (
                    <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">AI Video Generation</h2>
                        <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs self-start sm:self-auto">Grok Imagine (Fast)</Badge>
                      </div>
                    <div className="flex-1 flex flex-col gap-4 sm:gap-6">
                      {videoUrl ? (
                        <div className="space-y-4">
                          <div className="aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black relative group">
                            <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 transition-opacity">
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg text-xs sm:text-sm" onClick={() => downloadFile(videoUrl, "generated-video.mp4")}>
                                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Download
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2 text-green-400">
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span className="text-xs sm:text-sm font-medium">Generation Complete</span>
                            </div>
                            <Button variant="outline" onClick={() => { setVideoUrl(null); setPrompt(""); }} className="border-zinc-800 text-white hover:bg-zinc-800 text-xs sm:text-sm w-full sm:w-auto">Create Another</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">Your Prompt</Label>
                            <textarea className="w-full h-24 sm:h-32 bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 sm:p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none" placeholder="Describe the cinematic masterpiece you want to create..." value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isGenerating} />
                          </div>
                          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 text-red-400"><AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /><p className="text-xs sm:text-sm">{error}</p></div>}
                          <div className="mt-auto flex flex-col gap-4">
                            {isGenerating && (
                              <div className="space-y-3 sm:space-y-4 mb-2">
                                <div className="flex items-center justify-center gap-2 sm:gap-3 text-purple-400">
                                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                  <span className="text-xs sm:text-sm font-medium animate-pulse">{status}</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                                  <motion.div className="h-full bg-purple-600" initial={{ width: 0 }} animate={{ width: `${Math.max(progress, 5)}%` }} />
                                </div>
                              </div>
                            )}
                            <Button onClick={handleGenerateVideo} disabled={isGenerating || !prompt} className="w-full h-12 sm:h-14 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm sm:text-lg gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50">
                              {isGenerating ? "Processing..." : <><Wand2 className="w-4 h-4 sm:w-5 sm:h-5" /> Generate Video</>}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "text-image" && (
                    <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">AI Image Generation</h2>
                        <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-xs self-start sm:self-auto">Powered by Freepik</Badge>
                      </div>
                      <div className="flex-1 flex flex-col gap-4 sm:gap-6">
                        {generatedImages.length > 0 ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                              {generatedImages.map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 relative group">
                                  <img src={img} alt={`Generated ${idx}`} className="w-full h-full object-contain" />
                                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 transition-opacity">
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-xs sm:text-sm" onClick={() => downloadFile(img, `generated-image-${idx}.png`)}>
                                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Download
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="flex items-center gap-2 text-green-400"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /><span className="text-xs sm:text-sm font-medium">Images Generated</span></div>
                              <Button variant="outline" onClick={() => { setGeneratedImages([]); setImagePrompt(""); }} className="border-zinc-800 text-white hover:bg-zinc-800 text-xs sm:text-sm w-full sm:w-auto">Create Another</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-4 sm:space-y-6">
                              <div className="space-y-3">
                                <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">1. Your Image Prompt</Label>
                                <textarea className="w-full h-24 sm:h-32 bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 sm:p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none" placeholder="Describe the image you want to generate..." value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} disabled={isGeneratingImage} />
                              </div>
                              <div className="space-y-3">
                                <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">2. Select Style</Label>
                                <div className="flex flex-wrap gap-2">
                                  {[{ id: "any", name: "Default" }, { id: "anime", name: "Anime" }, { id: "portrait", name: "Portrait" }, { id: "3d", name: "3D Render" }, { id: "cyberpunk", name: "Cyberpunk" }].map((s) => (
                                    <button key={s.id} onClick={() => setImageStyle(s.id)} className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium transition-all", imageStyle === s.id ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")}>{s.name}</button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {imageError && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 text-red-400"><AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /><p className="text-xs sm:text-sm">{imageError}</p></div>}
                            <div className="mt-auto flex flex-col gap-4">
                              {isGeneratingImage && <div className="flex items-center justify-center gap-2 sm:gap-3 text-blue-400 mb-2"><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /><span className="text-xs sm:text-sm font-medium animate-pulse">Generating your image...</span></div>}
                              <Button onClick={handleGenerateImage} disabled={isGeneratingImage || !imagePrompt} className="w-full h-12 sm:h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-lg gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50">
                                {isGeneratingImage ? "Processing..." : <><Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> Generate Image</>}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "background" && (
                    <div className="space-y-4 sm:space-y-6 lg:space-y-8 flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Background Remover</h2>
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs self-start sm:self-auto">Free Community Engine</Badge>
                      </div>
                      <div className="flex-1 flex flex-col gap-4 sm:gap-6">
                        {uploadedImage ? (
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 h-full min-h-[300px] sm:min-h-[400px]">
                            <div className="space-y-3 sm:space-y-4">
                              <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">Original</Label>
                              <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 group">
                                <img src={uploadedImage} alt="Original" className="w-full h-full object-contain" />
                                <Button size="icon" variant="destructive" className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8" onClick={() => { setUploadedImage(null); setProcessedImage(null); }}><X className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
                              </div>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                              <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">Result</Label>
                              <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                {isProcessingImg ? <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400 animate-spin" /> : processedImage ? <><img src={processedImage} alt="Processed" className="w-full h-full object-contain relative z-10" /><div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20"><Button size="sm" className="bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm" onClick={() => downloadFile(processedImage, "removed-background.png")}><Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Download</Button></div></> : <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-800" />}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl sm:rounded-3xl bg-zinc-950/30 hover:bg-zinc-900/30 transition-colors cursor-pointer p-6 sm:p-12">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                            <div className="text-center"><Upload className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-500 mx-auto mb-4 sm:mb-6" /><h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Upload your image</h3><p className="text-zinc-500 text-sm">Drop your image here or browse files.</p></div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <Button onClick={handleRemoveBackground} disabled={!uploadedImage || isProcessingImg || !!processedImage} variant="secondary" className="h-12 sm:h-14 gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm sm:text-base">{isProcessingImg ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Eraser className="w-4 h-4 sm:w-5 sm:h-5" />} Remove Background</Button>
                          <Button onClick={() => { setUploadedImage(null); setProcessedImage(null); fileInputRef.current?.click(); }} variant="outline" className="h-12 sm:h-14 gap-2 border-zinc-800 text-white hover:bg-zinc-800 text-sm sm:text-base"><RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5" /> Change Image</Button>
                        </div>
                      </div>
                    </div>
                  )}

                {activeTab === "upscale" && (
                    <div className="space-y-4 sm:space-y-6 lg:space-y-8 flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">AI Image Upscaler</h2>
                        <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-xs self-start sm:self-auto">Powered by Cloudinary</Badge>
                      </div>
                      <div className="flex-1 flex flex-col gap-4 sm:gap-6">
                        {upscaleImage ? (
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 h-full min-h-[300px] sm:min-h-[400px]">
                            <div className="space-y-3 sm:space-y-4">
                              <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">Original</Label>
                              <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 group">
                                <img src={upscaleImage} alt="Original" className="w-full h-full object-contain" />
                                <Button size="icon" variant="destructive" className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8" onClick={() => { setUpscaleImage(null); setUpscaledResult(null); }}><X className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
                              </div>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                              <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">Upscaled Result</Label>
                              <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                {isUpscaling ? <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-pink-400 animate-spin" /> : upscaledResult ? <><img src={upscaledResult} alt="Upscaled" className="w-full h-full object-contain relative z-10" /><div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20"><Button size="sm" className="bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm" onClick={() => downloadFile(upscaledResult, "upscaled-image.png")}><Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Download</Button></div></> : <Maximize2 className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-800" />}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div onClick={() => upscaleInputRef.current?.click()} className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl sm:rounded-3xl bg-zinc-950/30 hover:bg-zinc-900/30 transition-colors cursor-pointer p-6 sm:p-12">
                            <input type="file" ref={upscaleInputRef} className="hidden" accept="image/*" onChange={handleUpscaleImageUpload} />
                            <div className="text-center"><Maximize2 className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-500 mx-auto mb-4 sm:mb-6" /><h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Enhance your image</h3><p className="text-zinc-500 text-sm">Upscale images using AI up to 8K.</p></div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <Button onClick={handleUpscale} disabled={!upscaleImage || isUpscaling || !!upscaledResult} variant="secondary" className="h-12 sm:h-14 gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm sm:text-base">{isUpscaling ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />} Upscale Image</Button>
                          <Button onClick={() => { setUpscaleImage(null); setUpscaledResult(null); upscaleInputRef.current?.click(); }} variant="outline" className="h-12 sm:h-14 gap-2 border-zinc-800 text-white hover:bg-zinc-800 text-sm sm:text-base"><RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5" /> Change Image</Button>
                        </div>
                      </div>
                    </div>
                  )}

                    {activeTab === "recorder" && (
                      <div className="space-y-4 sm:space-y-6 lg:space-y-8 flex-1 flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <h2 className="text-xl sm:text-2xl font-bold text-white">Screen Recorder</h2>
                          <Badge className={cn("transition-colors text-xs self-start sm:self-auto", isRecording ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-cyan-500/20 text-cyan-400")}>{isRecording ? "Recording Live" : "Ready to Record"}</Badge>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl sm:rounded-3xl bg-zinc-950/30 relative p-6 sm:p-12">
                          {isRecording && <div className="absolute top-3 left-3 sm:top-6 sm:left-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500/10 border border-red-500/30 rounded-full text-xs sm:text-sm font-bold text-red-400">{formatDuration(recordingDuration)}</div>}
                          
                          {/* Mobile Notice */}
                          <div className="md:hidden text-center">
                            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                              <Monitor className="w-8 h-8 text-zinc-600" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Desktop Only Feature</h3>
                            <p className="text-zinc-500 text-sm max-w-xs mx-auto">Screen recording requires a desktop browser. Please open this page on your computer to use this feature.</p>
                          </div>
                          
                          {/* Desktop UI */}
                          <div className="hidden md:block text-center relative z-10">
                            <div className={cn("w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8 shadow-2xl transition-all", isRecording ? "bg-red-600 scale-110" : "bg-zinc-900 border border-zinc-800")}>{isRecording ? <div className="w-6 h-6 lg:w-8 lg:h-8 bg-white rounded-sm" /> : <Monitor className="w-8 h-8 lg:w-10 lg:h-10 text-cyan-400" />}</div>
                            <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">{isRecording ? "Capturing Screen..." : "Share Your Screen"}</h3>
                            <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? "destructive" : "default"} className={cn("h-14 lg:h-16 px-8 lg:px-10 rounded-2xl font-bold text-base lg:text-lg gap-3 shadow-xl", isRecording ? "bg-red-600" : "bg-cyan-600 hover:bg-cyan-700")}>{isRecording ? <X className="w-5 h-5 lg:w-6 lg:h-6" /> : <Play className="w-5 h-5 lg:w-6 lg:h-6 fill-current" />}{isRecording ? "Stop Recording" : "Start Recording"}</Button>
                          </div>
                        </div>
                      </div>
                    )}

                  {activeTab === "avatars" && (
                    <div className="space-y-4 sm:space-y-6 lg:space-y-8 flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">AI Avatar Creator</h2>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs self-start sm:self-auto">Powered by Freepik</Badge>
                      </div>
                      <div className="flex-1 flex flex-col gap-4 sm:gap-6">
                        {avatarResult ? (
                          <div className="space-y-4 flex-1">
                            <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 relative group max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] mx-auto w-full">
                              <img src={avatarResult} alt="AI Avatar" className="w-full h-full object-contain" />
                              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 transition-opacity"><Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-lg text-xs sm:text-sm" onClick={() => downloadFile(avatarResult, "ai-avatar.png")}><Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Download</Button></div>
                            </div>
                            <Button variant="outline" className="w-full border-zinc-800 text-white text-sm sm:text-base" onClick={() => { setAvatarResult(null); setAvatarStyle(""); }}>Create Another</Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 flex-1">
                            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                              <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">1. Upload Your Photo</Label>
                              <div onClick={() => avatarInputRef.current?.click()} className={cn("aspect-square rounded-xl sm:rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative", avatarImage ? "border-green-500/50" : "border-zinc-800")}>
                                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarImageUpload} />
                                {avatarImage ? <img src={avatarImage} className="w-full h-full object-cover" /> : <><UserSquare2 className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-600 mb-2" /><p className="text-[10px] sm:text-xs text-zinc-500 font-medium">Clear Frontal Portrait</p></>}
                              </div>
                            </div>
                            <div className="space-y-3 sm:space-y-4 lg:space-y-6 flex flex-col">
                              <div className="space-y-3 flex-1">
                                <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">2. Describe Your Style</Label>
                                <textarea className="w-full h-28 sm:h-32 lg:h-40 bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 sm:p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all resize-none" placeholder="e.g. 3D animated character, Pixar style, Cyberpunk warrior..." value={avatarStyle} onChange={(e) => setAvatarStyle(e.target.value)} disabled={isGeneratingAvatar} />
                                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                                  {['3D Pixar', 'Anime Style', 'Cyberpunk', 'GTA V Style', 'Caricature'].map((s) => (
                                    <button key={s} onClick={() => setAvatarStyle(s)} className={cn("px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase transition-all", avatarStyle === s ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700")}>{s}</button>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-auto pt-3 sm:pt-4 lg:pt-6 space-y-3 sm:space-y-4">
                                {isGeneratingAvatar && <div className="flex items-center justify-center gap-2 sm:gap-3 text-green-400 mb-2"><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /><span className="text-xs sm:text-sm font-medium animate-pulse">{avatarStatus}</span></div>}
                                <Button onClick={handleGenerateAvatar} disabled={isGeneratingAvatar || !avatarImage || !avatarStyle} className="w-full h-12 sm:h-14 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm sm:text-lg gap-2 shadow-lg shadow-green-900/20 disabled:opacity-50">
                                  {isGeneratingAvatar ? "Processing..." : <><Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> Create Avatar</>}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                  </div>
                )}

                {activeTab !== "text-video" &&
                  activeTab !== "text-image" &&
                  activeTab !== "background" &&
                  activeTab !== "upscale" && 
                  activeTab !== "recorder" &&
                  activeTab !== "avatars" && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                    <Zap className="w-10 h-10 text-zinc-600 mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">Feature Coming Soon</h3>
                    <p className="text-zinc-400 max-w-md">We're working hard to bring this feature to the Invideo Hub. Stay tuned for updates!</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  );
}
