// ==========================================
// Service Worker النهائي - نظام مياه السوفعي
// ==========================================

const CACHE_NAME = 'soufai-v3.0'; // غيّر الرقم عند كل تحديث

// الملفات التي تعمل بدون إنترنت
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',

  // ❌ لا تحتاجها لأن كل شيء في index.html واحد
  // './css/style.css',    
  // './js/app.js',

  // مكتبات خارجية (CDN)
  'https://unpkg.com/vue@3/dist/vue.global.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// ============================
// التثبيت (تحميل أول مرة)
// ============================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 تخزين الملفات أوفلاين...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// ============================
// التفعيل + حذف الكاش القديم
// ============================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('🗑 حذف كاش قديم:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ============================
// جلب الملفات (Cache First)
// ============================
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {

      // لو موجود بالكاش → استخدمه
      if (cached) return cached;

      // لو غير موجود → من الشبكة + خزنه
      return fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(() => {
        // في حال انقطاع النت وطلب صفحة
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });

    })
  );
});

// ============================
// دعم التحديث الفوري
// ============================
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});