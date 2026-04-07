"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  MessageSquare,
  Send,
  Paperclip,
  FileText,
  Bot,
  User,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const features: { id: string; name: string; icon: any; description: string; color: string; href?: string }[] = [
  {
    id: "ixrachat",
    name: "IxraChat",
    icon: MessageSquare,
    description: "Chat with AI and analyze documents, PDFs, and files.",
    color: "text-amber-400",
  },
  {
    id: "text-video",
    name: "AI Video Generation",
    icon: Video,
    description: "Generate cinematic videos with advanced AI.",
    color: "text-yellow-400",
  },

  {
    id: "text-image",
    name: "AI Image Generation",
    icon: ImageIcon,
    description: "Generate high-fidelity images with premium models.",
    color: "text-amber-500",
  },
  {
    id: "avatars",
    name: "AI Avatar Creator",
    icon: UserSquare2,
    description: "Turn your photo into a stylized AI avatar.",
    color: "text-yellow-500",
  },
  {
    id: "background",
    name: "Background Remover",
    icon: Layers,
    description: "Remove image backgrounds instantly.",
    color: "text-amber-300",
  },
  {
    id: "upscale",
    name: "Image Upscaler",
    icon: Maximize2,
    description: "Enhance resolution up to 8K with AI.",
    color: "text-yellow-300",
  },
  {
    id: "recorder",
    name: "Screen Recorder",
    icon: Monitor,
    description: "Professional screen capturing with AI enhancements.",
    color: "text-amber-600",
  },
];

export default function InvideoPage() {
  const [activeTab, setActiveTab] = useState("ixrachat");

    // Video Generation State

  const [advPrompt, setAdvPrompt] = useState("");
  const [isAdvGenerating, setIsAdvGenerating] = useState(false);
  const [advVideoUrl, setAdvVideoUrl] = useState<string | null>(null);
  const [advStatus, setAdvStatus] = useState<string | null>(null);
  const [advProgress, setAdvProgress] = useState<number>(0);
  const [advError, setAdvError] = useState<string | null>(null);
  const [advAttachedImage, setAdvAttachedImage] = useState<string | null>(null);
  const [advDuration, setAdvDuration] = useState<number>(5);
  const advImageInputRef = useRef<HTMLInputElement>(null);

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState<string>("any");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

    // Fallback progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAdvGenerating && advProgress < 90) {
      interval = setInterval(() => {
        setAdvProgress((prev) => {
          if (prev < 90) return prev + 1;
          return prev;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isAdvGenerating, advProgress]);

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
  const [avatarBackground, setAvatarBackground] = useState("");
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

  // IxraChat State
  type ChatMessage = { role: "user" | "assistant"; content: string; fileName?: string };
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatFile, setChatFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [chatMessages, isChatLoading]);

  const getMimeTypeFromFile = (file: File): string => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const extMap: Record<string, string> = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        doc: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ppt: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        xlsx: "text/csv",
        xls: "text/csv",
        txt: "text/plain",
        csv: "text/csv",
        md: "text/markdown",
        json: "application/json",
        rtf: "application/rtf",
        epub: "application/epub+zip",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
    };
    if (extMap[ext]) return extMap[ext];
    if (file.type && file.type !== "application/octet-stream") return file.type;
    return "application/octet-stream";
  };

  const handleChatFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      const mimeType = getMimeTypeFromFile(file);
      setChatFile({ name: file.name, base64, mimeType });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text && !chatFile) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text || `Analyze this file: ${chatFile?.name}`,
      fileName: chatFile?.name,
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setIsChatLoading(true);
    setChatError(null);

    const currentFile = chatFile;
    setChatFile(null);

    try {
      const res = await fetch("/api/invideo/ixrachat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          file: currentFile || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as any).error || "Failed to get response");
      }

      // Add an empty assistant message that we'll stream into
      setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setIsChatLoading(false);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setChatMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "assistant") {
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
          }
          return updated;
        });
      }
    } catch (err: any) {
      setChatError(err.message);
      setIsChatLoading(false);
    }
  };

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

  const handleAdvImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAdvAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleGenerateAdvancedVideo = async () => {
    if (!advPrompt) return;

    setIsAdvGenerating(true);
    setAdvError(null);
    setAdvVideoUrl(null);
    setAdvProgress(0);
      setAdvStatus(advAttachedImage ? "Uploading image & starting generation..." : "Starting generation...");

    try {
      const body: Record<string, any> = { prompt: advPrompt, duration: advDuration };
      if (advAttachedImage) {
        body.image = advAttachedImage;
      }

      const response = await fetch("/api/invideo/generate-video-advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.details || data.error || "Failed to start generation");

      if (data.status === "succeeded") {
        setAdvVideoUrl(data.output);
        setIsAdvGenerating(false);
        setAdvStatus("Success!");
        setAdvProgress(100);
        return;
      }

      const taskId = data.id;
        setAdvStatus("Generating video...");

      const checkStatus = async () => {
        try {
          const statusRes = await fetch(`/api/invideo/prediction-status/${taskId}`);
          const statusData = await statusRes.json();

          if (!statusRes.ok) throw new Error(statusData.error || "Failed to check status");

          if (statusData.progress !== undefined && statusData.progress > advProgress) {
            setAdvProgress(statusData.progress);
          }

          if (statusData.message) {
            setAdvStatus(statusData.message);
          }

          if (statusData.status === "succeeded") {
            setAdvVideoUrl(statusData.output);
            setIsAdvGenerating(false);
            setAdvStatus("Success!");
            setAdvProgress(100);
          } else if (statusData.status === "failed") {
            throw new Error(statusData.error || "Generation failed");
          } else if (statusData.status === "processing" || statusData.status === "pending") {
            setTimeout(checkStatus, 5000);
          } else {
            throw new Error("Unexpected status: " + statusData.status);
          }
        } catch (pollErr: any) {
          setAdvError(pollErr.message);
          setIsAdvGenerating(false);
        }
      };

      checkStatus();
    } catch (err: any) {
      setAdvError(err.message);
      setIsAdvGenerating(false);
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
    if (!avatarImage) return;

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
          styleDescription: avatarBackground && avatarStyle ? `${avatarStyle}, with a ${avatarBackground} background` : avatarStyle || (avatarBackground ? `with a ${avatarBackground} background` : "photorealistic portrait"),
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
      <div className="p-4 sm:p-6 lg:p-10 overflow-x-hidden relative pb-16">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/3 w-[400px] h-[300px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-yellow-500/10 blur-[100px] pointer-events-none" />

      <header className="mb-6 sm:mb-8 lg:mb-10 relative">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs backdrop-blur-sm shadow-[0_0_12px_rgba(245,158,11,0.12)]"
          >
            <Zap className="w-3 h-3 mr-1" /> AI Powered Hub
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
          Invideo AI Studio
        </h1>
        <p className="text-zinc-400 max-w-2xl text-sm sm:text-base">
          A unified workspace for AI video generation, image enhancement, and
          professional editing tools.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
        <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:overflow-visible scrollbar-hide">
          {features.map((feature) => {
              const isExternal = !!feature.href;
              const isActive = activeTab === feature.id && !isExternal;
              return (
                <button
                  key={feature.id}
                  onClick={() => {
                    if (isExternal) {
                      window.open(feature.href, "_blank", "noopener,noreferrer");
                    } else {
                      setActiveTab(feature.id);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border transition-all duration-200 text-left whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink lg:w-full",
                    isActive
                      ? "text-white"
                      : "text-zinc-400 hover:text-zinc-200",
                  )}
                  style={isActive ? {
                    background: "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.06) 100%)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    boxShadow: "0 0 20px rgba(245,158,11,0.12), 0 1px 0 rgba(255,255,255,0.07) inset",
                    backdropFilter: "blur(12px)",
                  } : {
                    background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <feature.icon
                    className={cn(
                      "w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0",
                      isActive ? feature.color : "",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-semibold truncate lg:whitespace-normal flex items-center gap-1.5">
                      {feature.name}
                      {isExternal && <ArrowRight className="w-3 h-3 inline-block opacity-50" />}
                    </div>
                  </div>
                </button>
              );
            })}
        </div>

            <div className="lg:col-span-9 min-w-0">
                  <div
                    className="p-4 sm:p-6 lg:p-8 flex flex-col rounded-2xl w-full"
                    style={{
                      height: "calc(100vh - 220px)", minHeight: "500px",
                    background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.1) 100%)",
                    backdropFilter: "blur(24px) saturate(160%)",
                    WebkitBackdropFilter: "blur(24px) saturate(160%)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08) inset",
                  }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col min-h-0 overflow-hidden"
                >
                  {activeTab === "ixrachat" && (
                        <div className="flex flex-col min-h-0 overflow-hidden" style={{ height: "100%" }}>
                          {/* Header */}
                          <div className="flex items-center justify-end mb-3 flex-shrink-0">
                            {chatMessages.length > 0 && (
                              <button
                                onClick={() => { setChatMessages([]); setChatError(null); }}
                                className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                              >
                                <Trash2 className="w-3 h-3" /> New chat
                              </button>
                            )}
                          </div>

                        {/* Messages area */}
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-5 py-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-700/50 scrollbar-track-transparent" style={{ overflowAnchor: "none" }}>
                        {chatMessages.length === 0 && !isChatLoading && (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-zinc-500 text-sm">Hello! How can I help you today?</p>
                          </div>
                        )}

                          {chatMessages.map((msg, idx) => (
                            <div key={idx} className={cn("flex gap-2.5 w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                              {msg.role === "assistant" && (
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/30 to-yellow-600/25 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-[9px] font-black text-amber-300 tracking-tight leading-none">IX</span>
                                </div>
                              )}
                              <div className={cn("max-w-[85%] min-w-0", msg.role === "user" ? "" : "group/msg w-fit")}>
                                {msg.role === "user" ? (
                                  <div className="bg-amber-600/90 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed shadow-lg shadow-amber-900/20 break-words" style={{ overflowWrap: "anywhere" }}>
                                    {msg.fileName && (
                                      <div className="flex items-center gap-1.5 text-[11px] text-amber-200/80 mb-2 pb-2 border-b border-amber-400/20">
                                        <FileText className="w-3 h-3" />
                                        <span className="font-medium truncate">{msg.fileName}</span>
                                      </div>
                                    )}
                                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                                  </div>
                                ) : (
                                  <div className="text-zinc-200 text-sm leading-relaxed min-w-0 w-full overflow-hidden" style={{ overflowWrap: "anywhere" }}>
                                    <div className="prose prose-invert prose-sm max-w-none w-full break-words
                                        prose-p:my-1.5 prose-p:leading-relaxed prose-p:break-words
                                        prose-headings:text-white prose-headings:font-semibold prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
                                        prose-strong:text-white prose-strong:font-semibold
                                        prose-em:text-zinc-300
                                        prose-code:text-amber-300 prose-code:bg-amber-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                                        prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700/50 prose-pre:rounded-xl prose-pre:text-xs prose-pre:overflow-x-auto
                                        prose-ul:my-1.5 prose-ul:pl-4 prose-li:my-0.5 prose-li:break-words
                                        prose-ol:my-1.5 prose-ol:pl-4 prose-li:break-words
                                        prose-blockquote:border-amber-500/40 prose-blockquote:text-zinc-400 prose-blockquote:not-italic
                                        prose-hr:border-zinc-700/50
                                        prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline"
                                      style={{ wordBreak: 'break-word' }}>
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                    </div>
                                    <button
                                      onClick={() => { navigator.clipboard.writeText(msg.content); }}
                                      className="mt-2 flex items-center gap-1 text-[11px] text-zinc-600 hover:text-amber-400 transition-colors opacity-0 group-hover/msg:opacity-100"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                      Copy
                                    </button>
                                  </div>
                                )}
                              </div>
                              {msg.role === "user" && (
                                <div className="w-7 h-7 rounded-lg bg-zinc-700/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <User className="w-3.5 h-3.5 text-zinc-300" />
                                </div>
                              )}
                            </div>
                          ))}

                          {isChatLoading && (
                            <div className="flex gap-2.5 justify-start">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/30 to-yellow-600/25 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[9px] font-black text-amber-300 tracking-tight leading-none">IX</span>
                              </div>
                            <div className="flex items-center gap-1.5 py-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          </div>
                        )}

                        {chatError && (
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                            </div>
                            <div className="text-red-400 text-sm py-1 leading-relaxed">{chatError}</div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                        {/* Input area */}
                        <div className="flex-shrink-0 pt-3 mt-2 border-t border-white/5">
                          <input type="file" ref={chatFileInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt,.csv,.pptx,.xlsx,.json,.md,.rtf,.epub,.png,.jpg,.jpeg,.webp,.gif" onChange={handleChatFileUpload} />
                          <div
                            className="rounded-2xl border transition-all"
                            style={{background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.08)", backdropFilter:"blur(10px)"}}
                          >
                            {chatFile && (
                              <div className="flex items-center gap-2 px-3 pt-2.5">
                                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 text-xs text-amber-300">
                                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate max-w-[200px]">{chatFile.name}</span>
                                  <button onClick={() => setChatFile(null)} className="hover:text-white ml-1 flex-shrink-0"><X className="w-3 h-3" /></button>
                                </div>
                              </div>
                            )}
                            <textarea
                              ref={chatInputRef}
                              rows={1}
                              className="w-full bg-transparent px-4 pt-3 pb-2 text-white text-sm focus:outline-none resize-none leading-relaxed placeholder-zinc-500"
                              style={{ minHeight: "44px", maxHeight: "160px" }}
                              placeholder="Message IxraChat..."
                              value={chatInput}
                              onChange={(e) => { setChatInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
                              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                              disabled={isChatLoading}
                            />
                            <div className="flex items-center justify-between px-3 pb-2.5">
                              <button
                                onClick={() => chatFileInputRef.current?.click()}
                                title="Attach file"
                                className="flex items-center gap-1.5 text-zinc-500 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10 text-xs"
                              >
                                <Paperclip className="w-4 h-4" />
                                <span className="hidden sm:inline">Attach</span>
                              </button>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-600 hidden sm:block">Shift+Enter for new line</span>
                                <button
                                  onClick={handleSendMessage}
                                  disabled={isChatLoading || (!chatInput.trim() && !chatFile)}
                                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/20"
                                >
                                  {isChatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                    </div>
                  )}

                    {activeTab === "text-video" && (
                      <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col overflow-y-auto overflow-x-hidden pr-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">AI Video Generation</h2>
                          <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30 text-xs self-start sm:self-auto">AI Powered</Badge>
                      </div>
                      <div className="flex-1 flex flex-col gap-4 sm:gap-6">
                        {advVideoUrl ? (
                          <div className="space-y-4">
                            <div className="aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black relative group">
                              <video src={advVideoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 transition-opacity">
                                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg text-xs sm:text-sm" onClick={() => downloadFile(advVideoUrl, "generated-video.mp4")}>
                                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Download
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="flex items-center gap-2 text-amber-400">
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-xs sm:text-sm font-medium">Generation Complete</span>
                              </div>
                              <Button variant="outline" onClick={() => { setAdvVideoUrl(null); setAdvPrompt(""); setAdvAttachedImage(null); }} className="border-zinc-800 text-white hover:bg-zinc-800 text-xs sm:text-sm w-full sm:w-auto">Create Another</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-3">
                              <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">Your Prompt</Label>
                              <div className="relative">
                                  <textarea className="w-full h-24 sm:h-32 border rounded-xl p-3 sm:p-4 pb-12 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none" style={{background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.1)",backdropFilter:"blur(10px)"}} placeholder="Describe the cinematic video you want to create..." value={advPrompt} onChange={(e) => setAdvPrompt(e.target.value)} disabled={isAdvGenerating} />
                                <input type="file" ref={advImageInputRef} className="hidden" accept="image/*" onChange={handleAdvImageUpload} />
                                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                  <button
                                    onClick={() => advImageInputRef.current?.click()}
                                    disabled={isAdvGenerating}
                                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-400 transition-colors disabled:opacity-50"
                                  >
                                    <Paperclip className="w-4 h-4" />
                                    <span className="hidden sm:inline">Attach Image</span>
                                  </button>
                                  {advAttachedImage && (
                                    <span className="text-[10px] text-amber-400">Image attached</span>
                                  )}
                                </div>
                              </div>
                              {/* Duration selector */}
                              <div className="space-y-2">
                                <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">Video Duration</Label>
                                <div className="flex flex-wrap gap-2">
                                  {[4, 6, 8, 10, 12].map((sec) => (
                                    <button
                                      key={sec}
                                      onClick={() => setAdvDuration(sec)}
                                      disabled={isAdvGenerating}
                                      className={cn(
                                        "px-4 py-2 rounded-full text-xs font-semibold border transition-all disabled:opacity-40",
                                        advDuration === sec
                                          ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/30"
                                          : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/60 hover:text-white"
                                      )}
                                    >
                                      {sec}s
                                    </button>
                                  ))}
                                </div>
                                <p className="text-[10px] text-zinc-600">Selected: <span className="text-amber-400 font-medium">{advDuration} seconds</span> &nbsp;·&nbsp; Max: 12s</p>
                              </div>
                              {advAttachedImage && (
                                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
                                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-amber-500/30 flex-shrink-0">
                                    <img src={advAttachedImage} alt="Attached" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-amber-300 font-medium">Reference image attached</p>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">The video will be generated based on this image + your prompt</p>
                                  </div>
                                  <button onClick={() => setAdvAttachedImage(null)} className="text-zinc-500 hover:text-white transition-colors flex-shrink-0">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            {advError && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 text-red-400"><AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /><p className="text-xs sm:text-sm">{advError}</p></div>}
                            <div className="mt-auto flex flex-col gap-4">
                              {isAdvGenerating && (
                                <div className="space-y-3 sm:space-y-4 mb-2">
                                  <div className="flex items-center justify-center gap-2 sm:gap-3 text-amber-400">
                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                    <span className="text-xs sm:text-sm font-medium animate-pulse">{advStatus}</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                                    <motion.div className="h-full bg-amber-600" initial={{ width: 0 }} animate={{ width: `${Math.max(advProgress, 5)}%` }} />
                                  </div>
                                </div>
                              )}
                              <Button onClick={handleGenerateAdvancedVideo} disabled={isAdvGenerating || !advPrompt} className="w-full h-12 sm:h-14 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm sm:text-lg gap-2 shadow-lg shadow-amber-900/20 disabled:opacity-50">
                                {isAdvGenerating ? "Processing..." : <><Wand2 className="w-4 h-4 sm:w-5 sm:h-5" /> Generate Video</>}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                    {activeTab === "text-image" && (
                      <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col overflow-y-auto overflow-x-hidden pr-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">AI Image Generation</h2>
                          <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30 text-xs self-start sm:self-auto">High Fidelity</Badge>
                      </div>
                      <div className="flex-1 flex flex-col gap-4 sm:gap-6">
                        {generatedImages.length > 0 ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                              {generatedImages.map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 relative group">
                                  <img src={img} alt={`Generated ${idx}`} className="w-full h-full object-contain" />
                                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 transition-opacity">
                                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg text-xs sm:text-sm" onClick={() => downloadFile(img, `generated-image-${idx}.png`)}>
                                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Download
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="flex items-center gap-2 text-amber-400"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /><span className="text-xs sm:text-sm font-medium">Images Generated</span></div>
                              <Button variant="outline" onClick={() => { setGeneratedImages([]); setImagePrompt(""); }} className="border-zinc-800 text-white hover:bg-zinc-800 text-xs sm:text-sm w-full sm:w-auto">Create Another</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-4 sm:space-y-6">
                              <div className="space-y-3">
                                <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">1. Your Image Prompt</Label>
                                <textarea className="w-full h-24 sm:h-32 border rounded-xl p-3 sm:p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none" style={{background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.1)",backdropFilter:"blur(10px)"}} placeholder="Describe the image you want to generate..." value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} disabled={isGeneratingImage} />
                              </div>
                              <div className="space-y-3">
                                <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">2. Select Style</Label>
                                <div className="flex flex-wrap gap-2">
                                  {[{ id: "any", name: "Default" }, { id: "anime", name: "Anime" }, { id: "portrait", name: "Portrait" }, { id: "3d", name: "3D Render" }, { id: "cyberpunk", name: "Cyberpunk" }].map((s) => (
                                    <button key={s.id} onClick={() => setImageStyle(s.id)} className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium transition-all", imageStyle === s.id ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")}>{s.name}</button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {imageError && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 text-red-400"><AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /><p className="text-xs sm:text-sm">{imageError}</p></div>}
                            <div className="mt-auto flex flex-col gap-4">
                              {isGeneratingImage && <div className="flex items-center justify-center gap-2 sm:gap-3 text-amber-400 mb-2"><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /><span className="text-xs sm:text-sm font-medium animate-pulse">Generating your image...</span></div>}
                              <Button onClick={handleGenerateImage} disabled={isGeneratingImage || !imagePrompt} className="w-full h-12 sm:h-14 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm sm:text-lg gap-2 shadow-lg shadow-amber-900/20 disabled:opacity-50">
                                {isGeneratingImage ? "Processing..." : <><Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> Generate Image</>}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                    {activeTab === "background" && (
                      <div className="space-y-4 sm:space-y-6 lg:space-y-8 flex-1 flex flex-col overflow-y-auto overflow-x-hidden pr-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Background Remover</h2>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs self-start sm:self-auto">Free Community Engine</Badge>
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
                                {isProcessingImg ? <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 animate-spin" /> : processedImage ? <><img src={processedImage} alt="Processed" className="w-full h-full object-contain relative z-10" /><div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20"><Button size="sm" className="bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm" onClick={() => downloadFile(processedImage, "removed-background.png")}><Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Download</Button></div></> : <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-800" />}
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
                          <Button onClick={handleRemoveBackground} disabled={!uploadedImage || isProcessingImg || !!processedImage} variant="secondary" className="h-12 sm:h-14 gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm sm:text-base">{isProcessingImg ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Eraser className="w-4 h-4 sm:w-5 sm:h-5" />} Remove Background</Button>
                          <Button onClick={() => { setUploadedImage(null); setProcessedImage(null); fileInputRef.current?.click(); }} variant="outline" className="h-12 sm:h-14 gap-2 border-zinc-800 text-white hover:bg-zinc-800 text-sm sm:text-base"><RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5" /> Change Image</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "upscale" && (
                      <div className="space-y-4 sm:space-y-6 lg:space-y-8 flex-1 flex flex-col overflow-y-auto overflow-x-hidden pr-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">AI Image Upscaler</h2>
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs self-start sm:self-auto">AI Enhanced</Badge>
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
                                {isUpscaling ? <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 animate-spin" /> : upscaledResult ? <><img src={upscaledResult} alt="Upscaled" className="w-full h-full object-contain relative z-10" /><div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20"><Button size="sm" className="bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm" onClick={() => downloadFile(upscaledResult, "upscaled-image.png")}><Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Download</Button></div></> : <Maximize2 className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-800" />}
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
                          <Button onClick={handleUpscale} disabled={!upscaleImage || isUpscaling || !!upscaledResult} variant="secondary" className="h-12 sm:h-14 gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm sm:text-base">{isUpscaling ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />} Upscale Image</Button>
                          <Button onClick={() => { setUpscaleImage(null); setUpscaledResult(null); upscaleInputRef.current?.click(); }} variant="outline" className="h-12 sm:h-14 gap-2 border-zinc-800 text-white hover:bg-zinc-800 text-sm sm:text-base"><RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5" /> Change Image</Button>
                        </div>
                      </div>
                    </div>
                  )}

                      {activeTab === "recorder" && (
                        <div className="space-y-4 sm:space-y-6 lg:space-y-8 flex-1 flex flex-col overflow-y-auto overflow-x-hidden pr-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <h2 className="text-xl sm:text-2xl font-bold text-white">Screen Recorder</h2>
                          <Badge className={cn("transition-colors text-xs self-start sm:self-auto", isRecording ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-amber-500/20 text-amber-400")}>{isRecording ? "Recording Live" : "Ready to Record"}</Badge>
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
                            <div className={cn("w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8 shadow-2xl transition-all", isRecording ? "bg-red-600 scale-110" : "bg-zinc-900 border border-zinc-800")}>{isRecording ? <div className="w-6 h-6 lg:w-8 lg:h-8 bg-white rounded-sm" /> : <Monitor className="w-8 h-8 lg:w-10 lg:h-10 text-amber-400" />}</div>
                            <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">{isRecording ? "Capturing Screen..." : "Share Your Screen"}</h3>
                            <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? "destructive" : "default"} className={cn("h-14 lg:h-16 px-8 lg:px-10 rounded-2xl font-bold text-base lg:text-lg gap-3 shadow-xl", isRecording ? "bg-red-600" : "bg-amber-600 hover:bg-amber-700")}>{isRecording ? <X className="w-5 h-5 lg:w-6 lg:h-6" /> : <Play className="w-5 h-5 lg:w-6 lg:h-6 fill-current" />}{isRecording ? "Stop Recording" : "Start Recording"}</Button>
                          </div>
                        </div>
                      </div>
                    )}

                      {activeTab === "avatars" && (
                        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden pr-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                          <h2 className="text-xl sm:text-2xl font-bold text-white">AI Avatar Creator</h2>
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs self-start sm:self-auto">Style Transfer</Badge>
                        </div>
                        <div className="flex-1 space-y-4 sm:space-y-6">
                        {avatarResult ? (
                          <div className="space-y-4 flex-1">
                            <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 relative group max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] mx-auto w-full">
                              <img src={avatarResult} alt="AI Avatar" className="w-full h-full object-contain" />
                              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 transition-opacity"><Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg text-xs sm:text-sm" onClick={() => downloadFile(avatarResult, "ai-avatar.png")}><Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Download</Button></div>
                            </div>
                            <Button variant="outline" className="w-full border-zinc-800 text-white text-sm sm:text-base" onClick={() => { setAvatarResult(null); setAvatarStyle(""); setAvatarBackground(""); }}>Create Another</Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 flex-1">
                            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                              <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">1. Upload Your Photo</Label>
                              <div onClick={() => avatarInputRef.current?.click()} className={cn("aspect-square rounded-xl sm:rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative", avatarImage ? "border-amber-500/50" : "border-zinc-800")}>
                                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarImageUpload} />
                                {avatarImage ? <img src={avatarImage} className="w-full h-full object-cover" /> : <><UserSquare2 className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-600 mb-2" /><p className="text-[10px] sm:text-xs text-zinc-500 font-medium">Clear Frontal Portrait</p></>}
                              </div>
                            </div>
                            <div className="space-y-3 sm:space-y-4 lg:space-y-6 flex flex-col">
                              <div className="space-y-3 flex-1">
                                <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">2. Describe Your Style</Label>
                                  <textarea className="w-full h-28 sm:h-32 lg:h-40 border rounded-xl p-3 sm:p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none" style={{background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.1)",backdropFilter:"blur(10px)"}} placeholder="e.g. 3D animated character, Pixar style, Cyberpunk warrior..." value={avatarStyle} onChange={(e) => setAvatarStyle(e.target.value)} disabled={isGeneratingAvatar} />
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                                    {['3D Pixar', 'Anime Style', 'Cyberpunk', 'GTA V Style', 'Caricature'].map((s) => (
                                      <button key={s} onClick={() => setAvatarStyle(s)} className={cn("px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase transition-all", avatarStyle === s ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700")}>{s}</button>
                                    ))}
                                  </div>
                                </div>
                                  <div className="space-y-2">
                                    <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">3. Choose Background</Label>
                                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                                        {[
                                          { id: "professional woman presenter standing in a bright modern office, business casual attire, confident pose, photorealistic", label: "Office Woman", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=400&q=80&fit=crop&crop=face" },
                                          { id: "professional man in suit standing in corporate office with city view background, photorealistic portrait", label: "Corporate Man", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=400&q=80&fit=crop&crop=face" },
                                          { id: "young woman content creator in casual outfit sitting in a cozy home studio with ring light, photorealistic", label: "Home Studio", img: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=300&h=400&q=80&fit=crop&crop=face" },
                                          { id: "man in hoodie standing in modern podcast studio with microphone and acoustic panels, photorealistic", label: "Podcast Studio", img: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&h=400&q=80&fit=crop&crop=face" },
                                          { id: "business woman presenting in front of a clean white background, professional headshot style, photorealistic", label: "Clean White", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&q=80&fit=crop&crop=face" },
                                          { id: "man standing outdoors in a modern city street background, casual smart attire, golden hour lighting, photorealistic", label: "City Outdoor", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&q=80&fit=crop&crop=face" },
                                          { id: "woman with natural background standing near large windows with soft natural light streaming in, photorealistic", label: "Window Light", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&q=80&fit=crop&crop=face" },
                                          { id: "tech professional man in front of blue neon lit server room and tech equipment background, photorealistic", label: "Tech Lab", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&q=80&fit=crop&crop=face" },
                                          { id: "woman news anchor style presenter standing in front of a blurred newsroom background, photorealistic", label: "Newsroom", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=400&q=80&fit=crop&crop=face" },
                                          { id: "fitness instructor man in athletic wear in a bright modern gym background, photorealistic", label: "Gym", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=400&q=80&fit=crop&crop=faces" },
                                          { id: "professional teacher woman standing in front of a classroom whiteboard background, photorealistic", label: "Classroom", img: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=300&h=400&q=80&fit=crop&crop=face" },
                                          { id: "man in orange blazer orange background portrait style professional presenter, photorealistic", label: "Bold Orange", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&q=80&fit=crop&crop=face" },
                                        ].map((bg) => (
                                        <button
                                          key={bg.id}
                                          onClick={() => setAvatarBackground(avatarBackground === bg.id ? "" : bg.id)}
                                          title={bg.label}
                                          className="relative flex flex-col items-center gap-1 group"
                                        >
                                            <div
                                              className="relative w-full rounded-xl overflow-hidden transition-all duration-200"
                                              style={{
                                                aspectRatio: "3/4",
                                                outline: avatarBackground === bg.id ? "2px solid #22c55e" : "2px solid transparent",
                                                boxShadow: avatarBackground === bg.id ? "0 0 12px #22c55e80" : "none",
                                              }}
                                            >
                                              <img src={bg.img} alt={bg.label} className="w-full h-full object-cover object-top" />
                                              <div className={cn("absolute inset-0 transition-all duration-200", avatarBackground === bg.id ? "bg-amber-500/20" : "bg-black/0 group-hover:bg-black/20")} />
                                              {avatarBackground === bg.id && (
                                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                              )}
                                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1.5">
                                                <span className={cn("text-[9px] font-semibold truncate w-full block text-center", avatarBackground === bg.id ? "text-green-300" : "text-white/80")}>
                                                  {bg.label}
                                                </span>
                                              </div>
                                            </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                              <div className="mt-auto pt-3 sm:pt-4 lg:pt-6 space-y-3 sm:space-y-4">
                                {isGeneratingAvatar && <div className="flex items-center justify-center gap-2 sm:gap-3 text-amber-400 mb-2"><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /><span className="text-xs sm:text-sm font-medium animate-pulse">{avatarStatus}</span></div>}
                                <Button onClick={handleGenerateAvatar} disabled={isGeneratingAvatar || !avatarImage} className="w-full h-12 sm:h-14 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm sm:text-lg gap-2 shadow-lg shadow-amber-900/20 disabled:opacity-50">
                                  {isGeneratingAvatar ? "Processing..." : <><Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> Create Avatar</>}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab !== "ixrachat" &&
                  activeTab !== "text-video" &&
                  activeTab !== "advanced-video" &&
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
            </div>
          </div>
        </div>
      </div>
  );
}
