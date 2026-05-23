function startOnboarding() {
    window.location.href = '/onboarding.html';
}

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service worker registered');
        } catch (error) {
            console.warn('Service worker registration failed:', error);
        }
    }
}

registerServiceWorker();

console.log('🔥 Mirror is alive. Be yourself. Look fucking cool.');
