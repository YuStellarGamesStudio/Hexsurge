/* Hash-validated release cache; saves belong exclusively to the page. */
importScripts('./sw-assets.js');
const RELEASE = self.HEXSURGE_RELEASE;
const PREFIX = 'hexsurge-assets-';
const CACHE = PREFIX + RELEASE.version;
const scope = new URL('./', self.location.href);
const shell = new URL('index.html', scope).href;
const assets = new Set(RELEASE.assets.map(asset => new URL(asset.path, scope).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Bound parallelism avoids saturating mobile connections with hundreds of modules.
      let next = 0;
      await Promise.all(Array.from({ length: 8 }, async () => {
        while (next < RELEASE.assets.length) {
          const asset = RELEASE.assets[next++];
          const url = new URL(asset.path, scope).href;
          const response = await fetch(url, { cache: 'reload' });
          if (!response.ok) throw new Error(`Offline asset unavailable: ${asset.path}`);
          const bytes = await response.clone().arrayBuffer();
          const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
          if (hash !== asset.hash) throw new Error(`Offline asset hash mismatch: ${asset.path}`);
          await cache.put(url, response);
        }
      }));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Cache insertion order preserves the immediately preceding installed release.
    const versions = (await caches.keys()).filter(name => name.startsWith(PREFIX));
    const previous = versions.filter(name => name !== CACHE).at(-1);
    await Promise.all(versions.filter(name => name !== CACHE && name !== previous).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin) return;
  const navigation = request.mode === 'navigate' && url.pathname.startsWith(scope.pathname);
  // Only navigations discard their query: ?lang / ?debug still load the same shell.
  // Asset URLs match exactly, including their query; unknown requests go to network.
  const key = navigation ? shell : request.url;
  if (!navigation && !assets.has(key)) return;
  event.respondWith((async () => (await (await caches.open(CACHE)).match(key)) || fetch(request))());
});
