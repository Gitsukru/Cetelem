// Version du cache - Mise à jour automatique lors du déploiement
// Format: YYYY-MM-DD-commit-feature
const CACHE_VERSION = '2025-11-05-fix-update-cache-clearing';
const CACHE_NAME = `cetelem-v${CACHE_VERSION}`;
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

console.log('🔧 Service Worker version:', CACHE_VERSION);

// Installation du service worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation terminée');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Erreur installation', error);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activation en cours...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation terminée');
      return self.clients.claim();
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes non-GET ou externes
  if (event.request.method !== 'GET' ||
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Stratégie "Network First" pour les documents HTML (toujours vérifier le réseau en premier)
  if (event.request.destination === 'document' || event.request.url.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cloner et mettre en cache la nouvelle version
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Si le réseau échoue, utiliser le cache comme fallback
          return caches.match(event.request);
        })
    );
    return;
  }

  // Stratégie "Network First" pour TOUS les fichiers JavaScript (toujours la dernière version)
  if (event.request.url.endsWith('.js')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cloner et mettre en cache la nouvelle version
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // En cas d'échec réseau, utiliser le cache comme fallback
          return caches.match(event.request);
        })
    );
    return;
  }

  // Stratégie "Network First" pour les fichiers CSS (toujours la dernière version)
  if (event.request.url.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cloner et mettre en cache la nouvelle version
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // En cas d'échec réseau, utiliser le cache comme fallback
          return caches.match(event.request);
        })
    );
    return;
  }

  // Stratégie "Cache First" pour les autres ressources (images, fonts, etc.)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si la ressource est en cache, la retourner
        if (response) {
          return response;
        }

        // Sinon, faire la requête réseau
        return fetch(event.request)
          .then(response => {
            // Vérifier si la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cloner la réponse
            const responseToCache = response.clone();

            // Ajouter la réponse au cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // En cas d'échec, retourner la page principale si c'est une navigation
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// Gestion des messages depuis l'application
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});