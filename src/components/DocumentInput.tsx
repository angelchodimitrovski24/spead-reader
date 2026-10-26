'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  Clock,
  Trash2,
  X,
  FileCode,
  AlertCircle,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { SavedDocument, ThemeMode } from '@/types/reader';
import { SAMPLE_TEXTS, SampleText } from '@/lib/sample-texts';
import {
  parsePlainTextFile,
  parsePdfFile,
  parseEpubFile,
} from '@/lib/text-parsers';
import { getAllDocuments, deleteDocument, saveDocument } from '@/lib/db';

interface DocumentInputProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument: (doc: {
    id: string;
    title: string;
    text: string;
    sourceType: 'paste' | 'txt' | 'pdf' | 'epub' | 'sample';
    initialPosition?: number;
  }) => void;
  theme: ThemeMode;
}

export const DocumentInput: React.FC<DocumentInputProps> = ({
  isOpen,
  onClose,
  onSelectDocument,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file' | 'samples' | 'recent'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [recentDocs, setRecentDocs] = useState<SavedDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadRecentDocs();
      setErrorMessage('');
    }
  }, [isOpen]);

  const loadRecentDocs = async () => {
    try {
      const docs = await getAllDocuments();
      setRecentDocs(docs);
    } catch (err) {
      console.error('Failed to load recent docs', err);
    }
  };

  if (!isOpen) return null;

  const handlePasteSubmit = async () => {
    const trimmed = pastedText.trim();
    if (!trimmed) {
      setErrorMessage('Please enter or paste some text first.');
      return;
    }

    const title = docTitle.trim() || trimmed.slice(0, 35) + '...';
    const docId = 'doc_' + Date.now();
    const wordCount = trimmed.split(/\s+/).length;

    // Persist immediately in IndexedDB
    try {
      await saveDocument({
        id: docId,
        title,
        sourceType: 'paste',
        text: trimmed,
        wordCount,
        lastPosition: 0,
        updatedAt: Date.now(),
        totalTimeSpentSeconds: 0,
      });
    } catch (e) {
      console.warn('Could not save to IndexedDB:', e);
    }

    onSelectDocument({
      id: docId,
      title,
      text: trimmed,
      sourceType: 'paste',
      initialPosition: 0,
    });
    setPastedText('');
    setDocTitle('');
    onClose();
  };

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setErrorMessage('');
    setStatusMessage(`Preparing "${file.name}"...`);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let text = '';
      let title = file.name.replace(/\.[^/.]+$/, '');
      let sourceType: 'txt' | 'pdf' | 'epub' = 'txt';

      if (ext === 'txt' || ext === 'md' || ext === 'text') {
        setStatusMessage('Reading text file...');
        text = await parsePlainTextFile(file);
        sourceType = 'txt';
      } else if (ext === 'pdf') {
        sourceType = 'pdf';
        const res = await parsePdfFile(file, (msg) => setStatusMessage(msg));
        text = res.text;
        title = res.title || title;
      } else if (ext === 'epub') {
        sourceType = 'epub';
        const res = await parseEpubFile(file, (msg) => setStatusMessage(msg));
        text = res.text;
        title = res.title || title;
      } else {
        throw new Error(
          `Unsupported file format ".${ext}". Please choose a .txt, .md, .pdf, or .epub file.`
        );
      }

      const trimmedText = text.trim();
      if (!trimmedText) {
        throw new Error('No readable text could be extracted from this document.');
      }

      const docId = 'doc_' + Date.now();
      const wordCount = trimmedText.split(/\s+/).length;

      // Save document to IndexedDB immediately
      try {
        await saveDocument({
          id: docId,
          title,
          sourceType,
          text: trimmedText,
          wordCount,
          lastPosition: 0,
          updatedAt: Date.now(),
          totalTimeSpentSeconds: 0,
        });
      } catch (e) {
        console.warn('Could not save to IndexedDB:', e);
      }

      onSelectDocument({
        id: docId,
        title,
        text: trimmedText,
        sourceType,
        initialPosition: 0,
      });
      onClose();
    } catch (err: unknown) {
      console.error('File parsing error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to parse file.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSampleSelect = async (sample: SampleText) => {
    const docId = 'sample_' + sample.id;
    try {
      await saveDocument({
        id: docId,
        title: sample.title,
        sourceType: 'sample',
        text: sample.text,
        wordCount: sample.wordCount,
        lastPosition: 0,
        updatedAt: Date.now(),
        totalTimeSpentSeconds: 0,
      });
    } catch (e) {
      console.warn('Could not save sample doc to IndexedDB:', e);
    }

    onSelectDocument({
      id: docId,
      title: sample.title,
      text: sample.text,
      sourceType: 'sample',
      initialPosition: 0,
    });
    onClose();
  };

  const handleRecentSelect = (doc: SavedDocument) => {
    onSelectDocument({
      id: doc.id,
      title: doc.title,
      text: doc.text,
      sourceType: doc.sourceType,
      initialPosition: doc.lastPosition || 0,
    });
    onClose();
  };

  const handleDeleteRecent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteDocument(id);
    await loadRecentDocs();
  };

  const wordCount = pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0;
  const charCount = pastedText.length;

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

  const tabActive = 'bg-amber-600 text-white shadow-sm font-semibold';
  const tabInactive =
    theme === 'sepia'
      ? 'hover:bg-[#ebdfcc] text-[#6d5b45]'
      : theme === 'paper'
      ? 'hover:bg-[#e4e2d8] text-[#4d5358]'
      : 'hover:bg-black/10 dark:hover:bg-white/10 opacity-70';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${modalBgClass}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-current/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Add Text or Document</h2>
              <p className="text-xs opacity-70">Paste text, or open TXT, PDF, or EPUB files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-current/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs transition-all ${
              activeTab === 'paste' ? tabActive : tabInactive
            }`}
          >
            <FileText className="w-4 h-4" />
            Paste Text
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs transition-all ${
              activeTab === 'file' ? tabActive : tabInactive
            }`}
          >
            <Upload className="w-4 h-4" />
            Open File (TXT, PDF, EPUB)
          </button>

          <button
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs transition-all ${
              activeTab === 'samples' ? tabActive : tabInactive
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Sample Texts
          </button>

          <button
            onClick={() => setActiveTab('recent')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs transition-all ${
              activeTab === 'recent' ? tabActive : tabInactive
            }`}
          >
            <Clock className="w-4 h-4" />
            Recent ({recentDocs.length})
          </button>
        </div>

        {/* Error / Status Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: PASTE TEXT */}
          {activeTab === 'paste' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5 opacity-80">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., My Notes, Book Chapter, Article..."
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/5 dark:bg-white/5 border border-current/15 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold opacity-80">Paste Your Text Here</label>
                  <div className="flex items-center gap-3 text-[11px] opacity-60">
                    <span>{wordCount.toLocaleString()} words</span>
                    <span>•</span>
                    <span>{charCount.toLocaleString()} characters</span>
                    {pastedText && (
                      <button
                        onClick={() => setPastedText('')}
                        className="text-amber-500 hover:underline ml-2"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  rows={8}
                  placeholder="Type or paste your text here (news, study notes, books, transcripts)..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full p-4 rounded-xl text-sm leading-relaxed bg-black/5 dark:bg-white/5 border border-current/15 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono resize-y"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs opacity-60">
                  Tip: Supports any plain text or copied document content
                </span>
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pastedText.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium text-sm shadow-md shadow-amber-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Reading Now</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FILE UPLOAD */}
          {activeTab === 'file' && (
            <div className="flex flex-col gap-4">
              {/* Native File Input with explicit ID */}
              <input
                id="file-upload-input"
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.text,.pdf,.epub"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                  isDragging
                    ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                    : 'border-current/20 hover:border-amber-500/60 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                    <p className="text-sm font-semibold">{statusMessage || 'Extracting document text...'}</p>
                    <p className="text-xs opacity-60">Please wait while the text is processed</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shadow-inner">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold mb-1">
                        Drag and drop your file here, or click Browse
                      </p>
                      <p className="text-xs opacity-60">
                        Supports <strong className="text-amber-500">PDF</strong>,{' '}
                        <strong className="text-amber-500">EPUB</strong> books, and{' '}
                        <strong className="text-amber-500">TXT / Markdown</strong>
                      </p>
                    </div>

                    <label
                      htmlFor="file-upload-input"
                      className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shadow-md shadow-amber-600/20 transition-all"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Browse Files
                    </label>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-black/10 dark:bg-white/10">
                        .pdf
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-black/10 dark:bg-white/10">
                        .epub
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-black/10 dark:bg-white/10">
                        .txt
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-black/10 dark:bg-white/10">
                        .md
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs opacity-75 leading-relaxed flex items-start gap-2.5">
                <FileCode className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Everything is processed 100% locally in your browser. No files are uploaded to any server.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: SAMPLES */}
          {activeTab === 'samples' && (
            <div className="grid grid-cols-1 gap-3">
              <p className="text-xs opacity-70 mb-1">
                Choose a built-in sample text to immediately test your reading velocity:
              </p>
              {SAMPLE_TEXTS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSampleSelect(sample)}
                  className="p-4 rounded-xl border border-current/15 hover:border-amber-500/50 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all flex flex-col gap-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold group-hover:text-amber-500 transition-colors">
                      {sample.title}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold">
                      {sample.wordCount} words
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-60">
                    <span>{sample.author}</span>
                    <span>•</span>
                    <span>{sample.category}</span>
                  </div>
                  <p className="text-xs opacity-75 line-clamp-2 mt-1">
                    {sample.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: RECENT DOCUMENTS */}
          {activeTab === 'recent' && (
            <div className="flex flex-col gap-3">
              {recentDocs.length === 0 ? (
                <div className="py-12 text-center opacity-60 text-xs">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No saved documents yet. Paste text or open a file to start reading!
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                    <span>Saved in browser IndexedDB ({recentDocs.length})</span>
                    <span>Click any item to resume</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto">
                    {recentDocs.map((doc) => {
                      const percent =
                        doc.wordCount > 0
                          ? Math.min(100, Math.round((doc.lastPosition / doc.wordCount) * 100))
                          : 0;

                      return (
                        <div
                          key={doc.id}
                          onClick={() => handleRecentSelect(doc)}
                          className="p-3.5 rounded-xl border border-current/15 hover:border-amber-500/50 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold truncate group-hover:text-amber-500 transition-colors">
                                {doc.title}
                              </span>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 opacity-70">
                                {doc.sourceType}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs opacity-60 mt-1">
                              <span>{doc.wordCount.toLocaleString()} words</span>
                              <span>•</span>
                              <span>
                                Position: {doc.lastPosition.toLocaleString()} ({percent}%)
                              </span>
                              <span>•</span>
                              <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                            </div>

                            <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div
                                className="bg-amber-600 h-full rounded-full transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleDeleteRecent(e, doc.id)}
                            className="p-2 rounded-lg opacity-40 hover:opacity-100 hover:text-amber-500 hover:bg-amber-500/10 transition-colors shrink-0 cursor-pointer"
                            title="Remove from recent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
