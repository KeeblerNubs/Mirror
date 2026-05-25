/* ================================================================
   Mirror — app.js
   Core application logic: theme system, profile, wardrobe (IndexedDB),
   outfit generation with weather/dress code, outfit builder + AI
   critique, availability tracking, navigation, routing.
   ================================================================ */

// ── Constants ──────────────────────────────────────────────────────
const STORAGE_KEY = 'mirror-profile';
const DB_NAME = 'mirror-wardrobe';
const DB_VERSION = 2;
const ITEMS_STORE = 'items';

const CATEGORIES = [
    { id: 'tops', label: 'Tops', emoji: '👕' },
    { id: 'bottoms', label: 'Bottoms', emoji: '👖' },
    { id: 'shoes', label: 'Shoes', emoji: '👟' },
    { id: 'outerwear', label: 'Outerwear', emoji: '🧥' },
    { id: 'accessories', label: 'Accessories', emoji: '💍' },
    { id: 'bags', label: 'Bags', emoji: '👜' },
    { id: 'jewelry', label: 'Jewelry', emoji: '💎' },
    { id: 'hats', label: 'Hats', emoji: '🎩' },
];

const OCCASIONS = [
    'Work', 'School', 'Date Night', 'Birthday Party', 'Wedding',
    'Casual Hangout', 'Gym / Active', 'Beach / Pool', 'Concert / Festival',
    'Brunch', 'Interview', 'Night Out', 'Travel', 'Holiday Party',
];

const MOODS = [
    'Confident', 'Sexy', 'Whimsical', 'Professional', 'Edgy',
    'Cozy', 'Romantic', 'Bold', 'Mysterious', 'Playful',
    'Elegant', 'Chill', 'Powerful', 'Creative',
];

const DRESS_CODES = [
    { id: 'casual', label: 'Casual', desc: 'Anything goes' },
    { id: 'smart_casual', label: 'Smart Casual', desc: 'Polished but relaxed' },
    { id: 'business_casual', label: 'Business Casual', desc: 'Office-appropriate' },
    { id: 'formal', label: 'Formal', desc: 'Suits, gowns, dress shoes' },
    { id: 'creative', label: 'Creative', desc: 'Express yourself freely' },
    { id: 'streetwear', label: 'Streetwear', desc: 'Urban, hype, sneakers' },
    { id: 'athletic', label: 'Athletic', desc: 'Performance & comfort' },
];

const WEATHER_CODES = {
    0: { desc: 'Clear sky', icon: '☀️' },
    1: { desc: 'Mostly clear', icon: '🌤️' },
    2: { desc: 'Partly cloudy', icon: '⛅' },
    3: { desc: 'Overcast', icon: '☁️' },
    45: { desc: 'Foggy', icon: '🌫️' },
    48: { desc: 'Icy fog', icon: '🌫️' },
    51: { desc: 'Light drizzle', icon: '🌦️' },
    53: { desc: 'Drizzle', icon: '🌧️' },
    55: { desc: 'Heavy drizzle', icon: '🌧️' },
    61: { desc: 'Light rain', icon: '🌦️' },
    63: { desc: 'Rain', icon: '🌧️' },
    65: { desc: 'Heavy rain', icon: '🌧️' },
    71: { desc: 'Light snow', icon: '🌨️' },
    73: { desc: 'Snow', icon: '❄️' },
    75: { desc: 'Heavy snow', icon: '❄️' },
    80: { desc: 'Rain showers', icon: '🌦️' },
    81: { desc: 'Heavy showers', icon: '🌧️' },
    95: { desc: 'Thunderstorm', icon: '⛈️' },
};

// ── SVG Icons (inline for offline PWA) ────────────────────────────
const ICONS = {
    wardrobe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="9" rx="1"/><rect x="3" y="15" width="7" height="6" rx="1"/><rect x="14" y="15" width="7" height="6" rx="1"/></svg>',
    generate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
    builder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>',
};

// ── Theme System ──────────────────────────────────────────────────
function applyTheme(vibe) {
    const theme = vibe || 'dark';
    document.body.setAttribute('data-theme', theme);
}

function getThemeFromProfile() {
    const profile = getProfile();
    return profile ? profile.vibe : null;
}

// ── Profile Storage ───────────────────────────────────────────────
function getProfile() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch { return null; }
}
function saveProfile(p) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
function clearProfile() { localStorage.removeItem(STORAGE_KEY); }

// ── IndexedDB (Wardrobe) ──────────────────────────────────────────
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(ITEMS_STORE)) {
                const store = db.createObjectStore(ITEMS_STORE, { keyPath: 'id' });
                store.createIndex('category', 'category', { unique: false });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbGetAllItems() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ITEMS_STORE, 'readonly');
        const store = tx.objectStore(ITEMS_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbAddItem(item) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ITEMS_STORE, 'readwrite');
        const store = tx.objectStore(ITEMS_STORE);
        const req = store.put(item);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbDeleteItem(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ITEMS_STORE, 'readwrite');
        const store = tx.objectStore(ITEMS_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function dbGetItem(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ITEMS_STORE, 'readonly');
        const store = tx.objectStore(ITEMS_STORE);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbUpdateItem(item) {
    return dbAddItem(item);
}

// ── Image Utilities ───────────────────────────────────────────────
function compressImage(file, maxDim, quality) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > maxDim || h > maxDim) {
                    const ratio = Math.min(maxDim / w, maxDim / h);
                    w = Math.round(w * ratio);
                    h = Math.round(h * ratio);
                }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

function blobToObjectURL(blob) {
    return URL.createObjectURL(blob);
}

// ── Weather ───────────────────────────────────────────────────────
let cachedWeather = null;

function getSeason(lat) {
    const month = new Date().getMonth();
    const isNorthern = lat >= 0;
    if (month >= 2 && month <= 4) return isNorthern ? 'Spring' : 'Fall';
    if (month >= 5 && month <= 7) return isNorthern ? 'Summer' : 'Winter';
    if (month >= 8 && month <= 10) return isNorthern ? 'Fall' : 'Spring';
    return isNorthern ? 'Winter' : 'Summer';
}

async function fetchWeather() {
    if (cachedWeather) return cachedWeather;

    try {
        const pos = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) { reject(new Error('No geolocation')); return; }
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
        });

        const { latitude, longitude } = pos.coords;
        const res = await fetch(
            'https://api.open-meteo.com/v1/forecast?latitude=' + latitude +
            '&longitude=' + longitude +
            '&current=temperature_2m,weather_code&temperature_unit=fahrenheit'
        );

        if (!res.ok) throw new Error('Weather API error');
        const data = await res.json();

        const code = data.current?.weather_code ?? 0;
        const info = WEATHER_CODES[code] || WEATHER_CODES[0];

        cachedWeather = {
            temp: Math.round(data.current?.temperature_2m || 70),
            code: code,
            desc: info.desc,
            icon: info.icon,
            season: getSeason(latitude),
            latitude: latitude,
            longitude: longitude,
        };

        return cachedWeather;
    } catch (err) {
        console.warn('Weather unavailable:', err.message);
        return null;
    }
}

function renderWeatherWidget(weather) {
    if (!weather) return '';
    return '<div class="weather-widget">' +
        '<span class="weather-icon">' + weather.icon + '</span>' +
        '<div class="weather-info">' +
            '<span class="weather-temp">' + weather.temp + '°F · ' + weather.season + '</span>' +
            '<span class="weather-desc">' + weather.desc + '</span>' +
        '</div>' +
    '</div>';
}

// ── Navigation ────────────────────────────────────────────────────
function renderNav(activePage) {
    const existing = document.querySelector('.bottom-nav');
    if (existing) existing.remove();

    const pages = [
        { id: 'wardrobe', label: 'Wardrobe', icon: ICONS.wardrobe, href: '/wardrobe.html' },
        { id: 'generate', label: 'Generate', icon: ICONS.generate, href: '/generate.html' },
        { id: 'builder', label: 'Build', icon: ICONS.builder, href: '/builder.html' },
        { id: 'board', label: 'Profile', icon: ICONS.profile, href: '/board.html' },
    ];

    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.innerHTML = pages.map(p =>
        '<a class="nav-item' + (activePage === p.id ? ' active' : '') + '" href="' + p.href + '">' +
        p.icon + '<span>' + p.label + '</span></a>'
    ).join('');
    document.body.appendChild(nav);
}

// ── Onboarding (Image-Based Quiz) ─────────────────────────────────
const onboardingSteps = [
    {
        title: "What's your vibe?",
        subtitle: 'Tap the one that speaks to you.',
        type: 'image', key: 'vibe',
        options: [
            { label: 'Minimal + Clean', sub: 'White space, editorial, refined', value: 'minimal', emoji: '🤍', attr: 'data-vibe="minimal"' },
            { label: 'Bold + Loud', sub: 'High contrast, vivid, statement', value: 'bold', emoji: '🔥', attr: 'data-vibe="bold"' },
            { label: 'Comfy + Casual', sub: 'Warm, earthy, effortless', value: 'comfy', emoji: '🛋️', attr: 'data-vibe="comfy"' },
            { label: 'Dark + Mysterious', sub: 'Neon glow, moody, cyberpunk', value: 'dark', emoji: '🖤', attr: 'data-vibe="dark"' },
        ],
    },
    {
        title: "What's your gender expression?",
        subtitle: 'Your look, your rules.',
        type: 'image', key: 'expression',
        options: [
            { label: 'Masculine', sub: 'Structured, sharp, tailored', value: 'masc', emoji: '👔', attr: 'data-expr="masc"' },
            { label: 'Feminine', sub: 'Soft, flowing, expressive', value: 'femme', emoji: '👗', attr: 'data-expr="femme"' },
            { label: 'Androgynous', sub: 'Blurred lines, balanced', value: 'andro', emoji: '✨', attr: 'data-expr="andro"' },
            { label: 'Fluid / No Labels', sub: 'All of it, none of it, whatever', value: 'fluid', emoji: '🌈', attr: 'data-expr="fluid"' },
        ],
    },
    {
        title: 'How adventurous is your style?',
        subtitle: 'Rate your fashion risk tolerance.',
        type: 'image', key: 'adventure',
        options: [
            { label: 'Safe & Classic', sub: 'Timeless, dependable', value: 'safe', emoji: '🤵', attr: 'data-adv="safe"' },
            { label: 'A Little Playful', sub: 'Colorful, fun touches', value: 'playful', emoji: '🎨', attr: 'data-adv="playful"' },
            { label: 'Bold Statement', sub: 'Head-turning pieces', value: 'bold_stmt', emoji: '💥', attr: 'data-adv="bold_stmt"' },
            { label: 'Full Chaos Mode', sub: 'Rules? What rules?', value: 'chaos', emoji: '🌀', attr: 'data-adv="chaos"' },
        ],
    },
    {
        title: 'Your name (or whatever you go by)',
        subtitle: "This is how we'll address you.",
        type: 'text', key: 'name',
        placeholder: 'Enter your name...',
    },
];

let currentStep = 0;
let onboardingData = {};

function renderOnboardingStep() {
    const c = document.getElementById('step-container');
    const p = document.getElementById('progress-bar');
    const s = onboardingSteps[currentStep];
    if (!c || !s) return;

    if (p) p.style.width = (((currentStep + 1) / onboardingSteps.length) * 100) + '%';

    let h = '<h2>' + s.title + '</h2><p class="subtitle">' + s.subtitle + '</p>';

    if (s.type === 'image') {
        h += '<div class="quiz-image-grid">';
        s.options.forEach(o => {
            const sel = onboardingData[s.key] === o.value;
            h += '<div class="quiz-image-card' + (sel ? ' selected' : '') + '" ' +
                o.attr + ' onclick="selectOption(\'' + s.key + '\',\'' + o.value + '\')">' +
                '<span class="quiz-card-label">' + o.emoji + ' ' + o.label + '</span>' +
                '<span class="quiz-card-sub">' + o.sub + '</span>' +
                '</div>';
        });
        h += '</div>';
    } else if (s.type === 'single') {
        h += '<div class="quiz-options">';
        s.options.forEach(o => {
            const sel = onboardingData[s.key] === o.value;
            h += '<button class="' + (sel ? 'primary-btn' : 'secondary-btn') +
                '" type="button" onclick="selectOption(\'' + s.key + '\',\'' + o.value + '\')">' +
                o.emoji + ' ' + o.label + '</button>';
        });
        h += '</div>';
    } else if (s.type === 'text') {
        const v = onboardingData[s.key] || '';
        h += '<input type="text" id="text-input" class="text-input" placeholder="' +
            (s.placeholder || '') + '" value="' + v +
            '" oninput="updateText(\'' + s.key + '\',this.value)" autocomplete="off"/>';
    }

    h += '<div class="nav-buttons">';
    if (currentStep > 0)
        h += '<button class="secondary-btn" type="button" onclick="prevStep()">← Back</button>';
    if (currentStep < onboardingSteps.length - 1)
        h += '<button class="primary-btn" type="button" onclick="nextStep()" id="next-btn">Next →</button>';
    else
        h += "<button class=\"primary-btn\" type=\"button\" onclick=\"finishOnboarding()\">✨ Let's Go!</button>";
    h += '</div>';

    c.innerHTML = h;

    // Live-preview the theme when the user picks a vibe
    if (s.key === 'vibe' && onboardingData.vibe) {
        applyTheme(onboardingData.vibe);
    }

    if (s.type === 'text') setTimeout(() => { const i = document.getElementById('text-input'); if (i) i.focus(); }, 100);
}

function selectOption(k, v) { onboardingData[k] = v; renderOnboardingStep(); }
function updateText(k, v) { onboardingData[k] = v; }

function nextStep() {
    const s = onboardingSteps[currentStep];
    if (((s.type === 'single' || s.type === 'image') && !onboardingData[s.key]) ||
        (s.type === 'text' && (!onboardingData[s.key] || !onboardingData[s.key].trim()))) {
        const btn = document.getElementById('next-btn');
        if (btn) {
            btn.style.animation = 'shake 0.3s ease';
            btn.textContent = 'Pick something first!';
            setTimeout(() => { btn.style.animation = ''; btn.textContent = 'Next →'; }, 1200);
        }
        return;
    }
    if (currentStep < onboardingSteps.length - 1) { currentStep++; renderOnboardingStep(); }
}

function prevStep() { if (currentStep > 0) { currentStep--; renderOnboardingStep(); } }

function finishOnboarding() {
    for (let i = 0; i < onboardingSteps.length; i++) {
        const s = onboardingSteps[i];
        if (((s.type === 'single' || s.type === 'image') && !onboardingData[s.key]) ||
            (s.type === 'text' && (!onboardingData[s.key] || !onboardingData[s.key].trim()))) {
            currentStep = i;
            renderOnboardingStep();
            return;
        }
    }
    onboardingData.completedAt = new Date().toISOString();
    saveProfile(onboardingData);
    applyTheme(onboardingData.vibe);
    window.location.href = '/wardrobe.html';
}

function startOnboarding() {
    getProfile() ? window.location.href = '/wardrobe.html' : window.location.href = '/onboarding.html';
}

// ── Board / Profile ───────────────────────────────────────────────
async function renderBoard() {
    const p = getProfile();
    if (!p) { window.location.href = '/onboarding.html'; return; }

    const c = document.getElementById('board-content') || document.getElementById('page-content');
    if (!c) return;

    const items = await dbGetAllItems();
    const counts = {};
    CATEGORIES.forEach(cat => counts[cat.id] = 0);
    items.forEach(item => { if (counts[item.category] !== undefined) counts[item.category]++; });
    const totalItems = items.length;
    const availableItems = items.filter(i => i.available !== false).length;

    const findLabel = (key, val) => {
        const step = onboardingSteps.find(s => s.key === key);
        if (!step || !step.options) return val;
        const opt = step.options.find(o => o.value === val);
        return opt ? opt.label : val;
    };

    c.innerHTML =
        '<div class="board-header">' +
            '<h1 class="logo" style="font-size:clamp(2rem,8vw,3rem);">MIRROR</h1>' +
            '<p class="tagline" style="font-size:1rem;">Hey ' + (p.name || 'gorgeous') + ' ✨</p>' +
        '</div>' +

        '<div class="profile-card">' +
            '<div class="profile-row"><span>Vibe</span><span>' + findLabel('vibe', p.vibe) + '</span></div>' +
            '<div class="profile-row"><span>Expression</span><span>' + findLabel('expression', p.expression) + '</span></div>' +
            '<div class="profile-row"><span>Adventure</span><span>' + findLabel('adventure', p.adventure) + '</span></div>' +
            '<div class="profile-row"><span>Theme</span><span>' + (p.vibe || 'dark') + '</span></div>' +
        '</div>' +

        '<div class="card">' +
            '<h3 style="margin:0 0 0.75rem;">Your Wardrobe</h3>' +
            '<div class="wardrobe-stats">' +
                '<div class="stat-card"><div class="stat-num">' + totalItems + '</div><div class="stat-label">Total</div></div>' +
                '<div class="stat-card"><div class="stat-num">' + availableItems + '</div><div class="stat-label">Ready</div></div>' +
                '<div class="stat-card"><div class="stat-num">' + (counts.tops || 0) + '</div><div class="stat-label">Tops</div></div>' +
                '<div class="stat-card"><div class="stat-num">' + (counts.bottoms || 0) + '</div><div class="stat-label">Bottoms</div></div>' +
            '</div>' +
            (totalItems === 0
                ? '<p style="text-align:center;opacity:0.6;margin:1rem 0 0;">Start by adding items to your wardrobe.</p>'
                : '') +
        '</div>' +

        '<div class="board-actions">' +
            '<button class="primary-btn" onclick="window.location.href=\'/wardrobe.html\'">📸 Manage Wardrobe</button>' +
            '<button class="secondary-btn" onclick="resetProfile()">🔄 Start Over</button>' +
        '</div>';

    renderNav('board');
}

function resetProfile() {
    if (confirm('Reset your profile and start over?')) {
        clearProfile();
        window.location.href = '/';
    }
}

// ── Wardrobe Page ─────────────────────────────────────────────────
let wardrobeFilter = 'all';

async function renderWardrobe() {
    const p = getProfile();
    if (!p) { window.location.href = '/onboarding.html'; return; }

    const c = document.getElementById('page-content');
    if (!c) return;

    const items = await dbGetAllItems();
    const filtered = wardrobeFilter === 'all' ? items : items.filter(i => i.category === wardrobeFilter);
    const available = items.filter(i => i.available !== false).length;

    let html =
        '<div class="page-header">' +
            '<h1>Your Wardrobe</h1>' +
            '<p>' + items.length + ' item' + (items.length !== 1 ? 's' : '') +
            ' · ' + available + ' ready to wear</p>' +
        '</div>';

    // category tabs
    html += '<div class="category-tabs">';
    html += '<button class="category-tab' + (wardrobeFilter === 'all' ? ' active' : '') +
        '" onclick="setWardrobeFilter(\'all\')">All</button>';
    CATEGORIES.forEach(cat => {
        const count = items.filter(i => i.category === cat.id).length;
        html += '<button class="category-tab' + (wardrobeFilter === cat.id ? ' active' : '') +
            '" onclick="setWardrobeFilter(\'' + cat.id + '\')">' + cat.emoji + ' ' + cat.label +
            (count > 0 ? ' (' + count + ')' : '') + '</button>';
    });
    html += '</div>';

    // grid
    html += '<div class="wardrobe-grid">';
    html += '<button class="add-item-card" onclick="openAddItemModal()">' + ICONS.plus + '<span>Add Item</span></button>';
    filtered.forEach(item => {
        const url = blobToObjectURL(item.imageBlob);
        const isUnavailable = item.available === false;
        html += '<div class="wardrobe-item' + (isUnavailable ? ' unavailable' : '') +
            '" onclick="openItemDetail(\'' + item.id + '\')">' +
            '<img src="' + url + '" alt="' + (item.name || item.category) + '" loading="lazy">' +
            '<div class="item-label">' + (item.name || CATEGORIES.find(c => c.id === item.category)?.label || item.category) + '</div>' +
            '<button class="item-delete" onclick="event.stopPropagation();deleteWardrobeItem(\'' + item.id + '\')" title="Delete">×</button>' +
            '</div>';
    });
    html += '</div>';

    if (filtered.length === 0 && items.length > 0) {
        html += '<div class="empty-state"><p>No items in this category yet.</p></div>';
    } else if (items.length === 0) {
        html += '<div class="empty-state">' +
            '<div class="empty-icon">👗</div>' +
            '<h3>Your wardrobe is empty</h3>' +
            '<p>Tap the + card above to start adding your clothes, shoes, accessories — the whole closet.</p>' +
            '</div>';
    }

    c.innerHTML = html;
    renderNav('wardrobe');
}

function setWardrobeFilter(cat) {
    wardrobeFilter = cat;
    renderWardrobe();
}

async function deleteWardrobeItem(id) {
    if (!confirm('Remove this item from your wardrobe?')) return;
    await dbDeleteItem(id);
    renderWardrobe();
}

// ── Add Item Modal ────────────────────────────────────────────────
let pendingFile = null;
let pendingPreviewUrl = null;

function openAddItemModal() {
    pendingFile = null;
    pendingPreviewUrl = null;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    overlay.innerHTML =
        '<div class="modal-sheet" onclick="event.stopPropagation()">' +
            '<h2>Add to Wardrobe</h2>' +
            '<div class="upload-area" id="upload-area" onclick="triggerFileInput()">' +
                ICONS.camera +
                '<p>Tap to take a photo or choose from gallery</p>' +
            '</div>' +
            '<input type="file" id="file-input" accept="image/*" capture="environment" style="display:none" onchange="handleFileSelect(event)">' +
            '<div id="preview-container" class="hidden"></div>' +
            '<div class="form-group">' +
                '<label>Category</label>' +
                '<select class="text-input" id="item-category">' +
                    CATEGORIES.map(c => '<option value="' + c.id + '">' + c.emoji + ' ' + c.label + '</option>').join('') +
                '</select>' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Name (optional)</label>' +
                '<input type="text" class="text-input" id="item-name" placeholder="e.g. Blue denim jacket">' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Notes (optional)</label>' +
                '<textarea class="text-input" id="item-notes" placeholder="Color, brand, fit notes..."></textarea>' +
            '</div>' +
            '<button class="primary-btn" id="save-item-btn" onclick="saveNewItem()" disabled>Save Item</button>' +
            '<button class="secondary-btn" onclick="closeModal()">Cancel</button>' +
        '</div>';

    document.body.appendChild(overlay);
}

function triggerFileInput() {
    document.getElementById('file-input')?.click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    pendingFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        pendingPreviewUrl = e.target.result;
        const container = document.getElementById('preview-container');
        const uploadArea = document.getElementById('upload-area');
        if (container) {
            container.innerHTML = '<img class="upload-preview" src="' + pendingPreviewUrl + '" alt="Preview">' +
                '<button class="secondary-btn" onclick="triggerFileInput()" style="align-self:center;margin-top:0.5rem;">Change Photo</button>';
            container.classList.remove('hidden');
        }
        if (uploadArea) uploadArea.classList.add('hidden');
        const btn = document.getElementById('save-item-btn');
        if (btn) btn.disabled = false;
    };
    reader.readAsDataURL(file);
}

async function saveNewItem() {
    if (!pendingFile) return;

    const btn = document.getElementById('save-item-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

    const imageBlob = await compressImage(pendingFile, 800, 0.85);
    const thumbnailBlob = await compressImage(pendingFile, 200, 0.7);

    const item = {
        id: crypto.randomUUID(),
        category: document.getElementById('item-category')?.value || 'tops',
        name: document.getElementById('item-name')?.value.trim() || '',
        notes: document.getElementById('item-notes')?.value.trim() || '',
        imageBlob: imageBlob,
        thumbnailBlob: thumbnailBlob,
        available: true,
        addedAt: new Date().toISOString(),
    };

    await dbAddItem(item);
    closeModal();
    renderWardrobe();
}

function closeModal() {
    const modal = document.getElementById('add-item-modal') || document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    pendingFile = null;
    pendingPreviewUrl = null;
}

// ── Item Detail Modal ─────────────────────────────────────────────
async function openItemDetail(id) {
    const item = await dbGetItem(id);
    if (!item) return;

    const url = blobToObjectURL(item.imageBlob);
    const catLabel = CATEGORIES.find(c => c.id === item.category)?.label || item.category;
    const isAvailable = item.available !== false;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    overlay.innerHTML =
        '<div class="modal-sheet" onclick="event.stopPropagation()">' +
            '<h2>' + (item.name || catLabel) + '</h2>' +
            '<img class="item-detail-img" src="' + url + '" alt="' + (item.name || catLabel) + '">' +
            '<div class="item-detail-meta">' +
                '<div class="meta-row"><span class="meta-label">Category</span><span class="meta-value">' + catLabel + '</span></div>' +
                (item.notes ? '<div class="meta-row"><span class="meta-label">Notes</span><span class="meta-value">' + item.notes + '</span></div>' : '') +
                '<div class="meta-row"><span class="meta-label">Added</span><span class="meta-value">' + new Date(item.addedAt).toLocaleDateString() + '</span></div>' +
                '<div class="toggle-row">' +
                    '<span class="meta-label">Available to wear</span>' +
                    '<button class="toggle' + (isAvailable ? ' on' : '') + '" id="avail-toggle" onclick="toggleItemAvailability(\'' + item.id + '\')"></button>' +
                '</div>' +
            '</div>' +
            '<button class="secondary-btn" style="color:var(--negative);" onclick="deleteWardrobeItem(\'' + item.id + '\');closeModal()">Delete Item</button>' +
            '<button class="secondary-btn" onclick="closeModal()">Close</button>' +
        '</div>';

    document.body.appendChild(overlay);
}

async function toggleItemAvailability(id) {
    const item = await dbGetItem(id);
    if (!item) return;
    item.available = item.available === false ? true : false;
    await dbUpdateItem(item);

    const toggle = document.getElementById('avail-toggle');
    if (toggle) {
        toggle.classList.toggle('on', item.available);
    }
}

// ── Generate Outfit Page ──────────────────────────────────────────
let generateState = { occasion: '', mood: '', dressCode: '', results: null, loading: false, weather: null };

async function renderGenerate() {
    const p = getProfile();
    if (!p) { window.location.href = '/onboarding.html'; return; }

    const c = document.getElementById('page-content');
    if (!c) return;

    const items = await dbGetAllItems();
    const availableItems = items.filter(i => i.available !== false);

    // Fetch weather in background
    if (!generateState.weather) {
        fetchWeather().then(w => {
            if (w && !generateState.weather) {
                generateState.weather = w;
                const widget = document.getElementById('weather-slot');
                if (widget) widget.innerHTML = renderWeatherWidget(w);
            }
        });
    }

    let html =
        '<div class="page-header">' +
            '<h1>Generate Outfit</h1>' +
            '<p>Tell us the occasion and mood — we\'ll pick 3 looks from your wardrobe.</p>' +
        '</div>';

    // weather widget slot
    html += '<div id="weather-slot">' + renderWeatherWidget(generateState.weather) + '</div>';

    if (availableItems.length < 3) {
        html += '<div class="notice">You need at least 3 available items in your wardrobe to generate outfits. ' +
            '<a href="/wardrobe.html">Add items →</a></div>';
        c.innerHTML = html;
        renderNav('generate');
        return;
    }

    // occasion pills
    html += '<div class="form-group"><label>What\'s the occasion?</label><div class="pill-grid" id="occasion-pills">';
    OCCASIONS.forEach(o => {
        html += '<button class="pill' + (generateState.occasion === o ? ' active' : '') +
            '" onclick="setGenerateField(\'occasion\',\'' + o + '\')">' + o + '</button>';
    });
    html += '</div>';
    html += '<input type="text" class="text-input" placeholder="Or type your own..." id="occasion-custom" ' +
        'value="' + (OCCASIONS.includes(generateState.occasion) ? '' : generateState.occasion) + '" ' +
        'oninput="setGenerateField(\'occasion\',this.value)" style="margin-top:0.5rem;">';
    html += '</div>';

    // dress code pills
    html += '<div class="form-group"><label>Dress code</label><div class="pill-grid">';
    DRESS_CODES.forEach(dc => {
        html += '<button class="pill' + (generateState.dressCode === dc.id ? ' active' : '') +
            '" onclick="setGenerateField(\'dressCode\',\'' + dc.id + '\')" title="' + dc.desc + '">' + dc.label + '</button>';
    });
    html += '</div></div>';

    // mood pills
    html += '<div class="form-group"><label>How do you want to feel?</label><div class="pill-grid" id="mood-pills">';
    MOODS.forEach(m => {
        html += '<button class="pill' + (generateState.mood === m ? ' active' : '') +
            '" onclick="setGenerateField(\'mood\',\'' + m + '\')">' + m + '</button>';
    });
    html += '</div>';
    html += '<input type="text" class="text-input" placeholder="Or type your own..." id="mood-custom" ' +
        'value="' + (MOODS.includes(generateState.mood) ? '' : generateState.mood) + '" ' +
        'oninput="setGenerateField(\'mood\',this.value)" style="margin-top:0.5rem;">';
    html += '</div>';

    // generate button
    const canGenerate = generateState.occasion && generateState.mood && !generateState.loading;
    html += '<button class="primary-btn" onclick="generateOutfits()" ' + (canGenerate ? '' : 'disabled') + '>' +
        (generateState.loading ? '<span class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;"></span> Generating...' : '✨ Generate 3 Outfits') +
        '</button>';

    // results
    if (generateState.results) {
        html += '<div style="display:flex;flex-direction:column;gap:1rem;margin-top:0.5rem;">';
        generateState.results.forEach((outfit, idx) => {
            html += '<div class="outfit-card">';
            html += '<div class="outfit-card-header"><h3>Look ' + (idx + 1) + (outfit.name ? ': ' + outfit.name : '') + '</h3></div>';
            if (outfit.itemImages && outfit.itemImages.length > 0) {
                html += '<div class="outfit-card-items">';
                outfit.itemImages.forEach(img => {
                    html += '<img src="' + img.url + '" alt="' + (img.label || '') + '">';
                });
                html += '</div>';
            }
            html += '<div class="outfit-card-body"><p>' + (outfit.reasoning || '') + '</p></div>';
            html += '</div>';
        });
        html += '</div>';
    }

    c.innerHTML = html;
    renderNav('generate');
}

function setGenerateField(field, value) {
    generateState[field] = value;
    renderGenerate();
}

async function generateOutfits() {
    generateState.loading = true;
    generateState.results = null;
    renderGenerate();

    try {
        const allItems = await dbGetAllItems();
        const items = allItems.filter(i => i.available !== false);
        const profile = getProfile();

        const itemPayloads = await Promise.all(items.map(async (item, idx) => {
            const base64 = await blobToBase64(item.thumbnailBlob);
            return {
                index: idx + 1,
                id: item.id,
                category: item.category,
                name: item.name || '',
                notes: item.notes || '',
                image: base64,
            };
        }));

        const requestBody = {
            items: itemPayloads,
            occasion: generateState.occasion,
            mood: generateState.mood,
            dressCode: generateState.dressCode || '',
            profile: {
                vibe: profile.vibe,
                expression: profile.expression,
                adventure: profile.adventure,
                name: profile.name,
            },
        };

        if (generateState.weather) {
            requestBody.weather = {
                temp: generateState.weather.temp,
                desc: generateState.weather.desc,
                season: generateState.weather.season,
            };
        }

        const response = await fetch('/api/generate-outfit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Failed to generate outfits');
        }

        const data = await response.json();

        const outfits = (data.outfits || []).map(outfit => {
            const matchedImages = (outfit.itemIndices || []).map(idx => {
                const item = items[idx - 1];
                if (!item) return null;
                return { url: blobToObjectURL(item.imageBlob), label: item.name || item.category };
            }).filter(Boolean);
            return { name: outfit.name || '', reasoning: outfit.reasoning || '', itemImages: matchedImages };
        });

        generateState.results = outfits;
    } catch (err) {
        console.error('Generate error:', err);
        generateState.results = [{
            name: 'Could not generate',
            reasoning: 'Error: ' + err.message + '. Make sure the OPENAI_API_KEY is configured in your Cloudflare Worker environment.',
            itemImages: [],
        }];
    }

    generateState.loading = false;
    renderGenerate();
}

// ── Outfit Builder Page ───────────────────────────────────────────
let builderState = { selectedIds: new Set(), filter: 'all', critique: null, loading: false };

async function renderBuilder() {
    const p = getProfile();
    if (!p) { window.location.href = '/onboarding.html'; return; }

    const c = document.getElementById('page-content');
    if (!c) return;

    const items = await dbGetAllItems();
    const filtered = builderState.filter === 'all' ? items : items.filter(i => i.category === builderState.filter);
    const selectedItems = items.filter(i => builderState.selectedIds.has(i.id));

    let html =
        '<div class="page-header">' +
            '<h1>Build Your Outfit</h1>' +
            '<p>Pick items, then get AI feedback on your look.</p>' +
        '</div>';

    if (items.length === 0) {
        html += '<div class="notice">Add items to your wardrobe first. ' +
            '<a href="/wardrobe.html">Add items →</a></div>';
        c.innerHTML = html;
        renderNav('builder');
        return;
    }

    // selected strip
    html += '<div class="selected-strip">';
    if (selectedItems.length === 0) {
        html += '<span class="empty-msg">Tap items below to build your outfit</span>';
    } else {
        selectedItems.forEach(item => {
            html += '<img src="' + blobToObjectURL(item.imageBlob) + '" alt="' + (item.name || item.category) + '">';
        });
    }
    html += '</div>';

    // critique button
    const canCritique = selectedItems.length >= 2 && !builderState.loading;
    html += '<button class="primary-btn" onclick="critiqueOutfit()" ' + (canCritique ? '' : 'disabled') + '>' +
        (builderState.loading
            ? '<span class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;"></span> Analyzing...'
            : '🔍 Get AI Critique (' + selectedItems.length + ' items)') +
        '</button>';

    // critique results
    if (builderState.critique) {
        html += '<div style="display:flex;flex-direction:column;gap:0.75rem;">';
        if (builderState.critique.positives) {
            html += '<div class="critique-section positive"><h3>💚 What Works</h3><p>' + builderState.critique.positives + '</p></div>';
        }
        if (builderState.critique.negatives) {
            html += '<div class="critique-section negative"><h3>🔸 Could Improve</h3><p>' + builderState.critique.negatives + '</p></div>';
        }
        if (builderState.critique.suggestions) {
            html += '<div class="critique-section suggestion"><h3>💡 Swap Ideas</h3><p>' + builderState.critique.suggestions + '</p></div>';
        }
        if (builderState.critique.error) {
            html += '<div class="critique-section"><p>' + builderState.critique.error + '</p></div>';
        }
        html += '</div>';
    }

    // category tabs
    html += '<div class="category-tabs">';
    html += '<button class="category-tab' + (builderState.filter === 'all' ? ' active' : '') +
        '" onclick="setBuilderFilter(\'all\')">All</button>';
    CATEGORIES.forEach(cat => {
        const count = items.filter(i => i.category === cat.id).length;
        if (count === 0) return;
        html += '<button class="category-tab' + (builderState.filter === cat.id ? ' active' : '') +
            '" onclick="setBuilderFilter(\'' + cat.id + '\')">' + cat.emoji + ' ' + cat.label + '</button>';
    });
    html += '</div>';

    // item grid (selectable)
    html += '<div class="wardrobe-grid">';
    filtered.forEach(item => {
        const url = blobToObjectURL(item.imageBlob);
        const selected = builderState.selectedIds.has(item.id);
        const isUnavailable = item.available === false;
        html += '<div class="wardrobe-item selectable' + (selected ? ' selected' : '') +
            (isUnavailable ? ' unavailable' : '') +
            '" onclick="toggleBuilderItem(\'' + item.id + '\')">' +
            '<img src="' + url + '" alt="' + (item.name || item.category) + '" loading="lazy">' +
            '<div class="item-label">' + (item.name || CATEGORIES.find(c => c.id === item.category)?.label || item.category) + '</div>' +
            '</div>';
    });
    html += '</div>';

    if (selectedItems.length > 0) {
        html += '<button class="secondary-btn text-center" onclick="clearBuilderSelection()">Clear Selection</button>';
    }

    c.innerHTML = html;
    renderNav('builder');
}

function setBuilderFilter(cat) {
    builderState.filter = cat;
    renderBuilder();
}

function toggleBuilderItem(id) {
    if (builderState.selectedIds.has(id)) {
        builderState.selectedIds.delete(id);
    } else {
        builderState.selectedIds.add(id);
    }
    renderBuilder();
}

function clearBuilderSelection() {
    builderState.selectedIds.clear();
    builderState.critique = null;
    renderBuilder();
}

async function critiqueOutfit() {
    builderState.loading = true;
    builderState.critique = null;
    renderBuilder();

    try {
        const allItems = await dbGetAllItems();
        const selectedItems = allItems.filter(i => builderState.selectedIds.has(i.id));
        const profile = getProfile();

        const selectedPayloads = await Promise.all(selectedItems.map(async (item) => {
            const base64 = await blobToBase64(item.thumbnailBlob);
            return {
                id: item.id,
                category: item.category,
                name: item.name || '',
                notes: item.notes || '',
                image: base64,
            };
        }));

        const otherPayloads = await Promise.all(
            allItems.filter(i => !builderState.selectedIds.has(i.id)).slice(0, 20).map(async (item) => {
                const base64 = await blobToBase64(item.thumbnailBlob);
                return {
                    id: item.id,
                    category: item.category,
                    name: item.name || '',
                    notes: item.notes || '',
                    image: base64,
                };
            })
        );

        const response = await fetch('/api/critique-outfit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selectedItems: selectedPayloads,
                otherItems: otherPayloads,
                profile: {
                    vibe: profile.vibe,
                    expression: profile.expression,
                    adventure: profile.adventure,
                    name: profile.name,
                },
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Failed to critique outfit');
        }

        builderState.critique = await response.json();
    } catch (err) {
        console.error('Critique error:', err);
        builderState.critique = {
            error: 'Error: ' + err.message + '. Make sure the OPENAI_API_KEY is configured in your Cloudflare Worker environment.',
        };
    }

    builderState.loading = false;
    renderBuilder();
}

// ── Service Worker ────────────────────────────────────────────────
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try { await navigator.serviceWorker.register('/sw.js'); }
        catch (e) { console.warn(e); }
    }
}

// ── Router ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();

    // Apply theme from profile immediately
    applyTheme(getThemeFromProfile());

    const path = window.location.pathname;

    if (path.endsWith('onboarding.html')) {
        if (getProfile()) { window.location.href = '/wardrobe.html'; return; }
        onboardingData = {};
        currentStep = 0;
        renderOnboardingStep();
    } else if (path.endsWith('board.html')) {
        renderBoard();
    } else if (path.endsWith('wardrobe.html')) {
        if (!getProfile()) { window.location.href = '/onboarding.html'; return; }
        renderWardrobe();
    } else if (path.endsWith('generate.html')) {
        if (!getProfile()) { window.location.href = '/onboarding.html'; return; }
        renderGenerate();
    } else if (path.endsWith('builder.html')) {
        if (!getProfile()) { window.location.href = '/onboarding.html'; return; }
        renderBuilder();
    }
});
