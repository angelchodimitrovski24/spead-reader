import JSZip from 'jszip';
import { WordToken } from '@/types/reader';

/**
 * Calculates the Optimal Recognition Point (ORP) index for a word.
 * Eye fixation research shows the eye recognizes words fastest when
 * landing around 30-35% from the start of the word.
 */
export function calculateOrpIndex(word: string): number {
  const clean = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  const len = clean.length;
  if (len <= 1) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}

/**
 * Calculates a pause multiplier based on word punctuation and length.
 */
export function calculatePauseMultiplier(
  word: string,
  pauseOnPunctuation: boolean,
  pauseOnLongWords: boolean
): number {
  let multiplier = 1.0;

  if (pauseOnPunctuation) {
    if (/[.!?]["']?$/.test(word)) {
      multiplier *= 2.2; // Full stop, question mark, exclamation
    } else if (/[,;:—-]/.test(word)) {
      multiplier *= 1.5; // Comma, colon, semicolon, dash
    } else if (/["()«»]/.test(word)) {
      multiplier *= 1.2;
    }
  }

  if (pauseOnLongWords && word.length > 11) {
    multiplier *= 1.3;
  }

  return multiplier;
}

/**
 * Tokenizes text into an array of WordTokens.
 */
export function tokenizeText(
  text: string,
  pauseOnPunctuation = true,
  pauseOnLongWords = true
): WordToken[] {
  if (!text || !text.trim()) return [];

  const rawWords = text.trim().split(/\s+/);
  const tokens: WordToken[] = [];

  for (const raw of rawWords) {
    if (!raw) continue;
    const clean = raw.replace(/[^\p{L}\p{N}]+/gu, '');
    const orpOffset = calculateOrpIndex(raw);
    const pauseMultiplier = calculatePauseMultiplier(raw, pauseOnPunctuation, pauseOnLongWords);

    let targetCharIndex = 0;
    let letterCount = 0;
    for (let i = 0; i < raw.length; i++) {
      if (/[\p{L}\p{N}]/u.test(raw[i])) {
        if (letterCount === orpOffset) {
          targetCharIndex = i;
          break;
        }
        letterCount++;
      }
    }

    tokens.push({
      original: raw,
      clean: clean || raw,
      orpIndex: targetCharIndex,
      pauseMultiplier,
    });
  }

  return tokens;
}

/**
 * Parses plain text / markdown file.
 */
export async function parsePlainTextFile(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return await file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Parses PDF document using pdfjs-dist in the browser.
 */
export async function parsePdfFile(
  file: File,
  onProgress?: (msg: string) => void
): Promise<{ title: string; text: string }> {
  onProgress?.('Initializing PDF engine...');
  const pdfjs = await import('pdfjs-dist');

  // Configure worker
  if (typeof window !== 'undefined') {
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    } catch (e) {
      console.warn('Worker configuration notice:', e);
    }
  }

  onProgress?.('Reading PDF file data...');
  const arrayBuffer = await file.arrayBuffer();
  const uint8Data = new Uint8Array(arrayBuffer);

  onProgress?.('Loading PDF document...');
  const loadingTask = pdfjs.getDocument({
    data: uint8Data,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const fullTextParts: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.(`Extracting text: Page ${pageNum} of ${numPages}...`);
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    let lastY: number | null = null;
    let pageText = '';

    for (const item of textContent.items) {
      if ('str' in item) {
        if (lastY !== null && 'transform' in item && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
          pageText += ' ';
        }
        pageText += item.str;
        if ('transform' in item) {
          lastY = item.transform[5];
        }
      }
    }

    if (pageText.trim()) {
      fullTextParts.push(pageText.trim());
    }
  }

  const title = file.name.replace(/\.pdf$/i, '');
  return {
    title,
    text: fullTextParts.join('\n\n'),
  };
}

/**
 * Parses an EPUB file using JSZip in the browser.
 */
export async function parseEpubFile(
  file: File,
  onProgress?: (msg: string) => void
): Promise<{ title: string; text: string }> {
  onProgress?.('Extracting EPUB package...');
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Read META-INF/container.xml to find the root OPF file path
  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Invalid EPUB: Missing META-INF/container.xml');
  }

  const containerXml = await containerFile.async('text');
  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXml, 'application/xml');
  const rootfileEl = containerDoc.querySelector('rootfile');
  let opfPath = rootfileEl?.getAttribute('full-path');

  if (!opfPath) {
    // Try finding any .opf file in the zip
    const opfEntries = Object.keys(zip.files).filter((k) => k.endsWith('.opf'));
    if (opfEntries.length > 0) {
      opfPath = opfEntries[0];
    } else {
      throw new Error('Invalid EPUB: Unable to locate package OPF path');
    }
  }

  // 2. Read OPF file
  onProgress?.('Reading book manifest and spine...');
  let opfFile = zip.file(opfPath);
  if (!opfFile) {
    // Fallback: match case-insensitively
    const match = Object.keys(zip.files).find(
      (k) => k.toLowerCase() === opfPath!.toLowerCase()
    );
    if (match) opfFile = zip.file(match);
  }

  if (!opfFile) {
    throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}`);
  }

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
  const opfXml = await opfFile.async('text');
  const opfDoc = parser.parseFromString(opfXml, 'application/xml');

  // Extract Title
  const titleEl = opfDoc.querySelector('metadata > title, metadata > dc\\:title');
  const bookTitle = titleEl?.textContent?.trim() || file.name.replace(/\.epub$/i, '');

  // Extract Manifest items: id -> href
  const manifestMap: Record<string, string> = {};
  const itemEls = opfDoc.querySelectorAll('manifest > item');
  itemEls.forEach((el) => {
    const id = el.getAttribute('id');
    const href = el.getAttribute('href');
    if (id && href) {
      manifestMap[id] = href;
    }
  });

  // Extract Spine order: list of idrefs
  const itemrefs = opfDoc.querySelectorAll('spine > itemref');
  const readingOrderHrefs: string[] = [];

  itemrefs.forEach((ref) => {
    const idref = ref.getAttribute('idref');
    if (idref && manifestMap[idref]) {
      readingOrderHrefs.push(manifestMap[idref]);
    }
  });

  // Fallback if spine was empty
  if (readingOrderHrefs.length === 0) {
    Object.values(manifestMap).forEach((href) => {
      if (/\.(xhtml|html|htm|xml)$/i.test(href)) {
        readingOrderHrefs.push(href);
      }
    });
  }

  // 3. Process each chapter file in reading order
  const chapterTexts: string[] = [];
  const total = readingOrderHrefs.length;

  for (let i = 0; i < total; i++) {
    const relativeHref = readingOrderHrefs[i];
    onProgress?.(`Reading chapter ${i + 1} of ${total}...`);

    const decodedHref = decodeURIComponent(relativeHref).replace(/^\/+/, '');
    const fullZipPath = opfDir ? `${opfDir}${decodedHref}` : decodedHref;

    // Try finding exact match or relative match
    let chapterFile = zip.file(fullZipPath);
    if (!chapterFile) {
      chapterFile = zip.file(decodedHref);
    }
    if (!chapterFile) {
      // Search all keys for matching basename
      const baseName = decodedHref.split('/').pop()?.toLowerCase();
      const match = Object.keys(zip.files).find(
        (k) => k.toLowerCase().endsWith(baseName || '')
      );
      if (match) chapterFile = zip.file(match);
    }

    if (!chapterFile) continue;

    const chapterHtml = await chapterFile.async('text');
    const chapterDoc = parser.parseFromString(chapterHtml, 'text/html');

    // Remove non-content tags
    chapterDoc.querySelectorAll('script, style, head, nav, svg, noscript').forEach((el) => el.remove());

    const elements = chapterDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, blockquote, li');
    if (elements.length > 0) {
      const parts: string[] = [];
      elements.forEach((el) => {
        const text = el.textContent?.trim();
        if (text) parts.push(text);
      });
      if (parts.length > 0) {
        chapterTexts.push(parts.join('\n\n'));
      }
    } else {
      const rawText = chapterDoc.body?.textContent?.trim();
      if (rawText) {
        chapterTexts.push(rawText);
      }
    }
  }

  if (chapterTexts.length === 0) {
    throw new Error('Could not extract readable text from this EPUB eBook.');
  }

  return {
    title: bookTitle,
    text: chapterTexts.join('\n\n'),
  };
}
