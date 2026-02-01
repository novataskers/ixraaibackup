"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Image as ImageIcon, 
  Video, 
  UserSquare2, 
  Layers, 
  Maximize2, 
  UserCircle2, 
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
  RefreshCcw
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
  { id: "text-video", name: "AI Video Generation", icon: Video, description: "Create cinematic videos using the high-performance Wan-2.1 engine.", color: "text-purple-400" },
  { id: "text-image", name: "AI Image Generation", icon: ImageIcon, description: "Generate high-fidelity images with premium models.", color: "text-blue-400" },
  { id: "avatars", name: "AI Avatars", icon: UserSquare2, description: "Realistic avatars with natural voice synthesis.", color: "text-green-400" },
  { id: "background", name: "Background Remover", icon: Layers, description: "Remove image backgrounds instantly.", color: "text-orange-400" },
  { id: "upscale", name: "Image Upscaler", icon: Maximize2, description: "Enhance resolution up to 8K with AI.", color: "text-pink-400" },
  { id: "faceswap", name: "Face Swapper", icon: UserCircle2, description: "Seamless face replacement in photos and videos.", color: "text-red-400" },
  { id: "recorder", name: "Screen Recorder", icon: Monitor, description: "Professional screen capturing with AI enhancements.", color: "text-cyan-400" },
  { id: "img-to-vid", name: "Animation Maker", icon: Zap, description: "Animate static images into cinematic videos.", color: "text-yellow-400" },
];

export default function InvideoPage() {
  const [activeTab, setActiveTab] = useState("text-video");
  
  // Video Generation State
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleGenerateVideo = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatus("Initiating generation...");

    try {
      const response = await fetch("/api/invideo/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.details || data.error || "Failed to start generation");

      if (data.status === "succeeded") {
        setVideoUrl(data.output);
        setIsGenerating(false);
        setStatus("Success!");
        return;
      }

      const taskId = data.id;
      setStatus("Generating video (usually 30-90 seconds)...");

      // Polling for completion
      const checkStatus = async () => {
        try {
          const statusRes = await fetch(`/api/invideo/prediction-status/${taskId}`);
          const statusData = await statusRes.json();

          if (!statusRes.ok) {
            throw new Error(statusData.details || statusData.error || "Failed to check status");
          }

          if (statusData.status === "succeeded") {
            setVideoUrl(statusData.output);
            setIsGenerating(false);
            setStatus("Success!");
          } else if (statusData.status === "failed") {
            throw new Error(statusData.error || "Generation failed");
          } else if (statusData.status === "processing" || statusData.status === "pending") {
            // Still processing
            setTimeout(checkStatus, 5000);
          } else {
            // Unknown status or error in data
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

      if (!response.ok) throw new Error(data.error || "Failed to remove background");

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

      if (!response.ok) throw new Error(data.error || "Failed to upscale image");

      setUpscaledResult(data.output);
    } catch (err: any) {
      setUpscaleError(err.message);
    } finally {
      setIsUpscaling(false);
    }
  };

  const downloadFile = (url: string, filename: string) => {
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

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400">
            <Zap className="w-3 h-3 mr-1" /> AI Powered Hub
          </Badge>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Invideo AI Studio</h1>
        <p className="text-zinc-400 max-w-2xl">
          A unified workspace for AI video generation, image enhancement, and professional editing tools.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Mini Navigation */}
        <div className="lg:col-span-3 space-y-2">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveTab(feature.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left",
                activeTab === feature.id
                  ? "bg-purple-500/10 border-purple-500/50 text-white"
                  : "bg-zinc-900/30 border-zinc-800/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/50"
              )}
            >
              <feature.icon className={cn("w-5 h-5", activeTab === feature.id ? feature.color : "")} />
              <div className="flex-1">
                <div className="text-sm font-semibold">{feature.name}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Workspace */}
        <div className="lg:col-span-9">
          <Card className="bg-zinc-900/50 border-zinc-800 p-8 h-full min-h-[600px] flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col"
              >
                {activeTab === "text-video" && (
                  <div className="space-y-6 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-2xl font-bold text-white">AI Video Generation</h2>
                          <div className="flex gap-2">
                              <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                                Free Pika Playground Engine
                              </Badge>
                          </div>
                        </div>

                      <div className="flex-1 flex flex-col gap-6">
                        {videoUrl ? (
                          <div className="space-y-4">
                              <div className="aspect-video rounded-2xl overflow-hidden bg-black relative group">
                                <video 
                                  src={videoUrl} 
                                  controls 
                                  autoPlay 
                                  loop 
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute top-4 right-4 transition-opacity">
                                  <Button 
                                    size="sm" 
                                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                                    onClick={() => downloadFile(videoUrl, "generated-video.mp4")}
                                  >
                                    <Download className="w-4 h-4 mr-2" /> Download
                                  </Button>
                                </div>
                              </div>

                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 text-green-400">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-sm font-medium">Generation Complete</span>
                              </div>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setVideoUrl(null);
                                  setPrompt("");
                                }}
                                className="border-zinc-800 text-white hover:bg-zinc-800"
                              >
                                Create Another
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-3">
                              <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">Your Prompt</Label>
                              <textarea 
                                className="w-full h-32 bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                                placeholder="Describe the cinematic masterpiece you want to create..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isGenerating}
                              />
                            </div>

                          {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
                              <AlertCircle className="w-5 h-5 flex-shrink-0" />
                              <p className="text-sm">{error}</p>
                            </div>
                          )}

                          <div className="mt-auto flex flex-col gap-4">
                            {isGenerating && (
                              <div className="flex items-center justify-center gap-3 text-purple-400 mb-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-medium animate-pulse">{status}</span>
                              </div>
                            )}
                            <Button 
                              onClick={handleGenerateVideo}
                              disabled={isGenerating || !prompt}
                              className="w-full h-14 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50"
                            >
                              {isGenerating ? (
                                <>Processing...</>
                              ) : (
                                <><Wand2 className="w-5 h-5" /> Generate Video</>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                  {activeTab === "background" && (
                    <div className="space-y-8 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-white">Background Remover</h2>
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">New Tool</Badge>
                      </div>

                      <div className="flex-1 flex flex-col gap-6">
                        {uploadedImage ? (
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[400px]">
                            <div className="space-y-4">
                              <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">Original</Label>
                              <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 group">
                                <img src={uploadedImage} alt="Original" className="w-full h-full object-contain" />
                                <Button 
                                  size="icon" 
                                  variant="destructive" 
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    setUploadedImage(null);
                                    setProcessedImage(null);
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">Result</Label>
                              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                {isProcessingImg ? (
                                  <div className="text-center">
                                    <Loader2 className="w-10 h-10 text-orange-400 animate-spin mx-auto mb-4" />
                                    <p className="text-sm text-zinc-400 animate-pulse">Removing background...</p>
                                  </div>
                                ) : processedImage ? (
                                  <>
                                    <img src={processedImage} alt="Processed" className="w-full h-full object-contain relative z-10" />
                                    <div className="absolute top-4 right-4 z-20">
                                      <Button 
                                        size="sm" 
                                        className="bg-white text-black hover:bg-zinc-200"
                                        onClick={() => downloadFile(processedImage, "removed-background.png")}
                                      >
                                        <Download className="w-4 h-4 mr-2" /> Download
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center p-8">
                                    <ImageIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                    <p className="text-sm text-zinc-600">Click process to see result</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-950/30 hover:bg-zinc-900/30 transition-colors group cursor-pointer"
                          >
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept="image/*" 
                              onChange={handleImageUpload}
                            />
                            <div className="text-center p-12">
                              <div className="w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Upload className="w-10 h-10 text-zinc-500" />
                              </div>
                              <h3 className="text-xl font-semibold text-white mb-2">Upload your image</h3>
                              <p className="text-zinc-500 mb-8">Drop your image here or browse files. Supports PNG, JPG, WEBP.</p>
                              <Button variant="outline" className="border-zinc-800 text-white">Choose File</Button>
                            </div>
                          </div>
                        )}

                        {imgError && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{imgError}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <Button 
                            onClick={handleRemoveBackground}
                            disabled={!uploadedImage || isProcessingImg || !!processedImage}
                            variant="secondary" 
                            className="h-14 gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold"
                          >
                            {isProcessingImg ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Eraser className="w-5 h-5" />
                            )}
                            Remove Background
                          </Button>
                          <Button 
                            onClick={() => {
                              setUploadedImage(null);
                              setProcessedImage(null);
                              fileInputRef.current?.click();
                            }}
                            variant="outline" 
                            className="h-14 gap-2 border-zinc-800 text-white hover:bg-zinc-800"
                          >
                            <RefreshCcw className="w-5 h-5" /> Change Image
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "upscale" && (
                    <div className="space-y-8 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-white">AI Image Upscaler</h2>
                        <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">Powered by Cloudinary</Badge>
                      </div>

                      <div className="flex-1 flex flex-col gap-6">
                        {upscaleImage ? (
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[400px]">
                            <div className="space-y-4">
                              <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">Original</Label>
                              <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 group">
                                <img src={upscaleImage} alt="Original" className="w-full h-full object-contain" />
                                <Button 
                                  size="icon" 
                                  variant="destructive" 
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    setUpscaleImage(null);
                                    setUpscaledResult(null);
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">Upscaled Result</Label>
                              <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                {isUpscaling ? (
                                  <div className="text-center">
                                    <Loader2 className="w-10 h-10 text-pink-400 animate-spin mx-auto mb-4" />
                                    <p className="text-sm text-zinc-400 animate-pulse">Upscaling with AI...</p>
                                  </div>
                                ) : upscaledResult ? (
                                  <>
                                    <img src={upscaledResult} alt="Upscaled" className="w-full h-full object-contain relative z-10" />
                                    <div className="absolute top-4 right-4 z-20">
                                      <Button 
                                        size="sm" 
                                        className="bg-white text-black hover:bg-zinc-200"
                                        onClick={() => downloadFile(upscaledResult, "upscaled-image.png")}
                                      >
                                        <Download className="w-4 h-4 mr-2" /> Download
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center p-8">
                                    <Maximize2 className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                    <p className="text-sm text-zinc-600">Click upscale to enhance image</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => upscaleInputRef.current?.click()}
                            className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-950/30 hover:bg-zinc-900/30 transition-colors group cursor-pointer"
                          >
                            <input 
                              type="file" 
                              ref={upscaleInputRef} 
                              className="hidden" 
                              accept="image/*" 
                              onChange={handleUpscaleImageUpload}
                            />
                            <div className="text-center p-12">
                              <div className="w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Maximize2 className="w-10 h-10 text-zinc-500" />
                              </div>
                              <h3 className="text-xl font-semibold text-white mb-2">Enhance your image</h3>
                              <p className="text-zinc-500 mb-8">Upload low-res images to upscale them using AI. Max 8K resolution.</p>
                              <Button variant="outline" className="border-zinc-800 text-white">Choose File</Button>
                            </div>
                          </div>
                        )}

                        {upscaleError && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{upscaleError}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <Button 
                            onClick={handleUpscale}
                            disabled={!upscaleImage || isUpscaling || !!upscaledResult}
                            variant="secondary" 
                            className="h-14 gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold"
                          >
                            {isUpscaling ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Maximize2 className="w-5 h-5" />
                            )}
                            Upscale Image
                          </Button>
                          <Button 
                            onClick={() => {
                              setUpscaleImage(null);
                              setUpscaledResult(null);
                              upscaleInputRef.current?.click();
                            }}
                            variant="outline" 
                            className="h-14 gap-2 border-zinc-800 text-white hover:bg-zinc-800"
                          >
                            <RefreshCcw className="w-5 h-5" /> Change Image
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other tabs */}
                  {activeTab !== "text-video" && activeTab !== "background" && activeTab !== "upscale" && (

                  <div className="flex flex-col items-center justify-center flex-1 text-center">
                    <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6">
                      {React.createElement(features.find(f => f.id === activeTab)?.icon || Video, { className: "w-10 h-10 text-zinc-400" })}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{features.find(f => f.id === activeTab)?.name}</h3>
                    <p className="text-zinc-500 max-w-sm mb-8">{features.find(f => f.id === activeTab)?.description}</p>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">Open Studio</Button>
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
