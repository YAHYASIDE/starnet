// STAR NET — Service Worker (v3)
// ملفات التطبيق: تُجلب دائماً من الشبكة (بدون ذاكرة قديمة) لتظهر تحديثاتك فوراً.
// المكتبات الثابتة: من الذاكرة. ويعمل دون إنترنت عند الحاجة.
const CACHE = "starnet-v4";
const LIBS = [
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone/babel.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(LIBS.map((u) => c.add(u)))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

function isLib(url) { return url.startsWith("https://unpkg.com") || url.startsWith("https://cdnjs.cloudflare.com"); }

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = req.url;

  // المكتبات الثابتة: الذاكرة أولاً
  if (isLib(url)) {
    e.respondWith(
      caches.match(req).then((c) => c || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((ch) => ch.put(req, copy)).catch(() => {});
        return res;
      }))
    );
    return;
  }

  // ملفات التطبيق: دائماً من الشبكة بأحدث نسخة (no-store)، والذاكرة احتياط دون إنترنت
  e.respondWith(
    fetch(url, { cache: "no-store" })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((ch) => ch.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((c) => c || caches.match("./index.html")))
  );
});
