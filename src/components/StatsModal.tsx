'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Clock,
  Zap,
  Trophy,
  Flame,
  Calendar,
  Trash2,
  Download,
  X,
  BookOpen,
  TrendingUp,
  Award,
} from 'lucide-react';
import { ReadingSession, ThemeMode } from '@/types/reader';
import {
  getAllSessions,
  deleteSession,
  clearAllSessions,
  getAggregateStats,
  AggregateStats,
} from '@/lib/db';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, theme }) => {
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [stats, setStats] = useState<AggregateStats>({
    totalTimeSeconds: 0,
    totalWordsRead: 0,
    totalSessions: 0,
    averageWpm: 0,
    highestWpm: 0,
    todayTimeSeconds: 0,
    todayWordsRead: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [allSessions, agg] = await Promise.all([
        getAllSessions(),
        getAggregateStats(),
      ]);
      setSessions(allSessions);
      setStats(agg);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  if (!isOpen) return null;

  const handleDelete = async (id: number) => {
    await deleteSession(id);
    await loadData();
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete all reading sessions and stats?')) {
      await clearAllSessions();
      await loadData();
    }
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ stats, sessions }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `speed_reader_stats_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatDuration = (totalSeconds: number) => {
    const sec = Math.round(totalSeconds);
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${s}s`;
    }
    if (mins > 0) {
      return `${mins}m ${s}s`;
    }
    return `${s}s`;
  };

  // Badges logic
  const badges = [
    {
      id: 'first_session',
      title: 'First Step',
      desc: 'Logged 1st reading session',
      unlocked: stats.totalSessions >= 1,
      icon: Award,
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    },
    {
      id: 'words_1k',
      title: 'Centurion',
      desc: 'Read 1,000+ words',
      unlocked: stats.totalWordsRead >= 1000,
      icon: Trophy,
      color: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    },
    {
      id: 'words_10k',
      title: 'Bibliophile',
      desc: 'Read 10,000+ words',
      unlocked: stats.totalWordsRead >= 10000,
      icon: BookOpen,
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    },
    {
      id: 'speed_400',
      title: 'Speedster',
      desc: 'Clocked 400+ WPM',
      unlocked: stats.highestWpm >= 400,
      icon: Zap,
      color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    },
    {
      id: 'speed_600',
      title: 'Sonic Velocity',
      desc: 'Pushed past 600+ WPM',
      unlocked: stats.highestWpm >= 600,
      icon: Flame,
      color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    },
  ];

  const modalBgClass =
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${modalBgClass}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-current/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Reading Statistics & History</h2>
              <p className="text-xs opacity-60">
                IndexedDB storage • Precise active reading tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/5 dark:bg-white/5 border border-current/10 hover:bg-black/10 transition-colors"
                title="Export all sessions to JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* TOP METRICS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Total Reading Time */}
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs opacity-70">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Total Time</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-rose-500">
                {formatDuration(stats.totalTimeSeconds)}
              </span>
              <span className="text-[11px] opacity-60">
                Today: {formatDuration(stats.todayTimeSeconds)}
              </span>
            </div>

            {/* Total Words Read */}
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs opacity-70">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Words Read</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-500">
                {stats.totalWordsRead.toLocaleString()}
              </span>
              <span className="text-[11px] opacity-60">
                Today: {stats.todayWordsRead.toLocaleString()} words
              </span>
            </div>

            {/* Average WPM */}
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs opacity-70">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Average Speed</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-500">
                  {stats.averageWpm}
                </span>
                <span className="text-xs uppercase font-medium opacity-60">WPM</span>
              </div>
              <span className="text-[11px] opacity-60">Across all sessions</span>
            </div>

            {/* Highest WPM Record */}
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs opacity-70">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Peak Velocity</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-cyan-500">
                  {stats.highestWpm}
                </span>
                <span className="text-xs uppercase font-medium opacity-60">WPM</span>
              </div>
              <span className="text-[11px] opacity-60">{stats.totalSessions} sessions</span>
            </div>
          </div>

          {/* BADGES / MILESTONES */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider opacity-80">
                Reading Milestones
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {badges.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.id}
                    className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1 transition-all ${
                      b.unlocked
                        ? `${b.color} shadow-sm`
                        : 'opacity-35 bg-black/5 dark:bg-white/5 border-current/10 grayscale'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-0.5" />
                    <span className="text-xs font-bold">{b.title}</span>
                    <span className="text-[10px] opacity-75">{b.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SESSION HISTORY LIST */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Session Log ({sessions.length})
                </h3>
              </div>
              {sessions.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-rose-400 hover:underline flex items-center gap-1 opacity-70 hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="p-8 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 text-center text-xs opacity-60">
                No sessions recorded yet. Start reading a document to begin tracking time and
                velocity!
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 hover:border-current/20 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{s.documentTitle}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 opacity-70 uppercase">
                          {s.sourceType}
                        </span>
                        {s.completed && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                            Completed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] opacity-60 mt-1">
                        <span>{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(s.timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{formatDuration(s.durationSeconds)} duration</span>
                        <span>•</span>
                        <span>{s.wordsRead.toLocaleString()} words</span>
                        <span>•</span>
                        <span className="font-bold text-rose-400">{s.averageWpm} WPM</span>
                      </div>
                    </div>

                    <button
                      onClick={() => s.id && handleDelete(s.id)}
                      className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:text-rose-500 transition-colors"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
