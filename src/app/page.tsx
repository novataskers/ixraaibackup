"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Video, 
  Scissors, 
  Music, 
  ArrowRight, 
  Brain,
  Zap, 
  Shield, 
  Clock,
  Plus
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as any } }
};

const cards = [
  {
    href: "/invideo",
    icon: Video,
    title: "Invideo Hub",
    description: "Premium video & image generation with state-of-the-art AI engines.",
    features: ["Text to Video", "AI Avatars", "Model Suite"],
    label: "Video Expert",
    accent: "amber",
    iconBg: "from-amber-600/30 to-amber-800/10",
    iconColor: "text-amber-400",
    border: "rgba(245,158,11,0.25)",
    glow: "rgba(245,158,11,0.15)",
    dot: "bg-amber-500",
    labelColor: "text-amber-400",
    shimmer: "from-amber-500/10 via-transparent to-transparent",
  },
  {
    href: "/opus",
    icon: Scissors,
    title: "Vizard Studio",
    description: "Transform long-form content into viral shorts. Auto-splitting, captions, and more.",
    features: ["12h+ Video Splitter", "Auto-Shorts", "AI Captions"],
    label: "Content Mastery",
    accent: "amber",
    iconBg: "from-amber-600/30 to-amber-800/10",
    iconColor: "text-amber-400",
    border: "rgba(245,158,11,0.25)",
    glow: "rgba(245,158,11,0.15)",
    dot: "bg-amber-500",
    labelColor: "text-amber-400",
    shimmer: "from-amber-500/10 via-transparent to-transparent",
  },
  {
    href: "/suno",
    icon: Music,
    title: "Suno Studio",
    description: "Generative music and voice. Script to music, voice cloning, and lyrical generation.",
    features: ["Text to Music", "Voice Cloning", "Lyrics Gen"],
    label: "Audio Engine",
    accent: "amber",
    iconBg: "from-amber-600/30 to-amber-800/10",
    iconColor: "text-amber-400",
    border: "rgba(245,158,11,0.25)",
    glow: "rgba(245,158,11,0.15)",
    dot: "bg-amber-500",
    labelColor: "text-amber-400",
    shimmer: "from-amber-500/10 via-transparent to-transparent",
  },
];

const stats = [
  { label: "Advanced Models", value: "10+", icon: Zap },
  { label: "Processing Speed", value: "Instant", icon: Clock },
  { label: "Enterprise Security", value: "Locked", icon: Shield },
  { label: "Engine", value: "AIG", icon: Brain },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[-100px] left-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-1/4 w-[600px] h-[600px] rounded-full bg-yellow-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-amber-600/10 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 sm:py-16 lg:px-8">

        {/* Header */}
        <header className="mb-14 md:mb-20">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-5"
          >
            <Badge 
              variant="outline" 
              className="px-3 py-1.5 border-amber-500/30 bg-amber-500/10 text-amber-300 backdrop-blur-sm shadow-[0_0_12px_rgba(245,158,11,0.15)]"
            >
                <Brain className="w-3 h-3 mr-1.5" /> All-in-One AI Platform
            </Badge>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as any }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-5 leading-[1.2] pb-3 overflow-visible"
              >
                Your Complete <br />
                <span className="gradient-text italic" style={{paddingBottom:"0.3em",paddingTop:"0.1em",marginBottom:"-0.3em",display:"inline-block"}}>AI Creative Engine</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-base md:text-lg text-zinc-400 max-w-2xl leading-relaxed"
          >
            Unleash the power of state-of-the-art models for video, audio, and content automation. 
            Everything you need to create, edit, and publish — all in one seamless workspace.
          </motion.p>
        </header>

        {/* Studio Cards */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 mb-16 md:mb-24"
        >
          {cards.map((card) => (
            <motion.div key={card.href} variants={item}>
              <Link href={card.href}>
                <div
                  className="group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer"
                  style={{
                    background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.1) 100%)",
                    backdropFilter: "blur(24px) saturate(160%)",
                    WebkitBackdropFilter: "blur(24px) saturate(160%)",
                    border: `1px solid ${card.border}`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.07) inset`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${card.glow}, 0 1px 0 rgba(255,255,255,0.1) inset`;
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.07) inset`;
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* Top sheen line */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  {/* Hover shimmer overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.shimmer} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative p-7">
                    {/* Icon */}
                    <div 
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.iconBg} flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500`}
                      style={{ boxShadow: `0 0 24px ${card.glow}` }}
                    >
                      <card.icon className={`w-7 h-7 ${card.iconColor}`} />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2.5 flex items-center gap-2">
                      {card.title}
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </h3>
                    <p className="text-sm text-zinc-400 mb-5 leading-relaxed line-clamp-2">
                      {card.description}
                    </p>

                    <ul className="space-y-2 mb-7">
                      {card.features.map((f) => (
                        <li key={f} className="text-xs text-zinc-500 flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${card.dot} shadow-[0_0_6px_currentColor]`} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                      <span className={`text-xs font-semibold ${card.labelColor} uppercase tracking-widest`}>{card.label}</span>
                      <Plus className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="stat-glass rounded-2xl p-6 flex flex-col items-center text-center group hover:border-white/15 transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
