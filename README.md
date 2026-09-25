# ChartGenie.xyz — Instant AI Chart & Viral Infographic Generator

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-10B981?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Capacitor Ready](https://img.shields.io/badge/Capacitor-iOS%20%26%20Android-1192d3?logo=capacitor&logoColor=white)](https://capacitorjs.com/)

**ChartGenie** is a high-performance, privacy-first, client-side data visualization and viral infographic maker. Turn raw numbers, spreadsheets, and natural language prompts into stunning, publication-ready charts in seconds.

Built to be **user-friendly**, **viral on social networks (X/Twitter, LinkedIn, TikTok, Instagram)**, and **architected for seamless conversion into native iOS and Android mobile apps via Capacitor or PWA**.

---

## ⚡ What Makes It Viral & User-Friendly?

### 1. 🔥 Viral Meme & Social Presets
- **Relatable Humorous Charts**: "Where Developer Time Actually Goes", "Where My Salary Vanishes", "Anatomy of a 1-Hour Zoom Meeting", "Expectation vs Reality".
- **Social Media Aspect Ratios**:
  - `1:1` — Square Instagram & LinkedIn feed posts
  - `9:16` — TikTok, Instagram Reels, YouTube Shorts & Stories
  - `16:9` — X / Twitter headers, YouTube thumbnails & presentation slides
  - `4:3` — Keynote & PDF slide decks
- **Creator Watermark / Handle**: Add `@yourhandle` directly on the visual canvas for attribution when screenshots and exports get reposted.

### 2. 🎨 High-Contrast Aesthetic Themes
- **Spotify Wrapped**: Electric neon green (`#1ed760`), magenta, and deep pitch-black contrast.
- **Apple Keynote / Studio**: Sleek frosted glass, SF Pro aesthetic, and macOS color palette.
- **Terminal Amber**: Retro Bloomberg-style amber and phosphor green data aesthetic.
- **Notion Warm Paper**: Editorial minimalist monochrome for essays and blogs.
- **Neon Cyber, Vercel Slate, Stripe Finance, Emerald Luxe, Minimal Pastel**.

### 3. 🤖 Intelligent Natural Language AI Parser
- Type natural prompts like `"Tesla 1.8M, Ford 4.4M, BYD 3.0M"` or `"Rent $1400, Food $500, Fun $200"`.
- Smart heuristic extraction recognizes currency symbols, percentages, suffixes (`k`, `M`, `B`), dates, and metrics without requiring an API key.
- Auto-recommends chart types based on data patterns (e.g. time series $\rightarrow$ line chart; percentages $\rightarrow$ donut; comparisons $\rightarrow$ bar).

### 4. 📲 Native Share & Export Suite
- **Native Web Share API**: On iOS and Android devices, tap "Native Share" to open the device's native share sheet with the chart image pre-attached (share directly to Instagram Stories, Twitter, WhatsApp, Slack, Messages, or AirDrop).
- **1-Click Share to X (Twitter)**: Pre-fills tweet text with hashtags and share link.
- **Direct Clipboard Copy**: Copy high-res 2x PNG straight into system clipboard for immediate pasting into Slack, Notion, Word, or Google Slides.
- **Lossless Exports**: Vector SVG for Adobe Illustrator & Figma, and Ultra 4K 300 DPI PNGs for print.

### 5. 📂 Local Project Manager ("My Charts") & Autosave
- Automatic debounced background autosave prevents lost work.
- "My Saved Charts" drawer allows saving, switching between, and deleting multiple projects on device without needing external logins or servers.
- Haptic tactile feedback (`navigator.vibrate`) on touch interactions.

---

## 📱 How to Convert into a Native Mobile App (iOS & Android)

ChartGenie is built 100% client-side with no remote server state, safe-area inset support, and mobile bottom navigation—making it plug-and-play with **Capacitor**.

### Quick Setup with Capacitor:

1. **Install Capacitor in the project**:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
   ```

2. **Initialize Capacitor**:
   ```bash
   npx cap init ChartGenie xyz.chartgenie.app --web-dir dist
   ```
   *(A pre-configured [`capacitor.config.json`](file:///Users/airbook/devpro/chartmaker/capacitor.config.json) is already included in this repository).*

3. **Build the production web app**:
   ```bash
   npm run build
   ```

4. **Add iOS & Android platforms**:
   ```bash
   npx cap add ios
   npx cap add android
   ```

5. **Sync web assets to mobile shell**:
   ```bash
   npx cap sync
   ```

6. **Open in Xcode or Android Studio**:
   ```bash
   # For iOS (macOS required):
   npx cap open ios

   # For Android:
   npx cap open android
   ```

7. **Run on Device or Emulator**: Click "Run" in Xcode or Android Studio to test on physical iPhone or Android devices!

---

## 🌐 Progressive Web App (PWA) Installation

ChartGenie can also be installed as a standalone app directly from any mobile or desktop browser without the App Store:
- **On iOS (Safari)**: Tap the Share button $\rightarrow$ Select **"Add to Home Screen"**.
- **On Android (Chrome)**: Tap the menu $\rightarrow$ Select **"Install App"**.
- **On macOS / Windows (Chrome/Edge)**: Click the Install icon in the address bar.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run Oxlint linter
npm run lint

# Compile TypeScript & production bundle
npm run build
```

---

## 🔒 Privacy & Security

- **100% Client-Side Processing**: All CSV parsing, data transformations, chart rendering, and image generation occur inside the user's browser memory. Confidential business data is never transmitted to third-party servers.
