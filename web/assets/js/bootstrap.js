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
    const pct=document.getElementById('startupPct');if(pct)pct.textContent='0%';const bar=document.getElementById('startupBar');if(bar)bar.style.transform='scaleX(0)';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); 
    try{
      if(pct)pct.textContent='3%';if(bar)bar.style.transform='scaleX(.03)';
      await loadScript('web/data/runtime-index.js?v=27');
      if(pct)pct.textContent='7%';if(bar)bar.style.transform='scaleX(.07)';
      await loadScript('web/assets/js/app.js?v=27');
    }catch(err){
      console.error(err);started=false;languageStage.hidden=false;loadingStage.hidden=true;
      const old=loader.querySelector('.startup-error');if(old)old.remove();
      const msg=document.createElement('p');msg.className='startup-error';msg.textContent=lang==='el'?'Ο τοπικός κατάλογος δεν μπόρεσε να φορτώσει. Ελέγξτε ότι αποσυμπιέσατε ολόκληρο τον φάκελο.':'The local catalog could not load. Make sure the entire folder was extracted.';loader.querySelector('.startup-card').appendChild(msg);
    }
  }
  buttons.forEach(b=>b.addEventListener('click',()=>start(b.dataset.startLang)));
})();
