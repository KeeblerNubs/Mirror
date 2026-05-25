# Mirror — Confidence-First AI Wardrobe Assistant

Mirror is a wardrobe planner + outfit intelligence app built as a static-first Progressive Web App (PWA) on Cloudflare Pages, with serverless API routes for AI-powered styling and critique.

It is designed around inclusive, body-safe feedback and practical outfit generation from the clothes a person already owns.

---

## Table of Contents
1. [What Mirror Does](#what-mirror-does)
2. [Core Features](#core-features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [How Data Flows](#how-data-flows)
7. [Local Development](#local-development)
8. [Configuration & Secrets](#configuration--secrets)
9. [API Endpoints](#api-endpoints)
10. [PWA Behavior](#pwa-behavior)
11. [Mobile Packaging (Capacitor)](#mobile-packaging-capacitor)
12. [Data Model (Client-Side)](#data-model-client-side)
13. [Operational Notes](#operational-notes)
14. [Troubleshooting](#troubleshooting)
15. [Roadmap Ideas](#roadmap-ideas)

---

## What Mirror Does
Mirror helps a user:
- Build and maintain a personal wardrobe catalog.
- Generate occasion/mood/dress-code-aware outfit suggestions.
- Get AI critique on a selected outfit with swap suggestions.
- Save outfits and manage outfit history locally.
- Use the app offline for non-AI flows via PWA caching.

The product voice prioritizes confidence, specificity, inclusivity, and non-judgment.

---

## Core Features

### 1) Wardrobe Management
- Category-based wardrobe items (tops, bottoms, shoes, outerwear, accessories, bags, jewelry, hats).
- Image upload + client-side compression before storage/use.
- Persistent local item storage via IndexedDB.

### 2) Outfit Generation
- `/api/generate-outfit` takes wardrobe items + context (occasion, mood, optional dress code/profile/weather/style memory).
- Uses OpenAI Chat Completions (`gpt-4o`) with a JSON response contract.
- Returns exactly 3 complete outfit candidates using only provided items.

### 3) Outfit Critique
- `/api/critique-outfit` accepts a user-selected outfit and optional alternative pieces.
- AI returns strengths, weaknesses, and actionable replacement suggestions.

### 4) PWA + Offline
- Installable web app with manifest/service worker.
- Core interface and local data remain usable without internet.
- AI routes require connectivity + valid API key.

### 5) Multi-Surface Delivery
- Web-first deployment on Cloudflare Pages.
- Same web code wrapped with Capacitor for Android/iOS distribution.

---

## Architecture

### Frontend
- Static HTML pages under `public/`.
- Shared application logic in `public/js/app.js`.
- Styling in `public/css/mirror.css`.

### Backend (Serverless)
- Cloudflare Pages Functions in `functions/api/`.
- Two POST endpoints:
  - `generate-outfit`
  - `critique-outfit`

### Persistence
- Client-side IndexedDB for wardrobe/outfit data.
- Local profile storage via `localStorage`.

### AI Integration
- Calls OpenAI REST endpoint: `https://api.openai.com/v1/chat/completions`.
- Uses strict JSON-shaped prompts and `response_format: { type: "json_object" }`.

---

## Tech Stack
- **Platform/Hosting:** Cloudflare Pages + Functions
- **Frontend:** Vanilla HTML/CSS/JS
- **Local Storage:** IndexedDB + localStorage
- **AI:** OpenAI Chat Completions (`gpt-4o`)
- **PWA:** Web App Manifest + Service Worker
- **Mobile Wrapper:** Capacitor 7 (Android + iOS)
- **Dev Tooling:** Wrangler 4

---

## Project Structure

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
│     └─ critique-outfit.js
├─ capacitor.config.ts
├─ package.json
└─ README.md
```

---

## How Data Flows

### Generate Flow
1. User selects wardrobe items + context.
2. Frontend posts JSON payload to `/api/generate-outfit`.
3. Function composes system + user prompt and appends image inputs.
4. OpenAI returns JSON payload with 3 outfit objects.
5. Frontend renders outfits; user can save selections locally.

### Critique Flow
1. User assembles outfit in builder.
2. Frontend posts selected items (+ optional alternates) to `/api/critique-outfit`.
3. Function prompts AI for positive feedback, constructive critique, and swaps.
4. Frontend displays critique response.

---

## Local Development

### Prerequisites
- Node.js 18+ (recommended)
- npm
- Cloudflare Wrangler (installed via project dev dependencies)

### Install
```bash
npm install
```

### Run dev server
```bash
npm run dev
```

This starts local Pages dev from `public/` with Functions support.

---

## Configuration & Secrets

### Required secret for AI endpoints
Set this in Cloudflare Pages project secrets:
- `OPENAI_API_KEY`

If missing, API routes return an error:
- `OPENAI_API_KEY not configured. Set it as a Cloudflare Pages secret.`

### Environment expectations
- AI endpoints require internet egress from Functions runtime.
- Image payload size should be managed on client (compression is implemented in app logic).

---

## API Endpoints

## `POST /api/generate-outfit`

### Purpose
Generate exactly 3 full outfit suggestions from provided wardrobe items.

### Request body
```json
{
  "items": [
    {
      "category": "tops",
      "name": "Black Ribbed Tee",
      "notes": "Slim fit",
      "image": "data:image/jpeg;base64,..."
    }
  ],
  "occasion": "Date Night",
  "mood": "Confident",
  "dressCode": "smart_casual",
  "profile": {
    "vibe": "edgy",
    "expression": "bold",
    "adventure": "high"
  },
  "weather": {
    "temp": 68,
    "desc": "Partly cloudy",
    "season": "Spring"
  },
  "styleLearning": "Optional style memory/instructions"
}
```

### Required fields
- `items`
- `occasion`
- `mood`

### Response shape
```json
{
  "outfits": [
    {
      "name": "Look name",
      "itemIndices": [1, 3, 5],
      "reasoning": "Why this works"
    }
  ]
}
```

### Error behaviors
- `400`: invalid JSON body
- `400`: missing required fields
- `500`: missing API key or internal call failure
- `502`: upstream OpenAI failure or empty model output

---

## `POST /api/critique-outfit`

### Purpose
Critique a chosen outfit and recommend improvements.

### Request body
```json
{
  "selectedItems": [
    {
      "category": "tops",
      "name": "White Shirt",
      "notes": "Oversized",
      "image": "data:image/jpeg;base64,..."
    }
  ],
  "otherItems": [
    {
      "category": "outerwear",
      "name": "Navy Blazer",
      "image": "data:image/jpeg;base64,..."
    }
  ],
  "profile": {
    "vibe": "classic",
    "expression": "clean",
    "adventure": "medium"
  }
}
```

### Required fields
- `selectedItems` (minimum length: 2)

### Response shape
```json
{
  "positives": "What works",
  "negatives": "What needs improvement",
  "suggestions": "Specific swap suggestions"
}
```

### Error behaviors
- `400`: invalid JSON body
- `400`: fewer than 2 selected items
- `500`: missing API key or internal call failure
- `502`: upstream OpenAI failure or empty model output

---

## PWA Behavior
- `public/manifest.json` enables installability.
- `public/sw.js` handles offline caching strategy.
- Inline SVG icon constants in app logic support resilient UI rendering.

Offline behavior scope:
- ✅ Works: local pages, local wardrobe/outfit storage, navigation.
- ❌ Requires network: AI generation and critique.

---

## Mobile Packaging (Capacitor)

### Sync web assets/native projects
```bash
npm run mobile:sync
```

### Open Android Studio project
```bash
npm run mobile:android
```

### Open Xcode project
```bash
npm run mobile:ios
```

### Notes
- Ensure `public/icons/` contains required icon assets before native distribution.
- Capacitor packages are pinned in dependencies/devDependencies (major v7).

---

## Data Model (Client-Side)

### IndexedDB
Database name: `mirror-wardrobe`

Object stores:
1. `items` (keyPath: `id`)
   - index: `category`
2. `outfits` (keyPath: `id`)
   - index: `savedAt`

### localStorage
- Key: `mirror-profile`
- Stores user profile/theme context.

---

## Operational Notes
- AI prompts enforce color-theory-aware reasoning and inclusive language guardrails.
- API handlers enforce JSON-only responses from model output.
- Client image utilities include compression and base64 conversion helpers to reduce payload cost and improve responsiveness.

---

## Troubleshooting

### `OPENAI_API_KEY not configured`
Set Pages secret `OPENAI_API_KEY` and redeploy/restart local emulation.

### `OpenAI API error` (502)
- Validate key format and project billing/quota.
- Verify model availability for your account.
- Inspect function logs for upstream response body.

### AI response parsing issues
- Ensure prompts still enforce JSON output.
- Keep `response_format: { type: "json_object" }` in place.

### Mobile sync issues
- Run `npm install` first.
- Re-run `npm run mobile:sync` after changing web assets/plugins.

---

## Roadmap Ideas
- Account sync and cross-device cloud backup.
- Calendar/event-aware planning automation.
- “Worn recently” fatigue detection with smarter rotation.
- Per-item seasonality and climate scoring.
- More explicit accessibility settings and contrast-aware styling support.

---

Built for confident self-expression, practical styling outcomes, and zero body-shaming.
