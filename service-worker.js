'use strict';
const CACHE_PREFIX='praying-project-offline-';
const CACHE_NAME='praying-project-offline-v29';
const DETAIL_CACHE_PREFIX='praying-project-detail-';
const DETAIL_CACHE_NAME='praying-project-detail-bundles-v29';
const SHELL=['./','./index.html','./404.html','./web-app.webmanifest','./web/assets/css/styles.css','./web/assets/js/bootstrap.js','./web/assets/js/app.js','./web/data/runtime-index.js'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    for(const url of SHELL){
      try{const r=await fetch(url,{cache:'reload'});if(r.ok)await cache.put(url,r.clone())}catch(_){}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>(n.startsWith(CACHE_PREFIX)&&n!==CACHE_NAME)||(n.startsWith(DETAIL_CACHE_PREFIX)&&n!==DETAIL_CACHE_NAME)||n.startsWith('praying-project-detail-warm-')).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});

function isFreshCritical(path){
  return path.endsWith('/')||path.endsWith('/index.html')||path.endsWith('/404.html')||
    path.endsWith('/web/assets/css/styles.css')||path.endsWith('/web/assets/js/bootstrap.js')||
    path.endsWith('/web/assets/js/app.js')||path.endsWith('/web/data/runtime-index.js')||
    path.endsWith('/web/data/search-index.js')||path.endsWith('/web/offline-files.json')||path.endsWith('/service-worker.js');
}

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const offline=await caches.open(CACHE_NAME);
    // v29 detail bundles: cache-first when warmed, otherwise network once and
    // store the raw JSON bundle. The page only parses the selected record and
    // releases it when the modal closes.
    if(url.pathname.includes('/web/data/detail-bundles/')){
      const warm=await caches.open(DETAIL_CACHE_NAME);
      const hit=await warm.match(req,{ignoreSearch:true});if(hit)return hit;
      const offlineHit=await offline.match(req,{ignoreSearch:true});if(offlineHit)return offlineHit;
      try{const fresh=await fetch(req,{cache:'no-store'});if(fresh&&fresh.ok)warm.put(req,fresh.clone()).catch(()=>{});return fresh}catch(err){throw err}
    }
    if(isFreshCritical(url.pathname)){
      try{const fresh=await fetch(req,{cache:'no-store'});if(fresh&&fresh.ok)offline.put(req,fresh.clone()).catch(()=>{});return fresh}
      catch(err){const cached=await offline.match(req,{ignoreSearch:true});if(cached)return cached;throw err}
    }
    const cached=await offline.match(req,{ignoreSearch:true});if(cached)return cached;
    try{const response=await fetch(req);if(response&&response.ok)offline.put(req,response.clone()).catch(()=>{});return response}
    catch(err){if(req.mode==='navigate'){const fallback=await offline.match('./index.html');if(fallback)return fallback}throw err}
  })());
});
