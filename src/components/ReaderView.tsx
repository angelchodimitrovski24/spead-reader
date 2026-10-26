'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Gauge,
  Clock,
  Sparkles,
  HelpCircle,
  FolderOpen,
  FileText,
  Square,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import { WordToken, UserPreferences, SavedDocument, ThemeMode } from '@/types/reader';
import { logReadingSession, saveDocument } from '@/lib/db';

interface ReaderViewProps {
  tokens: WordToken[];
  currentDocId: string;
  currentDocTitle: string;
  sourceType: 'paste' | 'txt' | 'pdf' | 'epub' | 'sample';
  fullText: string;
  initialPosition?: number;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onSessionLogged: () => void;
  onOpenDocModal: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  tokens,
  currentDocId,
  currentDocTitle,
  sourceType,
  fullText,
  initialPosition = 0,
  preferences,
  onUpdatePreferences,
  onSessionLogged,
  onOpenDocModal,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialPosition);
  const [isPlaying, setIsPlaying] = useState(false);

  // STOPWATCH STATE (Explicit start, stop, save & reset, counting seconds)
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchWordsRead, setStopwatchWordsRead] = useState(0);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasFinishedRef = useRef(false);

  // When document or initial position changes, reset reader state cleanly
  useEffect(() => {
    setCurrentIndex(initialPosition || 0);
    setIsPlaying(false);
    setIsStopwatchRunning(false);
    setStopwatchSeconds(0);
    setStopwatchWordsRead(0);
    hasFinishedRef.current = false;
  }, [currentDocId, initialPosition]);

  // Save document reading progress to IndexedDB
  const persistDocumentProgress = useCallback(
    async (position: number) => {
      if (!currentDocId || tokens.length === 0) return;
      try {
        const doc: SavedDocument = {
          id: currentDocId,
          title: currentDocTitle,
          sourceType,
          text: fullText,
          wordCount: tokens.length,
          lastPosition: position,
          updatedAt: Date.now(),
          totalTimeSpentSeconds: stopwatchSeconds,
        };
        await saveDocument(doc);
      } catch (err) {
        console.error('Failed to save document progress:', err);
      }
    },
    [currentDocId, currentDocTitle, sourceType, fullText, tokens.length, stopwatchSeconds]
  );

  // STOPWATCH SECOND COUNTER (Ticking every 1000ms)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStopwatchRunning]);

  // STOPWATCH STOP: Saves to IndexedDB and Resets to 0 seconds
  const handleStopwatchStop = useCallback(async () => {
    setIsStopwatchRunning(false);
    setIsPlaying(false);

    const seconds = stopwatchSeconds;
    const words = stopwatchWordsRead;

    if (seconds > 0) {
      const avgWpm =
        words > 0 ? Math.round(words / (seconds / 60)) : preferences.wpm;
      const completionPercentage =
        tokens.length > 0
          ? Math.min(100, Math.round(((currentIndex + 1) / tokens.length) * 100))
          : 0;

      try {
        await logReadingSession({
          documentTitle: currentDocTitle || 'Reading Sprint',
          sourceType,
          timestamp: Date.now(),
          durationSeconds: seconds,
          wordsRead: words,
          averageWpm: avgWpm,
          targetWpm: preferences.wpm,
          completionPercentage,
          completed: currentIndex >= tokens.length - 1,
        });

        setSavedBanner(
          `Stopwatch Stopped & Saved: ${seconds}s elapsed • ${words} words read (${avgWpm} WPM)`
        );
        setTimeout(() => setSavedBanner(null), 4500);
        onSessionLogged();
      } catch (err) {
        console.error('Failed to save reading session:', err);
      }
    }

    // Reset stopwatch back to 0 seconds
    setStopwatchSeconds(0);
    setStopwatchWordsRead(0);
  }, [
    stopwatchSeconds,
    stopwatchWordsRead,
    preferences.wpm,
    tokens.length,
    currentIndex,
    currentDocTitle,
    sourceType,
    onSessionLogged,
  ]);

  const handleStopwatchStart = () => {
    setIsStopwatchRunning(true);
    // If not reading, also start reading
    if (!isPlaying) {
      if (currentIndex >= tokens.length - 1) {
        setCurrentIndex(0);
        hasFinishedRef.current = false;
      }
      setIsPlaying(true);
    }
  };

  const handleStopwatchPause = () => {
    setIsStopwatchRunning(false);
    setIsPlaying(false);
  };

  const handleStopwatchReset = () => {
    setIsStopwatchRunning(false);
    setIsPlaying(false);
    setStopwatchSeconds(0);
    setStopwatchWordsRead(0);
  };

  // RSVP Loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      persistDocumentProgress(currentIndex);
      return;
    }

    if (tokens.length === 0 || currentIndex >= tokens.length) {
      setIsPlaying(false);
      return;
    }

    const currentToken = tokens[currentIndex];
    const baseDelayMs = (60 / preferences.wpm) * 1000 * preferences.wordsPerChunk;
    const multiplier = currentToken ? currentToken.pauseMultiplier : 1.0;
    const effectiveDelay = Math.round(baseDelayMs * multiplier);

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + preferences.wordsPerChunk;
        setStopwatchWordsRead((w) => w + preferences.wordsPerChunk);

        if (nextIndex >= tokens.length) {
          setIsPlaying(false);
          if (!hasFinishedRef.current) {
            hasFinishedRef.current = true;
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch {
              // ignore
            }
            handleStopwatchStop();
          }
          persistDocumentProgress(tokens.length);
          return tokens.length - 1;
        }

        return nextIndex;
      });
    }, effectiveDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    isPlaying,
    currentIndex,
    tokens,
    preferences.wpm,
    preferences.wordsPerChunk,
    persistDocumentProgress,
    handleStopwatchStop,
  ]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setIsStopwatchRunning(false);
    } else {
      if (currentIndex >= tokens.length - 1) {
        setCurrentIndex(0);
        hasFinishedRef.current = false;
      }
      setIsPlaying(true);
      // Auto-start stopwatch when user starts reading!
      setIsStopwatchRunning(true);
    }
  };

  const jumpWords = (delta: number) => {
    setCurrentIndex((prev) => {
      const target = Math.max(0, Math.min(tokens.length - 1, prev + delta));
      persistDocumentProgress(target);
      return target;
    });
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setIsStopwatchRunning(false);
    setCurrentIndex(0);
    hasFinishedRef.current = false;
    persistDocumentProgress(0);
  };

  const handleSpeedChange = (newWpm: number) => {
    const clamped = Math.max(100, Math.min(1200, newWpm));
    onUpdatePreferences({ wpm: clamped });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyS':
          e.preventDefault();
          if (isStopwatchRunning) {
            handleStopwatchStop();
          } else {
            handleStopwatchStart();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          jumpWords(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          jumpWords(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleSpeedChange(preferences.wpm + 25);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleSpeedChange(preferences.wpm - 25);
          break;
        case 'KeyR':
          e.preventDefault();
          handleRestart();
          break;
        case 'KeyH':
        case 'Slash':
          if (e.key === '?') {
            e.preventDefault();
            setShowKeyboardHelp((prev) => !prev);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isStopwatchRunning, currentIndex, tokens.length, preferences.wpm, handleStopwatchStop]);

  // Eye-friendly dynamic colors
  const getThemePalette = (theme: ThemeMode) => {
    switch (theme) {
      case 'sepia':
        return {
          orpText: 'text-[#c2410c]',
          crosshairBg: 'bg-[#c2410c]/70',
          centerLine: 'bg-[#c2410c]/15',
          primaryBtn: 'bg-[#c2410c] hover:bg-[#9a3412] text-white',
          playActive: 'bg-[#b45309] hover:bg-[#92400e]',
          sliderAccent: 'accent-[#c2410c]',
          badgeBg: 'bg-[#c2410c]/10 text-[#c2410c]',
          boxBg: 'bg-[#eae0cc] border-[#d8cbb3]',
        };
      case 'paper':
        return {
          orpText: 'text-[#b91c1c]',
          crosshairBg: 'bg-[#b91c1c]/70',
          centerLine: 'bg-[#b91c1c]/15',
          primaryBtn: 'bg-[#b91c1c] hover:bg-[#991b1b] text-white',
          playActive: 'bg-[#d97706] hover:bg-[#b45309]',
          sliderAccent: 'accent-[#b91c1c]',
          badgeBg: 'bg-[#b91c1c]/10 text-[#b91c1c]',
          boxBg: 'bg-[#eae8e0] border-[#d8d5cb]',
        };
      case 'sage':
        return {
          orpText: 'text-[#e28766]',
          crosshairBg: 'bg-[#e28766]/70',
          centerLine: 'bg-[#e28766]/15',
          primaryBtn: 'bg-[#e28766] hover:bg-[#cf6d4b] text-white',
          playActive: 'bg-[#d97706] hover:bg-[#b45309]',
          sliderAccent: 'accent-[#e28766]',
          badgeBg: 'bg-[#e28766]/15 text-[#e28766]',
          boxBg: 'bg-[#1f2c25] border-[#2d3d34]',
        };
      case 'amber':
        return {
          orpText: 'text-[#f59e0b]',
          crosshairBg: 'bg-[#f59e0b]/70',
          centerLine: 'bg-[#f59e0b]/15',
          primaryBtn: 'bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold',
          playActive: 'bg-[#d97706] hover:bg-[#b45309]',
          sliderAccent: 'accent-[#f59e0b]',
          badgeBg: 'bg-[#f59e0b]/15 text-[#f59e0b]',
          boxBg: 'bg-[#1f1c16] border-[#322d23]',
        };
      case 'dark':
        return {
          orpText: 'text-[#38bdf8]',
          crosshairBg: 'bg-[#38bdf8]/70',
          centerLine: 'bg-[#38bdf8]/15',
          primaryBtn: 'bg-[#0284c7] hover:bg-[#0369a1] text-white',
          playActive: 'bg-[#f59e0b] hover:bg-[#d97706]',
          sliderAccent: 'accent-[#38bdf8]',
          badgeBg: 'bg-[#38bdf8]/15 text-[#38bdf8]',
          boxBg: 'bg-[#1e293b] border-[#334155]',
        };
      case 'warm-dark':
      default:
        return {
          orpText: 'text-[#e07a5f]',
          crosshairBg: 'bg-[#e07a5f]/70',
          centerLine: 'bg-[#e07a5f]/15',
          primaryBtn: 'bg-[#e07a5f] hover:bg-[#cc664a] text-white',
          playActive: 'bg-[#d97706] hover:bg-[#b45309]',
          sliderAccent: 'accent-[#e07a5f]',
          badgeBg: 'bg-[#e07a5f]/15 text-[#e07a5f]',
          boxBg: 'bg-[#222527] border-[#343a3d]',
        };
    }
  };

  const palette = getThemePalette(preferences.theme);

  // Current token & parts
  const currentToken = tokens[currentIndex] || {
    original: 'Ready',
    clean: 'Ready',
    orpIndex: 1,
    pauseMultiplier: 1,
  };

  const renderOrpWord = () => {
    if (preferences.wordsPerChunk > 1) {
      const chunkTokens = tokens.slice(currentIndex, currentIndex + preferences.wordsPerChunk);
      const chunkString = chunkTokens.map((t) => t.original).join(' ');
      return <div className="text-center font-bold tracking-normal">{chunkString}</div>;
    }

    const word = currentToken.original;
    const orpIdx = currentToken.orpIndex;

    const prefix = word.slice(0, orpIdx);
    const orpChar = word.charAt(orpIdx);
    const suffix = word.slice(orpIdx + 1);

    return (
      <div className="flex items-baseline justify-center w-full select-none">
        <span className="flex-1 text-right font-medium opacity-90">{prefix}</span>
        <span className={`${palette.orpText} font-bold mx-0.5 px-0.5 inline-block text-center`}>
          {orpChar}
        </span>
        <span className="flex-1 text-left font-medium opacity-90">{suffix}</span>
      </div>
    );
  };

  const percentComplete =
    tokens.length > 0 ? Math.min(100, Math.round(((currentIndex + 1) / tokens.length) * 100)) : 0;

  const remainingWords = Math.max(0, tokens.length - currentIndex);
  const remainingMinutes = preferences.wpm > 0 ? remainingWords / preferences.wpm : 0;
  const remainingMinText =
    remainingMinutes < 1
      ? `${Math.round(remainingMinutes * 60)}s`
      : `${Math.floor(remainingMinutes)}m ${Math.round((remainingMinutes % 1) * 60)}s`;

  const fontClass =
    preferences.fontFamily === 'serif'
      ? 'font-serif'
      : preferences.fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const sizeClass =
    preferences.fontSize === 'huge'
      ? 'text-5xl sm:text-6xl md:text-7xl'
      : preferences.fontSize === 'large'
      ? 'text-4xl sm:text-5xl md:text-6xl'
      : preferences.fontSize === 'medium'
      ? 'text-3xl sm:text-4xl md:text-5xl'
      : 'text-2xl sm:text-3xl md:text-4xl';

  const formatTimerClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const speedPresets = [250, 350, 450, 600, 800];

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-4xl mx-auto px-4 py-5 min-h-[calc(100vh-4rem)]">
      {/* Top Document Header Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/15">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="w-4 h-4 opacity-75 shrink-0" />
          <span className="text-xs font-semibold truncate max-w-[240px] sm:max-w-[340px]" title={currentDocTitle}>
            {currentDocTitle}
          </span>
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full ${palette.badgeBg} font-mono font-medium shrink-0`}>
            {tokens.length.toLocaleString()} words
          </span>
        </div>

        <button
          onClick={onOpenDocModal}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl ${palette.primaryBtn} text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Paste Text / Open File</span>
        </button>
      </div>

      {/* STOPWATCH CONTROLLER BAR (START, STOP & SAVE, RESET, COUNTS SECONDS) */}
      <div className="w-full p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/15 flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 shadow-sm">
        {/* Stopwatch Display */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isStopwatchRunning
                ? 'bg-emerald-500/20 text-emerald-500 ring-2 ring-emerald-500/40 animate-pulse'
                : 'bg-black/10 dark:bg-white/10 opacity-70'
            }`}
          >
            <Timer className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight">
                {formatTimerClock(stopwatchSeconds)}
              </span>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 opacity-80">
                {stopwatchSeconds}s
              </span>
              {isStopwatchRunning && (
                <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider animate-pulse">
                  Counting
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] opacity-60">
              <span>Sprint words: {stopwatchWordsRead.toLocaleString()}</span>
              {stopwatchSeconds > 0 && stopwatchWordsRead > 0 && (
                <>
                  <span>•</span>
                  <span>{Math.round(stopwatchWordsRead / (stopwatchSeconds / 60))} WPM pace</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stopwatch Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Start / Pause Button */}
          {!isStopwatchRunning ? (
            <button
              onClick={handleStopwatchStart}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Start stopwatch (Spacebar / S)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start</span>
            </button>
          ) : (
            <button
              onClick={handleStopwatchPause}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Pause stopwatch"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          {/* STOP & SAVE BUTTON (Saves to IndexedDB and Resets to 0) */}
          <button
            onClick={handleStopwatchStop}
            disabled={stopwatchSeconds === 0 && !isStopwatchRunning}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              stopwatchSeconds > 0 || isStopwatchRunning
                ? 'bg-rose-700 hover:bg-rose-600 text-white shadow-sm ring-1 ring-rose-500/50'
                : 'bg-black/10 dark:bg-white/10 opacity-40 cursor-not-allowed'
            }`}
            title="Stop: Saves session to IndexedDB and resets stopwatch to 0s"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop &amp; Save</span>
          </button>

          {/* Reset without saving */}
          {stopwatchSeconds > 0 && (
            <button
              onClick={handleStopwatchReset}
              className="p-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs opacity-75 hover:opacity-100 transition-all cursor-pointer"
              title="Reset stopwatch to 0 without saving"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SAVED TOAST BANNER */}
      {savedBanner && (
        <div className="w-full mb-3 p-3 rounded-xl bg-emerald-600/15 border border-emerald-600/35 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{savedBanner}</span>
          </div>
          <button
            onClick={() => setSavedBanner(null)}
            className="opacity-60 hover:opacity-100 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Reading Progress Indicator */}
      <div className="w-full flex items-center justify-between text-xs opacity-75 mb-3">
        <span className="font-mono">
          Word {currentIndex + 1} / {tokens.length.toLocaleString()}
        </span>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full ${palette.badgeBg} font-bold font-mono`}>
            {percentComplete}%
          </span>
          <span className="hidden sm:inline opacity-60 font-mono">~{remainingMinText} remaining</span>
        </div>
      </div>

      {/* RSVP DISPLAY BOX */}
      <div className="w-full flex-1 flex flex-col items-center justify-center relative my-3">
        <div className={`relative w-full max-w-2xl ${palette.boxBg} border rounded-3xl p-8 sm:p-14 shadow-lg flex flex-col items-center justify-center min-h-[240px] sm:min-h-[290px]`}>
          {/* ORP Center Guides (Crosshairs) */}
          {preferences.showOrpGuide && preferences.wordsPerChunk === 1 && (
            <>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className={`w-0.5 h-4 ${palette.crosshairBg} rounded-full`} />
                <div className={`w-2 h-0.5 ${palette.crosshairBg} opacity-50 rounded-full mt-0.5`} />
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className={`w-2 h-0.5 ${palette.crosshairBg} opacity-50 rounded-full mb-0.5`} />
                <div className={`w-0.5 h-4 ${palette.crosshairBg} rounded-full`} />
              </div>

              <div className={`absolute top-12 bottom-12 left-1/2 -translate-x-1/2 w-[1px] ${palette.centerLine} pointer-events-none`} />
            </>
          )}

          {/* Word Presentation */}
          <div className={`w-full ${fontClass} ${sizeClass} tracking-wide select-none`}>
            {renderOrpWord()}
          </div>

          {/* Finished banner */}
          {currentIndex >= tokens.length - 1 && !isPlaying && tokens.length > 0 && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Document Finished!</h3>
              <p className="text-xs text-neutral-300 max-w-sm mb-4">
                Completed {tokens.length.toLocaleString()} words at {preferences.wpm} WPM.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRestart}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl ${palette.primaryBtn} font-medium text-xs shadow-md transition-all cursor-pointer`}
                >
                  <RotateCcw className="w-4 h-4" />
                  Read Again
                </button>
                <button
                  onClick={onOpenDocModal}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  Open New Document
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PROGRESS SCRUBBER */}
      <div className="w-full max-w-2xl mb-4">
        <div className="relative flex items-center w-full">
          <input
            type="range"
            min={0}
            max={Math.max(0, tokens.length - 1)}
            value={currentIndex}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setCurrentIndex(val);
              persistDocumentProgress(val);
            }}
            className={`w-full h-2 rounded-lg bg-black/10 dark:bg-white/10 appearance-none cursor-pointer ${palette.sliderAccent} focus:outline-none`}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] opacity-60 mt-1.5 px-0.5 font-mono">
          <span>Start</span>
          <span>{percentComplete}%</span>
          <span>{tokens.length} words</span>
        </div>
      </div>

      {/* CONTROLS TOOLBAR */}
      <div className="w-full max-w-2xl flex flex-col gap-4 items-center">
        {/* Main Playback Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleRestart}
            className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/15 hover:bg-black/10 dark:hover:bg-white/10 transition-all opacity-80 hover:opacity-100 cursor-pointer"
            title="Restart from beginning (R)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => jumpWords(-10)}
            className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/15 hover:bg-black/10 dark:hover:bg-white/10 transition-all opacity-80 hover:opacity-100 cursor-pointer"
            title="Rewind 10 words (Left Arrow)"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Center Play / Pause Button */}
          <button
            onClick={togglePlay}
            className={`w-15 h-15 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-150 transform active:scale-95 cursor-pointer ${
              isPlaying
                ? `${palette.playActive} text-white`
                : `${palette.primaryBtn}`
            }`}
            title={isPlaying ? 'Pause (Spacebar)' : 'Play (Spacebar)'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => jumpWords(10)}
            className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/15 hover:bg-black/10 dark:hover:bg-white/10 transition-all opacity-80 hover:opacity-100 cursor-pointer"
            title="Forward 10 words (Right Arrow)"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowKeyboardHelp((prev) => !prev)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              showKeyboardHelp
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-black/5 dark:bg-white/5 border-current/15 opacity-80 hover:opacity-100'
            }`}
            title="Keyboard Shortcuts Guide (?)"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* SPEED SELECTOR & PRESETS */}
        <div className="w-full p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${palette.badgeBg} flex items-center justify-center`}>
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl font-bold font-mono ${palette.orpText}`}>
                  {preferences.wpm}
                </span>
                <span className="text-xs font-semibold uppercase opacity-60">WPM</span>
              </div>
              <p className="text-[11px] opacity-60">Words Per Minute</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleSpeedChange(preferences.wpm - 25)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer"
              title="Decrease speed by 25 WPM (Down Arrow)"
            >
              -25
            </button>

            <input
              type="range"
              min={100}
              max={1200}
              step={25}
              value={preferences.wpm}
              onChange={(e) => handleSpeedChange(parseInt(e.target.value, 10))}
              className={`w-36 h-2 rounded-lg bg-black/10 dark:bg-white/10 appearance-none cursor-pointer ${palette.sliderAccent} focus:outline-none`}
            />

            <button
              onClick={() => handleSpeedChange(preferences.wpm + 25)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer"
              title="Increase speed by 25 WPM (Up Arrow)"
            >
              +25
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {speedPresets.map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  preferences.wpm === speed
                    ? `${palette.primaryBtn} shadow-sm`
                    : 'bg-black/10 dark:bg-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                {speed}
              </button>
            ))}
          </div>
        </div>

        {/* KEYBOARD SHORTCUTS POPUP */}
        {showKeyboardHelp && (
          <div className="w-full p-4 rounded-2xl bg-black/10 dark:bg-white/10 border border-current/20 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Keyboard Shortcuts</span>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="opacity-60 hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 opacity-80">
              <div>
                <kbd className="px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/20 font-mono">
                  Space
                </kbd>{' '}
                Play / Pause
              </div>
              <div>
                <kbd className="px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/20 font-mono">
                  S
                </kbd>{' '}
                Start / Stop Stopwatch
              </div>
              <div>
                <kbd className="px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/20 font-mono">
                  ← / →
                </kbd>{' '}
                -10 / +10 words
              </div>
              <div>
                <kbd className="px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/20 font-mono">
                  ↑ / ↓
                </kbd>{' '}
                Speed +/- 25 WPM
              </div>
              <div>
                <kbd className="px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/20 font-mono">
                  R
                </kbd>{' '}
                Restart
              </div>
              <div>
                <kbd className="px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/20 font-mono">
                  ?
                </kbd>{' '}
                Toggle shortcuts
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
