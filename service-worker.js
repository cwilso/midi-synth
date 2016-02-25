var cacheName = 'midi-synth-cache-1-1';  
var filesToCache = [  
  './',  
  './index.html',
  './img/icons/128x128.png',  
  './img/icons/144x144.png',  
  './img/icons/152x152.png',  
  './img/icons/192x192.png',  
  './img/icons/256x256.png',  
  './img/icons/512x512.png',  
  './img/hsliderbody.png',  
  './img/hsliderknob.png',  
  './img/LittlePhatty.png',  
  './img/switch_toggle.png',  
  './img/vsliderbody.png',  
  './img/vsliderknob.png',  
  './js/midi.js',  
  './js/platform.js',  
  './js/platform.js.map',  
  './js/polymer.js',  
  './js/synth.js',  
  './js/ui.js',  
  './js/waveshaper.js', 
  './sounds/irRoom.wav', 
  './styles/main.css',  
  './webcomponents/controls.html',  
  './webcomponents/polymer-body.html',  
  './webcomponents/polymer.html',  
  './webcomponents/polymer.js',  
  './webcomponents/polymer.js.map',  
  './manifest.json'
];

self.addEventListener('install', function(e) {  
  console.log('[m-s ServiceWorker] Install');  
  e.waitUntil(  
    caches.open(cacheName).then(function(cache) {  
      console.log('[m-s ServiceWorker] Caching app shell');  
      return cache.addAll(filesToCache);  
    })  
  );  
});

self.addEventListener('activate', function(e) {  
  console.log('[m-s ServiceWorker] Activate');  
  e.waitUntil(  
    caches.keys().then(function(keyList) {  
      return Promise.all(keyList.map(function(key) {  
        console.log('[m-s ServiceWorker] Removing old cache ', key);  
        if (key !== cacheName) {  
          return caches.delete(key);  
        }  
      }));  
    })  
  );  
});

self.addEventListener('fetch', function(e) {  
  console.log('[m-s ServiceWorker] Fetch ', e.request.url);  
  e.respondWith(  
    caches.match(e.request).then(function(response) {  
      return response || fetch(e.request);  
    })  
  );  
});