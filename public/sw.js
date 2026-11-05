/**
 * Service Worker de TechField PWA (Semana 2 - Producción)
 * Ciclo de vida: Install, Activate, Fetch y Background Sync.
 * Estrategias de caché: Stale-While-Revalidate para App Shell, Cache-First para estáticos,
 * Network-First para API GET, y fallback a IndexedDB y offline.html.
 */

const CACHE_STATIC_NAME = 'techfield-static-v2';
const CACHE_DYNAMIC_NAME = 'techfield-dynamic-v2';

// Recursos críticos de la interfaz (App Shell)
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/app.js',
    '/js/db.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-maskable.png',
    '/icons/icon.svg',
    '/icons/apple-touch-icon.png'
];

// =========================================================
// 1. CICLO DE VIDA: INSTALACIÓN (INSTALL)
// =========================================================
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalando Service Worker (v2)...');

    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then((cache) => {
                console.log('[Service Worker] Pre-cacheando App Shell y recursos estáticos esenciales');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Pre-caché completado con éxito. Activando inmediatamente.');
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('[Service Worker] Error durante install en cache.addAll:', err);
            })
    );
});

// =========================================================
// 2. CICLO DE VIDA: ACTIVACIÓN Y LIMPIEZA DE CACHÉ (ACTIVATE)
// =========================================================
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activando Service Worker y limpiando cachés antiguas...');

    event.waitUntil(
        caches.keys()
            .then((keyList) => {
                return Promise.all(
                    keyList.map((key) => {
                        if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                            console.log('[Service Worker] Eliminando caché obsoleta:', key);
                            return caches.delete(key);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Tomando control de todos los clientes activos.');
                return self.clients.claim();
            })
    );
});

// =========================================================
// 3. CICLO DE VIDA: INTERCEPCIÓN DE RED (FETCH)
// =========================================================
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Solo procesar peticiones con esquemas HTTP / HTTPS
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Estrategia A: Peticiones a la API REST (/api/reportes)
    if (url.pathname.startsWith('/api/')) {
        // En peticiones GET aplicamos Network-First con Fallback a Caché Dinámica
        if (request.method === 'GET') {
            event.respondWith(
                fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(async () => {
                        console.log('[Service Worker] Modo sin conexión: Sirviendo API GET desde caché');
                        const cachedResponse = await caches.match(request);
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Fallback sintético en JSON si no estuviera en caché
                        return new Response(JSON.stringify({
                            offline: true,
                            mensaje: 'Servidor no disponible en este momento. Trabajando en modo local.'
                        }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    })
            );
            return;
        }

        // Para peticiones POST/DELETE de la API cuando el técnico está offline,
        // permitimos que fetch falle de forma natural para que la capa JavaScript (db.js)
        // lo detecte y lo guarde automáticamente en IndexedDB.
        return;
    }

    // Estrategia B: Navegación de Documentos HTML (SPA / App Shell)
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_STATIC_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    console.log('[Service Worker] Navegación Offline: Recuperando App Shell');
                    const cachedApp = await caches.match('/index.html');
                    if (cachedApp) {
                        return cachedApp;
                    }
                    return caches.match('/offline.html');
                })
        );
        return;
    }

    // Estrategia C: Recursos Estáticos (CSS, JS, Imágenes, Fuentes)
    // Estrategia: Cache-First con Stale-While-Revalidate en segundo plano
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                // Actualizar recurso en segundo plano
                fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            caches.open(CACHE_STATIC_NAME).then((cache) => {
                                cache.put(request, networkResponse);
                            });
                        }
                    })
                    .catch(() => {
                        // Silenciar error en background sync
                    });
                return cachedResponse;
            }

            // Si no estaba en caché, buscar en red y guardar en dinámica
            return fetch(request)
                .then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return networkResponse;
                })
                .catch(() => {
                    // Fallback para imágenes si la red falla
                    if (request.destination === 'image') {
                        return caches.match('/icons/icon-192.png');
                    }
                });
        })
    );
});

// =========================================================
// 4. SINCRONIZACIÓN EN SEGUNDO PLANO (BACKGROUND SYNC API)
// =========================================================
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Evento de sincronización en segundo plano recibido:', event.tag);
    if (event.tag === 'sync-reportes-tecnicos') {
        event.waitUntil(
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        tipo: 'EJECUTAR_SINCRONIZACION',
                        motivo: 'Background Sync disparado por el sistema'
                    });
                });
            })
        );
    }
});

