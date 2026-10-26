import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ReadingSession, SavedDocument, UserPreferences } from '@/types/reader';

interface SpeedReaderDB extends DBSchema {
  sessions: {
    key: number;
    value: ReadingSession;
    indexes: { 'by-date': number };
  };
  documents: {
    key: string;
    value: SavedDocument;
    indexes: { 'by-updated': number };
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
}

const DB_NAME = 'speed_reader_db';
const DB_VERSION = 1;

export const defaultPreferences: UserPreferences = {
  wpm: 350,
  wordsPerChunk: 1,
  theme: 'warm-dark',
  fontFamily: 'sans',
  fontSize: 'large',
  pauseOnPunctuation: true,
  pauseOnLongWords: true,
  showOrpGuide: true,
  bionicMode: false,
};

let dbPromise: Promise<IDBPDatabase<SpeedReaderDB>> | null = null;

function getDB(): Promise<IDBPDatabase<SpeedReaderDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in browser'));
  }
  if (!dbPromise) {
    dbPromise = openDB<SpeedReaderDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', {
            keyPath: 'id',
            autoIncrement: true,
          });
          sessionStore.createIndex('by-date', 'timestamp');
        }

        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', {
            keyPath: 'id',
          });
          docStore.createIndex('by-updated', 'updatedAt');
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

/* ================= Sessions ================= */

export async function logReadingSession(session: Omit<ReadingSession, 'id'>): Promise<number> {
  const db = await getDB();
  return db.add('sessions', session as ReadingSession);
}

export async function getAllSessions(): Promise<ReadingSession[]> {
  const db = await getDB();
  const tx = db.transaction('sessions', 'readonly');
  const index = tx.store.index('by-date');
  const all = await index.getAll();
  return all.reverse(); // Newest first
}

export async function deleteSession(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

export async function clearAllSessions(): Promise<void> {
  const db = await getDB();
  await db.clear('sessions');
}

/* ================= Saved Documents ================= */

export async function saveDocument(doc: SavedDocument): Promise<void> {
  const db = await getDB();
  await db.put('documents', doc);
}

export async function getAllDocuments(): Promise<SavedDocument[]> {
  const db = await getDB();
  const tx = db.transaction('documents', 'readonly');
  const index = tx.store.index('by-updated');
  const all = await index.getAll();
  return all.reverse(); // Most recently updated first
}

export async function getDocument(id: string): Promise<SavedDocument | undefined> {
  const db = await getDB();
  return db.get('documents', id);
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('documents', id);
}

/* ================= Settings ================= */

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const db = await getDB();
    const item = await db.get('settings', 'user_preferences');
    if (item && item.value) {
      return { ...defaultPreferences, ...(item.value as Partial<UserPreferences>) };
    }
  } catch (err) {
    console.error('Error fetching preferences:', err);
  }
  return defaultPreferences;
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await getPreferences();
    const updated = { ...current, ...prefs };
    const db = await getDB();
    await db.put('settings', { key: 'user_preferences', value: updated });
  } catch (err) {
    console.error('Error saving preferences:', err);
  }
}

/* ================= Aggregate Stats ================= */

export interface AggregateStats {
  totalTimeSeconds: number;
  totalWordsRead: number;
  totalSessions: number;
  averageWpm: number;
  highestWpm: number;
  todayTimeSeconds: number;
  todayWordsRead: number;
}

export async function getAggregateStats(): Promise<AggregateStats> {
  const sessions = await getAllSessions();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let totalTimeSeconds = 0;
  let totalWordsRead = 0;
  let highestWpm = 0;
  let todayTimeSeconds = 0;
  let todayWordsRead = 0;

  for (const s of sessions) {
    totalTimeSeconds += s.durationSeconds;
    totalWordsRead += s.wordsRead;
    if (s.averageWpm > highestWpm) highestWpm = s.averageWpm;
    if (s.targetWpm > highestWpm) highestWpm = Math.max(highestWpm, s.targetWpm);

    if (s.timestamp >= startOfToday) {
      todayTimeSeconds += s.durationSeconds;
      todayWordsRead += s.wordsRead;
    }
  }

  const averageWpm =
    totalTimeSeconds > 0
      ? Math.round((totalWordsRead / (totalTimeSeconds / 60)))
      : 0;

  return {
    totalTimeSeconds,
    totalWordsRead,
    totalSessions: sessions.length,
    averageWpm,
    highestWpm,
    todayTimeSeconds,
    todayWordsRead,
  };
}
