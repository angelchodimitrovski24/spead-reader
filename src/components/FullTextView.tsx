'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WordToken, UserPreferences } from '@/types/reader';
import { Sparkles, Timer, Play, Pause, Square, CheckCircle2, RotateCcw } from 'lucide-react';
import { logReadingSession } from '@/lib/db';

interface FullTextViewProps {
  tokens: WordToken[];
  currentIndex: number;
  onWordClick: (index: number) => void;
  preferences: UserPreferences;
  onToggleBionic: () => void;
  currentDocTitle: string;
  sourceType: 'paste' | 'txt' | 'pdf' | 'epub' | 'sample';
  onSessionLogged: () => void;
}

export const FullTextView: React.FC<FullTextViewProps> = ({
  tokens,
  currentIndex,
  onWordClick,
  preferences,
  onToggleBionic,
  currentDocTitle,
  sourceType,
  onSessionLogged,
}) => {
  // Stopwatch state
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // Stopwatch ticking in seconds
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStopwatchRunning]);

  // Stop & Save Stopwatch
  const handleStopwatchStop = useCallback(async () => {
    setIsStopwatchRunning(false);
    const seconds = stopwatchSeconds;

    if (seconds > 0) {
      const estimatedWords = Math.round((seconds / 60) * preferences.wpm);
      try {
        await logReadingSession({
          documentTitle: currentDocTitle || 'Full Text Reading',
          sourceType,
          timestamp: Date.now(),
          durationSeconds: seconds,
          wordsRead: estimatedWords,
          averageWpm: preferences.wpm,
          targetWpm: preferences.wpm,
          completionPercentage:
            tokens.length > 0 ? Math.min(100, Math.round(((currentIndex + 1) / tokens.length) * 100)) : 0,
          completed: false,
        });

        setSavedBanner(`Stopwatch Saved: ${seconds}s elapsed (~${estimatedWords} words at ${preferences.wpm} WPM)!`);
        setTimeout(() => setSavedBanner(null), 4000);
        onSessionLogged();
      } catch (err) {
        console.error('Failed to log session:', err);
      }
    }

    // Reset back to 0
    setStopwatchSeconds(0);
  }, [stopwatchSeconds, preferences.wpm, currentDocTitle, sourceType, tokens.length, currentIndex, onSessionLogged]);

  const fontClass =
    preferences.fontFamily === 'serif'
      ? 'font-serif'
      : preferences.fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render a single word with optional bionic formatting
  const renderWord = (token: WordToken, index: number) => {
    const isCurrent = index === currentIndex;
    const isRead = index < currentIndex;
    const word = token.original;

    let content: React.ReactNode = word;

    if (preferences.bionicMode) {
      const half = Math.ceil(word.length * 0.45);
      const boldPart = word.slice(0, half);
      const rest = word.slice(half);
      content = (
        <span>
          <strong className="font-extrabold">{boldPart}</strong>
          <span className="opacity-80">{rest}</span>
        </span>
      );
    }

    return (
      <span
        key={index}
        onClick={() => onWordClick(index)}
        className={`inline-block mx-1 my-0.5 px-1 py-0.5 rounded cursor-pointer transition-all ${
          isCurrent
            ? 'bg-amber-600 text-white font-bold ring-2 ring-amber-500/50 scale-105 shadow-sm'
            : isRead
            ? 'opacity-65 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
            : 'hover:bg-black/10 dark:hover:bg-white/10'
        }`}
        title={`Word ${index + 1}: Click to jump RSVP reader here`}
      >
        {content}
      </span>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5">
      {/* Top Options Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 mb-4 border-b border-current/10">
        <div>
          <h2 className="text-base font-bold">Full Text Reader</h2>
          <p className="text-xs opacity-65">
            Click any word to jump RSVP to that point in the document
          </p>
        </div>

        <button
          onClick={onToggleBionic}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-current/15 transition-all cursor-pointer ${
            preferences.bionicMode
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
          }`}
          title="Toggle Bionic Reading: highlights the first letters of each word for faster eye fixation"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bionic Reading: {preferences.bionicMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* STOPWATCH BAR FOR FULL TEXT READING */}
      <div className="w-full p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/15 flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isStopwatchRunning
                ? 'bg-emerald-500/20 text-emerald-500 ring-2 ring-emerald-500/40 animate-pulse'
                : 'bg-black/10 dark:bg-white/10 opacity-70'
            }`}
          >
            <Timer className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono tracking-tight">
                {formatTimer(stopwatchSeconds)}
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
            <p className="text-[11px] opacity-60">Reading Stopwatch • Counts seconds</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isStopwatchRunning ? (
            <button
              onClick={() => setIsStopwatchRunning(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start</span>
            </button>
          ) : (
            <button
              onClick={() => setIsStopwatchRunning(false)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

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

          {stopwatchSeconds > 0 && (
            <button
              onClick={() => {
                setIsStopwatchRunning(false);
                setStopwatchSeconds(0);
              }}
              className="p-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs opacity-75 hover:opacity-100 transition-all cursor-pointer"
              title="Reset without saving"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SAVED NOTICE */}
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

      {/* Main Text Content */}
      <div
        className={`p-6 sm:p-10 rounded-3xl bg-black/5 dark:bg-white/5 border border-current/15 leading-relaxed text-base sm:text-lg tracking-normal ${fontClass}`}
      >
        <div className="flex flex-wrap items-baseline">
          {tokens.map((token, idx) => renderWord(token, idx))}
        </div>
      </div>
    </div>
  );
};
