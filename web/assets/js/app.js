(()=>{
  'use strict';

  const entries=Array.isArray(window.ORTHODOX_ENTRIES)?window.ORTHODOX_ENTRIES:[];
  const network=document.getElementById('network');
  const scene=document.getElementById('scene');
  const canvas=document.getElementById('webCanvas');
  const labelsEl=document.getElementById('labels');
  const searchMarker=document.getElementById('searchMarker');
  const modal=document.getElementById('detailModal');
  const search=document.getElementById('search');
  const matchCount=document.getElementById('matchCount');
  const emptyState=document.getElementById('emptyState');
  const compact=matchMedia('(max-width:620px)').matches;
  const lowMemory=typeof navigator.deviceMemory==='number'&&navigator.deviceMemory<4;

  /*
    v12 performance architecture:
    - all 1,083 bubbles + all web threads are rasterized once into ONE canvas during startup;
    - panning/zooming changes only the transform of the scene (one composited layer);
    - there are no image/button DOM nodes to move while dragging;
    - names are small screen-space labels created only after movement stops;
    - details remain one-file-per-entry and are unloaded when the modal closes.
  */
  const WORLD={w:(compact||lowMemory)?2900:3400,h:(compact||lowMemory)?2100:2450};
  const CENTER={x:WORLD.w/2,y:WORLD.h/2};
  const BUBBLE_R=(compact||lowMemory)?24:26;
  const BASE_SCALE=compact?.75:.78;
  const MAX_SCALE=3.2;
  const NORMAL_MIN_SCALE=compact?.12:.10;

  let activeDetail=null;
  let detailScript=null;
  let detailLoadToken=0;
  let renderReady=false;
  let positions=[];
  const positionById=new Map();
  const byId=new Map(entries.map(e=>[e.id,e]));

  function storageGet(key,fallback){try{return localStorage.getItem(key)||fallback}catch(_){return fallback}}
  function storageSet(key,value){try{localStorage.setItem(key,value)}catch(_){} }

  const state={
    lang:(window.ORTHODOX_BOOT_LANG==='el'?'el':window.ORTHODOX_BOOT_LANG==='en'?'en':storageGet('orthodox-lang','en')),
    query:'',active:null,tab:'story',panX:0,panY:0,scale:BASE_SCALE
  };

  const UI={
    en:{
      father:'Father',son:'Son',spirit:'Holy Spirit',trinity:'HOLY TRINITY',centerSub:'Father • Son • Holy Spirit',
      feastDay:'Feast / commemoration',scripture:'Scripture / tradition',story:'Life & knowledge',prayer:'Prayer',notes:'Notes',
      overview:'Known account',identity:'Identity & Orthodox context',sources:'Sources & limits',commemoration:'Commemoration & veneration',names:'Names & aliases',
      search:'Search a saint, apostle, angel…',none:'No matches',
      notVenerated:'Biblical context: this entry is not presented as a saint and no prayer is addressed to this figure.',
      source:'Primary source / reference',imageSource:'Image source',detailed:'Expanded source-based profile',localRecord:'Complete local record',
      result:'match',results:'matches',detailLoading:'Loading full profile…',detailError:'The full local profile could not be loaded.',
      startup:'Building the smooth web',startupSub:'Rasterizing every bubble, icon, thread and cloud scene…',
      category:{christ:'Christ & Spirit',theotokos:'Theotokos',angel:'Angel / Heavenly Power',forefather:'Forefather',righteous:'Old Testament Righteous',prophet:'Prophet',apostle:'Apostle / Evangelist','nt-saint':'New Testament Saint','church-saint':'Church Saint',feast:'Feast','biblical-context':'Biblical Context'}
    },
    el:{
      father:'Πατήρ',son:'Υιός',spirit:'Άγιο Πνεύμα',trinity:'ΑΓΙΑ ΤΡΙΑΔΑ',centerSub:'Πατήρ • Υιός • Άγιο Πνεύμα',
      feastDay:'Εορτή / μνήμη',scripture:'Γραφή / παράδοση',story:'Βίος & γνώση',prayer:'Προσευχή',notes:'Σημειώσεις',
      overview:'Γνωστή διήγηση',identity:'Ταυτότητα & ορθόδοξο πλαίσιο',sources:'Πηγές & όρια',commemoration:'Μνήμη & τιμή',names:'Ονόματα & εναλλακτικές',
      search:'Αναζήτησε άγιο, απόστολο, άγγελο…',none:'Δεν βρέθηκαν αποτελέσματα',
      notVenerated:'Βιβλικό πλαίσιο: η καταχώριση δεν παρουσιάζεται ως άγιος και δεν απευθύνεται προσευχή σε αυτό το πρόσωπο.',
      source:'Κύρια πηγή / αναφορά',imageSource:'Πηγή εικόνας',detailed:'Εκτεταμένο προφίλ βασισμένο σε πηγές',localRecord:'Πλήρης τοπική καταγραφή',
      result:'αποτέλεσμα',results:'αποτελέσματα',detailLoading:'Φόρτωση πλήρους προφίλ…',detailError:'Δεν ήταν δυνατή η φόρτωση του πλήρους τοπικού προφίλ.',
      startup:'Δημιουργία ομαλού ιστού',startupSub:'Απόδοση όλων των φυσαλίδων, εικόνων, νημάτων και νεφών…',
      category:{christ:'Χριστός & Πνεύμα',theotokos:'Θεοτόκος',angel:'Άγγελος / Ουράνια Δύναμη',forefather:'Προπάτορας',righteous:'Δίκαιος Παλαιάς Διαθήκης',prophet:'Προφήτης',apostle:'Απόστολος / Ευαγγελιστής','nt-saint':'Άγιος Καινής Διαθήκης','church-saint':'Άγιος Εκκλησίας',feast:'Εορτή','biblical-context':'Βιβλικό Πλαίσιο'}
    }
  };
  const colors={christ:'#f5c94b',theotokos:'#4aa8df',angel:'#48cfe7',forefather:'#f0a65a',righteous:'#58b987',prophet:'#8c71ca',apostle:'#d95fa6','nt-saint':'#55bfa2','church-saint':'#e77f62',feast:'#e6bd4c','biblical-context':'#8a96b4'};

  const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function locText(value,lang=state.lang){
    let s=value==null?'':String(value);
    if(lang==='el'&&typeof window.ORTHODOX_LOCALIZE_EL==='function')s=window.ORTHODOX_LOCALIZE_EL(s);
    return s;
  }
  function haystack(e){return [e.name?.en,e.name?.el,e.role?.en,e.role?.el,e.search,...(e.aliases||[])].join(' ')}
  const searchIndex=new Map(entries.map(e=>[e.id,norm(haystack(e))]));
  function matches(){const q=norm(state.query.trim());return q?entries.filter(e=>(searchIndex.get(e.id)||'').includes(q)):entries}
  function hashString(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function unit(seed){seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296}

  const featuredIds=['jesus-christ','holy-spirit','theotokos','archangel-michael','archangel-gabriel','archangel-raphael','john-baptist','peter','paul','andrew','john-theologian','james-zebedee','mary-magdalene','stephen','george','demetrios','nicholas','nektarios','john-chrysostom','basil-great','gregory-theologian','gregory-palamas','constantine-helen','paisios','porphyrios','seraphim-sarov','spyridon','athanasius-great','cyril-alexandria','maximus-confessor','isaac-syrian','mary-egypt','moses','elijah','david','daniel','abraham','sarah','isaac','jacob','joseph-patriarch','noah','job','pentecost','nativity-christ','theophany','transfiguration','dormition','annunciation','pascha'];
  const featured=featuredIds.map(id=>byId.get(id)).filter(Boolean);
  const featuredSet=new Set(featured.map(e=>e.id));
  const ordered=[...featured,...entries.filter(e=>!featuredSet.has(e.id))];

  function buildLayout(){
    const out=[];
    const rings=compact?
      [{cap:8,rx:185,ry:150,jx:16,jy:14},{cap:14,rx:295,ry:225,jx:20,jy:18},{cap:22,rx:410,ry:305,jx:23,jy:20},{cap:32,rx:535,ry:395,jx:26,jy:22}]:
      [{cap:8,rx:200,ry:160,jx:17,jy:15},{cap:14,rx:320,ry:240,jx:21,jy:18},{cap:22,rx:450,ry:330,jx:24,jy:20},{cap:34,rx:590,ry:430,jx:27,jy:22}];
    let used=0;
    for(let ri=0;ri<rings.length&&used<ordered.length;ri++){
      const r=rings[ri],count=Math.min(r.cap,ordered.length-used),offset=.21*ri+(ri%2?Math.PI/count:0);
      for(let j=0;j<count;j++){
        const e=ordered[used+j],h=hashString(e.id),a=Math.PI*2*j/count+offset+(unit(h)*.12-.06);
        out.push({id:e.id,x:CENTER.x+Math.cos(a)*r.rx+(unit(h+11)*2-1)*r.jx,y:CENTER.y+Math.sin(a)*r.ry+(unit(h+37)*2-1)*r.jy});
      }
      used+=count;
    }
    const golden=Math.PI*(3-Math.sqrt(5));
    const startR=compact?545:600,spacing=compact?24:27,yr=.72;
    for(let i=used;i<ordered.length;i++){
      const k=i-used+1,e=ordered[i],h=hashString(e.id),r=startR+spacing*Math.sqrt(k),a=k*golden+(unit(h+91)*.20-.10);
      const radial=1+(unit(h+123)*.05-.025);
      out.push({id:e.id,x:CENTER.x+Math.cos(a)*r*radial+(unit(h+17)*2-1)*20,y:CENTER.y+Math.sin(a)*r*yr*radial+(unit(h+53)*2-1)*18});
    }
    positions=out;
    positionById.clear();for(const p of out)positionById.set(p.id,p);
  }

  function imageUrl(path){try{return new URL(path,document.baseURI).href}catch(_){return path}}
  const fallbackIcon='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="#203b66"/><circle cx="80" cy="80" r="60" fill="#d6a93c" stroke="#fff3b7" stroke-width="5"/><text x="80" y="105" text-anchor="middle" font-family="Georgia,serif" font-size="68" fill="#17203c">☦</text></svg>`);
  function imageChain(e,forCanvas=false){
    const chain=[];
    if(e.imageLocalReal)chain.push(imageUrl(e.imageLocalReal));
    if(e.imageRemote&&navigator.onLine!==false)chain.push(e.imageRemote);
    if(e.image)chain.push(imageUrl(e.image));
    chain.push(fallbackIcon);
    // Canvas startup prioritizes local reliability; real remote mappings are still attempted first.
    return [...new Set(chain)];
  }
  function preferredImage(e){return imageChain(e)[0]}
  function installImageFallback(img,e){const chain=imageChain(e);let stage=0;img.addEventListener('error',()=>{stage++;if(stage<chain.length)img.src=chain[stage]})}

  // ---------- One-time raster web ----------
  let ctx=null;
  function sizeCanvas(){
    canvas.width=WORLD.w;canvas.height=WORLD.h;canvas.style.width=`${WORLD.w}px`;canvas.style.height=`${WORLD.h}px`;
    scene.style.width=`${WORLD.w}px`;scene.style.height=`${WORLD.h}px`;
    ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
    if(ctx)ctx.imageSmoothingEnabled=true;
  }
  function drawThreads(){
    if(!ctx)return;
    ctx.clearRect(0,0,WORLD.w,WORLD.h);
    ctx.lineCap='round';ctx.lineWidth=1.15;ctx.strokeStyle='rgba(24,84,127,.34)';ctx.beginPath();
    for(let i=1;i<positions.length;i++){
      const a=positions[i];
      const js=i<80?[1,5,13]:[11,19];
      for(const off of js){const j=i-off;if(j<0)continue;const b=positions[j];const d=Math.hypot(a.x-b.x,a.y-b.y);if(d>320)continue;ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)}
    }
    ctx.stroke();
    ctx.lineWidth=1.4;ctx.strokeStyle='rgba(255,240,168,.48)';ctx.beginPath();
    for(let i=0;i<Math.min(18,positions.length);i+=2){const p=positions[i];ctx.moveTo(CENTER.x,CENTER.y);ctx.lineTo(p.x,p.y)}ctx.stroke();
  }
  function drawBubbleShell(e,p){
    if(!ctx)return;
    const c=colors[e.category]||'#72e8ff';
    ctx.beginPath();ctx.arc(p.x,p.y,BUBBLE_R+3,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.95)';ctx.fill();
    ctx.beginPath();ctx.arc(p.x,p.y,BUBBLE_R+1,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();
    ctx.beginPath();ctx.arc(p.x,p.y,BUBBLE_R-2,0,Math.PI*2);ctx.fillStyle='#16284a';ctx.fill();
  }
  function drawFallbackInBubble(p){
    ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,BUBBLE_R-3,0,Math.PI*2);ctx.clip();
    const g=ctx.createRadialGradient(p.x-BUBBLE_R*.3,p.y-BUBBLE_R*.35,2,p.x,p.y,BUBBLE_R);
    g.addColorStop(0,'#fff1ad');g.addColorStop(.48,'#c99734');g.addColorStop(1,'#2e4770');ctx.fillStyle=g;ctx.fillRect(p.x-BUBBLE_R,p.y-BUBBLE_R,BUBBLE_R*2,BUBBLE_R*2);
    ctx.fillStyle='#17203c';ctx.font=`bold ${Math.round(BUBBLE_R*1.05)}px Georgia,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('☦',p.x,p.y+1);ctx.restore();
  }
  function drawImageInBubble(img,p){
    ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,BUBBLE_R-3,0,Math.PI*2);ctx.clip();
    const iw=img.naturalWidth||img.width||1,ih=img.naturalHeight||img.height||1;
    const d=BUBBLE_R*2-6,scale=Math.min(d/iw,d/ih),w=iw*scale,h=ih*scale;
    ctx.fillStyle='#152444';ctx.fillRect(p.x-BUBBLE_R,p.y-BUBBLE_R,BUBBLE_R*2,BUBBLE_R*2);
    ctx.drawImage(img,p.x-w/2,p.y-h/2,w,h);ctx.restore();
  }
  function loadEntryImage(e,deadline){
    const chain=imageChain(e,true);
    let index=0;
    return new Promise(resolve=>{
      const tryNext=()=>{
        if(index>=chain.length||performance.now()>deadline){resolve(null);return}
        const src=chain[index++],img=new Image();let done=false;
        const remote=/^https?:/i.test(src);const timeout=Math.min(remote?1800:1200,Math.max(120,deadline-performance.now()));
        const timer=setTimeout(()=>finish(null),timeout);
        function finish(ok){if(done)return;done=true;clearTimeout(timer);img.onload=img.onerror=null;if(ok)resolve(img);else tryNext()}
        img.decoding='async';img.onload=()=>finish(img);img.onerror=()=>finish(null);img.src=src;
      };
      tryNext();
    });
  }
  async function rasterizeAll(deadline,onProgress){
    drawThreads();
    for(let i=0;i<ordered.length;i++)drawBubbleShell(ordered[i],positions[i]);
    let cursor=0,done=0,stopped=false;
    const concurrency=lowMemory?6:(compact?9:14);
    async function worker(){
      while(!stopped){
        const i=cursor++;if(i>=ordered.length)return;
        const e=ordered[i],p=positions[i];
        const img=await loadEntryImage(e,deadline);
        if(img)drawImageInBubble(img,p);else drawFallbackInBubble(p);
        done++;onProgress?.(done,ordered.length);
        if(performance.now()>=deadline){stopped=true;return}
        if((done&31)===0)await new Promise(r=>setTimeout(r,0));
      }
    }
    await Promise.race([
      Promise.all(Array.from({length:Math.min(concurrency,ordered.length)},()=>worker())),
      new Promise(r=>setTimeout(()=>{stopped=true;r()},Math.max(0,deadline-performance.now())))
    ]);
    // Anything not completed before the 30 s cap still gets a cheap local-looking shell.
    for(let i=0;i<ordered.length;i++){
      // Shells already exist, so no expensive late work is required.
    }
    renderReady=true;
  }

  // ---------- Screen-space names (not transformed while dragging) ----------
  const labelMap=new Map();
  function cameraBase(scale=state.scale){const vw=network.clientWidth||innerWidth,vh=network.clientHeight||innerHeight;return{x:(vw-WORLD.w*scale)/2,y:(vh-WORLD.h*scale)/2,vw,vh}}
  function worldToScreen(p){const b=cameraBase();return{x:b.x+state.panX+p.x*state.scale,y:b.y+state.panY+p.y*state.scale}}
  function clearLabels(){labelsEl.replaceChildren();labelMap.clear()}
  function refreshLabels(){
    if(!renderReady)return;
    clearLabels();
    const vw=network.clientWidth||innerWidth,vh=network.clientHeight||innerHeight;
    const queryMatches=state.query.trim()?new Set(matches().map(e=>e.id)):null;
    const candidates=[];
    for(let i=0;i<ordered.length;i++){
      const e=ordered[i],p=positions[i],s=worldToScreen(p);
      if(s.x<-80||s.x>vw+80||s.y<-70||s.y>vh+70)continue;
      const priority=queryMatches?.has(e.id)?-100000:Math.hypot(s.x-vw/2,s.y-vh/2);
      candidates.push({e,p,s,priority});
    }
    candidates.sort((a,b)=>a.priority-b.priority);
    const cap=compact?52:86;
    for(const c of candidates.slice(0,cap)){
      const label=document.createElement('div');label.className='canvas-label';
      if(c.e.venerated===false)label.classList.add('context-label');
      label.textContent=locText(c.e.name?.[state.lang]||c.e.name?.en||c.e.id,state.lang);
      const offset=Math.max(17,BUBBLE_R*state.scale+5);
      label.style.transform=`translate3d(${c.s.x.toFixed(1)}px,${(c.s.y+offset).toFixed(1)}px,0) translateX(-50%)`;
      labelsEl.appendChild(label);labelMap.set(c.e.id,label);
    }
    updateSearchMarker();
  }
  function updateSearchMarker(){
    const ms=matches();const q=state.query.trim();
    if(!q||!ms.length){searchMarker.hidden=true;return}
    const p=positionById.get(ms[0].id);if(!p){searchMarker.hidden=true;return}
    const s=worldToScreen(p),size=Math.max(34,Math.min(92,(BUBBLE_R*2+14)*state.scale));
    searchMarker.hidden=false;searchMarker.style.width=`${size}px`;searchMarker.style.height=`${size}px`;
    searchMarker.style.transform=`translate3d(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px,0) translate(-50%,-50%)`;
  }
  let labelTimer=0;function scheduleLabels(delay=90){clearTimeout(labelTimer);labelTimer=setTimeout(refreshLabels,delay)}

  // ---------- Per-entry details: load on tap, delete/unload on close ----------
  function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function showModalSafe(){if(typeof modal.showModal==='function'){try{modal.showModal();return}catch(_){}}modal.setAttribute('open','');modal.classList.add('fallback-open')}
  function clearPublishedDetail(id){
    const store=window.ORTHODOX_ENTRY_DETAILS;if(!store||!id)return;delete store[id];
    if(!Object.keys(store).length){try{delete window.ORTHODOX_ENTRY_DETAILS}catch(_){window.ORTHODOX_ENTRY_DETAILS=Object.create(null)}}
  }
  function unloadActiveDetails(){
    detailLoadToken++;
    if(detailScript){detailScript.onload=null;detailScript.onerror=null;detailScript.remove();detailScript=null}
    if(activeDetail?.id)clearPublishedDetail(activeDetail.id);if(state.active)clearPublishedDetail(state.active);activeDetail=null;
    const body=document.getElementById('tabBody');if(body)body.replaceChildren();
    const credit=document.getElementById('modalImageCredit');if(credit){credit.hidden=true;credit.removeAttribute('href');credit.textContent=''}
    const img=document.getElementById('modalImage');if(img){img.onerror=null;img.removeAttribute('src');img.alt=''}
  }
  function closeModalSafe(){
    if(typeof modal.close==='function'){try{modal.close()}catch(_){modal.removeAttribute('open')}}else modal.removeAttribute('open');
    modal.classList.remove('fallback-open');unloadActiveDetails();state.active=null;state.tab='story';
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
  function populateModalLoading(e,error=false){
    const lang=state.lang;modal.dataset.loading=error?'error':'true';
    const img=document.getElementById('modalImage');img.onerror=null;installImageFallback(img,e);img.src=preferredImage(e);img.alt=locText(e.name?.[lang]||e.name?.en||'',lang);
    const credit=document.getElementById('modalImageCredit');credit.hidden=true;credit.removeAttribute('href');credit.textContent='';
    document.getElementById('modalName').textContent=locText(e.name?.[lang]||e.name?.en||e.id,lang);
    document.getElementById('modalRole').textContent=locText(e.role?.[lang]||e.role?.en||'',lang);
    document.getElementById('modalFeast').textContent='…';document.getElementById('modalScripture').textContent='…';
    document.getElementById('modalCategory').textContent=UI[lang].category[e.category]||locText(e.category,lang);
    const body=document.getElementById('tabBody');body.replaceChildren();const status=document.createElement('div');status.className='detail-loading';
    status.innerHTML=`<span class="detail-spinner" aria-hidden="true"></span><strong>${escapeHtml(error?UI[lang].detailError:UI[lang].detailLoading)}</strong>`;body.append(status);
    document.getElementById('modalNotice').hidden=true;document.querySelectorAll('.tab').forEach(t=>{t.disabled=true;t.classList.toggle('active',t.dataset.tab===state.tab)});
  }
  async function openEntry(id){
    const e=byId.get(id);if(!e)return;unloadActiveDetails();state.active=id;state.tab='story';populateModalLoading(e);showModalSafe();
    try{await ensureDetails(e);if(state.active!==id)return;modal.dataset.loading='false';document.querySelectorAll('.tab').forEach(t=>t.disabled=false);populateModal()}
    catch(err){if(String(err?.message||err)!=='Detail load cancelled')console.error(err);if(state.active===id)populateModalLoading(e,true)}
  }
  function addSection(body,title,text,cls=''){text=locText(text);title=locText(title);if(!text)return;const section=document.createElement('section');section.className='profile-section'+(cls?` ${cls}`:'');const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.textContent=text;section.append(h,p);body.append(section)}
  function addSources(body,sources,lang){
    if(!Array.isArray(sources)||!sources.length)return;const section=document.createElement('section');section.className='profile-section';const h=document.createElement('h3');h.textContent=lang==='el'?'Πηγές & περαιτέρω ανάγνωση':'Sources & further reading';const ul=document.createElement('ul');ul.className='source-list';
    for(const s of sources){if(!s)continue;let label=(s.label&&((typeof s.label==='object'&&s.label[lang])||s.label.en))||s.url;if(!label)continue;label=locText(label,lang);const li=document.createElement('li');if(s.url){const a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;li.append(a)}else{const span=document.createElement('span');span.textContent=label;li.append(span)}ul.append(li)}
    section.append(h,ul);body.append(section);
  }
  function populateModal(){
    const base=byId.get(state.active);if(!base||activeDetail?.id!==base.id)return;const e=detailView(base),lang=state.lang;modal.dataset.loading='false';document.querySelectorAll('.tab').forEach(t=>t.disabled=false);
    const img=document.getElementById('modalImage');img.onerror=null;installImageFallback(img,e);img.src=preferredImage(e);img.alt=locText(e.name?.[lang]||e.name?.en||'',lang);
    const credit=document.getElementById('modalImageCredit');
    if(e.imageMeta?.sourceUrl){credit.hidden=false;credit.href=e.imageMeta.sourceUrl;const license=locText(e.imageMeta.license||'',lang);credit.textContent=lang==='el'?`${UI.el.imageSource} — Wikimedia Commons${license?` — ${license}`:''}`:locText(e.imageMeta.credit?.en||UI.en.imageSource,'en')}
    else{credit.hidden=true;credit.removeAttribute('href');credit.textContent=''}
    document.getElementById('modalName').textContent=locText(e.name?.[lang]||e.name?.en||e.id,lang);document.getElementById('modalRole').textContent=locText(e.role?.[lang]||e.role?.en||'',lang);document.getElementById('modalFeast').textContent=locText(e.feast?.[lang]||e.feast?.en||'—',lang);document.getElementById('modalScripture').textContent=locText(e.scriptureText?.[lang]||e.scriptureText?.en||e.scripture||'—',lang);document.getElementById('modalCategory').textContent=UI[lang].category[e.category]||locText(e.category,lang);
    const body=document.getElementById('tabBody');body.replaceChildren();
    if(state.tab==='story'){
      const k=e.knowledge?.[lang]||e.knowledge?.en;
      if(k?.sections?.length){const q=document.createElement('div');q.className='profile-quality';q.textContent=UI[lang].detailed;body.append(q);for(const s of k.sections)addSection(body,(typeof s.title==='object'?(s.title?.[lang]||s.title?.en):s.title)||'',typeof s.text==='object'?(s.text?.[lang]||s.text?.en):s.text,'long');addSources(body,(k.sources&&k.sources.length?k.sources:e.sources)||[],lang)}
      else if(e.profile?.[lang]){const q=document.createElement('div');q.className='profile-quality';q.textContent=UI[lang].localRecord;body.append(q);const profile=e.profile[lang];for(const key of ['overview','identity','sources','commemoration','names'])addSection(body,UI[lang][key]||key,profile[key]);addSources(body,e.sources||[],lang)}
      else addSection(body,UI[lang].overview,(e.story&&e.story[lang])||(e.story&&e.story.en)||'—');
    }else body.textContent=locText((e[state.tab]&&e[state.tab][lang])||(e[state.tab]&&e[state.tab].en)||'—',lang);
    const notice=document.getElementById('modalNotice');notice.hidden=e.venerated!==false;notice.textContent=UI[lang].notVenerated;document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===state.tab));
  }

  function translate(){
    document.documentElement.lang=state.lang;document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(UI[state.lang][k])el.textContent=UI[state.lang][k]});search.placeholder=UI[state.lang].search;document.querySelectorAll('.lang').forEach(b=>b.classList.toggle('active',b.dataset.lang===state.lang));
    if(state.active){const e=byId.get(state.active);if(e&&activeDetail?.id===e.id)populateModal();else if(e)populateModalLoading(e)}
    refreshLabels();updateSearchUI();
  }

  // ---------- Camera ----------
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function minScale(){const vw=network.clientWidth||innerWidth||360,vh=network.clientHeight||innerHeight||640;const fit=Math.min(vw/WORLD.w,vh/WORLD.h)*.92;return Math.max(.03,Math.min(NORMAL_MIN_SCALE,fit))}
  function clampPan(){
    const b=cameraBase(),hx=Math.max(0,(WORLD.w*state.scale-b.vw)/2)+Math.max(90,b.vw*.25),hy=Math.max(0,(WORLD.h*state.scale-b.vh)/2)+Math.max(90,b.vh*.25);state.panX=clamp(state.panX,-hx,hx);state.panY=clamp(state.panY,-hy,hy);
  }
  function applySceneTransform(){clampPan();const b=cameraBase();scene.style.transform=`translate3d(${(b.x+state.panX).toFixed(1)}px,${(b.y+state.panY).toFixed(1)}px,0) scale(${state.scale.toFixed(4)})`}
  let cameraRaf=0;function requestCamera(){if(cameraRaf)return;cameraRaf=requestAnimationFrame(()=>{cameraRaf=0;applySceneTransform();updateSearchMarker()})}
  function zoomAt(clientX,clientY,nextScale){
    nextScale=clamp(nextScale,minScale(),MAX_SCALE);if(Math.abs(nextScale-state.scale)<.0001)return;const r=network.getBoundingClientRect(),sx=clientX-r.left,sy=clientY-r.top,old=state.scale,ob=cameraBase(old);const wx=(sx-(ob.x+state.panX))/old,wy=(sy-(ob.y+state.panY))/old;state.scale=nextScale;const nb=cameraBase(nextScale);state.panX=sx-nb.x-wx*nextScale;state.panY=sy-nb.y-wy*nextScale;labelsEl.classList.add('moving');requestCamera();scheduleLabels(90);
  }
  function screenToWorld(clientX,clientY){const r=network.getBoundingClientRect(),b=cameraBase();return{x:(clientX-r.left-b.x-state.panX)/state.scale,y:(clientY-r.top-b.y-state.panY)/state.scale}}
  function hitEntry(clientX,clientY){
    const w=screenToWorld(clientX,clientY),extra=Math.min(45,14/Math.max(.18,state.scale)),radius=BUBBLE_R+extra;let best=null,bestD=radius;
    for(let i=0;i<positions.length;i++){const p=positions[i],d=Math.hypot(w.x-p.x,w.y-p.y);if(d<bestD){bestD=d;best=ordered[i]}}
    return best;
  }
  function centerEntry(e,scale=Math.max(.95,state.scale)){const p=positionById.get(e.id);if(!p)return;state.scale=clamp(scale,minScale(),MAX_SCALE);const b=cameraBase();state.panX=network.clientWidth/2-b.x-p.x*state.scale;state.panY=network.clientHeight/2-b.y-p.y*state.scale;requestCamera();scheduleLabels(80)}

  network.addEventListener('wheel',e=>{if(modal.hasAttribute('open'))return;e.preventDefault();zoomAt(e.clientX,e.clientY,state.scale*Math.exp(-e.deltaY*.00135))},{passive:false});
  const pointers=new Map();let gesture=null,lastTap={t:0,x:0,y:0};
  const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2}),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function beginPinch(){const ps=[...pointers.values()];if(ps.length<2)return;const a=ps[0],b=ps[1],m=midpoint(a,b),r=network.getBoundingClientRect(),base=cameraBase();const sx=m.x-r.left,sy=m.y-r.top;gesture={type:'pinch',startDistance:Math.max(1,distance(a,b)),startScale:state.scale,anchorX:(sx-base.x-state.panX)/state.scale,anchorY:(sy-base.y-state.panY)/state.scale};labelsEl.classList.add('moving');network.classList.add('is-dragging')}
  network.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;pointers.set(e.pointerId,{id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});try{network.setPointerCapture(e.pointerId)}catch(_){}if(pointers.size>=2){beginPinch();return}gesture={type:'pan',id:e.pointerId,startX:e.clientX,startY:e.clientY,panX:state.panX,panY:state.panY,moved:false};labelsEl.classList.add('moving');network.classList.add('is-dragging')});
  network.addEventListener('pointermove',e=>{
    const p=pointers.get(e.pointerId);if(p){p.x=e.clientX;p.y=e.clientY;pointers.set(e.pointerId,p)}
    if(gesture?.type==='pinch'&&pointers.size>=2){const ps=[...pointers.values()],a=ps[0],b=ps[1],m=midpoint(a,b),next=clamp(gesture.startScale*(distance(a,b)/gesture.startDistance),minScale(),MAX_SCALE),r=network.getBoundingClientRect(),sx=m.x-r.left,sy=m.y-r.top,base=cameraBase(next);state.scale=next;state.panX=sx-base.x-gesture.anchorX*next;state.panY=sy-base.y-gesture.anchorY*next;requestCamera();return}
    if(gesture?.type==='pan'&&gesture.id===e.pointerId){const dx=e.clientX-gesture.startX,dy=e.clientY-gesture.startY;if(!gesture.moved&&Math.hypot(dx,dy)>5)gesture.moved=true;if(gesture.moved){state.panX=gesture.panX+dx;state.panY=gesture.panY+dy;requestCamera()}return}
  },{passive:true});
  function releasePointer(e){const g=gesture,p=pointers.get(e.pointerId);pointers.delete(e.pointerId);if(g?.type==='pinch'){if(pointers.size===1){const q=[...pointers.values()][0];gesture={type:'pan',id:q.id,startX:q.x,startY:q.y,panX:state.panX,panY:state.panY,moved:true}}else gesture=null}else if(g?.type==='pan'&&g.id===e.pointerId)gesture=null;if(!pointers.size){network.classList.remove('is-dragging');labelsEl.classList.remove('moving');scheduleLabels(45)}return{g,p}}
  network.addEventListener('pointerup',e=>{const {g,p}=releasePointer(e);if(!p||g?.type!=='pan'||g.moved)return;const hit=hitEntry(e.clientX,e.clientY);if(hit){openEntry(hit.id);return}const now=performance.now();if(e.pointerType!=='mouse'&&now-lastTap.t<300&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<28){zoomAt(e.clientX,e.clientY,state.scale<1.2?state.scale*1.65:BASE_SCALE);lastTap.t=0}else lastTap={t:now,x:e.clientX,y:e.clientY}});
  network.addEventListener('pointercancel',releasePointer);
  network.addEventListener('dblclick',e=>{e.preventDefault();const hit=hitEntry(e.clientX,e.clientY);if(hit){openEntry(hit.id);return}zoomAt(e.clientX,e.clientY,state.scale<1.2?state.scale*1.65:BASE_SCALE)});
  window.addEventListener('resize',()=>{requestCamera();scheduleLabels(80)},{passive:true});

  // ---------- Search / language / keyboard ----------
  function updateSearchUI(){
    const ms=matches(),q=state.query.trim();emptyState.hidden=ms.length!==0;matchCount.textContent=q?`${ms.length} ${ms.length===1?UI[state.lang].result:UI[state.lang].results}`:`${entries.length}`;updateSearchMarker();
  }
  let searchDebounce=0;
  search.addEventListener('input',e=>{state.query=e.target.value;clearTimeout(searchDebounce);searchDebounce=setTimeout(()=>{updateSearchUI();refreshLabels()},55)});
  search.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=matches()[0];if(first){e.preventDefault();centerEntry(first,Math.max(1.05,state.scale));openEntry(first.id)}}});
  document.querySelectorAll('.lang').forEach(b=>b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();state.lang=b.dataset.lang;storageSet('orthodox-lang',state.lang);translate()}));
  document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==search){e.preventDefault();search.focus();return}if(e.key==='Escape'&&modal.hasAttribute('open')){closeModalSafe();return}if(!modal.hasAttribute('open')&&(e.key==='+'||e.key==='='||e.key==='-')){e.preventDefault();const r=network.getBoundingClientRect();zoomAt(r.left+r.width/2,r.top+r.height/2,state.scale*(e.key==='-'?.82:1.22));return}if(!modal.hasAttribute('open')&&e.key==='0'){e.preventDefault();state.panX=0;state.panY=0;state.scale=BASE_SCALE;requestCamera();scheduleLabels(60)}});
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{if(t.disabled)return;state.tab=t.dataset.tab;populateModal()}));document.getElementById('closeModal').addEventListener('click',closeModalSafe);modal.addEventListener('click',e=>{if(e.target===modal)closeModalSafe()});modal.addEventListener('cancel',e=>{e.preventDefault();closeModalSafe()});

  // ---------- Startup: actual pre-render work, max 30 s ----------
  async function runStartup(){
    const loader=document.getElementById('startupLoader');if(!loader){document.body.classList.remove('startup-lock');return}
    const bar=document.getElementById('startupBar'),pct=document.getElementById('startupPct'),title=document.getElementById('startupTitle'),sub=document.getElementById('startupSub');title.textContent=UI[state.lang].startup;sub.textContent=UI[state.lang].startupSub;
    const started=performance.now(),bootStarted=Number(window.ORTHODOX_BOOT_STARTED)||started,deadline=bootStarted+30000,minVisibleUntil=Math.min(deadline,started+1200);
    const progress=(done,total)=>{const v=Math.min(.99,.08+(done/Math.max(1,total))*.90);if(bar)bar.style.transform=`scaleX(${v})`;if(pct)pct.textContent=`${Math.round(v*100)}%`;if(sub){sub.textContent=state.lang==='el'?`Απόδοση φυσαλίδων ${done}/${total} • οι λεπτομέρειες θα φορτώνονται μόνο όταν ανοίγονται`:`Rasterizing bubbles ${done}/${total} • details will load only when opened`}};
    progress(0,entries.length);await rasterizeAll(deadline,progress);applySceneTransform();refreshLabels();updateSearchUI();
    const wait=Math.max(0,minVisibleUntil-performance.now());if(wait)await new Promise(r=>setTimeout(r,wait));if(bar)bar.style.transform='scaleX(1)';if(pct)pct.textContent='100%';if(sub)sub.textContent=state.lang==='el'?'Ο ομαλός ιστός είναι έτοιμος':'The smooth web is ready';await new Promise(r=>setTimeout(r,160));loader.classList.add('done');document.body.classList.remove('startup-lock');setTimeout(()=>loader.remove(),420);
  }

  document.body.classList.add('startup-lock');buildLayout();sizeCanvas();translate();applySceneTransform();runStartup();
})();
