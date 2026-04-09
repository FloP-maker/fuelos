// FuelOS Service Worker — Race Day: Offline + Push Notifications
const CACHE_NAME = 'fuelos-v4';
const STATIC_ASSETS = ['/', '/plan', '/race', '/prep', '/produits', '/analyses', '/manifest.json'];

// ============ INSTALL ============
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ============ ACTIVATE ============
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ============ FETCH ============
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Ne pas mettre en cache les API (auth, debriefs, etc.) — risque de réponses invalides pour le client.
  if (url.pathname.startsWith('/api/')) return;

  // Pour les navigations de page, preferer le reseau pour eviter les bundles obsoletes.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});

// ============ PUSH NOTIFICATIONS (server push) ============
self.addEventListener('push', (event) => {
  let data = { title: 'FuelOS', body: 'Heure de te ravitailler !', tag: 'fuelos-alert' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch (e) {}
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: data.tag,
      renotify: true,
      requireInteraction: true, // ⚠️ Important pour rester affichée
      vibrate: [200, 100, 200],
      actions: [
        { action: 'consumed', title: '✓ Pris' },
        { action: 'skip', title: '× Passer' }
      ],
      data: { url: '/race', tag: data.tag },
    })
  );
});

// ============ MESSAGE FROM PAGE (local notifications) ============
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data;
    
    console.log('[SW] Affichage notification:', title);
    
    self.registration.showNotification(title || 'FuelOS', {
      body: body || 'Heure de te ravitailler !',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: tag || 'fuelos-race',
      renotify: true,
      vibrate: [300, 100, 300, 100, 300],
      requireInteraction: true, // ⚠️ Important : notif reste jusqu'à action
      actions: [
        { action: 'consumed', title: '✓ Pris' },
        { action: 'skip', title: '× Passer' }
      ],
      data: { url: '/race', tag: tag },
    });
  }
});

// ============ NOTIFICATION CLICK ============
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Clic notification:', event.action, event.notification.tag);
  
  event.notification.close();
  
  // Si action sur un bouton (Pris ou Passer)
  if (event.action === 'consumed' || event.action === 'skip') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clients) => {
          // Envoyer le message à la page Race active
          for (const client of clients) {
            if (client.url.includes('/race')) {
              client.postMessage({
                type: 'NOTIFICATION_ACTION',
                action: event.action,
                tag: event.notification.tag
              });
              return client.focus();
            }
          }
          // Si pas de page Race ouverte, en ouvrir une
          if (self.clients.openWindow) {
            return self.clients.openWindow('/race');
          }
        })
    );
  } else {
    // Clic général sur la notification (pas sur un bouton)
    const targetUrl = (event.notification.data && event.notification.data.url) || '/race';
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clients) => {
          for (const client of clients) {
            if (client.url.includes('/race') && 'focus' in client) {
              return client.focus();
            }
          }
          if (self.clients.openWindow) {
            return self.clients.openWindow(targetUrl);
          }
        })
    );
  }
});

// ============ NOTIFICATION CLOSE ============
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée:', event.notification.tag);
});

console.log('[SW] FuelOS Service Worker v4 charge ✅');