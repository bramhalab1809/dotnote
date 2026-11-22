const CACHE_NAME = 'dotnote-offline-v1';
const ASSETS = [
    './',
    './index.html',
    './css/base.css',
    './css/animations.css',
    './js/config/tailwind-config.js',
    './js/data/words-part1.js',
    './js/data/words-part2.js',
    './js/data/words-part3.js',
    './js/db/indexeddb.js',
    './js/core/state.js',
    './js/core/toast.js',
    './js/core/self-heal.js',
    './js/core/word-learner.js',
    './js/ui/home-grid.js',
    './js/ui/sidebar-settings.js',
    './js/ui/editor-nav.js',
    './js/ui/pane-tools.js',
    './js/ui/caret-position.js',
    './js/ui/suggestions.js',
    './js/effects/bg-dots.js',
    './js/main.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
        caches.match(e.request).then((cached) =>
            cached || fetch(e.request).then((res) => {
                if (res && res.status === 200 && res.type === 'basic') {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
                }
                return res;
            }).catch(() => cached)
        )
    );
});
