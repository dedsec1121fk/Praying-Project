(()=>{
  'use strict';

  const entries=Array.isArray(window.ORTHODOX_ENTRIES)?window.ORTHODOX_ENTRIES:[];
  const cardGrid=document.getElementById('cardGrid');
  const search=document.getElementById('search');
  const matchCount=document.getElementById('matchCount');
  const emptyState=document.getElementById('emptyState');
  const modal=document.getElementById('detailModal');
  const byId=new Map(entries.map(e=>[e.id,e]));
  const storageGet=(k,f)=>{try{return localStorage.getItem(k)||f}catch(_){return f}};
  const storageSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}}

  const state={
    lang:(window.ORTHODOX_BOOT_LANG==='el'?'el':window.ORTHODOX_BOOT_LANG==='en'?'en':storageGet('orthodox-lang','en')),
    query:'',
    active:null,
    tab:'description'
  };

  const UI={
    en:{
      title:'Orthodox Saints',search:'Search a saint, apostle, angel…',none:'No matches',
      feastDay:'Feast / commemoration',scripture:'Scripture / tradition',description:'Description',story:'Story',prayer:'Prayer',notes:'Notes & cautions',
      overview:'Known account',identity:'Identity & Orthodox context',sources:'Sources & limits',commemoration:'Commemoration & veneration',names:'Names & aliases',
      notVenerated:'Biblical context: this entry is not presented as a saint and no prayer is addressed to this figure.',
      source:'Primary source / reference',imageSource:'Image source',localIllustration:'Local illustrative icon',detailed:'Expanded source-based profile',localRecord:'Complete local record',
      result:'match',results:'matches',detailLoading:'Loading full profile…',detailError:'The full local profile could not be loaded.',
      startup:'Preparing the saints catalog',startupSub:'Loading the catalog and the first visible icons…',
      ready:'Catalog ready',
      category:{christ:'Christ & Spirit',theotokos:'Theotokos',angel:'Angel / Heavenly Power',forefather:'Forefather',righteous:'Old Testament Righteous',prophet:'Prophet',apostle:'Apostle / Evangelist','nt-saint':'New Testament Saint','church-saint':'Church Saint',feast:'Feast','biblical-context':'Biblical Context'}
    },
    el:{
      title:'Ορθόδοξοι Άγιοι',search:'Αναζήτησε άγιο, απόστολο, άγγελο…',none:'Δεν βρέθηκαν αποτελέσματα',
      feastDay:'Εορτή / μνήμη',scripture:'Γραφή / παράδοση',description:'Περιγραφή',story:'Ιστορία',prayer:'Προσευχή',notes:'Σημειώσεις & επιφυλάξεις',
      overview:'Γνωστή διήγηση',identity:'Ταυτότητα & ορθόδοξο πλαίσιο',sources:'Πηγές & όρια',commemoration:'Μνήμη & τιμή',names:'Ονόματα & εναλλακτικές',
      notVenerated:'Βιβλικό πλαίσιο: η καταχώριση δεν παρουσιάζεται ως άγιος και δεν απευθύνεται προσευχή σε αυτό το πρόσωπο.',
      source:'Κύρια πηγή / αναφορά',imageSource:'Πηγή εικόνας',localIllustration:'Τοπική εικονογραφική απεικόνιση',detailed:'Εκτεταμένο προφίλ βασισμένο σε πηγές',localRecord:'Πλήρης τοπική καταγραφή',
      result:'αποτέλεσμα',results:'αποτελέσματα',detailLoading:'Φόρτωση πλήρους προφίλ…',detailError:'Δεν ήταν δυνατή η φόρτωση του πλήρους τοπικού προφίλ.',
      startup:'Προετοιμασία του καταλόγου των αγίων',startupSub:'Φόρτωση του καταλόγου και των πρώτων ορατών εικόνων…',
      ready:'Ο κατάλογος είναι έτοιμος',
      category:{christ:'Χριστός & Πνεύμα',theotokos:'Θεοτόκος',angel:'Άγγελος / Ουράνια Δύναμη',forefather:'Προπάτορας',righteous:'Δίκαιος Παλαιάς Διαθήκης',prophet:'Προφήτης',apostle:'Απόστολος / Ευαγγελιστής','nt-saint':'Άγιος Καινής Διαθήκης','church-saint':'Άγιος Εκκλησίας',feast:'Εορτή','biblical-context':'Βιβλικό Πλαίσιο'}
    }
  };

  const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function locText(value,lang=state.lang){
    let s=value==null?'':String(value);
    if(lang==='el'&&typeof window.ORTHODOX_LOCALIZE_EL==='function')s=window.ORTHODOX_LOCALIZE_EL(s);
    return s;
  }
  function haystack(e){return [e.name?.en,e.name?.el,e.role?.en,e.role?.el,e.search,...(e.aliases||[])].join(' ')}
  const searchIndex=new Map(entries.map(e=>[e.id,norm(haystack(e))]));
  const featuredIds=['jesus-christ','holy-spirit','theotokos','archangel-michael','archangel-gabriel','archangel-raphael','john-baptist','peter','paul','andrew','john-theologian','james-zebedee','mary-magdalene','stephen','george','demetrios','nicholas','nektarios','john-chrysostom','basil-great','gregory-theologian','gregory-palamas','constantine-helen','paisios','porphyrios','seraphim-sarov','spyridon','athanasius-great','cyril-alexandria','maximus-confessor','isaac-syrian','mary-egypt','moses','elijah','david','daniel','abraham','sarah','isaac','jacob','joseph-patriarch','noah','job','pentecost','nativity-christ','theophany','transfiguration','dormition','annunciation','pascha'];
  const featuredSet=new Set(featuredIds);
  const ordered=[...entries].sort((a,b)=>{
    const af=featuredSet.has(a.id), bf=featuredSet.has(b.id);
    if(af!==bf) return af?-1:1;
    const an=locText(a.name?.en||a.id,'en').toLowerCase();
    const bn=locText(b.name?.en||b.id,'en').toLowerCase();
    return an.localeCompare(bn);
  });

  function matches(){
    const q=norm(state.query.trim());
    return q?ordered.filter(e=>(searchIndex.get(e.id)||'').includes(q)):ordered;
  }

  function imageUrl(path){try{return new URL(path,document.baseURI).href}catch(_){return path}}
  const fallbackIcon='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="#203b66"/><circle cx="80" cy="80" r="60" fill="#d6a93c" stroke="#fff3b7" stroke-width="5"/><text x="80" y="105" text-anchor="middle" font-family="Georgia,serif" font-size="68" fill="#17203c">☦</text></svg>`);
  function thumbChain(e){
    const chain=[];
    if(e.imageLocalReal) chain.push(imageUrl(e.imageLocalReal));
    if(e.image) chain.push(imageUrl(e.image));
    if(e.imageRemote) chain.push(e.imageRemote);
    chain.push(fallbackIcon);
    return [...new Set(chain)];
  }
  function preferredThumb(e){ return thumbChain(e)[0]||fallbackIcon; }
  function installFallback(img,e){
    const chain=thumbChain(e); let i=0;
    img.addEventListener('error',()=>{ i++; if(i<chain.length) img.src=chain[i]; }, {once:false});
  }

  let activeDetail=null;
  let detailScript=null;
  let detailLoadToken=0;
  function clearPublishedDetail(id){
    const store=window.ORTHODOX_ENTRY_DETAILS;if(!store||!id)return;delete store[id];
    if(!Object.keys(store).length){try{delete window.ORTHODOX_ENTRY_DETAILS}catch(_){window.ORTHODOX_ENTRY_DETAILS=Object.create(null)}}
  }
  function unloadActiveDetails(){
    detailLoadToken++;
    if(detailScript){detailScript.onload=null;detailScript.onerror=null;detailScript.remove();detailScript=null}
    if(activeDetail?.id)clearPublishedDetail(activeDetail.id);
    if(state.active)clearPublishedDetail(state.active);
    activeDetail=null;
    const body=document.getElementById('tabBody');if(body)body.replaceChildren();
    const credit=document.getElementById('modalImageCredit');if(credit){credit.hidden=true;credit.removeAttribute('href');credit.textContent=''}
    const img=document.getElementById('modalImage');if(img){img.onerror=null;img.removeAttribute('src');img.alt=''}
  }
  function showModalSafe(){if(typeof modal.showModal==='function'){try{modal.showModal();return}catch(_){}}modal.setAttribute('open','');modal.classList.add('fallback-open')}
  function closeModalSafe(){
    if(typeof modal.close==='function'){try{modal.close()}catch(_){modal.removeAttribute('open')}}else modal.removeAttribute('open');
    modal.classList.remove('fallback-open');unloadActiveDetails();state.active=null;state.tab='description';
  }
  function detailFileUrl(e){return `web/data/details/${e.detailFile}`}
  function detailView(e){return activeDetail?.id===e.id?Object.assign({},e,activeDetail.data):e}
  function ensureDetails(e){
    if(!e.detailFile)return Promise.reject(new Error('Missing per-entry detail file'));
    const token=++detailLoadToken;
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');detailScript=script;script.src=detailFileUrl(e);script.async=true;
      script.onload=()=>{
        const data=window.ORTHODOX_ENTRY_DETAILS?.[e.id];
        if(token!==detailLoadToken||state.active!==e.id){clearPublishedDetail(e.id);script.remove();if(detailScript===script)detailScript=null;return reject(new Error('Detail load cancelled'))}
        if(!data){script.remove();if(detailScript===script)detailScript=null;return reject(new Error('Entry missing from detail file'))}
        activeDetail={id:e.id,data};resolve(data);
      };
      script.onerror=()=>{if(detailScript===script)detailScript=null;script.remove();clearPublishedDetail(e.id);reject(new Error(`Could not load ${script.src}`))};
      document.head.appendChild(script);
    });
  }
  function setModalMedia(e){
    const lang=state.lang, img=document.getElementById('modalImage'), credit=document.getElementById('modalImageCredit');
    img.onerror=null; installFallback(img,e); img.src=preferredThumb(e); img.alt=locText(e.name?.[lang]||e.name?.en||'',lang);
    if(e.imageMeta?.sourceUrl){
      credit.hidden=false; credit.href=e.imageMeta.sourceUrl;
      const license=locText(e.imageMeta.license||'',lang);
      credit.textContent=lang==='el'?`${UI.el.imageSource} — Wikimedia Commons${license?` — ${license}`:''}`:locText(e.imageMeta.credit?.en||UI.en.imageSource,'en');
    }else if(e.imageQuality?.label){
      credit.hidden=false; credit.removeAttribute('href'); credit.textContent=locText(e.imageQuality.label?.[lang]||e.imageQuality.label?.en||'',lang);
    }else{
      credit.hidden=false; credit.removeAttribute('href'); credit.textContent=UI[lang].localIllustration;
    }
  }
  function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function addSection(body,title,text,cls=''){text=locText(text);title=locText(title);if(!text)return;const section=document.createElement('section');section.className='profile-section'+(cls?` ${cls}`:'');const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.textContent=text;section.append(h,p);body.append(section)}
  function addSources(body,sources,lang){
    if(!Array.isArray(sources)||!sources.length)return;const section=document.createElement('section');section.className='profile-section';const h=document.createElement('h3');h.textContent=lang==='el'?'Πηγές & περαιτέρω ανάγνωση':'Sources & further reading';const ul=document.createElement('ul');ul.className='source-list';
    for(const s of sources){if(!s)continue;let label=(s.label&&((typeof s.label==='object'&&s.label[lang])||s.label.en))||s.url;if(!label)continue;label=locText(label,lang);const li=document.createElement('li');if(s.url){const a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;li.append(a)}else{const span=document.createElement('span');span.textContent=label;li.append(span)}ul.append(li)}
    section.append(h,ul);body.append(section);
  }
  function populateModalLoading(e,error=false){
    const lang=state.lang; modal.dataset.loading=error?'error':'true';
    setModalMedia(e);
    document.getElementById('modalName').textContent=locText(e.name?.[lang]||e.name?.en||e.id,lang);
    document.getElementById('modalRole').textContent=locText(e.role?.[lang]||e.role?.en||'',lang);
    document.getElementById('modalFeast').textContent='…'; document.getElementById('modalScripture').textContent='…';
    document.getElementById('modalCategory').textContent=UI[lang].category[e.category]||locText(e.category,lang);
    const body=document.getElementById('tabBody');body.replaceChildren(); const status=document.createElement('div'); status.className='detail-loading';
    status.innerHTML=`<span class="detail-spinner" aria-hidden="true"></span><strong>${escapeHtml(error?UI[lang].detailError:UI[lang].detailLoading)}</strong>`; body.append(status);
    document.getElementById('modalNotice').hidden=true; document.querySelectorAll('.tab').forEach(t=>{t.disabled=true;t.classList.toggle('active',t.dataset.tab===state.tab)});
  }
  function populateModal(){
    const base=byId.get(state.active); if(!base||activeDetail?.id!==base.id)return; const e=detailView(base),lang=state.lang;
    modal.dataset.loading='false'; document.querySelectorAll('.tab').forEach(t=>t.disabled=false);
    setModalMedia(e);
    document.getElementById('modalName').textContent=locText(e.name?.[lang]||e.name?.en||e.id,lang);
    document.getElementById('modalRole').textContent=locText(e.role?.[lang]||e.role?.en||'',lang);
    document.getElementById('modalFeast').textContent=locText(e.feast?.[lang]||e.feast?.en||'—',lang);
    document.getElementById('modalScripture').textContent=locText(e.scriptureText?.[lang]||e.scriptureText?.en||e.scripture||'—',lang);
    document.getElementById('modalCategory').textContent=UI[lang].category[e.category]||locText(e.category,lang);
    const body=document.getElementById('tabBody'); body.replaceChildren();
    if(state.tab==='description'){
      addSection(body,UI[lang].description,(e.description&&e.description[lang])||(e.description&&e.description.en)||(e.story&&e.story[lang])||(e.story&&e.story.en)||'—','description-section');
    }else if(state.tab==='story'){
      const k=e.knowledge?.[lang]||e.knowledge?.en;
      if(k?.sections?.length){const q=document.createElement('div');q.className='profile-quality';q.textContent=locText(e.contentQuality?.label?.[lang]||e.contentQuality?.label?.en||UI[lang].detailed,lang);body.append(q);const qualityNote=e.contentQuality?.note?.[lang]||e.contentQuality?.note?.en;if(qualityNote)addSection(body,lang==='el'?'Τεκμηρίωση & βεβαιότητα':'Evidence & certainty',qualityNote,'quality-note');for(const s of k.sections)addSection(body,(typeof s.title==='object'?(s.title?.[lang]||s.title?.en):s.title)||'',typeof s.text==='object'?(s.text?.[lang]||s.text?.en):s.text,'long');addSources(body,(k.sources&&k.sources.length?k.sources:e.sources)||[],lang)}
      else if(e.profile?.[lang]){const q=document.createElement('div');q.className='profile-quality';q.textContent=UI[lang].localRecord;body.append(q);const profile=e.profile[lang];for(const key of ['overview','identity','sources','commemoration','names'])addSection(body,UI[lang][key]||key,profile[key]);addSources(body,e.sources||[],lang)}
      else addSection(body,UI[lang].story,(e.story&&e.story[lang])||(e.story&&e.story.en)||'—');
    }else if(state.tab==='prayer'){
      addSection(body,UI[lang].prayer,(e.prayer&&e.prayer[lang])||(e.prayer&&e.prayer.en)||'—','prayer-section');
    }
    const notice=document.getElementById('modalNotice'); notice.hidden=e.venerated!==false; notice.textContent=UI[lang].notVenerated;
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===state.tab));
  }
  async function openEntry(id){
    const e=byId.get(id); if(!e)return;
    unloadActiveDetails(); state.active=id; state.tab='description'; populateModalLoading(e); showModalSafe();
    try{ await ensureDetails(e); if(state.active!==id)return; modal.dataset.loading='false'; document.querySelectorAll('.tab').forEach(t=>t.disabled=false); populateModal(); }
    catch(err){ if(String(err?.message||err)!=='Detail load cancelled')console.error(err); if(state.active===id)populateModalLoading(e,true); }
  }

  function renderCards(){
    const list=matches();
    emptyState.hidden=list.length!==0;
    matchCount.textContent=state.query.trim()?`${list.length} ${list.length===1?UI[state.lang].result:UI[state.lang].results}`:`${entries.length}`;
    const frag=document.createDocumentFragment();
    for(const e of list){
      const card=document.createElement('button');
      card.type='button'; card.className='saint-card'; card.dataset.id=e.id;
      card.setAttribute('aria-label',locText(e.name?.[state.lang]||e.name?.en||e.id,state.lang));
      const media=document.createElement('div'); media.className='saint-card-media';
      const img=document.createElement('img');
      img.loading='lazy'; img.decoding='async'; img.alt=locText(e.name?.[state.lang]||e.name?.en||'',state.lang); img.src=preferredThumb(e); installFallback(img,e);
      media.append(img);
      const name=document.createElement('div'); name.className='saint-card-name'; name.textContent=locText(e.name?.[state.lang]||e.name?.en||e.id,state.lang);
      const role=document.createElement('div'); role.className='saint-card-role'; role.textContent=locText(e.role?.[state.lang]||e.role?.en||'',state.lang);
      card.append(media,name,role);
      card.addEventListener('click',()=>openEntry(e.id));
      frag.append(card);
    }
    cardGrid.replaceChildren(frag);
  }

  function translate(){
    document.documentElement.lang=state.lang;
    search.placeholder=UI[state.lang].search;
    search.setAttribute('aria-label',UI[state.lang].search);
    document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(UI[state.lang][key])el.textContent=UI[state.lang][key]});
    document.querySelectorAll('.lang').forEach(btn=>btn.classList.toggle('active',btn.dataset.lang===state.lang));
    renderCards();
    if(state.active){const e=byId.get(state.active);if(e&&activeDetail?.id===e.id)populateModal();else if(e)populateModalLoading(e)}
  }

  function preloadFirstIcons(limit=24){
    const first=matches().slice(0,limit);
    return Promise.all(first.map(e=>new Promise(resolve=>{
      const img=new Image(); let done=false;
      const finish=()=>{if(done)return;done=true; resolve();};
      img.onload=finish; img.onerror=finish; img.decoding='async'; img.src=preferredThumb(e);
    })));
  }
  async function runStartup(){
    const loader=document.getElementById('startupLoader'); if(!loader){ renderCards(); return; }
    const bar=document.getElementById('startupBar'), pct=document.getElementById('startupPct'), title=document.getElementById('startupTitle'), sub=document.getElementById('startupSub');
    title.textContent=UI[state.lang].startup; sub.textContent=UI[state.lang].startupSub;
    const setProgress=(v,text)=>{ const p=Math.max(0,Math.min(1,v)); if(bar)bar.style.transform=`scaleX(${p})`; if(pct)pct.textContent=`${Math.round(p*100)}%`; if(text&&sub)sub.textContent=text; };
    setProgress(.15,UI[state.lang].startupSub);
    renderCards();
    setProgress(.55,state.lang==='el'?'Απεικόνιση του καταλόγου…':'Rendering the catalog…');
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    await preloadFirstIcons(24);
    setProgress(1,UI[state.lang].ready);
    await new Promise(r=>setTimeout(r,180));
    loader.classList.add('done'); document.body.classList.remove('startup-lock'); setTimeout(()=>loader.remove(),320);
  }

  let searchDebounce=0;
  search.addEventListener('input',e=>{ state.query=e.target.value; clearTimeout(searchDebounce); searchDebounce=setTimeout(renderCards,45); });
  search.addEventListener('keydown',e=>{ if(e.key==='Enter'){ const first=matches()[0]; if(first){ e.preventDefault(); openEntry(first.id); } } });
  document.querySelectorAll('.lang').forEach(btn=>btn.addEventListener('click',ev=>{ ev.preventDefault(); state.lang=btn.dataset.lang; storageSet('orthodox-lang',state.lang); translate(); }));
  document.addEventListener('keydown',e=>{
    if(e.key==='/'&&document.activeElement!==search){ e.preventDefault(); search.focus(); return; }
    if(e.key==='Escape'&&modal.hasAttribute('open')){ closeModalSafe(); return; }
  });
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{ if(t.disabled)return; state.tab=t.dataset.tab; populateModal(); }));
  document.getElementById('closeModal').addEventListener('click',closeModalSafe);
  modal.addEventListener('click',e=>{ if(e.target===modal) closeModalSafe(); });
  modal.addEventListener('cancel',e=>{ e.preventDefault(); closeModalSafe(); });

  document.body.classList.add('startup-lock');
  translate();
  runStartup();
})();
