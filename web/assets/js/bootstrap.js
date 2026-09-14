(()=>{
  'use strict';
  const loader=document.getElementById('startupLoader');
  const languageStage=document.getElementById('languageStage');
  const loadingStage=document.getElementById('loadingStage');
  const buttons=[...document.querySelectorAll('[data-start-lang]')];
  let started=false;
  function save(lang){try{localStorage.setItem('orthodox-lang',lang)}catch(_){}}
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src;s.async=false;
      s.onload=()=>{s.onload=s.onerror=null;resolve(s)};
      s.onerror=()=>{s.onload=s.onerror=null;s.remove();reject(new Error(`Could not load ${src}`))};
      document.head.appendChild(s);
    });
  }
  async function start(lang){
    if(started)return;started=true;
    lang=lang==='el'?'el':'en';
    window.ORTHODOX_BOOT_LANG=lang;window.ORTHODOX_BOOT_STARTED=performance.now();
    save(lang);document.documentElement.lang=lang;
    languageStage.hidden=true;loadingStage.hidden=false;
    const title=document.getElementById('startupTitle'),sub=document.getElementById('startupSub');
    title.textContent=lang==='el'?'Πλήρης φόρτωση του ιστού':'Loading the complete web';
    sub.textContent=lang==='el'?'Θα ανοίξει μόνο όταν ελεγχθούν και αποκωδικοποιηθούν όλες οι τοπικές εικόνες. Δεν υπάρχει χρονικό όριο.':'The web will open only after every local icon has been checked and decoded. There is no overall time limit.';
    try{
      await loadScript('web/data/runtime-index.js');
      await loadScript('web/assets/js/app.js');
    }catch(err){
      console.error(err);started=false;languageStage.hidden=false;loadingStage.hidden=true;
      const old=loader.querySelector('.startup-error');if(old)old.remove();
      const msg=document.createElement('p');msg.className='startup-error';msg.textContent=lang==='el'?'Η τοπική εφαρμογή δεν μπόρεσε να φορτώσει. Ελέγξτε ότι αποσυμπιέσατε ολόκληρο τον φάκελο.':'The local app could not load. Make sure the entire folder was extracted.';loader.querySelector('.startup-card').appendChild(msg);
    }
  }
  buttons.forEach(b=>b.addEventListener('click',()=>start(b.dataset.startLang)));
})();
