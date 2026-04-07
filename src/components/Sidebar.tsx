"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Video, 
  Scissors, 
  Music, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Home", href: "/", icon: Home, color: "text-white" },
  { name: "Invideo Hub", href: "/invideo", icon: Video, color: "text-amber-400", glow: "rgba(245,158,11,0.2)" },
  { name: "Vizard Studio", href: "/opus", icon: Scissors, color: "text-yellow-400", glow: "rgba(250,204,21,0.2)" },
  { name: "Suno Studio", href: "/suno", icon: Music, color: "text-amber-500", glow: "rgba(245,158,11,0.2)" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored !== "light";
    setIsDark(dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 sidebar-glass border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="IxraAI Logo" className="w-9 h-9 rounded-xl object-cover" />
            <span className="text-lg font-bold text-white tracking-tight">IxraAI</span>
        </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white btn-glass rounded-xl"
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-zinc-400 hover:text-white btn-glass rounded-xl"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div 
        className={cn(
          "md:hidden fixed top-14 left-0 bottom-0 z-40 w-64 sidebar-glass transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item: any) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <div 
                className={cn(
                  "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                  pathname === item.href 
                    ? "nav-active text-white" 
                    : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", pathname === item.href ? item.color : "")} />
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "hidden md:flex relative flex-col h-full sidebar-glass transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-white/[0.06]">
          <img src="/logo.png" alt="IxraAI Logo" className="w-10 h-10 rounded-xl object-cover shrink-0" />
          {!collapsed && (
              <span className="text-xl font-bold text-white tracking-tight">IxraAI</span>
          )}
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item: any) => {
            const isActive = pathname === item.href;
            const content = (
              <div 
                className={cn(
                  "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer",
                  isActive
                    ? "nav-active text-white"
                    : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0 transition-all duration-200", isActive ? item.color : "group-hover:text-zinc-200")} />
                {!collapsed && <span className="font-medium">{item.name}</span>}
              </div>
            );

            return (
              <Link key={item.href} href={item.href}>
                {content}
              </Link>
            );
          })}
        </div>

          {/* Collapse Button */}
          <div className="p-4 border-t border-white/[0.06] flex flex-col gap-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 px-3 py-3 text-zinc-500 hover:text-white rounded-xl btn-glass transition-all",
                collapsed && "justify-center"
              )}
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3 px-3 py-3 text-zinc-500 hover:text-white rounded-xl btn-glass transition-all",
                collapsed && "justify-center"
              )}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <><ChevronLeft className="w-5 h-5" /><span>Collapse</span></>}
            </Button>
          </div>
      </div>
    </>
  );
}
