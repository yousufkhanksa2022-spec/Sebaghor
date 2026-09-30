// সেবাঘর — Service Worker
// অ্যাপের বেসিক ফাইলগুলো ক্যাশ করে রাখে যাতে ইন্টারনেট দুর্বল থাকলেও অ্যাপ খোলে।
// নতুন ভার্সন ডিপ্লয় করলে CACHE_NAME বদলে দিন (v1 -> v2), তাহলে পুরনো ক্যাশ বাতিল হয়ে যাবে।

var CACHE_NAME = "sebaghor-cache-v1";
var PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json"
];
// আইকন এখন manifest.json ও index.html এর ভেতরেই (base64 আকারে) আছে,
// তাই আলাদা icons/ ফোল্ডার বা ফাইল ক্যাশ করার দরকার নেই।

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// নেটওয়ার্ক-ফার্স্ট কৌশল: ইন্টারনেট থাকলে সবসময় সর্বশেষ ডেটা আনবে (বুকিং/প্রোভাইডার লাইভ থাকা জরুরি),
// না থাকলে ক্যাশ থেকে দেখাবে যাতে অ্যাপ অন্তত খোলে।
self.addEventListener("fetch", function(event){
  if (event.request.method !== "GET") return;
  // Firebase/Google Fonts-এর রিকোয়েস্ট ক্যাশ না করে সরাসরি নেটওয়ার্কে পাঠাই
  if (event.request.url.indexOf("googleapis.com") !== -1 ||
      event.request.url.indexOf("gstatic.com") !== -1 ||
      event.request.url.indexOf("firestore.googleapis.com") !== -1) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(function(response){
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, clone); });
        return response;
      })
      .catch(function(){ return caches.match(event.request); })
  );
});
