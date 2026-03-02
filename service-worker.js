const VERSION = "v1002";            // ←更新のたびに数字を上げる
const CACHE = "kyudo-cache-" + VERSION;

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

// ★ここが重要：HTML（画面遷移）はネット優先にする
self.addEventListener("fetch", (e) => {
  const req = e.request;

  // ページ（index.html等）＝常にネットから取りに行く（古い画面が残る問題を潰す）
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("./index.html", fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await caches.match("./index.html");
        return cached || caches.match("./");
      }
    })());
    return;
  }

  // 画像やmanifest等はキャッシュ優先でOK
  e.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
