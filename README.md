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
8. [Platform Setup Guides](#platform-setup-guides)
9. [Deployment Workflow (Cloudflare Pages)](#deployment-workflow-cloudflare-pages)
10. [API Reference](#api-reference)
11. [Frontend Pages & Navigation Map](#frontend-pages--navigation-map)
12. [Client Data Model (IndexedDB/localStorage)](#client-data-model-indexeddblocalstorage)
13. [PWA Behavior (Offline/Installability)](#pwa-behavior-offlineinstallability)
14. [Mobile App Build (Capacitor)](#mobile-app-build-capacitor)
15. [Security, Privacy, and Responsible AI Notes](#security-privacy-and-responsible-ai-notes)
16. [Troubleshooting](#troubleshooting)
17. [Contributor Checklist](#contributor-checklist)
18. [Roadmap](#roadmap)

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
├─ scripts/
│  └─ serve_static.py
├─ Dockerfile
├─ compose.yaml
├─ capacitor.config.ts
├─ package.json
└─ README.md
```

---

## Runtime Requirements
- Node.js 18+
- npm 9+
- Git 2.40+
- Cloudflare account + Pages project (for hosted runtime)
- OpenAI API key
- For native mobile builds:
  - Android Studio (Android)
  - Xcode on macOS (iOS)
- Optional local runtime choices:
  - Docker Desktop 4+ / Docker Engine 24+
  - Python 3.10+ for static-only preview

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

## Platform Setup Guides

Use the path that matches the machine you are setting up. The **full local runtime** is `npm run dev` or Docker, because those run Cloudflare Pages Functions from `functions/api/`. The Python script is intentionally **static-only** and is useful for quick UI/PWA checks when you do not need AI endpoints.

### Windows 11 PC — Native Node + Wrangler

#### 1) Install required tools
1. Install **Git for Windows** from <https://git-scm.com/download/win>.
2. Install **Node.js 20 LTS or newer** from <https://nodejs.org/>. Keep the installer option that adds Node and npm to `PATH`.
3. Install **Visual Studio Code** or another editor if desired.
4. Open **PowerShell** as your normal user and verify:
   ```powershell
   git --version
   node --version
   npm --version
   ```

#### 2) Clone and install
```powershell
git clone <YOUR_REPO_URL> Mirror
cd Mirror
npm install
```

If you already have the repository, open PowerShell in the repo root instead:
```powershell
cd C:\path\to\Mirror
npm install
```

#### 3) Configure the OpenAI key for local functions
For the current PowerShell window only:
```powershell
$env:OPENAI_API_KEY="sk-your-key-here"
```

For a persistent user-level variable:
```powershell
setx OPENAI_API_KEY "sk-your-key-here"
```
Close and reopen PowerShell after `setx`, because existing shells do not automatically reload new environment variables.

#### 4) Run the full app locally
```powershell
npm run dev
```
Open the local URL Wrangler prints, usually `http://localhost:8788/`. Validate the basics:
- Landing page loads.
- Wardrobe entries can be added.
- `/api/generate-outfit` and other AI routes work when `OPENAI_API_KEY` is set.

### Windows 11 PC — Docker Desktop

Docker is the cleanest option when you want the same Node/Wrangler runtime without installing project dependencies directly on Windows.

#### 1) Install Docker Desktop
1. Install **Docker Desktop for Windows** from <https://www.docker.com/products/docker-desktop/>.
2. During installation, enable the **WSL 2 backend** if prompted.
3. Reboot if Docker asks.
4. Open PowerShell and verify:
   ```powershell
   docker --version
   docker compose version
   ```

#### 2) Add local environment configuration
Create a `.env` file in the repo root. Do not commit this file.
```powershell
cd C:\path\to\Mirror
notepad .env
```
Add:
```text
OPENAI_API_KEY=sk-your-key-here
```

#### 3) Build and run with Compose
```powershell
docker compose up --build
```
Open `http://localhost:8788/`.

Useful Docker commands:
```powershell
# Stop the container
Ctrl+C

# Stop and remove the container network
docker compose down

# Rebuild after dependency or Dockerfile changes
docker compose build --no-cache

# View logs without attaching interactively
docker compose logs -f mirror
```

#### 4) Run without Compose, if preferred
```powershell
docker build -t mirror-app .
docker run --rm -p 8788:8788 -e OPENAI_API_KEY="sk-your-key-here" mirror-app
```

### Python One-Script Static Preview

Use this when you only need to review static pages, CSS, service worker behavior, or installability. This does **not** execute Cloudflare Pages Functions, so AI endpoints under `/api/*` will not work.

#### Windows 11 / Windows Server
```powershell
py -3 scripts\serve_static.py --host 127.0.0.1 --port 8000
```
Open `http://127.0.0.1:8000/`.

To allow another device on the same network to open the preview:
```powershell
py -3 scripts\serve_static.py --host 0.0.0.0 --port 8000
```
Then open `http://<WINDOWS_MACHINE_IP>:8000/` from the other device. If Windows Defender Firewall prompts, allow private-network access only unless you intentionally need broader access.

#### Linux / Ubuntu
```bash
python3 scripts/serve_static.py --host 127.0.0.1 --port 8000
```
Open `http://127.0.0.1:8000/`.

For LAN access:
```bash
python3 scripts/serve_static.py --host 0.0.0.0 --port 8000
```

### Windows Server Setup

Windows Server can run Mirror either as a full local Node/Wrangler process, a Docker container, or a static-only Python preview.

#### Option A — Full runtime with Node
1. Install Git and Node.js 20 LTS or newer.
2. Clone the repo:
   ```powershell
   git clone <YOUR_REPO_URL> C:\Apps\Mirror
   cd C:\Apps\Mirror
   npm install
   ```
3. Set the machine-level secret from an elevated PowerShell prompt:
   ```powershell
   [Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "sk-your-key-here", "Machine")
   ```
4. Open a new PowerShell window so the variable is loaded, then run:
   ```powershell
   cd C:\Apps\Mirror
   npm run dev
   ```
5. For a persistent background process, use a Windows service wrapper such as NSSM or a process manager such as PM2. The service command should run from `C:\Apps\Mirror` and execute:
   ```powershell
   npm run dev
   ```
6. If the server must be reachable from another host, open the chosen port in Windows Defender Firewall and put a real reverse proxy/TLS terminator in front of it for production traffic.

#### Option B — Docker on Windows Server
1. Install Docker Engine or Docker Desktop according to your Windows Server edition and organization policy.
2. Clone the repo into `C:\Apps\Mirror`.
3. Create `C:\Apps\Mirror\.env` with `OPENAI_API_KEY=sk-your-key-here`.
4. Run:
   ```powershell
   cd C:\Apps\Mirror
   docker compose up -d --build
   docker compose logs -f mirror
   ```
5. Open `http://SERVER_NAME_OR_IP:8788/` after allowing inbound TCP 8788 or after routing through your reverse proxy.

### Linux / Ubuntu Setup

#### 1) Install system packages
Ubuntu 22.04/24.04 example:
```bash
sudo apt update
sudo apt install -y git curl ca-certificates python3
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

#### 2) Clone and install
```bash
git clone <YOUR_REPO_URL> ~/Mirror
cd ~/Mirror
npm install
```

#### 3) Configure the OpenAI key
For the current shell:
```bash
export OPENAI_API_KEY="sk-your-key-here"
```

For repeated local use, add it to your shell profile or create a systemd environment file with locked-down permissions:
```bash
sudo install -m 600 /dev/null /etc/mirror.env
echo 'OPENAI_API_KEY=sk-your-key-here' | sudo tee /etc/mirror.env >/dev/null
```

#### 4) Run directly
```bash
npm run dev
```
Open `http://localhost:8788/` on the machine, or use SSH port forwarding from your workstation:
```bash
ssh -L 8788:127.0.0.1:8788 user@server
```
Then open `http://localhost:8788/` on your workstation.

#### 5) Run as a systemd service
Create `/etc/systemd/system/mirror.service`:
```ini
[Unit]
Description=Mirror Cloudflare Pages local runtime
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/home/YOUR_USER/Mirror
EnvironmentFile=/etc/mirror.env
ExecStart=/usr/bin/npx wrangler pages dev public --ip 0.0.0.0 --port 8788
Restart=on-failure
RestartSec=5
User=YOUR_USER

[Install]
WantedBy=multi-user.target
```
Enable and start it:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mirror
sudo systemctl status mirror
journalctl -u mirror -f
```

#### 6) Docker on Linux / Ubuntu
Install Docker Engine, then:
```bash
cd ~/Mirror
printf 'OPENAI_API_KEY=%s\n' 'sk-your-key-here' > .env
docker compose up -d --build
docker compose logs -f mirror
```
Open `http://SERVER_IP:8788/`, or place Nginx/Caddy/Traefik in front for TLS and a public hostname.

### Production Notes for Self-Hosted Servers

Cloudflare Pages is still the preferred production deployment target for this repo. If you self-host:
- Terminate HTTPS with a reverse proxy such as Caddy, Nginx, IIS ARR, or a managed load balancer.
- Keep `OPENAI_API_KEY` only in server/container environment variables.
- Do not expose development logs that may include request payloads.
- Restrict inbound ports to only HTTP/HTTPS or the specific internal preview port you need.
- Treat the Python script as a preview server, not a production app server.


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
