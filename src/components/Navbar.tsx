'use client';

import React from 'react';
import {
  Zap,
  BarChart3,
  Settings,
  FileText,
  Maximize2,
  Minimize2,
  BookOpen,
  Smartphone,
  Download,
} from 'lucide-react';
import { ReaderMode, ThemeMode } from '@/types/reader';

interface NavbarProps {
  currentTitle: string;
  wordCount: number;
  currentMode: ReaderMode;
  onModeChange: (mode: ReaderMode) => void;
  onOpenNewDoc: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenInstallModal: () => void;
  theme: ThemeMode;
  todaySeconds: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTitle,
  wordCount,
  currentMode,
  onModeChange,
  onOpenNewDoc,
  onOpenStats,
  onOpenSettings,
  onOpenInstallModal,
  theme,
  todaySeconds,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTodayTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const headerBgClass =
    theme === 'sepia'
      ? 'bg-[#f4ebd9] border-[#d8cbb3] text-[#382e25]'
      : theme === 'paper'
      ? 'bg-[#f6f5f0] border-[#d8d5cb] text-[#24272a]'
      : theme === 'sage'
      ? 'bg-[#161f1a] border-[#2d3d34] text-[#d5dfd8]'
      : theme === 'amber'
      ? 'bg-[#15130f] border-[#322d23] text-[#ecd7b8]'
      : theme === 'dark'
      ? 'bg-[#0f172a] border-[#334155] text-[#f8fafc]'
      : 'bg-[#1b1d1e] border-[#343a3d] text-[#e3dfd5]';

  const pillClass = 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border-current/15 text-current';

  const accentActiveBtn =
    theme === 'sepia'
      ? 'bg-[#c2410c] text-white shadow-sm'
      : theme === 'paper'
      ? 'bg-[#b91c1c] text-white shadow-sm'
      : theme === 'amber'
      ? 'bg-[#f59e0b] text-black font-semibold shadow-sm'
      : 'bg-[#e07a5f] text-white shadow-sm';

  return (
    <header className={`border-b sticky top-0 z-40 transition-colors duration-200 ${headerBgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
        {/* Brand & Document Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={onOpenNewDoc}
            title="Open Document Selector"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold tracking-tight text-sm">
                SpeedReader
              </span>
              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded font-mono font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/20 uppercase tracking-wider">
                RSVP
              </span>
            </div>
          </div>

          {currentTitle && (
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-current/10 min-w-0">
              <span className="text-xs font-medium truncate max-w-[180px] lg:max-w-[280px]" title={currentTitle}>
                {currentTitle}
              </span>
              {wordCount > 0 && (
                <span className="text-[11px] opacity-60 shrink-0 font-mono">
                  ({wordCount.toLocaleString()} w)
                </span>
              )}
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10">
          <button
            onClick={() => onModeChange('rsvp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentMode === 'rsvp'
                ? accentActiveBtn
                : 'opacity-70 hover:opacity-100'
            }`}
            title="RSVP Speed Reading Mode"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>RSVP</span>
          </button>
          <button
            onClick={() => onModeChange('fulltext')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentMode === 'fulltext'
                ? accentActiveBtn
                : 'opacity-70 hover:opacity-100'
            }`}
            title="Full Text & Bionic Reading Mode"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Full Text</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Install on Android Button */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 border border-emerald-600/30 transition-all cursor-pointer"
            title="Install offline app on Android"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install Android App</span>
            <span className="sm:hidden">Install</span>
          </button>

          {/* Today's Reading Time pill */}
          <button
            onClick={onOpenStats}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${pillClass}`}
            title="Today's Reading Time"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono">Today: {formatTodayTime(todaySeconds)}</span>
          </button>

          {/* Open Doc Button */}
          <button
            onClick={onOpenNewDoc}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${accentActiveBtn} transition-all cursor-pointer`}
            title="Paste text or open TXT, PDF, EPUB"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Doc</span>
          </button>

          {/* Stats Button */}
          <button
            onClick={onOpenStats}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${pillClass}`}
            title="Reading Statistics & History"
            aria-label="Stats"
          >
            <BarChart3 className="w-4 h-4 text-emerald-500" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${pillClass}`}
            title="Display & Speed Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${pillClass}`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F)'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
