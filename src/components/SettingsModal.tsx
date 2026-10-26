'use client';

import React from 'react';
import {
  Settings,
  X,
  Palette,
  Type,
  Maximize,
  Sliders,
  Crosshair,
  Timer,
  Eye,
} from 'lucide-react';
import { UserPreferences, ThemeMode, FontFamily } from '@/types/reader';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdate: (prefs: Partial<UserPreferences>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdate,
}) => {
  if (!isOpen) return null;

  const themes: { id: ThemeMode; label: string; desc: string; previewClass: string }[] = [
    {
      id: 'warm-dark',
      label: 'Warm Charcoal',
      desc: 'Soft dark paper, zero harsh glare',
      previewClass: 'bg-[#1b1d1e] border-[#343a3d] text-[#e3dfd5]',
    },
    {
      id: 'sepia',
      label: 'Kindle Sepia',
      desc: 'Warm paper & espresso tones',
      previewClass: 'bg-[#f4ebd9] border-[#d8cbb3] text-[#382e25]',
    },
    {
      id: 'sage',
      label: 'Forest Sage',
      desc: 'Restful muted botanical dark',
      previewClass: 'bg-[#161f1a] border-[#2d3d34] text-[#d5dfd8]',
    },
    {
      id: 'amber',
      label: 'Night Amber',
      desc: 'Zero blue light night comfort',
      previewClass: 'bg-[#15130f] border-[#322d23] text-[#ecd7b8]',
    },
    {
      id: 'paper',
      label: 'Book Paper',
      desc: 'Editorial off-white e-ink feel',
      previewClass: 'bg-[#f6f5f0] border-[#d8d5cb] text-[#24272a]',
    },
    {
      id: 'dark',
      label: 'Classic Slate',
      desc: 'Cool modern slate dark',
      previewClass: 'bg-[#0f172a] border-[#334155] text-[#f8fafc]',
    },
  ];

  const fonts: { id: FontFamily; label: string; preview: string; class: string }[] = [
    { id: 'sans', label: 'Sans Serif', preview: 'Aa', class: 'font-sans' },
    { id: 'serif', label: 'Serif Classic', preview: 'Aa', class: 'font-serif' },
    { id: 'mono', label: 'Monospace', preview: 'Aa', class: 'font-mono' },
  ];

  const fontSizes: { id: UserPreferences['fontSize']; label: string }[] = [
    { id: 'small', label: 'Small' },
    { id: 'medium', label: 'Medium' },
    { id: 'large', label: 'Large' },
    { id: 'huge', label: 'Extra Large' },
  ];

  const modalBgClass =
    preferences.theme === 'sepia'
      ? 'bg-[#f4ebd9] border-[#d8cbb3] text-[#382e25]'
      : preferences.theme === 'paper'
      ? 'bg-[#f6f5f0] border-[#d8d5cb] text-[#24272a]'
      : preferences.theme === 'sage'
      ? 'bg-[#161f1a] border-[#2d3d34] text-[#d5dfd8]'
      : preferences.theme === 'amber'
      ? 'bg-[#15130f] border-[#322d23] text-[#ecd7b8]'
      : preferences.theme === 'dark'
      ? 'bg-[#0f172a] border-[#334155] text-[#f8fafc]'
      : 'bg-[#1b1d1e] border-[#343a3d] text-[#e3dfd5]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${modalBgClass}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-current/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Reader Preferences</h2>
              <p className="text-xs opacity-70">Eye comfort, pacing, and typography settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* THEME SELECTOR */}
          <div>
            <div className="flex items-center gap-2 mb-2.5 text-xs font-bold opacity-80 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-amber-500" />
              <span>Eye Comfort Palettes</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdate({ theme: t.id })}
                  className={`p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all cursor-pointer ${t.previewClass} ${
                    preferences.theme === t.id
                      ? 'ring-2 ring-amber-500 shadow-md scale-[1.02]'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">{t.label}</span>
                    <span className="w-3 h-3 rounded-full border border-current/30" />
                  </div>
                  <span className="text-[10px] opacity-70 leading-tight">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FONT FAMILY */}
          <div>
            <div className="flex items-center gap-2 mb-2.5 text-xs font-bold opacity-80 uppercase tracking-wider">
              <Type className="w-4 h-4 text-amber-500" />
              <span>Typography</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onUpdate({ fontFamily: f.id })}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    preferences.fontFamily === f.id
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 border-current/15 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className={`text-xl font-bold ${f.class}`}>{f.preview}</span>
                  <span className="text-xs font-medium">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FONT SIZE */}
          <div>
            <div className="flex items-center gap-2 mb-2.5 text-xs font-bold opacity-80 uppercase tracking-wider">
              <Maximize className="w-4 h-4 text-amber-500" />
              <span>Display Size</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {fontSizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onUpdate({ fontSize: s.id })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    preferences.fontSize === s.id
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 border-current/15 opacity-70 hover:opacity-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* CHUNK SIZE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold opacity-80 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>Chunk Size (Words at once)</span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-500">
                {preferences.wordsPerChunk} {preferences.wordsPerChunk === 1 ? 'word' : 'words'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {([1, 2, 3] as const).map((chunk) => (
                <button
                  key={chunk}
                  onClick={() => onUpdate({ wordsPerChunk: chunk })}
                  className={`py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    preferences.wordsPerChunk === chunk
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 border-current/15 opacity-70 hover:opacity-100'
                  }`}
                >
                  {chunk} Word{chunk > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* SMART PACING & GUIDES */}
          <div className="flex flex-col gap-3 pt-2 border-t border-current/10">
            {/* Punctuation Pause */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Timer className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-xs font-semibold block">Pause on Punctuation</span>
                  <span className="text-[11px] opacity-65">
                    Slight natural pause at commas, periods, and sentence endings
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.pauseOnPunctuation}
                onChange={(e) => onUpdate({ pauseOnPunctuation: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>

            {/* Long Words Pause */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Timer className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-xs font-semibold block">Pause on Long Words</span>
                  <span className="text-[11px] opacity-65">
                    Gives extra milliseconds for words longer than 11 letters
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.pauseOnLongWords}
                onChange={(e) => onUpdate({ pauseOnLongWords: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>

            {/* ORP Crosshair Guide */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Crosshair className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-xs font-semibold block">ORP Center Markers</span>
                  <span className="text-[11px] opacity-65">
                    Subtle upper & lower fixation markers for eye relaxation
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.showOrpGuide}
                onChange={(e) => onUpdate({ showOrpGuide: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
