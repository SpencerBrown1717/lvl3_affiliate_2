// LVL3.ai Affiliate Portal Service Worker

const CACHE_NAME = 'lvl3-affiliate-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/firebase.js',
  '/firebase.config.js',
  '/auth.js',
  '/salesLinks.js',
  '/notifications.js',
  '/config.js',
  'https://cdn.jsdelivr.net/npm/firebase@9.22.0/firebase-app.js',
  'https://cdn.jsdelivr.net/npm/firebase@9.22.0/firebase-auth.js',
  'https://cdn.jsdelivr.net/npm/firebase@9.22.0/firebase-firestore.js',
  'https://cdn.jsdelivr.net/npm/firebase@9.22.0/firebase-functions.js',
  'https://cdn.jsdelivr.net/npm/uuid@9.0.0/dist/umd/uuid.min.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(error => {
        console.error('Error during service worker install:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('cdn.jsdelivr.net')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => console.error('Cache put error:', err));

            return response;
          })
          .catch(error => {
            console.error('Fetch error:', error);
            // You could return a custom offline page here
          });
      })
  );
});

// Background sync for offline operations
self.addEventListener('sync', event => {
  if (event.tag === 'link-click-sync') {
    event.waitUntil(syncLinkClicks());
  } else if (event.tag === 'link-share-sync') {
    event.waitUntil(syncLinkShares());
  }
});

async function syncLinkClicks() {
  try {
    const db = await openDB('lvl3-offline-db', 1);
    const offlineClicks = await db.getAll('offlineClicks');
    
    if (offlineClicks.length > 0) {
      // Process each offline click
      for (const click of offlineClicks) {
        try {
          // Send to server
          const response = await fetch('/api/track-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(click)
          });
          
          if (response.ok) {
            await db.delete('offlineClicks', click.id);
          }
        } catch (error) {
          console.error('Error syncing click:', error);
          // Will be retried next time
        }
      }
    }
  } catch (error) {
    console.error('Error in syncLinkClicks:', error);
  }
}

async function syncLinkShares() {
  try {
    const db = await openDB('lvl3-offline-db', 1);
    const offlineShares = await db.getAll('offlineShares');
    
    if (offlineShares.length > 0) {
      // Process each offline share
      for (const share of offlineShares) {
        try {
          // Send to server
          const response = await fetch('/api/track-share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(share)
          });
          
          if (response.ok) {
            await db.delete('offlineShares', share.id);
          }
        } catch (error) {
          console.error('Error syncing share:', error);
          // Will be retried next time
        }
      }
    }
  } catch (error) {
    console.error('Error in syncLinkShares:', error);
  }
}

// Function to open IndexedDB with improved error handling
function openDB(name, version) {
  // First check if IndexedDB is available in this browser
  if (!('indexedDB' in self)) {
    return Promise.reject(new Error('IndexedDB is not supported in this browser'));
  }
  
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(name, version);
      
      request.onupgradeneeded = e => {
        try {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('offlineClicks')) {
            db.createObjectStore('offlineClicks', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('offlineShares')) {
            db.createObjectStore('offlineShares', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('offlineLinks')) {
            db.createObjectStore('offlineLinks', { keyPath: 'id' });
          }
        } catch (err) {
          console.error('Error during database upgrade:', err);
          // Don't reject here as onupgradeneeded failures will trigger onerror
        }
      };
      
      request.onsuccess = e => resolve(e.target.result);
      request.onerror = e => {
        console.error('IndexedDB error:', e.target.error);
        reject(e.target.error || new Error('Unknown IndexedDB error'));
      };
    } catch (err) {
      console.error('Error opening IndexedDB:', err);
      reject(err);
    }
  });
}
