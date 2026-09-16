'use strict';
const CACHE_PREFIX='praying-project-offline-';
const CACHE_NAME='praying-project-offline-v26';
const SHELL=['./','./index.html','./404.html','./web-app.webmanifest','./web/assets/css/styles.css','./web/assets/js/bootstrap.js','./web/assets/js/app.js','./web/data/runtime-index.js','./web/offline-files.json'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    for(const url of SHELL){
      try{
        const r=await fetch(url,{cache:'reload'});
        if(r.ok)await cache.put(url,r.clone());
      }catch(_){}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n.startsWith(CACHE_PREFIX)&&n!==CACHE_NAME).map(n=>caches.delete(n)));
    await self.clients.claim();
    const windows=await self.clients.matchAll({type:'window'});
    for(const client of windows){try{await client.navigate(client.url)}catch(_){}}
  })());
});

function isFreshCritical(path){
  return path.endsWith('/')||path.endsWith('/index.html')||path.endsWith('/404.html')||
    path.endsWith('/web/assets/css/styles.css')||path.endsWith('/web/assets/js/bootstrap.js')||
    path.endsWith('/web/assets/js/app.js')||path.endsWith('/web/data/runtime-index.js')||
    path.endsWith('/web/offline-files.json')||path.endsWith('/service-worker.js');
}

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    if(isFreshCritical(url.pathname)){
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        if(fresh&&fresh.ok)cache.put(req,fresh.clone()).catch(()=>{});
        return fresh;
      }catch(_){
        const cached=await cache.match(req,{ignoreSearch:true});
        if(cached)return cached;
        throw _;
      }
    }
    const cached=await cache.match(req,{ignoreSearch:true});
    if(cached)return cached;
    try{
      const response=await fetch(req);
      if(response&&response.ok)cache.put(req,response.clone()).catch(()=>{});
      return response;
    }catch(err){
      if(req.mode==='navigate'){
        const fallback=await cache.match('./index.html');
        if(fallback)return fallback;
      }
      throw err;
    }
  })());
});
