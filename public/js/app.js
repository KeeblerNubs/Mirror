/* ================================================================
   Mirror — app.js
   Core application logic: theme system, profile, wardrobe (IndexedDB),
   outfit generation with weather/dress code, outfit builder + AI
   critique, availability tracking, navigation, routing.
   ================================================================ */

// ── Constants ──────────────────────────────────────────────────────
const STORAGE_KEY = 'mirror-profile';
const DB_NAME = 'mirror-wardrobe';
const DB_VERSION = 3;
const ITEMS_STORE = 'items';
const OUTFITS_STORE = 'outfits';

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
    saved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
    remix: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 012-2h2"/><path d="M17 3h2a2 2 0 012 2v2"/><path d="M21 17v2a2 2 0 01-2 2h-2"/><path d="M7 21H5a2 2 0 01-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    community: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
    fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c-4.97 0-9-2.69-9-6 0-2.5 1.5-4.5 3-6 .5 1 1.5 2 3 2 0-3 2-6 6-9 0 3 3 5 3 8 1.5-1.5 3-1 3-1 0 3.5-4.03 12-9 12z"/></svg>',
    wash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6l3 1 3-1 3 1 3-1 3 1 3-1"/><path d="M3 10l3 1 3-1 3 1 3-1 3 1 3-1"/><path d="M3 14l3 1 3-1 3 1 3-1 3 1 3-1"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>',
    suitcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="11" x2="12" y2="17"/></svg>',
    mannequin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="4" r="2"/><path d="M12 6v4"/><path d="M8 10l4 2 4-2"/><path d="M12 12v5"/><path d="M9 22l3-5 3 5"/></svg>',
    vote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 00-6 0v4"/><rect x="2" y="9" width="20" height="12" rx="2"/><path d="M12 15v2"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>',
};

const CHALLENGES_KEY = 'mirror-challenges';
const LAUNDRY_KEY = 'mirror-laundry';
const VOTING_KEY = 'mirror-votes';

const DAILY_CHALLENGES = [
    { id: 'monochrome', title: 'Monochrome Monday', desc: 'Wear an outfit using only one color family', icon: '🎨' },
    { id: 'textures', title: 'Texture Mix', desc: 'Combine at least 3 different textures/fabrics', icon: '🧶' },
    { id: 'no_black', title: 'No Black Challenge', desc: 'Build a look without any black pieces', icon: '🌈' },
    { id: 'accessory', title: 'Accessory Focus', desc: 'Let an accessory be the statement piece', icon: '💎' },
    { id: 'comfort', title: 'Comfort Zone Exit', desc: 'Wear something you normally wouldn\'t', icon: '🚀' },
    { id: 'vintage', title: 'Throwback Thursday', desc: 'Style an outfit inspired by a past decade', icon: '🕰️' },
    { id: 'layers', title: 'Layer Up', desc: 'Create a look with at least 3 layers', icon: '🧥' },
    { id: 'color_pop', title: 'Color Pop', desc: 'Neutral outfit with one bold color accent', icon: '💥' },
    { id: 'minimal', title: 'Minimalist', desc: '3 pieces max — make it count', icon: '✨' },
    { id: 'pattern', title: 'Pattern Play', desc: 'Mix two different patterns that work together', icon: '🔲' },
    { id: 'dress_up', title: 'Overdressed Friday', desc: 'Dress one level above what the day requires', icon: '👑' },
    { id: 'sport_lux', title: 'Sport Luxe', desc: 'Mix athletic and dressy pieces', icon: '🏆' },
    { id: 'decade', title: 'Decade Dressing', desc: 'Channel the 90s, 70s, or 2000s', icon: '📻' },
    { id: 'one_brand', title: 'Brand Loyalty', desc: 'Build a full look from one brand if possible', icon: '🏷️' },
];

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
const SEASON_ITEMS = {
    Spring: ['light jackets', 'layering pieces', 'rain jackets', 'light sweaters'],
    Summer: ['shorts', 'tank tops', 't-shirts', 'sandals', 'sunglasses', 'light dresses'],
    Fall: ['sweaters', 'boots', 'jackets', 'scarves', 'layering pieces'],
    Winter: ['heavy coats', 'boots', 'scarves', 'gloves', 'beanies', 'warm layers'],
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
            if (!db.objectStoreNames.contains(OUTFITS_STORE)) {
                const oStore = db.createObjectStore(OUTFITS_STORE, { keyPath: 'id' });
                oStore.createIndex('savedAt', 'savedAt', { unique: false });
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

// ── IndexedDB (Outfits) ───────────────────────────────────────────
async function dbGetAllOutfits() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(OUTFITS_STORE, 'readonly');
        const store = tx.objectStore(OUTFITS_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbAddOutfit(outfit) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(OUTFITS_STORE, 'readwrite');
        const store = tx.objectStore(OUTFITS_STORE);
        const req = store.put(outfit);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbGetOutfit(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(OUTFITS_STORE, 'readonly');
        const store = tx.objectStore(OUTFITS_STORE);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbDeleteOutfit(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(OUTFITS_STORE, 'readwrite');
        const store = tx.objectStore(OUTFITS_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function dbUpdateOutfit(outfit) {
    return dbAddOutfit(outfit);
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
        { id: 'saved', label: 'Saved', icon: ICONS.saved, href: '/saved.html' },
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
    const outfits = await dbGetAllOutfits();
    const counts = {};
    CATEGORIES.forEach(cat => counts[cat.id] = 0);
    items.forEach(item => { if (counts[item.category] !== undefined) counts[item.category]++; });
    const totalItems = items.length;
    const availableItems = items.filter(i => i.available !== false).length;
    const totalOutfits = outfits.length;
    const likedOutfits = outfits.filter(o => o.liked).length;

    const findLabel = (key, val) => {
        const step = onboardingSteps.find(s => s.key === key);
        if (!step || !step.options) return val;
        const opt = step.options.find(o => o.value === val);
        return opt ? opt.label : val;
    };

    // Wardrobe gap analysis
    const missingCats = CATEGORIES.filter(cat => counts[cat.id] === 0).map(cat => cat.label);

    // Most used items in saved outfits
    const itemUsage = {};
    outfits.forEach(o => {
        (o.itemIds || []).forEach(id => { itemUsage[id] = (itemUsage[id] || 0) + 1; });
    });
    const topItemIds = Object.entries(itemUsage).sort((a, b) => b[1] - a[1]).slice(0, 3);

    let html =
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
                '<div class="stat-card"><div class="stat-num">' + totalOutfits + '</div><div class="stat-label">Saved</div></div>' +
                '<div class="stat-card"><div class="stat-num">' + likedOutfits + '</div><div class="stat-label">Liked</div></div>' +
            '</div>' +
            (totalItems === 0
                ? '<p style="text-align:center;opacity:0.6;margin:1rem 0 0;">Start by adding items to your wardrobe.</p>'
                : '') +
        '</div>';

    // Analytics: category breakdown
    if (totalItems > 0) {
        html += '<div class="card">' +
            '<h3 style="margin:0 0 0.75rem;">Wardrobe Breakdown</h3>';
        CATEGORIES.forEach(cat => {
            const count = counts[cat.id] || 0;
            if (count === 0) return;
            const pct = Math.round((count / totalItems) * 100);
            html += '<div class="analytics-bar-row">' +
                '<span class="analytics-bar-label">' + cat.emoji + ' ' + cat.label + '</span>' +
                '<div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:' + pct + '%"></div></div>' +
                '<span class="analytics-bar-value">' + count + '</span>' +
                '</div>';
        });
        html += '</div>';
    }

    // Analytics: wardrobe gaps
    if (missingCats.length > 0 && totalItems > 0) {
        html += '<div class="card">' +
            '<h3 style="margin:0 0 0.5rem;">Wardrobe Gaps</h3>' +
            '<p style="margin:0;opacity:0.7;font-size:0.85rem;">You\'re missing: ' +
            missingCats.join(', ') + '. Adding variety unlocks better outfit combos.</p>' +
            '</div>';
    }

    // Analytics: most-used items
    if (topItemIds.length > 0) {
        html += '<div class="card">' +
            '<h3 style="margin:0 0 0.75rem;">Most Used Items</h3>' +
            '<div class="top-items-list">';
        for (const [itemId, count] of topItemIds) {
            const item = items.find(i => i.id === itemId);
            if (!item) continue;
            const catLabel = CATEGORIES.find(ct => ct.id === item.category)?.label || item.category;
            html += '<div class="top-item-row">' +
                '<span class="top-item-name">' + (item.name || catLabel) + '</span>' +
                '<span class="top-item-count">in ' + count + ' outfit' + (count !== 1 ? 's' : '') + '</span>' +
                '</div>';
        }
        html += '</div></div>';
    }

    // Analytics: cost-per-wear
    const pricedItems = items.filter(i => i.price && i.price > 0);
    if (pricedItems.length > 0) {
        const totalSpent = pricedItems.reduce((sum, i) => sum + i.price, 0);
        html += '<div class="card">' +
            '<h3 style="margin:0 0 0.75rem;">Cost Analysis</h3>' +
            '<div class="wardrobe-stats">' +
                '<div class="stat-card"><div class="stat-num">$' + totalSpent.toFixed(0) + '</div><div class="stat-label">Total Spent</div></div>' +
                '<div class="stat-card"><div class="stat-num">$' + (totalSpent / pricedItems.length).toFixed(0) + '</div><div class="stat-label">Avg Price</div></div>' +
            '</div>';

        // Best and worst cost-per-wear
        const cpwItems = pricedItems.map(item => {
            let wc = 0;
            outfits.forEach(o => {
                if ((o.itemIds || []).includes(item.id)) wc += Math.max((o.wornDates || []).length, 1);
            });
            return { item, cpw: wc > 0 ? item.price / wc : item.price, wearCount: wc };
        }).sort((a, b) => a.cpw - b.cpw);

        const bestCpw = cpwItems.filter(c => c.wearCount > 0).slice(0, 3);
        if (bestCpw.length > 0) {
            html += '<div class="top-items-list" style="margin-top:0.5rem;">';
            bestCpw.forEach(c => {
                const catLabel = CATEGORIES.find(ct => ct.id === c.item.category)?.label || c.item.category;
                html += '<div class="top-item-row">' +
                    '<span class="top-item-name">' + (c.item.name || catLabel) + '</span>' +
                    '<span class="top-item-count cpw-low">$' + c.cpw.toFixed(2) + '/wear</span>' +
                    '</div>';
            });
            html += '</div>';
        }

        html += '</div>';
    }

    html +=
        '<div class="board-actions">' +
            '<button class="primary-btn" onclick="window.location.href=\'/wardrobe.html\'">📸 Manage Wardrobe</button>' +
            '<button class="secondary-btn" onclick="window.location.href=\'/saved.html\'">💾 Saved Outfits</button>' +
            '<button class="secondary-btn" onclick="window.location.href=\'/calendar.html\'">📅 Outfit Calendar</button>' +
            '<button class="secondary-btn" onclick="window.location.href=\'/ootd.html\'">☀️ Outfit of the Day</button>' +
            '<button class="secondary-btn" onclick="window.location.href=\'/community.html\'">👥 Community</button>' +
            '<button class="secondary-btn" onclick="window.location.href=\'/challenges.html\'">🔥 Style Challenges</button>' +
            '<button class="secondary-btn" onclick="generateStyleReport()">📊 Style Report</button>' +
            '<button class="secondary-btn" onclick="window.location.href=\'/packing.html\'">🧳 Smart Packing</button>' +
            '<button class="secondary-btn" onclick="showWishlist()">🛒 Wishlist</button>' +
            '<button class="secondary-btn" onclick="resetProfile()" style="color:var(--negative);">🔄 Start Over</button>' +
        '</div>';

    c.innerHTML = html;
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

    // action rows
    html += '<div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;">' +
        '<button class="secondary-btn" style="flex:1;font-size:0.85rem;" onclick="openBatchScanModal()">' + ICONS.scan + ' Batch Scan</button>' +
        '<button class="secondary-btn" style="flex:1;font-size:0.85rem;" onclick="showSeasonalAdvice()">' + ICONS.sun + ' Seasonal Tips</button>' +
        '</div>' +
        '<div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;">' +
        '<button class="secondary-btn" style="flex:1;font-size:0.85rem;" onclick="showLaundryStatus()">' + ICONS.wash + ' Laundry</button>' +
        '<button class="secondary-btn" style="flex:1;font-size:0.85rem;" onclick="window.location.href=\'/packing.html\'">' + ICONS.suitcase + ' Pack a Trip</button>' +
        '</div>';

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
                '<label>Brand (optional)</label>' +
                '<input type="text" class="text-input" id="item-brand" placeholder="e.g. Nike, Zara, Vintage">' +
            '</div>' +
            '<div class="form-row">' +
                '<div class="form-group" style="flex:1;">' +
                    '<label>Price (optional)</label>' +
                    '<input type="number" class="text-input" id="item-price" placeholder="$" min="0" step="0.01">' +
                '</div>' +
                '<div class="form-group" style="flex:1;">' +
                    '<label>Purchased</label>' +
                    '<input type="date" class="text-input" id="item-purchase-date">' +
                '</div>' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Notes (optional)</label>' +
                '<textarea class="text-input" id="item-notes" placeholder="Color, fit notes..."></textarea>' +
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

    const priceVal = document.getElementById('item-price')?.value;
    const item = {
        id: crypto.randomUUID(),
        category: document.getElementById('item-category')?.value || 'tops',
        name: document.getElementById('item-name')?.value.trim() || '',
        notes: document.getElementById('item-notes')?.value.trim() || '',
        brand: document.getElementById('item-brand')?.value.trim() || '',
        price: priceVal ? parseFloat(priceVal) : null,
        purchaseDate: document.getElementById('item-purchase-date')?.value || null,
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

    // Calculate cost-per-wear
    const outfits = await dbGetAllOutfits();
    let wearCount = 0;
    outfits.forEach(o => {
        if ((o.itemIds || []).includes(item.id)) wearCount += Math.max((o.wornDates || []).length, 1);
    });
    const costPerWear = item.price && wearCount > 0 ? (item.price / wearCount).toFixed(2) : null;

    overlay.innerHTML =
        '<div class="modal-sheet" onclick="event.stopPropagation()">' +
            '<h2>' + (item.name || catLabel) + '</h2>' +
            '<img class="item-detail-img" src="' + url + '" alt="' + (item.name || catLabel) + '">' +
            '<div class="item-detail-meta">' +
                '<div class="meta-row"><span class="meta-label">Category</span><span class="meta-value">' + catLabel + '</span></div>' +
                (item.brand ? '<div class="meta-row"><span class="meta-label">Brand</span><span class="meta-value">' + item.brand + '</span></div>' : '') +
                (item.price ? '<div class="meta-row"><span class="meta-label">Price</span><span class="meta-value">$' + item.price.toFixed(2) + '</span></div>' : '') +
                (costPerWear ? '<div class="meta-row"><span class="meta-label">Cost/Wear</span><span class="meta-value cpw-' + (parseFloat(costPerWear) > 20 ? 'high' : 'low') + '">$' + costPerWear + '</span></div>' : '') +
                (wearCount > 0 ? '<div class="meta-row"><span class="meta-label">Worn</span><span class="meta-value">' + wearCount + ' time' + (wearCount !== 1 ? 's' : '') + '</span></div>' : '') +
                (item.purchaseDate ? '<div class="meta-row"><span class="meta-label">Purchased</span><span class="meta-value">' + new Date(item.purchaseDate + 'T12:00:00').toLocaleDateString() + '</span></div>' : '') +
                (item.notes ? '<div class="meta-row"><span class="meta-label">Notes</span><span class="meta-value">' + item.notes + '</span></div>' : '') +
                '<div class="meta-row"><span class="meta-label">Added</span><span class="meta-value">' + new Date(item.addedAt).toLocaleDateString() + '</span></div>' +
                '<div class="toggle-row">' +
                    '<span class="meta-label">Available to wear</span>' +
                    '<button class="toggle' + (isAvailable ? ' on' : '') + '" id="avail-toggle" onclick="toggleItemAvailability(\'' + item.id + '\')"></button>' +
                '</div>' +
            '</div>' +
            '<div class="toggle-row">' +
                '<span class="meta-label">Clean / Ready</span>' +
                '<button class="toggle' + (item.laundry !== true ? ' on' : '') + '" id="laundry-toggle" onclick="toggleItemLaundry(\'' + item.id + '\')"></button>' +
            '</div>' +
            '<button class="primary-btn" onclick="closeModal();startRemix(\'' + item.id + '\')">🔀 Remix — 5 Ways to Wear This</button>' +
            '<button class="secondary-btn" onclick="closeModal();openVirtualTryOn(\'' + item.id + '\')">' + ICONS.mannequin + ' Virtual Try-On</button>' +
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

async function toggleItemLaundry(id) {
    const item = await dbGetItem(id);
    if (!item) return;
    item.laundry = item.laundry !== true ? true : false;
    await dbUpdateItem(item);
    const toggle = document.getElementById('laundry-toggle');
    if (toggle) toggle.classList.toggle('on', !item.laundry);
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

    // Quick actions
    html += '<div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;">' +
        '<button class="secondary-btn" style="flex:1;font-size:0.85rem;" onclick="window.location.href=\'/ootd.html\'">☀️ Today\'s Pick</button>' +
        '<button class="secondary-btn" style="flex:1;font-size:0.85rem;" onclick="window.location.href=\'/community.html\'">' + ICONS.community + ' Community</button>' +
        '</div>' +
        '<div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;">' +
        '<button class="secondary-btn" style="flex:1;font-size:0.85rem;" onclick="window.location.href=\'/challenges.html\'">' + ICONS.fire + ' Challenges</button>' +
        '<button class="secondary-btn" style="flex:1;font-size:0.85rem;" onclick="openOutfitVoting()">' + ICONS.vote + ' Vote</button>' +
        '</div>';

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
            const hasItems = outfit.itemIds && outfit.itemIds.length > 0;
            html += '<div class="outfit-card" id="outfit-card-' + idx + '">';
            html += '<div class="outfit-card-header"><h3>Look ' + (idx + 1) + (outfit.name ? ': ' + outfit.name : '') + '</h3>' +
                (hasItems ? '<div class="outfit-card-actions">' +
                    '<button class="icon-btn" onclick="saveGeneratedOutfit(' + idx + ')" title="Save">' + ICONS.saved + '</button>' +
                    '<button class="icon-btn" onclick="shareOutfitCard(\'outfit-card-' + idx + '\')" title="Share">' + ICONS.share + '</button>' +
                '</div>' : '') +
                '</div>';
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

        const styleLearning = await getStyleLearningContext();

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
            styleLearning: styleLearning,
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
            const matchedItems = (outfit.itemIndices || []).map(idx => {
                const item = items[idx - 1];
                if (!item) return null;
                return { id: item.id, url: blobToObjectURL(item.imageBlob), label: item.name || item.category };
            }).filter(Boolean);
            return {
                name: outfit.name || '',
                reasoning: outfit.reasoning || '',
                itemImages: matchedItems,
                itemIds: matchedItems.map(m => m.id),
            };
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

// ── Save & Share Outfits ──────────────────────────────────────────
async function saveGeneratedOutfit(idx) {
    const outfit = generateState.results[idx];
    if (!outfit || !outfit.itemIds || outfit.itemIds.length === 0) return;

    const saved = {
        id: crypto.randomUUID(),
        name: outfit.name || 'Look ' + (idx + 1),
        itemIds: outfit.itemIds,
        reasoning: outfit.reasoning || '',
        occasion: generateState.occasion || '',
        mood: generateState.mood || '',
        dressCode: generateState.dressCode || '',
        source: 'generated',
        critique: null,
        liked: false,
        wornDates: [],
        savedAt: new Date().toISOString(),
    };

    await dbAddOutfit(saved);
    const btn = document.querySelector('#outfit-card-' + idx + ' .icon-btn');
    if (btn) { btn.style.color = 'var(--positive)'; btn.innerHTML = '✓ Saved'; }
}

async function saveBuiltOutfit() {
    const allItems = await dbGetAllItems();
    const selectedItems = allItems.filter(i => builderState.selectedIds.has(i.id));
    if (selectedItems.length < 2) return;

    const saved = {
        id: crypto.randomUUID(),
        name: 'Custom Look',
        itemIds: selectedItems.map(i => i.id),
        reasoning: '',
        occasion: '',
        mood: '',
        dressCode: '',
        source: 'built',
        critique: builderState.critique || null,
        liked: false,
        wornDates: [],
        savedAt: new Date().toISOString(),
    };

    await dbAddOutfit(saved);
    const btn = document.getElementById('save-built-btn');
    if (btn) { btn.textContent = '✓ Saved!'; btn.disabled = true; }
}

async function shareOutfitCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const W = 600;
        const H = 800;
        canvas.width = W;
        canvas.height = H;

        // Background
        const bgColor = getComputedStyle(document.body).getPropertyValue('--card-bg').trim() || '#111';
        const textColor = getComputedStyle(document.body).getPropertyValue('--text').trim() || '#fff';
        const accentColor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#ff00ff';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, W, H);

        // Header
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('MIRROR', 30, 50);

        ctx.fillStyle = textColor;
        ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.globalAlpha = 0.6;
        ctx.fillText('Be yourself. Look fucking cool.', 30, 72);
        ctx.globalAlpha = 1;

        // Outfit name
        const nameEl = card.querySelector('h3');
        const outfitName = nameEl ? nameEl.textContent : 'My Look';
        ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(outfitName, 30, 120);

        // Draw item images
        const imgs = card.querySelectorAll('.outfit-card-items img');
        const imgSize = 120;
        const gap = 10;
        let x = 30;
        const y = 145;
        const loadPromises = Array.from(imgs).map((imgEl) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = imgEl.src;
            });
        });

        const loadedImgs = await Promise.all(loadPromises);
        loadedImgs.forEach((img) => {
            if (!img) return;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(x, y, imgSize, imgSize * 1.25, 8);
            ctx.clip();
            ctx.drawImage(img, x, y, imgSize, imgSize * 1.25);
            ctx.restore();
            x += imgSize + gap;
        });

        // Reasoning text
        const bodyEl = card.querySelector('.outfit-card-body p');
        const reasoning = bodyEl ? bodyEl.textContent : '';
        if (reasoning) {
            ctx.fillStyle = textColor;
            ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.globalAlpha = 0.85;
            const lines = wrapText(ctx, reasoning, W - 60);
            let ty = y + imgSize * 1.25 + 40;
            lines.forEach(line => {
                if (ty < H - 40) {
                    ctx.fillText(line, 30, ty);
                    ty += 20;
                }
            });
            ctx.globalAlpha = 1;
        }

        // Footer
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('Created with Mirror', 30, H - 25);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], 'mirror-outfit.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: 'My Mirror Look', files: [file] });
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mirror-outfit.png';
            a.click();
            URL.revokeObjectURL(url);
        }
    } catch (err) {
        console.error('Share error:', err);
        alert('Could not share. Try saving a screenshot instead.');
    }
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    words.forEach(word => {
        const test = current ? current + ' ' + word : word;
        if (ctx.measureText(test).width > maxWidth) {
            if (current) lines.push(current);
            current = word;
        } else {
            current = test;
        }
    });
    if (current) lines.push(current);
    return lines;
}

// ── Style Learning ────────────────────────────────────────────────
async function getStyleLearningContext() {
    const outfits = await dbGetAllOutfits();
    if (outfits.length === 0) return '';

    const liked = outfits.filter(o => o.liked);
    const recent = outfits.sort((a, b) => b.savedAt.localeCompare(a.savedAt)).slice(0, 5);
    const items = await dbGetAllItems();

    let context = '\n\nSTYLE LEARNING — the user has saved ' + outfits.length + ' outfit(s).';

    if (liked.length > 0) {
        context += '\nLiked outfits (the user\'s favorites):';
        liked.slice(0, 5).forEach(o => {
            const names = (o.itemIds || []).map(id => {
                const item = items.find(i => i.id === id);
                return item ? (item.name || item.category) : 'unknown';
            }).join(', ');
            context += '\n- "' + o.name + '": ' + names;
            if (o.occasion) context += ' (occasion: ' + o.occasion + ')';
            if (o.mood) context += ' (mood: ' + o.mood + ')';
        });
    }

    if (recent.length > 0 && liked.length === 0) {
        context += '\nRecently saved outfits:';
        recent.forEach(o => {
            const names = (o.itemIds || []).map(id => {
                const item = items.find(i => i.id === id);
                return item ? (item.name || item.category) : 'unknown';
            }).join(', ');
            context += '\n- "' + o.name + '": ' + names;
        });
    }

    // Category preferences from saved outfits
    const catFreq = {};
    outfits.forEach(o => {
        (o.itemIds || []).forEach(id => {
            const item = items.find(i => i.id === id);
            if (item) catFreq[item.category] = (catFreq[item.category] || 0) + 1;
        });
    });
    const topCats = Object.entries(catFreq).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topCats.length > 0) {
        context += '\nMost-used categories in saved outfits: ' + topCats.map(c => c[0] + ' (' + c[1] + 'x)').join(', ');
    }

    context += '\nUse this history to inform your suggestions — lean toward similar styles and combinations the user has shown preference for, while still offering variety.\n';
    return context;
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
        if (!builderState.critique.error) {
            html += '<button class="primary-btn" id="save-built-btn" onclick="saveBuiltOutfit()">💾 Save This Outfit</button>';
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

// ── Saved Outfits Page ────────────────────────────────────────────
async function renderSaved() {
    const p = getProfile();
    if (!p) { window.location.href = '/onboarding.html'; return; }

    const c = document.getElementById('page-content');
    if (!c) return;

    const outfits = await dbGetAllOutfits();
    const items = await dbGetAllItems();
    outfits.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));

    let html =
        '<div class="page-header">' +
            '<h1>Saved Outfits</h1>' +
            '<p>' + outfits.length + ' outfit' + (outfits.length !== 1 ? 's' : '') + ' saved</p>' +
        '</div>';

    html += '<div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;">' +
        '<button class="secondary-btn" onclick="window.location.href=\'/calendar.html\'" style="flex:1;">📅 Calendar</button>' +
        '</div>';

    if (outfits.length === 0) {
        html += '<div class="empty-state">' +
            '<div class="empty-icon">💾</div>' +
            '<h3>No saved outfits yet</h3>' +
            '<p>Generate outfits or build your own and save them to see them here.</p>' +
            '<button class="primary-btn mt-1" onclick="window.location.href=\'/generate.html\'">✨ Generate Outfits</button>' +
            '</div>';
        c.innerHTML = html;
        renderNav('saved');
        return;
    }

    html += '<div style="display:flex;flex-direction:column;gap:1rem;">';
    outfits.forEach((outfit) => {
        const outfitItems = (outfit.itemIds || []).map(id => items.find(i => i.id === id)).filter(Boolean);

        html += '<div class="outfit-card" id="saved-card-' + outfit.id + '">';
        html += '<div class="outfit-card-header">' +
            '<h3>' + (outfit.name || 'Untitled Look') + '</h3>' +
            '<div class="outfit-card-actions">' +
                '<button class="icon-btn' + (outfit.liked ? ' liked' : '') + '" onclick="toggleOutfitLike(\'' + outfit.id + '\')" title="Like">' + ICONS.heart + '</button>' +
                '<button class="icon-btn" onclick="shareOutfitCard(\'saved-card-' + outfit.id + '\')" title="Share">' + ICONS.share + '</button>' +
                '<button class="icon-btn" onclick="deleteSavedOutfit(\'' + outfit.id + '\')" title="Delete" style="color:var(--negative);">' + ICONS.trash + '</button>' +
            '</div>' +
            '</div>';

        if (outfitItems.length > 0) {
            html += '<div class="outfit-card-items">';
            outfitItems.forEach(item => {
                html += '<img src="' + blobToObjectURL(item.imageBlob) + '" alt="' + (item.name || item.category) + '">';
            });
            html += '</div>';
        }

        html += '<div class="outfit-card-body">';
        if (outfit.reasoning) html += '<p>' + outfit.reasoning + '</p>';

        const meta = [];
        if (outfit.occasion) meta.push(outfit.occasion);
        if (outfit.mood) meta.push(outfit.mood);
        if (outfit.dressCode) meta.push(outfit.dressCode);
        if (outfit.source) meta.push(outfit.source === 'generated' ? 'AI Generated' : 'Custom Built');
        if (meta.length > 0) {
            html += '<div class="outfit-meta">' + meta.join(' · ') + '</div>';
        }

        if (outfit.wornDates && outfit.wornDates.length > 0) {
            html += '<div class="outfit-meta">Worn ' + outfit.wornDates.length + ' time' + (outfit.wornDates.length !== 1 ? 's' : '') + '</div>';
        }

        html += '<div class="outfit-meta" style="font-size:0.75rem;">' + new Date(outfit.savedAt).toLocaleDateString() + '</div>';
        html += '</div>';

        // Critique display if saved from builder
        if (outfit.critique && outfit.critique.positives) {
            html += '<div style="padding:0 1.25rem 1.25rem;display:flex;flex-direction:column;gap:0.5rem;">';
            html += '<div class="critique-section positive" style="padding:0.75rem;"><p style="font-size:0.8rem;">' + outfit.critique.positives + '</p></div>';
            if (outfit.critique.negatives) {
                html += '<div class="critique-section negative" style="padding:0.75rem;"><p style="font-size:0.8rem;">' + outfit.critique.negatives + '</p></div>';
            }
            html += '</div>';
        }

        html += '</div>';
    });
    html += '</div>';

    c.innerHTML = html;
    renderNav('saved');
}

async function toggleOutfitLike(id) {
    const outfit = await dbGetOutfit(id);
    if (!outfit) return;
    outfit.liked = !outfit.liked;
    await dbUpdateOutfit(outfit);
    renderSaved();
}

async function deleteSavedOutfit(id) {
    if (!confirm('Delete this saved outfit?')) return;
    await dbDeleteOutfit(id);
    renderSaved();
}

// ── Outfit Calendar Page ──────────────────────────────────────────
let calendarState = { year: new Date().getFullYear(), month: new Date().getMonth() };

async function renderCalendar() {
    const p = getProfile();
    if (!p) { window.location.href = '/onboarding.html'; return; }

    const c = document.getElementById('page-content');
    if (!c) return;

    const outfits = await dbGetAllOutfits();
    const items = await dbGetAllItems();
    const { year, month } = calendarState;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // Build worn date map: dateStr → outfit
    const dateOutfitMap = {};
    outfits.forEach(o => {
        (o.wornDates || []).forEach(d => {
            if (d.startsWith(year + '-' + String(month + 1).padStart(2, '0'))) {
                dateOutfitMap[d] = o;
            }
        });
    });

    let html =
        '<div class="page-header">' +
            '<h1>Outfit Calendar</h1>' +
            '<p>Plan and track what you wear</p>' +
        '</div>';

    // Month navigation
    html += '<div class="calendar-nav">' +
        '<button class="icon-btn" onclick="calendarPrev()">←</button>' +
        '<h2 class="calendar-month-label">' + monthNames[month] + ' ' + year + '</h2>' +
        '<button class="icon-btn" onclick="calendarNext()">→</button>' +
        '</div>';

    // Day headers
    html += '<div class="calendar-grid">';
    dayNames.forEach(d => { html += '<div class="calendar-day-header">' + d + '</div>'; });

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-cell empty"></div>';
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        const outfit = dateOutfitMap[dateStr];
        const isToday = isCurrentMonth && d === today.getDate();
        let cellClass = 'calendar-cell';
        if (isToday) cellClass += ' today';
        if (outfit) cellClass += ' has-outfit';

        html += '<div class="' + cellClass + '" onclick="openCalendarDay(\'' + dateStr + '\')">';
        html += '<span class="calendar-date">' + d + '</span>';
        if (outfit) {
            const firstItem = (outfit.itemIds || []).map(id => items.find(i => i.id === id)).filter(Boolean)[0];
            if (firstItem) {
                html += '<img class="calendar-thumb" src="' + blobToObjectURL(firstItem.thumbnailBlob || firstItem.imageBlob) + '" alt="">';
            } else {
                html += '<span class="calendar-dot"></span>';
            }
        }
        html += '</div>';
    }

    html += '</div>';

    // Back to saved
    html += '<button class="secondary-btn mt-1 text-center" onclick="window.location.href=\'/saved.html\'">← Back to Saved Outfits</button>';

    c.innerHTML = html;
    renderNav('saved');
}

function calendarPrev() {
    calendarState.month--;
    if (calendarState.month < 0) { calendarState.month = 11; calendarState.year--; }
    renderCalendar();
}

function calendarNext() {
    calendarState.month++;
    if (calendarState.month > 11) { calendarState.month = 0; calendarState.year++; }
    renderCalendar();
}

async function openCalendarDay(dateStr) {
    const outfits = await dbGetAllOutfits();
    const items = await dbGetAllItems();

    // Find outfit already assigned to this date
    const assigned = outfits.find(o => (o.wornDates || []).includes(dateStr));

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    let modalHtml = '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<h2>' + dateLabel + '</h2>';

    if (assigned) {
        const outfitItems = (assigned.itemIds || []).map(id => items.find(i => i.id === id)).filter(Boolean);
        modalHtml += '<p style="margin:0;font-weight:600;">' + (assigned.name || 'Outfit') + '</p>';
        if (outfitItems.length > 0) {
            modalHtml += '<div class="selected-strip">';
            outfitItems.forEach(item => {
                modalHtml += '<img src="' + blobToObjectURL(item.imageBlob) + '" alt="' + (item.name || item.category) + '">';
            });
            modalHtml += '</div>';
        }
        modalHtml += '<button class="secondary-btn" style="color:var(--negative);" onclick="removeCalendarOutfit(\'' + assigned.id + '\',\'' + dateStr + '\')">Remove from this day</button>';
    } else {
        if (outfits.length === 0) {
            modalHtml += '<p style="opacity:0.6;">No saved outfits to assign. Save some outfits first!</p>';
        } else {
            modalHtml += '<p style="margin:0;opacity:0.7;">Pick an outfit to wear on this day:</p>';
            modalHtml += '<div style="display:flex;flex-direction:column;gap:0.5rem;max-height:50vh;overflow-y:auto;">';
            outfits.forEach(o => {
                const outfitItems = (o.itemIds || []).map(id => items.find(i => i.id === id)).filter(Boolean);
                modalHtml += '<div class="calendar-pick-row" onclick="assignCalendarOutfit(\'' + o.id + '\',\'' + dateStr + '\')">' +
                    '<div class="calendar-pick-thumbs">';
                outfitItems.slice(0, 3).forEach(item => {
                    modalHtml += '<img src="' + blobToObjectURL(item.thumbnailBlob || item.imageBlob) + '" alt="">';
                });
                modalHtml += '</div>' +
                    '<span class="calendar-pick-name">' + (o.name || 'Outfit') + '</span>' +
                    '</div>';
            });
            modalHtml += '</div>';
        }
    }

    modalHtml += '<button class="secondary-btn" onclick="closeModal()">Close</button>';
    modalHtml += '</div>';

    overlay.innerHTML = modalHtml;
    document.body.appendChild(overlay);
}

async function assignCalendarOutfit(outfitId, dateStr) {
    const outfit = await dbGetOutfit(outfitId);
    if (!outfit) return;
    if (!outfit.wornDates) outfit.wornDates = [];
    if (!outfit.wornDates.includes(dateStr)) {
        outfit.wornDates.push(dateStr);
        await dbUpdateOutfit(outfit);
    }
    closeModal();
    renderCalendar();
}

async function removeCalendarOutfit(outfitId, dateStr) {
    const outfit = await dbGetOutfit(outfitId);
    if (!outfit) return;
    outfit.wornDates = (outfit.wornDates || []).filter(d => d !== dateStr);
    await dbUpdateOutfit(outfit);
    closeModal();
    renderCalendar();
}

// ── Outfit of the Day ─────────────────────────────────────────────
let ootdState = { result: null, loading: false };

async function renderOOTD() {
    const p = getProfile();
    if (!p) { window.location.href = '/onboarding.html'; return; }

    const c = document.getElementById('page-content');
    if (!c) return;

    const items = await dbGetAllItems();
    const availableItems = items.filter(i => i.available !== false);
    const weather = await fetchWeather();

    let html =
        '<div class="page-header">' +
            '<h1>Outfit of the Day</h1>' +
            '<p>Your AI-curated look for today</p>' +
        '</div>';

    html += '<div id="weather-slot">' + renderWeatherWidget(weather) + '</div>';

    if (availableItems.length < 3) {
        html += '<div class="notice">You need at least 3 available items to get an OOTD. ' +
            '<a href="/wardrobe.html">Add items →</a></div>';
        c.innerHTML = html;
        renderNav('generate');
        return;
    }

    if (ootdState.loading) {
        html += '<div class="ootd-loading">' +
            '<span class="spinner"></span>' +
            '<p>Picking the perfect look for today...</p>' +
            '</div>';
    } else if (ootdState.result) {
        const outfit = ootdState.result;
        html += '<div class="ootd-card" id="ootd-card">';
        html += '<div class="ootd-badge">☀️ Today\'s Look</div>';
        html += '<h2 style="margin:0 0 0.5rem;">' + (outfit.name || 'Your Look') + '</h2>';
        if (outfit.itemImages && outfit.itemImages.length > 0) {
            html += '<div class="outfit-card-items">';
            outfit.itemImages.forEach(img => {
                html += '<img src="' + img.url + '" alt="' + (img.label || '') + '">';
            });
            html += '</div>';
        }
        html += '<div class="outfit-card-body"><p>' + (outfit.reasoning || '') + '</p></div>';
        html += '<div class="ootd-actions">' +
            '<button class="primary-btn" onclick="saveOOTD()">💾 Save</button>' +
            '<button class="secondary-btn" onclick="shareOutfitCard(\'ootd-card\')">📤 Share</button>' +
            '</div>';
        html += '</div>';
    } else {
        html += '<div class="ootd-prompt">' +
            '<div class="ootd-prompt-icon">✨</div>' +
            '<p>Tap below to get your personalized outfit for today, based on the weather, your style, and what\'s in your closet.</p>' +
            '<button class="primary-btn" onclick="generateOOTD()">Get Today\'s Outfit</button>' +
            '</div>';
    }

    html += '<button class="secondary-btn mt-1" style="width:100%;" onclick="ootdState.result=null;generateOOTD()">🔄 Get a Different Look</button>';

    c.innerHTML = html;
    renderNav('generate');
}

async function generateOOTD() {
    ootdState.loading = true;
    ootdState.result = null;
    renderOOTD();

    const items = await dbGetAllItems();
    const availableItems = items.filter(i => i.available !== false);
    const profile = getProfile();
    const weather = await fetchWeather();
    const styleLearning = await getStyleLearningContext();

    // Check calendar for today
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const outfits = await dbGetAllOutfits();
    const todayOutfit = outfits.find(o => (o.wornDates || []).includes(todayStr));

    const itemPayloads = await Promise.all(availableItems.map(async (item) => {
        const base64 = await blobToBase64(item.imageBlob);
        return {
            category: item.category,
            name: item.name || '',
            notes: item.notes || '',
            image: base64,
        };
    }));

    try {
        const requestBody = {
            items: itemPayloads,
            occasion: todayOutfit ? 'Continue with planned outfit' : 'Daily wear — whatever the day brings',
            mood: 'Confident and comfortable',
            dressCode: 'casual',
            profile: { vibe: profile.vibe, expression: profile.expression, adventure: profile.adventure, name: profile.name },
            styleLearning: styleLearning,
            ootdMode: true,
        };

        if (weather) {
            requestBody.weather = { temp: weather.temp, desc: weather.desc, season: weather.season };
        }

        const response = await fetch('/api/generate-outfit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) throw new Error('API error');

        const data = await response.json();
        const outfit = (data.outfits || [])[0];

        if (outfit) {
            const matchedItems = (outfit.itemIndices || []).map(idx => {
                const item = availableItems[idx - 1];
                if (!item) return null;
                return { id: item.id, url: blobToObjectURL(item.imageBlob), label: item.name || item.category };
            }).filter(Boolean);

            ootdState.result = {
                name: outfit.name || 'Today\'s Look',
                reasoning: outfit.reasoning || '',
                itemImages: matchedItems,
                itemIds: matchedItems.map(m => m.id),
            };
        }
    } catch (err) {
        console.error('OOTD error:', err);
        ootdState.result = { name: 'Could not generate', reasoning: 'Something went wrong. Try again!', itemImages: [], itemIds: [] };
    }

    ootdState.loading = false;
    renderOOTD();
}

async function saveOOTD() {
    if (!ootdState.result || !ootdState.result.itemIds || ootdState.result.itemIds.length === 0) return;
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    const saved = {
        id: crypto.randomUUID(),
        name: ootdState.result.name || 'OOTD',
        itemIds: ootdState.result.itemIds,
        reasoning: ootdState.result.reasoning || '',
        occasion: 'Outfit of the Day',
        mood: '',
        dressCode: '',
        source: 'ootd',
        critique: null,
        liked: false,
        wornDates: [todayStr],
        savedAt: new Date().toISOString(),
    };

    await dbAddOutfit(saved);
    alert('Outfit of the Day saved!');
}

// ── Outfit Remix ──────────────────────────────────────────────────
let remixState = { pinnedItemId: null, results: null, loading: false };

async function startRemix(itemId) {
    remixState.pinnedItemId = itemId;
    remixState.results = null;
    remixState.loading = true;

    // Show loading in a modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
    overlay.innerHTML = '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<h2>🔀 Remixing...</h2>' +
        '<div style="text-align:center;padding:2rem;">' +
            '<span class="spinner"></span>' +
            '<p>Finding 5 ways to wear this item...</p>' +
        '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    const items = await dbGetAllItems();
    const pinnedItem = items.find(i => i.id === itemId);
    if (!pinnedItem) { closeModal(); return; }

    const availableItems = items.filter(i => i.available !== false);
    const profile = getProfile();
    const styleLearning = await getStyleLearningContext();

    const itemPayloads = await Promise.all(availableItems.map(async (item) => {
        const base64 = await blobToBase64(item.imageBlob);
        return {
            category: item.category,
            name: item.name || '',
            notes: item.notes || '',
            image: base64,
        };
    }));

    const pinnedIdx = availableItems.findIndex(i => i.id === itemId) + 1;

    try {
        const requestBody = {
            items: itemPayloads,
            occasion: 'Versatile — show different ways to style this piece',
            mood: 'Varied — show range from casual to dressy',
            dressCode: '',
            profile: { vibe: profile.vibe, expression: profile.expression, adventure: profile.adventure, name: profile.name },
            styleLearning: styleLearning,
            remixMode: true,
            pinnedItemIndex: pinnedIdx,
            pinnedItemName: pinnedItem.name || pinnedItem.category,
        };

        const response = await fetch('/api/generate-outfit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) throw new Error('API error');

        const data = await response.json();
        remixState.results = (data.outfits || []).map(outfit => {
            const matchedItems = (outfit.itemIndices || []).map(idx => {
                const item = availableItems[idx - 1];
                if (!item) return null;
                return { id: item.id, url: blobToObjectURL(item.imageBlob), label: item.name || item.category };
            }).filter(Boolean);
            return {
                name: outfit.name || '',
                reasoning: outfit.reasoning || '',
                itemImages: matchedItems,
                itemIds: matchedItems.map(m => m.id),
            };
        });
    } catch (err) {
        console.error('Remix error:', err);
        remixState.results = [{ name: 'Could not generate', reasoning: 'Something went wrong.', itemImages: [], itemIds: [] }];
    }

    remixState.loading = false;

    // Update modal with results
    const modal = document.querySelector('.modal-sheet');
    if (!modal) return;

    let modalHtml = '<h2>🔀 5 Ways to Wear: ' + (pinnedItem.name || CATEGORIES.find(c => c.id === pinnedItem.category)?.label || 'This Item') + '</h2>';
    modalHtml += '<div style="display:flex;flex-direction:column;gap:1rem;max-height:60vh;overflow-y:auto;">';

    (remixState.results || []).forEach((outfit, idx) => {
        modalHtml += '<div class="outfit-card" id="remix-card-' + idx + '">';
        modalHtml += '<div class="outfit-card-header"><h3>' + (outfit.name || 'Look ' + (idx + 1)) + '</h3>' +
            '<div class="outfit-card-actions">' +
                '<button class="icon-btn" onclick="saveRemixOutfit(' + idx + ')" title="Save">' + ICONS.saved + '</button>' +
            '</div>' +
            '</div>';
        if (outfit.itemImages.length > 0) {
            modalHtml += '<div class="outfit-card-items">';
            outfit.itemImages.forEach(img => {
                modalHtml += '<img src="' + img.url + '" alt="' + (img.label || '') + '">';
            });
            modalHtml += '</div>';
        }
        modalHtml += '<div class="outfit-card-body"><p>' + (outfit.reasoning || '') + '</p></div>';
        modalHtml += '</div>';
    });

    modalHtml += '</div>';
    modalHtml += '<button class="secondary-btn" onclick="closeModal()">Close</button>';
    modal.innerHTML = modalHtml;
}

async function saveRemixOutfit(idx) {
    const outfit = remixState.results[idx];
    if (!outfit || !outfit.itemIds || outfit.itemIds.length === 0) return;

    const saved = {
        id: crypto.randomUUID(),
        name: outfit.name || 'Remix Look',
        itemIds: outfit.itemIds,
        reasoning: outfit.reasoning || '',
        occasion: '',
        mood: '',
        dressCode: '',
        source: 'remix',
        critique: null,
        liked: false,
        wornDates: [],
        savedAt: new Date().toISOString(),
    };

    await dbAddOutfit(saved);
    const btn = document.querySelector('#remix-card-' + idx + ' .icon-btn');
    if (btn) { btn.style.color = 'var(--positive)'; btn.innerHTML = '✓'; }
}

// ── Batch Scan (Wardrobe Import from Photos) ──────────────────────
let batchScanState = { detecting: false, detected: [], imageData: null };

function openBatchScanModal() {
    batchScanState = { detecting: false, detected: [], imageData: null };

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    overlay.innerHTML =
        '<div class="modal-sheet" onclick="event.stopPropagation()">' +
            '<h2>📸 Batch Scan</h2>' +
            '<p style="opacity:0.7;margin:0 0 1rem;">Take a photo of your closet, clothing rack, or flat lay — AI will detect and categorize every item.</p>' +
            '<div class="upload-area" id="scan-upload-area" onclick="triggerScanInput()">' +
                ICONS.scan +
                '<p>Tap to take a photo of multiple items</p>' +
            '</div>' +
            '<input type="file" id="scan-file-input" accept="image/*" capture="environment" style="display:none" onchange="handleScanFile(event)">' +
            '<div id="scan-preview" class="hidden"></div>' +
            '<div id="scan-results"></div>' +
            '<button class="secondary-btn" onclick="closeModal()">Cancel</button>' +
        '</div>';

    document.body.appendChild(overlay);
}

function triggerScanInput() {
    document.getElementById('scan-file-input')?.click();
}

async function handleScanFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = async (e) => {
        batchScanState.imageData = e.target.result;
        const preview = document.getElementById('scan-preview');
        const uploadArea = document.getElementById('scan-upload-area');
        if (preview) {
            preview.innerHTML = '<img class="item-detail-img" src="' + e.target.result + '" alt="Scan">';
            preview.classList.remove('hidden');
        }
        if (uploadArea) uploadArea.classList.add('hidden');

        // Start detection
        batchScanState.detecting = true;
        const results = document.getElementById('scan-results');
        if (results) results.innerHTML = '<div style="text-align:center;padding:1rem;"><span class="spinner"></span><p>AI is detecting items...</p></div>';

        try {
            const response = await fetch('/api/detect-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: e.target.result }),
            });

            if (!response.ok) throw new Error('Detection failed');

            const data = await response.json();
            batchScanState.detected = data.items || [];
            batchScanState.detecting = false;
            renderScanResults();
        } catch (err) {
            console.error('Scan error:', err);
            batchScanState.detecting = false;
            if (results) results.innerHTML = '<p style="color:var(--negative);">Detection failed. Try again with a clearer photo.</p>';
        }
    };
    reader.readAsDataURL(file);
}

function renderScanResults() {
    const results = document.getElementById('scan-results');
    if (!results) return;

    if (batchScanState.detected.length === 0) {
        results.innerHTML = '<p>No items detected. Try a clearer photo with items spread out.</p>';
        return;
    }

    let html = '<h3 style="margin:1rem 0 0.5rem;">' + batchScanState.detected.length + ' items detected</h3>';
    html += '<div style="display:flex;flex-direction:column;gap:0.5rem;">';

    batchScanState.detected.forEach((item, idx) => {
        const catEmoji = CATEGORIES.find(c => c.id === item.category)?.emoji || '👕';
        html += '<div class="scan-item-row" id="scan-item-' + idx + '">' +
            '<div class="scan-item-info">' +
                '<span class="scan-item-emoji">' + catEmoji + '</span>' +
                '<div>' +
                    '<div class="scan-item-name">' + (item.name || 'Unknown Item') + '</div>' +
                    '<div class="scan-item-cat">' + (item.category || 'tops') + (item.notes ? ' · ' + item.notes : '') + '</div>' +
                '</div>' +
            '</div>' +
            '<button class="icon-btn" onclick="toggleScanItem(' + idx + ')" id="scan-toggle-' + idx + '" style="color:var(--positive);">✓</button>' +
            '</div>';
    });

    html += '</div>';
    html += '<button class="primary-btn mt-1" onclick="importScannedItems()">Import Selected Items</button>';

    results.innerHTML = html;
}

function toggleScanItem(idx) {
    const btn = document.getElementById('scan-toggle-' + idx);
    const row = document.getElementById('scan-item-' + idx);
    if (!btn || !row) return;

    if (btn.style.color === 'var(--muted)') {
        btn.style.color = 'var(--positive)';
        btn.textContent = '✓';
        row.style.opacity = '1';
    } else {
        btn.style.color = 'var(--muted)';
        btn.textContent = '✗';
        row.style.opacity = '0.4';
    }
}

async function importScannedItems() {
    const selected = [];
    batchScanState.detected.forEach((item, idx) => {
        const btn = document.getElementById('scan-toggle-' + idx);
        if (btn && btn.style.color !== 'var(--muted)') {
            selected.push(item);
        }
    });

    if (selected.length === 0) { alert('No items selected.'); return; }

    // Create a placeholder image for scanned items (no individual photos)
    const placeholderCanvas = document.createElement('canvas');
    placeholderCanvas.width = 200;
    placeholderCanvas.height = 200;
    const pCtx = placeholderCanvas.getContext('2d');
    const bgColor = getComputedStyle(document.body).getPropertyValue('--card-bg').trim() || '#111';
    pCtx.fillStyle = bgColor;
    pCtx.fillRect(0, 0, 200, 200);
    pCtx.fillStyle = '#666';
    pCtx.font = '48px sans-serif';
    pCtx.textAlign = 'center';
    pCtx.textBaseline = 'middle';

    for (const item of selected) {
        const catEmoji = CATEGORIES.find(c => c.id === item.category)?.emoji || '👕';
        pCtx.clearRect(0, 0, 200, 200);
        pCtx.fillStyle = bgColor;
        pCtx.fillRect(0, 0, 200, 200);
        pCtx.fillStyle = '#666';
        pCtx.font = '48px sans-serif';
        pCtx.fillText(catEmoji, 100, 80);
        pCtx.font = '14px sans-serif';
        pCtx.fillText(item.name || item.category, 100, 140);

        const blob = await new Promise(r => placeholderCanvas.toBlob(r, 'image/jpeg', 0.8));

        await dbAddItem({
            id: crypto.randomUUID(),
            category: item.category || 'tops',
            name: item.name || '',
            notes: item.notes || '',
            brand: '',
            price: null,
            purchaseDate: null,
            imageBlob: blob,
            thumbnailBlob: blob,
            available: true,
            addedAt: new Date().toISOString(),
        });
    }

    closeModal();
    alert(selected.length + ' item(s) imported! You can update their photos individually.');
    renderWardrobe();
}

// ── Seasonal Rotation ─────────────────────────────────────────────
async function showSeasonalAdvice() {
    const weather = await fetchWeather();
    const currentSeason = weather ? weather.season : getSeason(40);
    const items = await dbGetAllItems();
    const counts = {};
    CATEGORIES.forEach(cat => counts[cat.id] = 0);
    items.forEach(item => { if (counts[item.category] !== undefined) counts[item.category]++; });

    const suggestions = SEASON_ITEMS[currentSeason] || [];
    const otherSeasons = SEASONS.filter(s => s !== currentSeason);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    let modalHtml = '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<h2>' + ICONS.sun + ' Seasonal Guide</h2>' +
        '<div class="seasonal-badge">' + currentSeason + '</div>';

    // Current season essentials
    modalHtml += '<div class="card" style="margin:1rem 0;">' +
        '<h3 style="margin:0 0 0.5rem;">' + currentSeason + ' Essentials</h3>' +
        '<p style="margin:0;opacity:0.7;font-size:0.85rem;">Make sure you have these for the current season:</p>' +
        '<div class="seasonal-items">';
    suggestions.forEach(s => {
        modalHtml += '<span class="seasonal-tag">' + s + '</span>';
    });
    modalHtml += '</div></div>';

    // Capsule wardrobe recommendation
    const totalItems = items.length;
    const capsuleTarget = 33;
    modalHtml += '<div class="card" style="margin:0 0 1rem;">' +
        '<h3 style="margin:0 0 0.5rem;">Capsule Wardrobe</h3>';
    if (totalItems <= capsuleTarget) {
        modalHtml += '<p style="margin:0;opacity:0.7;font-size:0.85rem;">You have ' + totalItems + ' items — that\'s a lean wardrobe! A typical capsule wardrobe has about 33 pieces. You\'re ' + (totalItems < capsuleTarget ? 'well within range.' : 'right at the sweet spot.') + '</p>';
    } else {
        modalHtml += '<p style="margin:0;opacity:0.7;font-size:0.85rem;">You have ' + totalItems + ' items. Consider archiving ' + (totalItems - capsuleTarget) + ' items for the off-season to create a focused capsule wardrobe of ~33 pieces.</p>';
    }
    modalHtml += '</div>';

    // Off-season items to store
    modalHtml += '<div class="card" style="margin:0 0 1rem;">' +
        '<h3 style="margin:0 0 0.5rem;">Consider Storing for Off-Season</h3>' +
        '<p style="margin:0;opacity:0.7;font-size:0.85rem;">These categories are less needed in ' + currentSeason + ':</p>' +
        '<div class="seasonal-items">';

    const offSeasonCats = {
        Spring: ['heavy coats', 'thick scarves'],
        Summer: ['heavy coats', 'boots', 'scarves', 'thick sweaters'],
        Fall: ['sandals', 'tank tops', 'swim wear'],
        Winter: ['sandals', 'shorts', 'tank tops', 'sunglasses'],
    };
    (offSeasonCats[currentSeason] || []).forEach(s => {
        modalHtml += '<span class="seasonal-tag off-season">' + s + '</span>';
    });
    modalHtml += '</div></div>';

    // Mark items as stored
    modalHtml += '<p style="opacity:0.6;font-size:0.8rem;">Tip: Use the "Available to wear" toggle on individual items to mark off-season items as stored.</p>';

    modalHtml += '<button class="secondary-btn" onclick="closeModal()">Got It</button>';
    modalHtml += '</div>';

    overlay.innerHTML = modalHtml;
    document.body.appendChild(overlay);
}

// ── Community / Social Feed ───────────────────────────────────────
async function renderCommunity() {
    const p = getProfile();
    if (!p) { window.location.href = '/onboarding.html'; return; }

    const c = document.getElementById('page-content');
    if (!c) return;

    const outfits = await dbGetAllOutfits();
    const items = await dbGetAllItems();

    // Show shared outfits + import option
    const sharedOutfits = outfits.filter(o => o.shared);
    const allOutfits = outfits.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));

    let html =
        '<div class="page-header">' +
            '<h1>Community</h1>' +
            '<p>Share your looks & import outfit ideas</p>' +
        '</div>';

    // Export / Import section
    html += '<div class="card">' +
        '<h3 style="margin:0 0 0.5rem;">Share & Import</h3>' +
        '<div style="display:flex;gap:0.5rem;">' +
            '<button class="secondary-btn" style="flex:1;font-size:0.85rem;" onclick="exportOutfitCodes()">📤 Export My Looks</button>' +
            '<button class="secondary-btn" style="flex:1;font-size:0.85rem;" onclick="openImportModal()">📥 Import Look</button>' +
        '</div>' +
        '</div>';

    // Your shared looks
    html += '<h3 style="margin:1rem 0 0.5rem;">Your Outfit Feed</h3>';

    if (allOutfits.length === 0) {
        html += '<div class="empty-state">' +
            '<div class="empty-icon">👥</div>' +
            '<h3>No outfits yet</h3>' +
            '<p>Save some outfits to see them in your feed.</p>' +
            '</div>';
    } else {
        html += '<div class="feed-grid">';
        allOutfits.forEach(outfit => {
            const outfitItems = (outfit.itemIds || []).map(id => items.find(i => i.id === id)).filter(Boolean);
            const firstItem = outfitItems[0];
            const thumbUrl = firstItem ? blobToObjectURL(firstItem.thumbnailBlob || firstItem.imageBlob) : '';

            html += '<div class="feed-card" onclick="openFeedDetail(\'' + outfit.id + '\')">' +
                (thumbUrl ? '<img class="feed-thumb" src="' + thumbUrl + '" alt="">' : '<div class="feed-thumb-placeholder">✨</div>') +
                '<div class="feed-info">' +
                    '<span class="feed-name">' + (outfit.name || 'Outfit') + '</span>' +
                    '<span class="feed-date">' + new Date(outfit.savedAt).toLocaleDateString() + '</span>' +
                '</div>' +
                '</div>';
        });
        html += '</div>';
    }

    c.innerHTML = html;
    renderNav('generate');
}

async function exportOutfitCodes() {
    const outfits = await dbGetAllOutfits();
    const items = await dbGetAllItems();

    if (outfits.length === 0) { alert('No outfits to export.'); return; }

    const exportData = outfits.slice(0, 10).map(o => {
        const outfitItems = (o.itemIds || []).map(id => {
            const item = items.find(i => i.id === id);
            return item ? { name: item.name || item.category, category: item.category, notes: item.notes, brand: item.brand || '' } : null;
        }).filter(Boolean);
        return {
            name: o.name || 'Outfit',
            items: outfitItems,
            occasion: o.occasion || '',
            mood: o.mood || '',
            reasoning: o.reasoning || '',
        };
    });

    const code = btoa(unescape(encodeURIComponent(JSON.stringify(exportData))));

    // Copy to clipboard
    try {
        await navigator.clipboard.writeText(code);
        alert('Share code copied to clipboard! Send it to friends so they can import your looks.');
    } catch {
        // Fallback: show in a modal
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'add-item-modal';
        overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
        overlay.innerHTML = '<div class="modal-sheet" onclick="event.stopPropagation()">' +
            '<h2>Share Code</h2>' +
            '<p>Copy this code and send it to friends:</p>' +
            '<textarea class="text-input" style="height:120px;font-size:0.7rem;" readonly>' + code + '</textarea>' +
            '<button class="secondary-btn" onclick="closeModal()">Close</button>' +
            '</div>';
        document.body.appendChild(overlay);
    }
}

function openImportModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
    overlay.innerHTML = '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<h2>📥 Import Outfit</h2>' +
        '<p style="opacity:0.7;">Paste a share code from a friend to see their outfit ideas.</p>' +
        '<textarea class="text-input" id="import-code" style="height:100px;" placeholder="Paste share code here..."></textarea>' +
        '<button class="primary-btn" onclick="importOutfitCode()">Import</button>' +
        '<button class="secondary-btn" onclick="closeModal()">Cancel</button>' +
        '</div>';
    document.body.appendChild(overlay);
}

async function importOutfitCode() {
    const codeEl = document.getElementById('import-code');
    if (!codeEl || !codeEl.value.trim()) return;

    try {
        const json = decodeURIComponent(escape(atob(codeEl.value.trim())));
        const data = JSON.parse(json);

        if (!Array.isArray(data)) throw new Error('Invalid format');

        let count = 0;
        for (const outfit of data) {
            await dbAddOutfit({
                id: crypto.randomUUID(),
                name: (outfit.name || 'Imported Look') + ' (imported)',
                itemIds: [],
                reasoning: outfit.reasoning || '',
                occasion: outfit.occasion || '',
                mood: outfit.mood || '',
                dressCode: '',
                source: 'imported',
                critique: null,
                liked: false,
                wornDates: [],
                savedAt: new Date().toISOString(),
                importedItems: outfit.items || [],
            });
            count++;
        }

        closeModal();
        alert(count + ' outfit(s) imported! Check your Saved Outfits.');
        renderCommunity();
    } catch (err) {
        alert('Invalid share code. Make sure you copied the whole thing.');
    }
}

async function openFeedDetail(outfitId) {
    const outfit = await dbGetOutfit(outfitId);
    if (!outfit) return;
    const items = await dbGetAllItems();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    const outfitItems = (outfit.itemIds || []).map(id => items.find(i => i.id === id)).filter(Boolean);

    let modalHtml = '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<h2>' + (outfit.name || 'Outfit') + '</h2>';

    if (outfitItems.length > 0) {
        modalHtml += '<div class="outfit-card-items">';
        outfitItems.forEach(item => {
            modalHtml += '<img src="' + blobToObjectURL(item.imageBlob) + '" alt="' + (item.name || item.category) + '">';
        });
        modalHtml += '</div>';
    }

    // Show imported item descriptions if no actual items
    if (outfitItems.length === 0 && outfit.importedItems) {
        modalHtml += '<div style="margin:0.5rem 0;">';
        outfit.importedItems.forEach(item => {
            const catEmoji = CATEGORIES.find(c => c.id === item.category)?.emoji || '👕';
            modalHtml += '<div class="scan-item-row" style="cursor:default;">' +
                '<div class="scan-item-info">' +
                    '<span class="scan-item-emoji">' + catEmoji + '</span>' +
                    '<div><div class="scan-item-name">' + (item.name || 'Item') + '</div>' +
                    '<div class="scan-item-cat">' + (item.brand ? item.brand + ' · ' : '') + item.category + '</div></div>' +
                '</div></div>';
        });
        modalHtml += '</div>';
    }

    if (outfit.reasoning) modalHtml += '<p style="opacity:0.8;">' + outfit.reasoning + '</p>';

    const meta = [];
    if (outfit.occasion) meta.push(outfit.occasion);
    if (outfit.mood) meta.push(outfit.mood);
    if (outfit.source) meta.push(outfit.source);
    if (meta.length > 0) modalHtml += '<div class="outfit-meta">' + meta.join(' · ') + '</div>';

    modalHtml += '<button class="secondary-btn" onclick="closeModal()">Close</button></div>';

    overlay.innerHTML = modalHtml;
    document.body.appendChild(overlay);
}

// ── Style Challenges & Streaks ────────────────────────────────────
function getChallengeData() {
    try { return JSON.parse(localStorage.getItem(CHALLENGES_KEY) || '{}'); } catch { return {}; }
}

function saveChallengeData(data) {
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(data));
}

function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
}

function getDailyChallenge() {
    const today = getTodayStr();
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
}

function calculateStreak(data) {
    const completed = data.completed || {};
    const dates = Object.keys(completed).sort().reverse();
    if (dates.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        if (completed[ds]) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }
    return streak;
}

async function renderChallenges() {
    const c = document.getElementById('page-content');
    if (!c) return;

    const data = getChallengeData();
    const today = getTodayStr();
    const todayChallenge = getDailyChallenge();
    const streak = calculateStreak(data);
    const isCompleted = data.completed && data.completed[today];
    const totalCompleted = Object.keys(data.completed || {}).length;

    let html =
        '<div class="page-header">' +
            '<h1>Style Challenges</h1>' +
            '<p>Push your style boundaries every day</p>' +
        '</div>';

    // Streak card
    html += '<div class="card challenge-streak-card">' +
        '<div class="streak-display">' +
            '<span class="streak-fire">🔥</span>' +
            '<span class="streak-number">' + streak + '</span>' +
        '</div>' +
        '<div class="streak-label">' + (streak === 1 ? '1 Day Streak' : streak + ' Day Streak') + '</div>' +
        '<div class="streak-sub">' + totalCompleted + ' challenges completed all time</div>' +
        '</div>';

    // Today's challenge
    html += '<div class="card challenge-today">' +
        '<div class="challenge-icon">' + todayChallenge.icon + '</div>' +
        '<h3>Today\'s Challenge</h3>' +
        '<h2 class="challenge-title">' + todayChallenge.title + '</h2>' +
        '<p class="challenge-desc">' + todayChallenge.desc + '</p>';

    if (isCompleted) {
        html += '<div class="challenge-done-badge">Completed today!</div>';
    } else {
        html += '<button class="primary-btn" onclick="completeChallenge()">I Did It!</button>';
    }
    html += '</div>';

    // Recent history
    const completed = data.completed || {};
    const recentDates = Object.keys(completed).sort().reverse().slice(0, 7);
    if (recentDates.length > 0) {
        html += '<div class="card">' +
            '<h3 style="margin:0 0 0.75rem;">Recent Challenges</h3>';
        recentDates.forEach(date => {
            const ch = DAILY_CHALLENGES.find(x => x.id === completed[date]) || { icon: '?', title: 'Challenge' };
            html += '<div class="challenge-history-row">' +
                '<span>' + ch.icon + ' ' + ch.title + '</span>' +
                '<span style="opacity:0.5;">' + new Date(date + 'T12:00:00').toLocaleDateString() + '</span>' +
                '</div>';
        });
        html += '</div>';
    }

    // All challenges preview
    html += '<div class="card">' +
        '<h3 style="margin:0 0 0.75rem;">All Challenges</h3>';
    DAILY_CHALLENGES.forEach(ch => {
        const done = Object.values(completed).includes(ch.id);
        html += '<div class="challenge-list-row' + (done ? ' done' : '') + '">' +
            '<span>' + ch.icon + ' ' + ch.title + '</span>' +
            (done ? '<span style="color:var(--accent);">Done</span>' : '') +
            '</div>';
    });
    html += '</div>';

    c.innerHTML = html;
    renderNav('generate');
}

function completeChallenge() {
    const data = getChallengeData();
    if (!data.completed) data.completed = {};
    const today = getTodayStr();
    const todayChallenge = getDailyChallenge();
    data.completed[today] = todayChallenge.id;
    saveChallengeData(data);
    renderChallenges();
}

// ── AI Style Report ───────────────────────────────────────────────
async function generateStyleReport() {
    const items = await dbGetAllItems();
    const outfits = await dbGetAllOutfits();
    const profile = getProfile();

    if (items.length === 0) {
        alert('Add some items to your wardrobe first to generate a style report.');
        return;
    }

    const counts = {};
    items.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });

    const occasions = {};
    const moods = {};
    outfits.forEach(o => {
        if (o.occasion) occasions[o.occasion] = (occasions[o.occasion] || 0) + 1;
        if (o.mood) moods[o.mood] = (moods[o.mood] || 0) + 1;
    });

    const topItemCounts = {};
    outfits.forEach(o => {
        (o.itemIds || []).forEach(id => { topItemCounts[id] = (topItemCounts[id] || 0) + 1; });
    });
    const topItems = Object.entries(topItemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([id, count]) => {
            const item = items.find(i => i.id === id);
            return { name: item ? (item.name || item.category) : id, count };
        });

    const pricedItems = items.filter(i => i.price && i.price > 0);
    const totalSpent = pricedItems.reduce((sum, i) => sum + i.price, 0);

    const stats = {
        totalItems: items.length,
        totalOutfits: outfits.length,
        likedOutfits: outfits.filter(o => o.liked).length,
        categoryBreakdown: counts,
        topItems,
        occasions,
        moods,
        totalSpent: totalSpent.toFixed(2),
        avgCostPerWear: pricedItems.length > 0 ? (totalSpent / pricedItems.length).toFixed(2) : '0',
    };

    // Show loading modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
    overlay.innerHTML = '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<h2>📊 Style Report</h2>' +
        '<div class="ootd-loading"><div class="spinner"></div><p>Analyzing your style...</p></div>' +
        '</div>';
    document.body.appendChild(overlay);

    try {
        const res = await fetch('/api/style-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stats, profile }),
        });

        if (!res.ok) throw new Error('API error');
        const report = await res.json();

        const sheet = overlay.querySelector('.modal-sheet');
        sheet.innerHTML =
            '<h2>📊 ' + (report.title || 'Your Style Report') + '</h2>' +
            '<div class="style-report">' +
                '<div class="report-score">' +
                    '<div class="score-circle">' + (report.styleScore || 75) + '</div>' +
                    '<div class="score-label">Style Score</div>' +
                '</div>' +
                '<div class="report-section">' +
                    '<h4>Style Personality</h4>' +
                    '<p>' + (report.stylePersonality || '') + '</p>' +
                '</div>' +
                '<div class="report-section">' +
                    '<h4>Key Insight</h4>' +
                    '<p>' + (report.topInsight || '') + '</p>' +
                '</div>' +
                '<div class="report-section">' +
                    '<h4>Color Story</h4>' +
                    '<p>' + (report.colorStory || '') + '</p>' +
                '</div>' +
                (report.suggestions ? '<div class="report-section"><h4>Suggestions</h4><ul>' +
                    report.suggestions.map(s => '<li>' + s + '</li>').join('') + '</ul></div>' : '') +
                (report.challenge ? '<div class="report-section challenge-card">' +
                    '<h4>Next Month\'s Challenge</h4><p>' + report.challenge + '</p></div>' : '') +
            '</div>' +
            '<button class="secondary-btn" onclick="closeModal()">Close</button>';
    } catch (err) {
        const sheet = overlay.querySelector('.modal-sheet');
        sheet.innerHTML =
            '<h2>📊 Style Report</h2>' +
            '<p style="text-align:center;">Could not generate report. Make sure OPENAI_API_KEY is configured.</p>' +
            '<button class="secondary-btn" onclick="closeModal()">Close</button>';
    }
}

// ── Laundry Tracker ───────────────────────────────────────────────
async function showLaundryStatus() {
    const items = await dbGetAllItems();
    const dirtyItems = items.filter(i => i.laundry === true);
    const cleanItems = items.filter(i => i.laundry !== true && i.available !== false);
    const totalReady = cleanItems.length;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    let html = '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<h2>' + ICONS.wash + ' Laundry Tracker</h2>';

    // Summary
    html += '<div class="wardrobe-stats" style="margin-bottom:1rem;">' +
        '<div class="stat-card"><div class="stat-num">' + cleanItems.length + '</div><div class="stat-label">Clean</div></div>' +
        '<div class="stat-card"><div class="stat-num">' + dirtyItems.length + '</div><div class="stat-label">In Laundry</div></div>' +
        '</div>';

    // Warning if running low
    if (totalReady < 5 && items.length > 5) {
        html += '<div class="notice" style="margin-bottom:1rem;">⚠️ Running low on clean clothes! Only ' + totalReady + ' items ready to wear.</div>';
    }

    // Dirty items by category
    if (dirtyItems.length > 0) {
        html += '<h3 style="margin:0 0 0.5rem;">In the Laundry</h3>';
        dirtyItems.forEach(item => {
            const catLabel = CATEGORIES.find(ct => ct.id === item.category)?.label || item.category;
            html += '<div class="scan-item-row">' +
                '<div class="scan-item-info">' +
                    '<span class="scan-item-name">' + (item.name || catLabel) + '</span>' +
                    '<span class="scan-item-cat">' + catLabel + '</span>' +
                '</div>' +
                '<button class="pill active" onclick="markClean(\'' + item.id + '\')">Mark Clean</button>' +
                '</div>';
        });
        html += '<button class="primary-btn" style="margin-top:0.75rem;" onclick="markAllClean()">Mark All Clean</button>';
    } else {
        html += '<p style="text-align:center;opacity:0.6;">All items are clean! Open an item and toggle "Clean / Ready" to track laundry.</p>';
    }

    html += '<button class="secondary-btn" style="margin-top:0.75rem;" onclick="closeModal()">Close</button></div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);
}

async function markClean(id) {
    const item = await dbGetItem(id);
    if (!item) return;
    item.laundry = false;
    await dbUpdateItem(item);
    closeModal();
    showLaundryStatus();
}

async function markAllClean() {
    const items = await dbGetAllItems();
    for (const item of items) {
        if (item.laundry === true) {
            item.laundry = false;
            await dbUpdateItem(item);
        }
    }
    closeModal();
    showLaundryStatus();
}

// ── Outfit Voting ─────────────────────────────────────────────────
async function openOutfitVoting() {
    const outfits = await dbGetAllOutfits();
    if (outfits.length < 2) {
        alert('Save at least 2 outfits first to create a vote!');
        return;
    }

    const items = await dbGetAllItems();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    // Pick 2 random outfits
    const shuffled = [...outfits].sort(() => Math.random() - 0.5);
    const optionA = shuffled[0];
    const optionB = shuffled[1];

    let html = '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<h2>' + ICONS.vote + ' Which Look?</h2>' +
        '<p style="text-align:center;opacity:0.7;">Tap the outfit you\'d wear today</p>' +
        '<div class="vote-container">';

    [optionA, optionB].forEach((outfit, idx) => {
        const label = idx === 0 ? 'A' : 'B';
        html += '<div class="vote-option" onclick="castVote(\'' + outfit.id + '\')">' +
            '<div class="vote-label">' + label + '</div>' +
            '<h4>' + (outfit.name || 'Look ' + label) + '</h4>';
        if (outfit.itemIds && outfit.itemIds.length > 0) {
            html += '<div class="vote-items">';
            outfit.itemIds.slice(0, 4).forEach(id => {
                const item = items.find(i => i.id === id);
                if (item && item.imageBlob) {
                    html += '<img src="' + blobToObjectURL(item.imageBlob) + '" alt="' + (item.name || '') + '">';
                }
            });
            html += '</div>';
        }
        if (outfit.reasoning) html += '<p class="vote-reasoning">' + outfit.reasoning.substring(0, 80) + '...</p>';
        html += '</div>';
    });

    html += '</div>' +
        '<button class="secondary-btn" onclick="openOutfitVoting()">🔀 Different Matchup</button>' +
        '<button class="secondary-btn" onclick="closeModal()">Close</button>' +
        '</div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);
}

function castVote(outfitId) {
    let votes;
    try { votes = JSON.parse(localStorage.getItem(VOTING_KEY) || '{}'); } catch { votes = {}; }
    votes[outfitId] = (votes[outfitId] || 0) + 1;
    localStorage.setItem(VOTING_KEY, JSON.stringify(votes));

    const totalVotes = votes[outfitId];
    closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
    overlay.innerHTML = '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<div style="text-align:center;padding:2rem 0;">' +
            '<div style="font-size:3rem;">👍</div>' +
            '<h3>Vote Recorded!</h3>' +
            '<p style="opacity:0.7;">This outfit has ' + totalVotes + ' vote' + (totalVotes !== 1 ? 's' : '') + ' total</p>' +
        '</div>' +
        '<button class="primary-btn" onclick="openOutfitVoting()">Vote Again</button>' +
        '<button class="secondary-btn" onclick="closeModal()">Done</button>' +
        '</div>';
    document.body.appendChild(overlay);
}

// ── Virtual Try-On (Silhouette Composite) ─────────────────────────
async function openVirtualTryOn(itemId) {
    const items = await dbGetAllItems();
    const targetItem = items.find(i => i.id === itemId);
    if (!targetItem) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    let html = '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<h2>' + ICONS.mannequin + ' Virtual Try-On</h2>';

    // Silhouette layout positions based on category
    const slotOrder = ['hats', 'tops', 'outerwear', 'bottoms', 'shoes', 'accessories', 'bags', 'jewelry'];
    const slotLabels = {
        hats: 'Head', tops: 'Top', outerwear: 'Layer', bottoms: 'Bottom',
        shoes: 'Feet', accessories: 'Accessory', bags: 'Bag', jewelry: 'Jewelry'
    };

    // Pre-fill the target item's slot
    const selectedItems = {};
    selectedItems[targetItem.category] = targetItem;

    html += '<div class="tryon-canvas" id="tryon-canvas">';

    slotOrder.forEach(slot => {
        const selected = selectedItems[slot];
        const catItems = items.filter(i => i.category === slot && i.available !== false && i.laundry !== true);
        html += '<div class="tryon-slot" data-slot="' + slot + '">';
        if (selected) {
            html += '<img src="' + blobToObjectURL(selected.imageBlob) + '" alt="' + (selected.name || slot) + '" class="tryon-item-img">';
            html += '<div class="tryon-slot-label">' + (selected.name || slotLabels[slot]) + '</div>';
        } else {
            html += '<div class="tryon-empty" onclick="pickTryOnItem(\'' + slot + '\')">' +
                '<span class="tryon-plus">+</span>' +
                '<span>' + slotLabels[slot] + '</span>' +
                '</div>';
        }
        html += '</div>';
    });

    html += '</div>';

    // Add item picker area
    html += '<div id="tryon-picker" class="hidden"></div>';
    html += '<button class="primary-btn" onclick="exportTryOnImage()">📸 Save Look</button>';
    html += '<button class="secondary-btn" onclick="closeModal()">Close</button></div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    // Store items for picker
    window._tryOnItems = items;
    window._tryOnSelected = selectedItems;
}

async function pickTryOnItem(slot) {
    const items = (window._tryOnItems || []).filter(i => i.category === slot && i.available !== false && i.laundry !== true);
    const picker = document.getElementById('tryon-picker');
    if (!picker || items.length === 0) {
        alert('No available ' + slot + ' in your wardrobe.');
        return;
    }

    picker.classList.remove('hidden');
    let html = '<h4>Pick a ' + slot + ':</h4><div class="tryon-picker-grid">';
    items.forEach(item => {
        html += '<div class="tryon-picker-item" onclick="selectTryOnItem(\'' + slot + '\',\'' + item.id + '\')">' +
            '<img src="' + blobToObjectURL(item.imageBlob) + '" alt="' + (item.name || slot) + '">' +
            '</div>';
    });
    html += '</div>';
    picker.innerHTML = html;
}

function selectTryOnItem(slot, itemId) {
    const item = (window._tryOnItems || []).find(i => i.id === itemId);
    if (!item) return;

    window._tryOnSelected[slot] = item;
    const slotEl = document.querySelector('.tryon-slot[data-slot="' + slot + '"]');
    if (slotEl) {
        slotEl.innerHTML = '<img src="' + blobToObjectURL(item.imageBlob) + '" alt="' + (item.name || slot) + '" class="tryon-item-img">' +
            '<div class="tryon-slot-label">' + (item.name || slot) + '</div>';
    }
    document.getElementById('tryon-picker')?.classList.add('hidden');
}

async function exportTryOnImage() {
    const selected = window._tryOnSelected || {};
    const filledSlots = Object.values(selected).filter(Boolean);
    if (filledSlots.length === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 400, 600);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Mirror — Virtual Try-On', 200, 30);

    const slotPositions = {
        hats: { x: 150, y: 40, w: 100, h: 80 },
        tops: { x: 125, y: 130, w: 150, h: 120 },
        outerwear: { x: 50, y: 130, w: 80, h: 120 },
        bottoms: { x: 125, y: 260, w: 150, h: 140 },
        shoes: { x: 125, y: 410, w: 150, h: 80 },
        accessories: { x: 300, y: 200, w: 80, h: 80 },
        bags: { x: 300, y: 300, w: 80, h: 80 },
        jewelry: { x: 300, y: 130, w: 60, h: 60 },
    };

    for (const [slot, item] of Object.entries(selected)) {
        if (!item || !item.imageBlob) continue;
        const pos = slotPositions[slot];
        if (!pos) continue;
        try {
            const url = blobToObjectURL(item.imageBlob);
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });
            ctx.drawImage(img, pos.x, pos.y, pos.w, pos.h);
        } catch (e) { /* skip items that can't load */ }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px system-ui';
    ctx.fillText('Be yourself. Look fucking cool.', 200, 580);

    canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'mirror-tryon.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try { await navigator.share({ files: [file], title: 'Mirror Try-On' }); } catch (e) { /* cancelled */ }
        } else {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'mirror-tryon.png';
            a.click();
        }
    }, 'image/png');
}

// ── Smart Packing ─────────────────────────────────────────────────
let packingState = { destination: '', duration: 3, activities: '', results: null, loading: false };

async function renderPacking() {
    const p = getProfile();
    if (!p) { window.location.href = '/onboarding.html'; return; }

    const c = document.getElementById('page-content');
    if (!c) return;

    const items = await dbGetAllItems();
    const availableItems = items.filter(i => i.available !== false && i.laundry !== true);

    let html =
        '<div class="page-header">' +
            '<h1>' + ICONS.suitcase + ' Smart Packing</h1>' +
            '<p>AI builds the perfect capsule travel wardrobe from your closet</p>' +
        '</div>';

    if (availableItems.length < 3) {
        html += '<div class="notice">Add at least 3 items to your wardrobe first. <a href="/wardrobe.html">Go to Wardrobe →</a></div>';
        c.innerHTML = html;
        renderNav('wardrobe');
        return;
    }

    html += '<div class="card">' +
        '<div class="form-group">' +
            '<label>Destination</label>' +
            '<input type="text" class="text-input" id="pack-dest" placeholder="e.g. Paris, beach resort, business conference" value="' + packingState.destination + '">' +
        '</div>' +
        '<div class="form-row">' +
            '<div class="form-group" style="flex:1;">' +
                '<label>Days</label>' +
                '<input type="number" class="text-input" id="pack-days" value="' + packingState.duration + '" min="1" max="30">' +
            '</div>' +
        '</div>' +
        '<div class="form-group">' +
            '<label>Activities (optional)</label>' +
            '<input type="text" class="text-input" id="pack-activities" placeholder="e.g. sightseeing, dinner dates, hiking" value="' + packingState.activities + '">' +
        '</div>' +
        '<button class="primary-btn" onclick="generatePackingList()" ' + (packingState.loading ? 'disabled' : '') + '>' +
            (packingState.loading ? '<span class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;"></span> Packing...' : '🧳 Build Packing List') +
        '</button>' +
        '</div>';

    // Results
    if (packingState.results) {
        const r = packingState.results;

        // Packing list
        if (r.packingList && r.packingList.length > 0) {
            html += '<div class="card"><h3 style="margin:0 0 0.75rem;">📋 Pack These Items</h3>';
            r.packingList.forEach(p => {
                const item = availableItems[p.itemIndex - 1];
                const name = item ? (item.name || CATEGORIES.find(ct => ct.id === item.category)?.label || 'Item') : 'Item ' + p.itemIndex;
                html += '<div class="pack-item-row">' +
                    '<span class="pack-item-name">' + name + '</span>' +
                    '<span class="pack-item-reason">' + (p.reason || '') + '</span>' +
                    '</div>';
            });
            html += '</div>';
        }

        // Outfit combos
        if (r.outfitCombos && r.outfitCombos.length > 0) {
            html += '<div class="card"><h3 style="margin:0 0 0.75rem;">👗 Outfit Combos</h3>';
            r.outfitCombos.forEach(combo => {
                html += '<div class="pack-combo">' +
                    '<h4>' + combo.name + '</h4>' +
                    '<div class="pack-combo-items">';
                (combo.itemIndices || []).forEach(idx => {
                    const item = availableItems[idx - 1];
                    if (item && item.imageBlob) {
                        html += '<img src="' + blobToObjectURL(item.imageBlob) + '" alt="' + (item.name || '') + '" class="pack-combo-img">';
                    }
                });
                html += '</div></div>';
            });
            html += '</div>';
        }

        // Missing items
        if (r.missingItems && r.missingItems.length > 0) {
            html += '<div class="card"><h3 style="margin:0 0 0.5rem;">🛍️ Consider Getting</h3>' +
                '<ul style="margin:0;padding-left:1.25rem;opacity:0.85;">';
            r.missingItems.forEach(m => { html += '<li>' + m + '</li>'; });
            html += '</ul></div>';
        }

        // Tips
        if (r.packingTips && r.packingTips.length > 0) {
            html += '<div class="card"><h3 style="margin:0 0 0.5rem;">💡 Packing Tips</h3>' +
                '<ul style="margin:0;padding-left:1.25rem;opacity:0.85;">';
            r.packingTips.forEach(t => { html += '<li>' + t + '</li>'; });
            html += '</ul></div>';
        }
    }

    c.innerHTML = html;
    renderNav('wardrobe');
}

async function generatePackingList() {
    const dest = document.getElementById('pack-dest')?.value?.trim();
    const days = parseInt(document.getElementById('pack-days')?.value) || 3;
    const activities = document.getElementById('pack-activities')?.value?.trim();

    if (!dest) { alert('Enter a destination first.'); return; }

    packingState.destination = dest;
    packingState.duration = days;
    packingState.activities = activities;
    packingState.loading = true;
    renderPacking();

    const items = await dbGetAllItems();
    const availableItems = items.filter(i => i.available !== false && i.laundry !== true);
    const profile = getProfile();

    const itemData = availableItems.map(item => ({
        category: item.category,
        name: item.name || '',
        notes: item.notes || '',
        image: item.imageBlob ? blobToObjectURL(item.imageBlob) : null,
    }));

    // Fetch weather for destination context
    let weatherInfo = '';
    const weather = await fetchWeather();
    if (weather) weatherInfo = weather.temp + '°F, ' + weather.desc;

    try {
        const res = await fetch('/api/smart-pack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: itemData.map(i => ({ category: i.category, name: i.name, notes: i.notes })),
                destination: dest,
                duration: days,
                activities: activities || undefined,
                weather: weatherInfo || undefined,
                profile: profile ? { vibe: profile.vibe, expression: profile.expression } : undefined,
            }),
        });

        if (!res.ok) throw new Error('API error');
        packingState.results = await res.json();
    } catch (err) {
        alert('Could not generate packing list. Make sure OPENAI_API_KEY is configured.');
    }

    packingState.loading = false;
    renderPacking();
}

// ── Wishlist / Shopping Gaps ──────────────────────────────────────
const WISHLIST_KEY = 'mirror-wishlist';

function getWishlist() {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch { return []; }
}

function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

async function showWishlist() {
    const items = await dbGetAllItems();
    const wishlist = getWishlist();

    // Detect gaps
    const counts = {};
    items.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
    const gaps = CATEGORIES.filter(cat => !counts[cat.id] || counts[cat.id] < 2);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-item-modal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    let html = '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<h2>' + ICONS.cart + ' Wishlist & Gaps</h2>';

    // Wardrobe gaps
    if (gaps.length > 0) {
        html += '<div class="card" style="margin-bottom:1rem;">' +
            '<h4 style="margin:0 0 0.5rem;">Wardrobe Gaps</h4>' +
            '<p style="margin:0 0 0.5rem;opacity:0.7;font-size:0.85rem;">Categories that could use more items:</p>';
        gaps.forEach(g => {
            const count = counts[g.id] || 0;
            html += '<div class="wishlist-gap">' +
                '<span>' + g.emoji + ' ' + g.label + '</span>' +
                '<span style="opacity:0.5;">' + count + ' item' + (count !== 1 ? 's' : '') + '</span>' +
                '<button class="pill" style="font-size:0.75rem;" onclick="addToWishlist(\'' + g.label + '\')">+ Wishlist</button>' +
                '</div>';
        });
        html += '</div>';
    }

    // Wishlist items
    html += '<div class="card">' +
        '<h4 style="margin:0 0 0.5rem;">Shopping List</h4>';

    if (wishlist.length === 0) {
        html += '<p style="opacity:0.5;text-align:center;">No items on your wishlist yet. Tap wardrobe gaps above or add manually below.</p>';
    } else {
        wishlist.forEach((w, idx) => {
            html += '<div class="wishlist-item">' +
                '<span>' + w.name + '</span>' +
                (w.priority ? '<span class="wishlist-priority ' + w.priority + '">' + w.priority + '</span>' : '') +
                '<button class="pill" style="font-size:0.75rem;color:var(--negative);" onclick="removeWishlistItem(' + idx + ')">×</button>' +
                '</div>';
        });
    }

    html += '<div style="display:flex;gap:0.5rem;margin-top:0.75rem;">' +
        '<input type="text" class="text-input" id="wishlist-input" placeholder="Add item..." style="flex:1;">' +
        '<button class="primary-btn" style="padding:0.5rem 1rem;" onclick="addWishlistFromInput()">Add</button>' +
        '</div>';

    html += '</div>' +
        '<button class="secondary-btn" onclick="closeModal()">Close</button></div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);
}

function addToWishlist(name) {
    const wishlist = getWishlist();
    wishlist.push({ name, priority: 'medium', addedAt: new Date().toISOString() });
    saveWishlist(wishlist);
    closeModal();
    showWishlist();
}

function addWishlistFromInput() {
    const input = document.getElementById('wishlist-input');
    if (!input || !input.value.trim()) return;
    const wishlist = getWishlist();
    wishlist.push({ name: input.value.trim(), priority: 'medium', addedAt: new Date().toISOString() });
    saveWishlist(wishlist);
    closeModal();
    showWishlist();
}

function removeWishlistItem(idx) {
    const wishlist = getWishlist();
    wishlist.splice(idx, 1);
    saveWishlist(wishlist);
    closeModal();
    showWishlist();
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
    } else if (path.endsWith('saved.html')) {
        if (!getProfile()) { window.location.href = '/onboarding.html'; return; }
        renderSaved();
    } else if (path.endsWith('calendar.html')) {
        if (!getProfile()) { window.location.href = '/onboarding.html'; return; }
        renderCalendar();
    } else if (path.endsWith('ootd.html')) {
        if (!getProfile()) { window.location.href = '/onboarding.html'; return; }
        renderOOTD();
    } else if (path.endsWith('community.html')) {
        if (!getProfile()) { window.location.href = '/onboarding.html'; return; }
        renderCommunity();
    } else if (path.endsWith('challenges.html')) {
        if (!getProfile()) { window.location.href = '/onboarding.html'; return; }
        renderChallenges();
    } else if (path.endsWith('packing.html')) {
        if (!getProfile()) { window.location.href = '/onboarding.html'; return; }
        renderPacking();
    } else if (path.endsWith('tryon.html')) {
        if (!getProfile()) { window.location.href = '/onboarding.html'; return; }
        // tryon is launched via modal from item detail, so redirect to wardrobe
        window.location.href = '/wardrobe.html';
    }
});
