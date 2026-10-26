'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { ReaderView } from '@/components/ReaderView';
import { FullTextView } from '@/components/FullTextView';
import { DocumentInput } from '@/components/DocumentInput';
import { StatsModal } from '@/components/StatsModal';
import { SettingsModal } from '@/components/SettingsModal';
import { InstallAppModal } from '@/components/InstallAppModal';
import {
  ReaderMode,
  UserPreferences,
  WordToken,
  SavedDocument,
} from '@/types/reader';
import { SAMPLE_TEXTS } from '@/lib/sample-texts';
import { tokenizeText } from '@/lib/text-parsers';
import {
  getPreferences,
  savePreferences,
  defaultPreferences,
  getAggregateStats,
  saveDocument,
  getAllDocuments,
} from '@/lib/db';
import { Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Home() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [currentMode, setCurrentMode] = useState<ReaderMode>('rsvp');

  // Active document state
  const [currentDocId, setCurrentDocId] = useState<string>('sample_' + SAMPLE_TEXTS[0].id);
  const [currentDocTitle, setCurrentDocTitle] = useState<string>(SAMPLE_TEXTS[0].title);
  const [sourceType, setSourceType] = useState<'paste' | 'txt' | 'pdf' | 'epub' | 'sample'>('sample');
  const [fullText, setFullText] = useState<string>(SAMPLE_TEXTS[0].text);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);

  // Modals
  const [isDocInputOpen, setIsDocInputOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);

  // Android PWA Install prompt state
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstallNatively, setCanInstallNatively] = useState(false);

  // Stats
  const [todaySeconds, setTodaySeconds] = useState(0);

  // Listen for PWA install prompt on Android / Chrome
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstallNatively(true);
      setShowAndroidBanner(true);
    };

    const handleAppInstalled = () => {
      setCanInstallNatively(false);
      setShowAndroidBanner(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPromptRef.current) {
      await deferredPromptRef.current.prompt();
      const choice = await deferredPromptRef.current.userChoice;
      if (choice.outcome === 'accepted') {
        setCanInstallNatively(false);
        setShowAndroidBanner(false);
      }
      deferredPromptRef.current = null;
    }
  };

  // Load preferences and initial document on mount
  useEffect(() => {
    async function init() {
      try {
        const [prefs, stats, recent] = await Promise.all([
          getPreferences(),
          getAggregateStats(),
          getAllDocuments(),
        ]);
        setPreferences(prefs);
        setTodaySeconds(stats.todayTimeSeconds);

        if (recent.length > 0) {
          const latest = recent[0];
          setCurrentDocId(latest.id);
          setCurrentDocTitle(latest.title);
          setSourceType(latest.sourceType);
          setFullText(latest.text);
          setCurrentWordIndex(latest.lastPosition || 0);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  const refreshTodayStats = useCallback(async () => {
    try {
      const stats = await getAggregateStats();
      setTodaySeconds(stats.todayTimeSeconds);
    } catch (err) {
      console.error('Stats refresh error:', err);
    }
  }, []);

  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updated };
      savePreferences(next);
      return next;
    });
  };

  const handleSelectDocument = async (doc: {
    id: string;
    title: string;
    text: string;
    sourceType: 'paste' | 'txt' | 'pdf' | 'epub' | 'sample';
    initialPosition?: number;
  }) => {
    setCurrentDocId(doc.id);
    setCurrentDocTitle(doc.title);
    setFullText(doc.text);
    setSourceType(doc.sourceType);
    setCurrentWordIndex(doc.initialPosition || 0);

    try {
      await saveDocument({
        id: doc.id,
        title: doc.title,
        sourceType: doc.sourceType,
        text: doc.text,
        wordCount: doc.text.trim().split(/\s+/).length,
        lastPosition: doc.initialPosition || 0,
        updatedAt: Date.now(),
        totalTimeSpentSeconds: 0,
      });
      await refreshTodayStats();
    } catch (e) {
      console.warn('Could not save document:', e);
    }
  };

  const tokens: WordToken[] = useMemo(() => {
    return tokenizeText(
      fullText,
      preferences.pauseOnPunctuation,
      preferences.pauseOnLongWords
    );
  }, [fullText, preferences.pauseOnPunctuation, preferences.pauseOnLongWords]);

  // Eye-comfort theme container classes
  const themeContainerClass =
    preferences.theme === 'sepia'
      ? 'bg-[#f4ebd9] text-[#382e25]'
      : preferences.theme === 'paper'
      ? 'bg-[#f6f5f0] text-[#24272a]'
      : preferences.theme === 'sage'
      ? 'bg-[#161f1a] text-[#d5dfd8]'
      : preferences.theme === 'amber'
      ? 'bg-[#15130f] text-[#ecd7b8]'
      : preferences.theme === 'dark'
      ? 'bg-[#0f172a] text-[#f8fafc]'
      : 'bg-[#181a1b] text-[#e3dfd5]'; // warm-dark (default)

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${themeContainerClass}`}>
      {/* Navigation Header */}
      <Navbar
        currentTitle={currentDocTitle}
        wordCount={tokens.length}
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        onOpenNewDoc={() => setIsDocInputOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        theme={preferences.theme}
        todaySeconds={todaySeconds}
      />

      {/* Main Reading Canvas */}
      <main className="flex-1 flex flex-col justify-center items-center">
        {currentMode === 'rsvp' ? (
          <ReaderView
            key={currentDocId}
            tokens={tokens}
            currentDocId={currentDocId}
            currentDocTitle={currentDocTitle}
            sourceType={sourceType}
            fullText={fullText}
            initialPosition={currentWordIndex}
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onSessionLogged={refreshTodayStats}
            onOpenDocModal={() => setIsDocInputOpen(true)}
          />
        ) : (
          <FullTextView
            tokens={tokens}
            currentIndex={currentWordIndex}
            onWordClick={(index) => {
              setCurrentWordIndex(index);
              setCurrentMode('rsvp');
            }}
            preferences={preferences}
            onToggleBionic={() =>
              handleUpdatePreferences({ bionicMode: !preferences.bionicMode })
            }
            currentDocTitle={currentDocTitle}
            sourceType={sourceType}
            onSessionLogged={refreshTodayStats}
          />
        )}
      </main>

      {/* Android Offline App Quick Banner */}
      {showAndroidBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-600/40 text-emerald-100 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div
            className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
            onClick={() => setIsInstallModalOpen(true)}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate">Install for Android</p>
              <p className="text-[11px] opacity-75 leading-tight">Works 100% offline with EPUB & PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                if (canInstallNatively) {
                  handleNativeInstall();
                } else {
                  setIsInstallModalOpen(true);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              Install
            </button>
            <button
              onClick={() => setShowAndroidBanner(false)}
              className="p-1 rounded-lg opacity-60 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <DocumentInput
        isOpen={isDocInputOpen}
        onClose={() => setIsDocInputOpen(false)}
        onSelectDocument={handleSelectDocument}
        theme={preferences.theme}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        theme={preferences.theme}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdate={handleUpdatePreferences}
      />

      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        theme={preferences.theme}
        canInstallNatively={canInstallNatively}
        onNativeInstall={handleNativeInstall}
      />
    </div>
  );
}
