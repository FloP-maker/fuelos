// FuelOS Service Worker — Race Day: Offline + Push Notifications
const CACHE_NAME = 'fuelos-v2';
const STATIC_ASSETS = ['/', '/plan', '/race', '/shop', '/learn', '/manifest.json'];

// ============ INSTALL ============
self.addEventListener('install', (event) => {
  event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
        );
          self.skipWaiting();
          });

          // ============ ACTIVATE ============
          self.addEventListener('activate', (event) => {
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
                                                                                                                                          icon: '/favicon.ico',
                                                                                                                                                badge: '/favicon.ico',
                                                                                                                                                      tag: data.tag,
                                                                                                                                                            renotify: true,
                                                                                                                                                                  requireInteraction: false,
                                                                                                                                                                        vibrate: [200, 100, 200],
                                                                                                                                                                              data: { url: '/race' },
                                                                                                                                                                                  })
                                                                                                                                                                                    );
                                                                                                                                                                                    });

                                                                                                                                                                                    // ============ NOTIFICATION CLICK ============
                                                                                                                                                                                    self.addEventListener('notificationclick', (event) => {
                                                                                                                                                                                      event.notification.close();
                                                                                                                                                                                        const targetUrl = (event.notification.data && event.notification.data.url) || '/race';
                                                                                                                                                                                          event.waitUntil(
                                                                                                                                                                                              self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
                                                                                                                                                                                                    for (const client of clients) {
                                                                                                                                                                                                            if (client.url.includes('/race') && 'focus' in client) {
                                                                                                                                                                                                                      return client.focus();
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                          if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
                                                                                                                                                                                                                                              })
                                                                                                                                                                                                                                                );
                                                                                                                                                                                                                                                });

                                                                                                                                                                                                                                                // ============ MESSAGE FROM PAGE (local notifications) ============
                                                                                                                                                                                                                                                self.addEventListener('message', (event) => {
                                                                                                                                                                                                                                                  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
                                                                                                                                                                                                                                                      const { title, body, tag } = event.data;
                                                                                                                                                                                                                                                          self.registration.showNotification(title || 'FuelOS', {
                                                                                                                                                                                                                                                                body: body || 'Heure de te ravitailler !',
                                                                                                                                                                                                                                                                      icon: '/favicon.ico',
                                                                                                                                                                                                                                                                            badge: '/favicon.ico',
                                                                                                                                                                                                                                                                                  tag: tag || 'fuelos-race',
                                                                                                                                                                                                                                                                                        renotify: true,
                                                                                                                                                                                                                                                                                              vibrate: [300, 100, 300, 100, 300],
                                                                                                                                                                                                                                                                                                    requireInteraction: false,
                                                                                                                                                                                                                                                                                                          data: { url: '/race' },
                                                                                                                                                                                                                                                                                                              });
                                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                                });