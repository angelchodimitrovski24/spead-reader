# SpeedReader ⚡📖

A modern, high-performance **Speed Reader** and **Offline Android App** built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**. Designed for rapid reading using **RSVP (Rapid Serial Visual Presentation)** with **Optimal Recognition Point (ORP)** fixation, alongside a synchronized **Full-Text / Bionic Reading** view.

All reading sessions, active time tracking, velocity metrics, and reading progress are stored locally and privately in your device's **IndexedDB**.

---

## 👁️ Eye-Comfort Color Palettes

Reading at high speeds should never cause retinal fatigue or blue-light glare. SpeedReader features scientifically balanced eye-comfort themes:

- **Warm Charcoal (Default)**: Soft dark paper (`#181a1b`) with warm ivory text (`#e3dfd5`) and a terracotta ORP fixation point (`#e07a5f`). Zero harsh pure-white glare.
- **Kindle Sepia**: Classic e-reader paper (`#f4ebd9`) with deep warm espresso text (`#382e25`) and burnt sienna accent.
- **Forest Sage**: Muted botanical dark (`#161f1a`) that soothes ocular muscles during long reading sprints.
- **Night Amber (Blue-Light Filter)**: Ultra-warm lantern glow (`#15130f`) with soft amber text for bedtime reading without disrupting circadian rhythm.
- **Book Paper**: Editorial off-white ink tone (`#f6f5f0`) for daylight reading.

---

## 📱 Offline App for Android (PWA)

SpeedReader is a full **Progressive Web App (PWA)** that installs directly onto your Android phone or tablet:

### How to Install on Android:
1. Open Chrome, Samsung Internet, or Brave on your Android device and navigate to your SpeedReader URL.
2. Tap the **"Install Android App"** button in the header, or open the browser menu (**⋮** three dots) and tap **"Install app"** or **"Add to Home screen"**.
3. Tap **Install** to add the SpeedReader icon to your Android home screen and app launcher.
4. **100% Offline**: Once installed, open it anytime—on planes, subways, or without internet. All EPUB eBooks, PDFs, text files, and your reading statistics are processed and saved locally.

---

## ✨ Core Features

### 1. Multi-Format Document Input
- **Paste & Type**: Paste any text or notes with live word & character counting.
- **Plain Text & Markdown**: Open `.txt`, `.md`, or `.text` files.
- **PDF Documents**: Direct in-browser PDF text extraction across all pages via local `pdfjs-dist` worker.
- **EPUB eBooks**: Client-side unzipping and chapter extraction via `jszip` with HTML sanitization and reading-order preservation.
- **Sample Library**: Instant sample texts covering science, literature, and philosophy for immediate benchmarking.
- **Recent Documents**: Automatically saves documents with your reading progress to resume anytime.

### 2. RSVP Speed Reading Engine
- **Optimal Recognition Point (ORP)**: Fixates your eye on the optimal reading point (30-35% of each word) highlighted in warm eye-comfort color with subtle crosshair markers.
- **Adjustable Velocity**: Select any speed from **100 to 1200 WPM** with a slider, stepper buttons (`-25` / `+25`), or quick presets (`250`, `350`, `450`, `600`, `800` WPM).
- **Smart Pacing**: Natural pauses on punctuation marks (`.`, `!`, `?`, `,`, `;`, `—`) and extra time for long words (>11 letters).
- **Chunking**: Read 1 word, 2 words, or 3 words at a time.
- **Interactive Scrubber**: Seek to any word or percentage, with dynamic time-remaining estimates.

### 3. Full-Text & Bionic Reading Mode
- Switch seamlessly between RSVP and paragraph view.
- **Bionic Reading Toggle**: Bolds the initial letters of each word to facilitate rapid eye saccades.
- **Synchronized Seek**: Click any word in the full text to jump the RSVP reader directly to that location.

### 4. Reading Time & IndexedDB Stats Tracking
- **Active Time Tracker**: Accurately counts reading duration *only* while reading is active.
- **Persistent IndexedDB Stores**:
  - `sessions`: Timestamp, duration, words read, average WPM, target WPM, completion status.
  - `documents`: Document text, word count, last reading position, total time spent.
  - `settings`: Saved user preferences (WPM, theme, fonts, chunk size, pauses).
- **Comprehensive Stats Dashboard**:
  - Total time read & today's reading time.
  - Total words read & peak WPM record.
  - Milestones / Badges (First Step, Centurion, Bibliophile, Speedster, Sonic Velocity).
  - Detailed session history list with delete and clear options.
  - JSON export of reading statistics.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / Pause reading |
| `←` (Left Arrow) | Rewind 10 words |
| `→` (Right Arrow) | Forward 10 words |
| `↑` (Up Arrow) | Increase speed by 25 WPM |
| `↓` (Down Arrow) | Decrease speed by 25 WPM |
| `R` | Restart document from the beginning |
| `?` | Toggle keyboard shortcuts modal |
| `F` | Toggle fullscreen mode |

---

## 🚀 Running the App

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your desktop or Android device.
