"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Video,
  Scissors, 
  Music, 
  Mic2, 
  FileText, 
  Wand2, 
  Download,
  Play,
  Pause,
  Radio,
  Disc,
  Loader2,
  Zap,
  Volume2,
  Image as ImageIcon,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateLyricVideo } from "@/lib/video-generator";

const genres = ["Lo-fi", "Synthwave", "Cyberpunk", "Classical", "Hip Hop", "Rock", "Acoustic"];
const songStyles = ["Slow", "Fast", "Beat", "Up-beat", "Rock", "Pop", "Jazz", "Emotional", "Energetic"];

export default function SunoPage() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Lo-fi");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [energy, setEnergy] = useState(75);
  const [isLoading, setIsLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentSong, setCurrentSong] = useState<any>({
    title: "No Song Selected",
    audioUrl: "",
    imageUrl: "",
    lyrics: "Select a song from your library or generate a new one to get started.",
    duration: 0,
    currentTime: 0,
    status: 'empty'
  });
  const [activeVersion, setActiveVersion] = useState<'v4' | 'v35'>('v4');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPollingId = useRef<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("suno_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
        parsed.forEach((item: any) => {
          if (item.v4Status === 'generating' && item.v4Id) {
            startPolling(item.v4Id, 'v4', item.id);
          }
          if (item.v35Status === 'generating' && item.v35Id) {
            startPolling(item.v35Id, 'v35', item.id);
          }
        });
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("suno_history", JSON.stringify(history));
  }, [history]);

  const startPolling = async (taskId: string, version: 'v4' | 'v35', historyItemId: string) => {
    let pollCount = 0;
    const maxPolls = 60;
    
    const pollStatus = async () => {
      try {
        const statusRes = await fetch(`/api/suno/status?ids=${taskId}`);
        
        if (!statusRes.ok) {
          if (pollCount < maxPolls) {
            pollCount++;
            setGenerationProgress(Math.min(95, Math.floor((pollCount / maxPolls) * 100)));
            setTimeout(pollStatus, 5000);
            return;
          }
        }

        const statusData = await statusRes.json();
        const song = Array.isArray(statusData) ? statusData[0] : statusData;
        
        if (song && (song.status === 'complete' || song.audio_url)) {
const versionData = {
              audioUrl: song.audio_url,
              imageUrl: song.image_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80",
              title: song.title || "Generated Song",
              timestampedLyrics: song.timestampedLyrics,
              lyrics: song.lyrics,
              status: 'complete'
            };
          
          setHistory(prev => {
            const updated = prev.map(item => {
              if (item.id === historyItemId) {
                const newItem = { ...item };
                if (version === 'v4') {
                  newItem.v4 = versionData;
                  newItem.v4Status = 'complete';
                } else {
                  newItem.v35 = versionData;
                  newItem.v35Status = 'complete';
                }
                if (newItem.v4Status === 'complete' || newItem.v35Status === 'complete') {
                  newItem.status = 'complete';
                }
                return newItem;
              }
              return item;
            });
            
const item = updated.find(i => i.id === historyItemId);
              if (item && currentPollingId.current === historyItemId) {
                const activeVer = activeVersion === 'v4' ? item.v4 : item.v35;
                if (activeVer?.status === 'complete') {
                  const displayLyrics = activeVer.lyrics || item.lyrics;
                  setCurrentSong({
                      ...item,
                      audioUrl: activeVer.audioUrl,
                      imageUrl: activeVer.imageUrl,
                      title: activeVer.title || item.title,
                      lyrics: displayLyrics,
                      timestampedLyrics: activeVer.timestampedLyrics,
                    });
                  toast.success(`${version.toUpperCase()} version ready!`);
                }
                
                const bothDone = (item.v4Status === 'complete' || item.v4Status === 'error' || item.v4Status === 'timeout' || !item.v4Id) &&
                                 (item.v35Status === 'complete' || item.v35Status === 'error' || item.v35Status === 'timeout' || !item.v35Id);
                if (bothDone) {
                  setIsLoading(false);
                  setGenerationProgress(0);
                }
              }
            return updated;
          });
          return;
        }

        if (song && song.status === 'error') {
          setHistory(prev => {
            const updated = prev.map(item => {
              if (item.id === historyItemId) {
                const newItem = { ...item };
                if (version === 'v4') {
                  newItem.v4Status = 'error';
                } else {
                  newItem.v35Status = 'error';
                }
                return newItem;
              }
              return item;
            });
            
            const item = updated.find(i => i.id === historyItemId);
            if (item && currentPollingId.current === historyItemId) {
              const bothDone = (item.v4Status === 'complete' || item.v4Status === 'error' || item.v4Status === 'timeout' || !item.v4Id) &&
                               (item.v35Status === 'complete' || item.v35Status === 'error' || item.v35Status === 'timeout' || !item.v35Id);
              if (bothDone) {
                setIsLoading(false);
                setGenerationProgress(0);
              }
            }
            return updated;
          });
          return;
        }
        
        if (pollCount < maxPolls) {
          pollCount++;
          setGenerationProgress(Math.min(95, Math.floor((pollCount / maxPolls) * 100)));
          setTimeout(pollStatus, 4000);
        } else {
          setHistory(prev => {
            const updated = prev.map(item => {
              if (item.id === historyItemId) {
                const newItem = { ...item };
                if (version === 'v4') {
                  newItem.v4Status = 'timeout';
                } else {
                  newItem.v35Status = 'timeout';
                }
                return newItem;
              }
              return item;
            });
            
            const item = updated.find(i => i.id === historyItemId);
            if (item && currentPollingId.current === historyItemId) {
              const bothDone = (item.v4Status === 'complete' || item.v4Status === 'error' || item.v4Status === 'timeout' || !item.v4Id) &&
                               (item.v35Status === 'complete' || item.v35Status === 'error' || item.v35Status === 'timeout' || !item.v35Id);
              if (bothDone) {
                setIsLoading(false);
                setGenerationProgress(0);
              }
            }
            return updated;
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
        setHistory(prev => {
          const updated = prev.map(item => {
            if (item.id === historyItemId) {
              const newItem = { ...item };
              if (version === 'v4') {
                newItem.v4Status = 'error';
              } else {
                newItem.v35Status = 'error';
              }
              return newItem;
            }
            return item;
          });
          
          const item = updated.find(i => i.id === historyItemId);
          if (item && currentPollingId.current === historyItemId) {
            const bothDone = (item.v4Status === 'complete' || item.v4Status === 'error' || item.v4Status === 'timeout' || !item.v4Id) &&
                             (item.v35Status === 'complete' || item.v35Status === 'error' || item.v35Status === 'timeout' || !item.v35Id);
            if (bothDone) {
              setIsLoading(false);
              setGenerationProgress(0);
              toast.error("Error checking status");
            }
          }
          return updated;
        });
      }
    };
    
    pollStatus();
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.error("Playback failed", e);
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong.audioUrl, retryCount]);

  const handleAudioError = (e: any) => {
    if (currentSong.audioUrl && isPlaying) {
      if (retryCount < 3) {
        const nextRetry = retryCount + 1;
        setTimeout(() => {
          setRetryCount(nextRetry);
          if (audioRef.current) {
            audioRef.current.load();
            setIsPlaying(true);
          }
        }, 2000);
      } else {
        toast.error("Audio failed to load.");
        setIsPlaying(false);
        setRetryCount(0);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentSong(prev => ({
        ...prev,
        currentTime: audioRef.current?.currentTime || 0,
        duration: audioRef.current?.duration || 0
      }));
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentSong(prev => ({ ...prev, currentTime: value[0] }));
    }
  };

  const handleGenerateLyrics = async () => {
    if (!prompt) {
      toast.error("Please enter a prompt first");
      return;
    }
    
    setIsGeneratingLyrics(true);
    try {
      const res = await fetch("/api/suno/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt,
          style: selectedStyles.join(", ")
        })
      });
      const data = await res.json();
      if (data.lyrics) {
        setPrompt(data.lyrics);
        toast.success("Lyrics generated!");
      }
    } catch (error) {
      toast.error("Failed to generate lyrics");
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const handleGenerateMusic = async () => {
    if (!prompt) {
      toast.error("Please enter a prompt or lyrics");
      return;
    }

    setIsLoading(true);
    setIsPlaying(false);
    setGeneratedVideoUrl(null);
    
    const historyId = `song-${Date.now()}`;
    const newHistoryItem = {
      id: historyId,
      title: prompt.split('\n')[0].slice(0, 30) || "Untitled Song",
      status: 'generating',
      genre: selectedGenre,
      timestamp: new Date().toISOString(),
      lyrics: prompt,
      audioUrl: "",
      imageUrl: "",
      v4: null,
      v35: null,
      v4Status: 'generating',
      v35Status: 'generating',
      v4Id: null,
      v35Id: null,
    };
    setHistory(prev => [newHistoryItem, ...prev]);
    setCurrentSong({
      ...newHistoryItem,
      duration: 0,
      currentTime: 0
    });
    currentPollingId.current = historyId;

    try {
      const res = await fetch("/api/suno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          genre: [selectedGenre, ...selectedStyles].filter(Boolean).join(", "), 
          energy 
        })
      });
      
      const data = await res.json();
      
      if (data.v4Id || data.v35Id) {
        setHistory(prev => prev.map(item => 
          item.id === historyId ? { 
            ...item, 
            v4Id: data.v4Id,
            v35Id: data.v35Id,
          } : item
        ));
        
        if (data.v4Id) {
          startPolling(data.v4Id, 'v4', historyId);
        }
        if (data.v35Id) {
          startPolling(data.v35Id, 'v35', historyId);
        }
      } else {
        setIsLoading(false);
        setHistory(prev => prev.map(item => 
          item.id === historyId ? { ...item, status: 'error' } : item
        ));
        toast.error(data.message || data.error || "Failed to start generation");
      }
    } catch (error) {
      console.error("Generation error:", error);
      setIsLoading(false);
      setHistory(prev => prev.map(item => 
        item.id === historyId ? { ...item, status: 'error' } : item
      ));
      toast.error("An error occurred");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      const url = URL.createObjectURL(file);
      setCustomImage(url);
      handleGenerateVideo(url);
    }
  };

  const handleGenerateVideo = async (overrideImage?: string) => {
    console.log("Generating video for audio URL:", currentSong.audioUrl);
    
    if (!currentSong.audioUrl) {
      toast.error("No audio URL found for this song. Please wait for generation to complete.");
      return;
    }

    setIsVideoLoading(true);
    setVideoProgress(0);
    setGeneratedVideoUrl(null);
    setShowVideoDialog(false);
    
    try {
      const videoUrl = await generateLyricVideo(
        currentSong.audioUrl, 
        currentSong.lyrics, 
        overrideImage || currentSong.imageUrl,
        (progress) => {
          setVideoProgress(progress);
        },
        currentSong.timestampedLyrics
      );
      setGeneratedVideoUrl(videoUrl);
      toast.success("Lyric video created!");
    } catch (error: any) {
      console.error("Video Generation Error:", error);
      toast.error(`Video Error: ${error.message || "Failed to create lyric video"}`);
    } finally {
      setIsVideoLoading(false);
      setVideoProgress(0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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

  return (
    <div className="p-6 lg:p-10 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[400px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-yellow-500/10 blur-[120px] pointer-events-none" />
      {currentSong.audioUrl && (
        <audio 
          key={currentSong.audioUrl}
          ref={audioRef} 
          src={currentSong.audioUrl} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onError={handleAudioError}
        />
      )}
      
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div>
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs mb-4 backdrop-blur-sm shadow-[0_0_12px_rgba(245,158,11,0.12)]">
            <Radio className="w-3 h-3 mr-1.5" /> AI Music Studio
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Suno Studio</h1>
          <p className="text-zinc-400 max-w-xl text-sm">
            Compose high-fidelity music and voices with professional AI models.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <div className="p-8 h-full rounded-2xl" style={{background:"linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.1) 100%)",backdropFilter:"blur(24px) saturate(160%)",WebkitBackdropFilter:"blur(24px) saturate(160%)",border:"1px solid rgba(255,255,255,0.10)",boxShadow:"0 8px 40px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08) inset"}}>
            <div className="space-y-8">
              <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-widest text-xs mb-4">
                <FileText className="w-4 h-4" /> Text to Music
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="text-zinc-400 uppercase text-[10px] tracking-widest font-bold">Song Prompt / Lyrics</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {songStyles.map((style) => (
                        <Badge
                          key={style}
                          variant={selectedStyles.includes(style) ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-all text-[10px] px-2 py-0 h-5",
                            selectedStyles.includes(style) 
                              ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600" 
                              : "text-zinc-500 border-zinc-800 hover:border-zinc-700 bg-transparent"
                          )}
                          onClick={() => {
                            setSelectedStyles(prev => 
                              prev.includes(style) 
                                ? prev.filter(s => s !== style) 
                                : [...prev, style]
                            );
                          }}
                        >
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-48 rounded-2xl p-6 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none font-mono text-sm leading-relaxed input-glass"
                    placeholder="[Verse 1]&#10;Midnight rain on a neon street...&#10;&#10;[Chorus]&#10;Lost in the rhythm of the city heart..."
                  />
                  <div className="flex justify-between">
                    <Button 
                      variant="ghost" 
                      onClick={handleGenerateLyrics}
                      disabled={isGeneratingLyrics}
                      className="text-amber-400 text-xs gap-1 h-auto p-0 hover:bg-transparent disabled:opacity-50"
                    >
                      {isGeneratingLyrics ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      Generate AI Lyrics
                    </Button>
                    <span className="text-xs text-zinc-500">{prompt.length} / 2000</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={handleGenerateMusic}
                    disabled={isLoading}
                    className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-bold text-lg gap-3 disabled:opacity-50 relative overflow-hidden"
                  >
                    {isLoading ? (
                      <>
                        <div 
                          className="absolute inset-0 bg-white/20 transition-all duration-500 ease-out"
                          style={{ width: `${generationProgress}%` }}
                        />
                        <Loader2 className="w-6 h-6 animate-spin relative z-10" />
                        <span className="relative z-10">Generating... {generationProgress}%</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-6 h-6 animate-pulse" />
                        <span>Generate Music</span>
                      </>
                    )}
                  </Button>
                  
                  {isLoading && (
                    <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${generationProgress}%` }}
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
            <div className="p-8 flex flex-col items-center text-center overflow-hidden relative rounded-2xl" style={{background:"linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.1) 100%)",backdropFilter:"blur(24px) saturate(160%)",WebkitBackdropFilter:"blur(24px) saturate(160%)",border:"1px solid rgba(255,255,255,0.10)",boxShadow:"0 8px 40px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08) inset"}}>
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
            
              <motion.div 
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-48 h-48 rounded-full border-8 border-zinc-900 shadow-[0_0_50px_-10px_rgba(245,158,11,0.3)] bg-zinc-900 flex items-center justify-center mb-8 relative overflow-hidden"
            >
              {currentSong.imageUrl ? (
                <img 
                  src={currentSong.imageUrl} 
                  alt={currentSong.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              ) : (
                <Disc className="w-32 h-32 text-zinc-800 opacity-20" />
              )}
              <div className="absolute inset-4 rounded-full border border-zinc-700/50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <Music className="w-12 h-12 text-amber-500" />
              </div>
            </motion.div>

            <h3 className="text-2xl font-bold text-white mb-1 truncate w-full px-4">
              {currentSong.status === 'generating' ? `Generating... ${currentSong.title}` : currentSong.title}
            </h3>
<p className="text-zinc-500 mb-6 uppercase tracking-widest text-[10px] font-bold">
                {currentSong.genre || (currentSong.status === 'generating' ? 'AI Mix' : '')} {currentSong.duration > 0 ? `• ${formatTime(currentSong.duration)}` : ''}
              </p>

              {currentSong.v4 || currentSong.v35 || currentSong.v4Status || currentSong.v35Status ? (
                <div className="flex gap-2 mb-4">
<button
                      onClick={() => {
setActiveVersion('v4');
                          if (currentSong.v4?.audioUrl) {
                            setIsPlaying(false);
                            setCurrentSong(prev => ({
                              ...prev,
                              audioUrl: currentSong.v4.audioUrl,
                              imageUrl: currentSong.v4.imageUrl || prev.imageUrl,
                              lyrics: currentSong.v4.lyrics || prev.lyrics,
                              timestampedLyrics: currentSong.v4.timestampedLyrics,
                            }));
                          }
                        }}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all",
                      activeVersion === 'v4'
                        ? "bg-amber-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    )}
                  >
                    {currentSong.v4Status === 'generating' ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> V4
                      </span>
                    ) : currentSong.v4Status === 'complete' ? (
                      'V4'
                    ) : currentSong.v4Status === 'error' ? (
                      'V4 (Error)'
                    ) : (
                      'V4'
                    )}
                  </button>
<button
                      onClick={() => {
setActiveVersion('v35');
                          if (currentSong.v35?.audioUrl) {
                            setIsPlaying(false);
                            setCurrentSong(prev => ({
                              ...prev,
                              audioUrl: currentSong.v35.audioUrl,
                              imageUrl: currentSong.v35.imageUrl || prev.imageUrl,
                              lyrics: currentSong.v35.lyrics || prev.lyrics,
                              timestampedLyrics: currentSong.v35.timestampedLyrics,
                            }));
                          }
                        }}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all",
                      activeVersion === 'v35'
                        ? "bg-yellow-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    )}
                  >
                    {currentSong.v35Status === 'generating' ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> V3.5
                      </span>
                    ) : currentSong.v35Status === 'complete' ? (
                      'V3.5'
                    ) : currentSong.v35Status === 'error' ? (
                      'V3.5 (Error)'
                    ) : (
                      'V3.5'
                    )}
                  </button>
                </div>
              ) : null}

              <div className="w-full space-y-4 mb-8">
              <Slider 
                value={[currentSong.currentTime]} 
                max={currentSong.duration || 100} 
                onValueChange={handleSeek}
                className="w-full h-1.5" 
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>{formatTime(currentSong.currentTime)}</span>
                <span>{formatTime(currentSong.duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-white text-black hover:scale-105 transition-transform"
                disabled={!currentSong.audioUrl}
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 fill-black ml-1" />}
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-zinc-400 hover:text-white" 
                  onClick={() => setShowVideoDialog(true)}
                  disabled={!currentSong.audioUrl || isVideoLoading}
                >
                  {isVideoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-zinc-400 hover:text-white" 
                    onClick={() => downloadFile(currentSong.audioUrl, `${currentSong.title}.mp3`)}
                    disabled={!currentSong.audioUrl}
                  >
                    <Download className="w-5 h-5" />
                  </Button>

              </div>
            </div>

            {isVideoLoading && (
              <div className="mt-6 flex flex-col items-center gap-3 w-full">
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full transition-all duration-300"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
                <p className="text-sm text-zinc-400">Creating lyric video... {videoProgress}%</p>
              </div>
            )}

            {generatedVideoUrl && (
              <div className="mt-8 w-full space-y-4">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800">
                  <video 
                    src={generatedVideoUrl} 
                    controls 
                    className="w-full h-full"
                  />
                </div>
                <Button 
                  variant="outline" 
                  className="w-full gap-2 border-zinc-800 hover:bg-zinc-900" 
                  onClick={() => downloadFile(generatedVideoUrl, `${currentSong.title || 'lyric-video'}.mp4`)}
                >
                  <Download className="w-4 h-4" /> Download MP4 Video
                </Button>
              </div>
              )}
            </div>

            <div className="p-6 h-[250px] flex flex-col overflow-hidden rounded-2xl" style={{background:"linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 8px 32px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.07) inset"}}>
              <h4 className="text-sm font-bold text-white mb-6 uppercase tracking-widest shrink-0">Lyrics / Transcript</h4>
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full text-left">
                <div className="pr-4">
                  <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed">
                    {currentSong.lyrics && currentSong.lyrics !== "Select a song from your library or generate a new one to get started." 
                      ? currentSong.lyrics 
                      : prompt 
                        ? prompt 
                        : "No lyrics available. Enter lyrics above and generate a song."}
                  </pre>
                </div>
              </ScrollArea>
              </div>
            </div>

            <div className="p-6 rounded-2xl" style={{background:"linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",backdropFilter:"blur(20px) saturate(160%)",WebkitBackdropFilter:"blur(20px) saturate(160%)",border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 8px 32px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.07) inset"}}>
              <h4 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex justify-between items-center">
              Your Library
              <Badge variant="outline" className="text-[10px] h-5">{history.length}</Badge>
            </h4>
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs italic">
                    Your library is empty.
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer",
                        currentSong.id === item.id
                            ? "bg-amber-500/10 border-amber-500/30" 
                            : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]"
                      )}
onClick={() => {
                              if (item.status === 'complete') {
                                const activeVer = activeVersion === 'v4' ? item.v4 : item.v35;
                                const fallbackVer = activeVersion === 'v4' ? item.v35 : item.v4;
                                const versionToUse = activeVer?.audioUrl ? activeVer : fallbackVer;
                                setCurrentSong({
                                  ...item,
                                  audioUrl: versionToUse?.audioUrl || item.audioUrl,
                                  imageUrl: versionToUse?.imageUrl || item.imageUrl,
                                  lyrics: versionToUse?.lyrics || item.lyrics,
                                  timestampedLyrics: versionToUse?.timestampedLyrics,
                                });
                              }
                            }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center overflow-hidden">
                        {item.status === 'generating' ? (
                          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                        ) : item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.title}</div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                          {item.genre} • {item.status === 'complete' ? 'Ready' : item.status === 'generating' ? 'Creating...' : 'Failed'}
                        </div>
                      </div>
                      {item.status === 'complete' && (
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                          <Play className="w-3 h-3 fill-zinc-400" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              </ScrollArea>
            </div>
          </div>
        </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="border-white/10 text-white sm:max-w-[425px]" style={{background:"linear-gradient(160deg, rgba(20,20,30,0.97) 0%, rgba(12,12,18,0.99) 100%)",backdropFilter:"blur(30px)",WebkitBackdropFilter:"blur(30px)",boxShadow:"0 25px 80px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.08) inset"}}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Generate Lyric Video</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-6">
            <button
              onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-pink-500/40 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-amber-500" />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">Custom Image</div>
                <div className="text-[10px] text-zinc-500 mt-1">Upload from device</div>
              </div>
            </button>

            <button
              onClick={() => handleGenerateVideo()}
                className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-purple-500/40 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">Cover Image</div>
                <div className="text-[10px] text-zinc-500 mt-1">Use music cover</div>
              </div>
            </button>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowVideoDialog(false)}
              className="text-zinc-500 hover:text-white"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
