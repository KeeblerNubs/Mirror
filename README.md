# Mirror — Confidence‑First AI Wardrobe Assistant

Mirror is a static-first Progressive Web App (PWA) for wardrobe planning, outfit generation, and constructive style critique.

It runs on Cloudflare Pages + Pages Functions, stores user wardrobe/state locally in the browser, and uses OpenAI-powered endpoints for intelligent outfit guidance.

---

## Table of Contents
1. [Product Overview](#product-overview)
2. [Feature Inventory](#feature-inventory)
3. [System Architecture](#system-architecture)
4. [Repository Layout](#repository-layout)
5. [Runtime Requirements](#runtime-requirements)
6. [Environment Variables & Secrets](#environment-variables--secrets)
7. [Local Development Workflow](#local-development-workflow)
8. [Deployment Workflow (Cloudflare Pages)](#deployment-workflow-cloudflare-pages)
9. [API Reference](#api-reference)
10. [Frontend Pages & Navigation Map](#frontend-pages--navigation-map)
11. [Client Data Model (IndexedDB/localStorage)](#client-data-model-indexeddblocalstorage)
12. [PWA Behavior (Offline/Installability)](#pwa-behavior-offlineinstallability)
13. [Mobile App Build (Capacitor)](#mobile-app-build-capacitor)
14. [Security, Privacy, and Responsible AI Notes](#security-privacy-and-responsible-ai-notes)
15. [Troubleshooting](#troubleshooting)
16. [Contributor Checklist](#contributor-checklist)
17. [Roadmap](#roadmap)

---

## Product Overview
Mirror helps users:
- Catalog wardrobe items.
- Generate complete outfits constrained to owned items.
- Receive constructive, confidence-centered outfit critique.
- Save and revisit looks locally.
- Use core non-AI workflows offline via PWA caching.

Design intent:
- Inclusive and non-shaming tone.
- Actionable recommendations over vague advice.
- Fast local UX, optional AI enhancement.

---

## Feature Inventory

### Wardrobe Management
- Category-driven item organization (tops, bottoms, shoes, outerwear, accessories, etc.).
- Client-side image handling/compression before persistence and API use.
- Local-first storage for wardrobe and saved outfits.

### Outfit Generation
- Endpoint: `POST /api/generate-outfit`.
- Input: owned items + context (occasion, mood, dress code, profile, weather, style memory).
- Output contract: exactly 3 complete outfit options in strict JSON format.

### Outfit Critique
- Endpoint: `POST /api/critique-outfit`.
- Input: selected outfit + optional alternate pieces.
- Output: strengths, weak points, and practical swap recommendations.

### Additional AI Utilities (present in repo)
- `POST /api/style-report`
- `POST /api/smart-pack`
- `POST /api/detect-items`

### PWA / Installability
- Web App Manifest + Service Worker enabled.
- Installable on supported mobile/desktop browsers.
- Offline access for static pages and locally stored data.

### Multi-Surface Delivery
- Primary surface: web deployment on Cloudflare Pages.
- Mobile packaging: Capacitor wrapper for Android/iOS.

---

## System Architecture

### Frontend
- Multi-page static app under `public/`.
- Shared behavior in `public/js/app.js`.
- Shared visual system in `public/css/mirror.css`.

### Backend (Serverless)
- Cloudflare Pages Functions in `functions/api/`.
- Routes are JavaScript modules exporting `onRequestPost` handlers.

### Persistence
- IndexedDB: structured local records (wardrobe, outfits, preferences).
- localStorage: lightweight settings/profile flags.

### AI Integration
- OpenAI Chat Completions endpoint via HTTPS.
- Server-side API key usage only (key never shipped to client bundle).

---

## Repository Layout

```text
/
├─ public/
│  ├─ index.html
│  ├─ onboarding.html
│  ├─ wardrobe.html
│  ├─ generate.html
│  ├─ builder.html
│  ├─ board.html
│  ├─ saved.html
│  ├─ calendar.html
│  ├─ community.html
│  ├─ challenges.html
│  ├─ ootd.html
│  ├─ packing.html
│  ├─ tryon.html
│  ├─ sw.js
│  ├─ manifest.json
│  ├─ css/
│  │  └─ mirror.css
│  ├─ js/
│  │  └─ app.js
│  └─ icons/
│     └─ README.md
├─ functions/
│  └─ api/
│     ├─ generate-outfit.js
│     ├─ critique-outfit.js
│     ├─ style-report.js
│     ├─ smart-pack.js
│     └─ detect-items.js
├─ capacitor.config.ts
├─ package.json
└─ README.md
```

---

## Runtime Requirements
- Node.js 18+
- npm 9+
- Cloudflare account + Pages project (for hosted runtime)
- OpenAI API key
- For native mobile builds:
  - Android Studio (Android)
  - Xcode on macOS (iOS)

---

## Environment Variables & Secrets

### Required
- `OPENAI_API_KEY`

Set in Cloudflare Pages project secrets for production/staging.
For local Pages Functions development, expose it in your local shell environment before running dev.

### Important Notes
- Do **not** embed API keys in client-side JavaScript or HTML.
- Missing key should fail fast with explicit 5xx error from function routes.

---

## Local Development Workflow

### 1) Install dependencies
```bash
npm install
```

### 2) Start local app + functions
```bash
npm run dev
```

This runs `wrangler pages dev public` and serves:
- Static pages from `public/`
- Functions from `functions/`

### 3) Validate main user flows
- Add wardrobe items.
- Generate outfits.
- Critique assembled look.
- Save/reopen outfits.

---

## Deployment Workflow (Cloudflare Pages)

1. Connect repo to Cloudflare Pages.
2. Configure build command (static app: no bundling required).
3. Set output directory to `public`.
4. Ensure Functions directory is detected (`functions/`).
5. Add `OPENAI_API_KEY` secret in Pages settings.
6. Deploy and verify API endpoints + client routes.

---

## API Reference

### `POST /api/generate-outfit`
**Purpose:** Return exactly 3 outfit options using only provided wardrobe items.

**Request body (example):**
```json
{
  "items": [{ "category": "tops", "name": "Black Tee", "notes": "fitted", "image": "data:image/jpeg;base64,..." }],
  "occasion": "Date Night",
  "mood": "Confident",
  "dressCode": "smart_casual",
  "profile": { "vibe": "edgy", "expression": "bold", "adventure": "high" },
  "weather": { "temp": 68, "desc": "Partly cloudy", "season": "Spring" },
  "styleLearning": "Prefer monochrome with one accent"
}
```

**Response shape (high-level):**
- `outfits`: array of 3 objects.
- Each outfit includes item selections and styling rationale.

### `POST /api/critique-outfit`
**Purpose:** Evaluate selected outfit and suggest improvements/swaps.

### `POST /api/style-report`
**Purpose:** Generate broader style synthesis/trends from user wardrobe context.

### `POST /api/smart-pack`
**Purpose:** Suggest packing lists based on trip and style constraints.

### `POST /api/detect-items`
**Purpose:** Detect/label clothing information from provided imagery.

> Exact request/response details should be kept in sync with each function implementation.

---

## Frontend Pages & Navigation Map
- `index.html`: Landing / entry.
- `onboarding.html`: Initial profile/preferences.
- `wardrobe.html`: Item management.
- `generate.html`: Outfit generation workflow.
- `builder.html`: Manual outfit assembly.
- `board.html`: Mood/style board surface.
- `saved.html`: Persisted looks.
- `calendar.html`: Outfit planning timeline.
- Additional pages (`community`, `challenges`, `packing`, `tryon`, etc.) support extended UX surfaces.

---

## Client Data Model (IndexedDB/localStorage)

Typical local entities:
- Wardrobe items (`id`, `category`, `name`, `notes`, `image`, metadata).
- Saved outfits (selected item IDs + generated rationale).
- User style preferences/profile snapshot.

Storage principles:
- Treat local state as source of truth for personal closet data.
- Keep AI output derivable/reproducible from stored inputs where possible.

---

## PWA Behavior (Offline/Installability)
- `manifest.json` defines install metadata/icons.
- `sw.js` handles static asset caching and offline navigation support.
- AI endpoints require network connectivity and valid server-side key.

Recommended verification:
- Install prompt appears on supported browsers.
- Reload works offline for cached routes.
- Local wardrobe remains available offline.

---

## Mobile App Build (Capacitor)

### Current Setup
- Capacitor dependencies are present in `package.json`.
- Capacitor config is in `capacitor.config.ts`.
- Script helpers:
  - `npm run mobile:sync`
  - `npm run mobile:android`
  - `npm run mobile:ios`

### Build Steps
1. Ensure toolchains are installed (Android Studio / Xcode).
2. Ensure TypeScript is available for `.ts` Capacitor config parsing.
3. Run:
   ```bash
   npm run mobile:sync
   npx cap add android
   npx cap add ios
   ```
4. Open native projects:
   ```bash
   npm run mobile:android
   npm run mobile:ios
   ```

### Notes
- Native platform directories (`android/`, `ios/`) are generated and should usually be committed when collaborating on native code.
- Any web updates should be followed by `npm run mobile:sync`.

---

## Security, Privacy, and Responsible AI Notes
- Never expose `OPENAI_API_KEY` client-side.
- Minimize sensitive data sent to model endpoints.
- Use tone and prompt constraints to avoid body-shaming or harmful language.
- Validate and sanitize all JSON request bodies before model calls.

---

## Troubleshooting

### `OPENAI_API_KEY not configured`
- Add secret to Cloudflare Pages project (or local shell env for dev).

### Capacitor sync fails on `.ts` config
- Install TypeScript as a dev dependency or convert config to supported non-TS format.

### API endpoint 4xx/5xx
- Check function logs in Wrangler/Cloudflare dashboard.
- Verify request JSON schema and required fields.

### Offline behavior inconsistent
- Clear service worker + cache storage, then reload and re-install.

---

## Contributor Checklist
- [ ] Keep prompts/output contracts backward compatible where possible.
- [ ] Update README API docs when endpoint behavior changes.
- [ ] Validate mobile sync after frontend structure changes.
- [ ] Test at least one offline scenario before release.
- [ ] Confirm inclusive language in UX and AI responses.

---

## Roadmap
- Shared cloud sync for wardrobe across devices.
- Auth + user profiles.
- Stronger image understanding + auto-tagging.
- Outfit confidence scoring with explainability.
- Analytics on wear frequency and underused items.
- Optional calendar integrations.
