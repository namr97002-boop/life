// تغيير الرقم (v1 to v2) هو المفتاح لمسح كل التخزين القديم فوراً
const CACHE_NAME = 'soufai-system-v1.1';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // إذا كان لديك ملفات CSS أو JS خارجية يفضل إضافتها هنا
];

// 1. التثبيت (Install): مسح الانتظار وحفظ الملفات الأساسية
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ تم فتح الكاش وحفظ الملفات');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. التنشيط (Activate): مسح "كل" التخزين القديم فوراً وبدون رحمة
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ تم مسح التخزين القديم:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. الجلب (Fetch): استراتيجية ذكية (الكاش أولاً مع تحديث في الخلفية)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // إرسال الطلب للشبكة لتحديث الكاش في الخلفية
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // إذا كان الرد سليم، خزن نسخة منه
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // في حالة انقطاع النت تماماً، الكاش هو المنقذ
        return cachedResponse;
      });

      // ارجع الرد من الكاش فوراً للسرعة، أو انتظر الشبكة إذا لم يكن موجوداً
      return cachedResponse || fetchPromise;
    })
  );
});