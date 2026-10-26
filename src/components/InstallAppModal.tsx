'use client';

import React from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  X,
  WifiOff,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ThemeMode } from '@/types/reader';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  canInstallNatively: boolean;
  onNativeInstall: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  theme,
  canInstallNatively,
  onNativeInstall,
}) => {
  if (!isOpen) return null;

  const modalBgClass =
    theme === 'sepia'
      ? 'bg-[#f4ebd9] border-[#d8cbb3] text-[#382e25]'
      : theme === 'paper'
      ? 'bg-[#f6f5f0] border-[#d8d5cb] text-[#24272a]'
      : theme === 'sage'
      ? 'bg-[#161f1a] border-[#2d3d34] text-[#d5dfd8]'
      : theme === 'amber'
      ? 'bg-[#15130f] border-[#322d23] text-[#ecd7b8]'
      : 'bg-[#1b1d1e] border-[#343a3d] text-[#e3dfd5]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${modalBgClass}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-current/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Install for Android</h2>
              <p className="text-xs opacity-70">100% Offline Progressive Web App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Native Install Button if supported by current browser session */}
          {canInstallNatively ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>One-Tap Install Ready</span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                Your device supports instant installation. Tap the button below to add SpeedReader to your Android home screen and app drawer.
              </p>
              <button
                onClick={() => {
                  onNativeInstall();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install SpeedReader on Android</span>
              </button>
            </div>
          ) : null}

          {/* Android Chrome Instructions */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-80">
              How to Install on Android (Chrome / Brave / Edge)
            </h3>

            <div className="flex flex-col gap-2.5 text-xs opacity-85">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <strong className="block font-semibold mb-0.5">Open in Mobile Chrome</strong>
                  <span>Visit this app on your Android smartphone or tablet.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <strong className="block font-semibold mb-0.5">Tap the Browser Menu</strong>
                  <span>Tap the three dots (⋮) icon in the top right corner of Chrome.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <strong className="block font-semibold mb-0.5">Select &quot;Install app&quot; or &quot;Add to Home screen&quot;</strong>
                  <span>Confirm by tapping <strong>Install</strong>. It creates a dedicated launcher icon!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Offline Features Highlight */}
          <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold opacity-80">
              <WifiOff className="w-4 h-4 text-emerald-500" />
              <span>Complete Offline Capabilities</span>
            </div>
            <ul className="text-xs opacity-75 space-y-1.5 list-disc list-inside">
              <li>No internet or Wi-Fi needed after installation</li>
              <li>Read offline on flights, subways, or travels</li>
              <li>EPUB, PDF, and text files parsed 100% locally on device</li>
              <li>Reading stats and progress saved in local device storage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
