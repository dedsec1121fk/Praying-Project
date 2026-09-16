'use strict';
const CACHE_PREFIX='praying-project-offline-';
const CACHE_NAME='praying-project-offline-v25';
const SHELL=['./','./index.html','./404.html','./web-app.webmanifest','./web/assets/css/styles.css','./web/assets/js/bootstrap.js','./web/assets/js/app.js','./web/data/runtime-index.js','./web/offline-files.json'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    for(const url of SHELL){try{await cache.add(url)}catch(_){}}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n.startsWith(CACHE_PREFIX)&&n!==CACHE_NAME).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cached=await caches.match(req);
    if(cached)return cached;
    try{
      const response=await fetch(req);
      if(response&&response.ok){
        const cache=await caches.open(CACHE_NAME);
        cache.put(req,response.clone()).catch(()=>{});
      }
      return response;
    }catch(err){
      if(req.mode==='navigate'){
        const fallback=await caches.match('./index.html');
        if(fallback)return fallback;
      }
      throw err;
    }
  })());
});
