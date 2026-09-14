(()=>{
  'use strict';
  const loader=document.getElementById('startupLoader');
  const languageStage=document.getElementById('languageStage');
  const loadingStage=document.getElementById('loadingStage');
  const buttons=[...document.querySelectorAll('[data-start-lang]')];
  let started=false;
  function save(lang){try{localStorage.setItem('orthodox-lang',lang)}catch(_){}}
  function loadScript(src,deadline){return new Promise((resolve,reject)=>{const s=document.createElement('script');let settled=false;const finish=(ok,err)=>{if(settled)return;settled=true;clearTimeout(timer);s.onload=s.onerror=null;ok?resolve(s):reject(err||new Error(`Could not load ${src}`))};s.src=src;s.async=false;s.onload=()=>finish(true);s.onerror=()=>finish(false);const timer=setTimeout(()=>finish(false,new Error(`Loading timed out: ${src}`)),Math.max(1000,deadline-performance.now()));document.head.appendChild(s)})}
  async function start(lang){
    if(started)return;started=true;
    lang=lang==='el'?'el':'en';window.ORTHODOX_BOOT_LANG=lang;window.ORTHODOX_BOOT_STARTED=performance.now();const deadline=window.ORTHODOX_BOOT_STARTED+30000;save(lang);document.documentElement.lang=lang;
    languageStage.hidden=true;loadingStage.hidden=false;
    const title=document.getElementById('startupTitle'),sub=document.getElementById('startupSub');
    title.textContent=lang==='el'?'Προετοιμασία ολόκληρου του ιστού':'Preparing the complete web';
    sub.textContent=lang==='el'?'Προετοιμασία όλων των φυσαλίδων, του ιστού και του περιβάλλοντος νεφών…':'Preparing every bubble, the web and the cloud environment…';
    try{
      await loadScript('web/data/runtime-index.js',deadline);
      await loadScript('web/assets/js/app.js',deadline);
    }catch(err){
      console.error(err);started=false;languageStage.hidden=false;loadingStage.hidden=true;
      const msg=document.createElement('p');msg.className='startup-error';msg.textContent=lang==='el'?'Η τοπική εφαρμογή δεν μπόρεσε να φορτώσει. Ελέγξτε ότι αποσυμπιέσατε ολόκληρο τον φάκελο.':'The local app could not load. Make sure the entire folder was extracted.';loader.querySelector('.startup-card').appendChild(msg);
    }
  }
  buttons.forEach(b=>b.addEventListener('click',()=>start(b.dataset.startLang)));
})();
