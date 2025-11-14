// Service Worker Version for cache busting
const CACHE_VERSION = 'sai-web-pwa-v1.0';
const CACHE_NAME = CACHE_VERSION;

// List of files to pre-cache on install
const urlsToCache = [
  '/', // The root page (important for start_url)
  '/index.html', // If your blog uses this structure
  // Add main CSS and JS files here if they are static and need offline access
  // Example: '/static/style.css',
  // Example: '/static/main.js'
];

// Installation: Caches static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and added static assets');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Service Worker installation failed:', err);
      })
  );
  self.skipWaiting();
});

// Activation: Cleans up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch: Strategy (Cache-First, then Network for dynamic content)
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // If the request is for an external asset (like Google Fonts or Blogger analytics), skip caching
  if (requestUrl.origin !== location.origin || event.request.method !== 'GET') {
    return;
  }
  
  // Cache-First strategy: Serve from cache if available, otherwise fetch from network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cache hit, or fetch from network
        return response || fetch(event.request).then(networkResponse => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          // IMPORTANT: Clone the response. A response is a stream and can only be consumed once.
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
      .catch(error => {
        console.error('Fetching failed:', error);
        // Fallback for offline (can serve a static offline page if needed)
        // return caches.match('/offline.html'); 
      })
  );
});
