// ============================================================
// SERVICE WORKER – MEOSEGÉD PWA (offline támogatás)
// ============================================================

const CACHE_NAME = 'meosegéd-v1.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './js/scanner.js',
  './js/checklist.js',
  './js/pdf.js',
  './js/dashboard.js',
  './manifest.json'
];

// CDN erőforrások (cache-elendők)
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
];

// ── Telepítés ─────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Statikus fájlok cache-elése...');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(CACHE_NAME + '-cdn').then(cache => {
        console.log('[SW] CDN fájlok cache-elése...');
        return Promise.allSettled(CDN_ASSETS.map(url => cache.add(url)));
      })
    ]).then(() => self.skipWaiting())
  );
});

// ── Aktiválás ─────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== CACHE_NAME + '-cdn')
          .map(k => {
            console.log('[SW] Régi cache törlése:', k);
            return caches.delete(k);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch – Cache First stratégia ────────────────────────
self.addEventListener('fetch', event => {
  // Csak GET kéréseket kezelünk
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Kamera / média kérések nem cache-elendők
  if (event.request.url.includes('getUserMedia')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Cache hit – visszaadjuk, háttérben frissítjük a hálózatból
        if (!url.hostname.includes('fonts.g') && !url.hostname.includes('cdn.')) {
          fetch(event.request).then(response => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
            }
          }).catch(() => {});
        }
        return cached;
      }

      // Cache miss – hálózatból töltjük, és cache-eljük
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseToCache = response.clone();
        const cacheName = url.hostname !== location.hostname
          ? CACHE_NAME + '-cdn'
          : CACHE_NAME;
        caches.open(cacheName).then(cache => cache.put(event.request, responseToCache));
        return response;
      }).catch(() => {
        // Teljesen offline – visszaadjuk az index.html-t SPA fallbackként
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ── Push értesítések (jövőbeli bővítéshez) ───────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'MEOSEGÉD', body: 'Új értesítés' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'meosegéd-notification',
      renotify: true
    })
  );
});
