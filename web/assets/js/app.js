(()=>{
  'use strict';

  const entries=Array.isArray(window.ORTHODOX_ENTRIES)?window.ORTHODOX_ENTRIES:[];
  let activeDetail=null;
  let detailScript=null;
  let detailLoadToken=0;
  const nodesEl=document.getElementById('nodes');
  const svg=document.getElementById('webLines');
  const network=document.getElementById('network');
  const scene=document.getElementById('scene');
  const modal=document.getElementById('detailModal');
  const search=document.getElementById('search');
  const matchCount=document.getElementById('matchCount');
  const emptyState=document.getElementById('emptyState');
  const compact=matchMedia('(max-width:620px)').matches;
  const lowMemory=typeof navigator.deviceMemory==='number'&&navigator.deviceMemory<4;
  const finePointer=matchMedia('(pointer:fine)').matches;

  /*
    v8: every catalogue entry has a permanent place in the web. We no longer cap the
    catalogue at 34/54 nodes. To stay light on phones, only bubbles inside (or just
    outside) the viewport are mounted in the DOM; panning/zooming reveals every other
    bubble at its fixed world position. This is spatial virtualization, not pagination.
  */
  const outerEstimate=2600+255*Math.sqrt(Math.max(1,entries.length));
  const WORLD={
    w:Math.ceil(Math.max(compact?22000:24000,outerEstimate*2.34)),
    h:Math.ceil(Math.max(compact?17000:18500,outerEstimate*1.82))
  };
  const CENTER={x:WORLD.w/2,y:WORLD.h/2};
  const BASE_SCALE=compact?.54:.66;
  const NORMAL_MIN_SCALE=compact?.095:.075;
  const MAX_SCALE=2.8;
  function minScale(){
    const vw=network.clientWidth||innerWidth||360,vh=network.clientHeight||innerHeight||640;
    const fit=Math.min(vw/WORLD.w,vh/WORLD.h)*.90;
    return Math.max(.016,Math.min(NORMAL_MIN_SCALE,fit));
  }

  function storageGet(key,fallback){try{return localStorage.getItem(key)||fallback}catch(_){return fallback}}
  function storageSet(key,value){try{localStorage.setItem(key,value)}catch(_){} }

  const state={
    lang:storageGet('orthodox-lang','en'),query:'',active:null,tab:'story',
    panX:0,panY:0,hoverX:0,hoverY:0,scale:BASE_SCALE
  };

  const UI={
    en:{
      father:'Father',son:'Son',spirit:'Holy Spirit',trinity:'HOLY TRINITY',centerSub:'Father • Son • Holy Spirit',
      feastDay:'Feast / commemoration',scripture:'Scripture / tradition',story:'Life & knowledge',prayer:'Prayer',notes:'Notes',
      overview:'Known account',identity:'Identity & Orthodox context',sources:'Sources & limits',commemoration:'Commemoration & veneration',names:'Names & aliases',
      search:'Search a saint, apostle, angel…',none:'No matches',
      notVenerated:'Biblical context: this entry is not presented as a saint and no prayer is addressed to this figure.',
      source:'Primary source / reference',imageSource:'Image source',detailed:'Expanded source-based profile',localRecord:'Complete local record',
      result:'match',results:'matches',detailLoading:'Loading full profile…',detailError:'The full local profile could not be loaded.',startup:'Preparing the complete web',startupSub:'Building all bubble positions and warming nearby images…',
      category:{christ:'Christ & Spirit',theotokos:'Theotokos',angel:'Angel / Heavenly Power',forefather:'Forefather',righteous:'Old Testament Righteous',prophet:'Prophet',apostle:'Apostle / Evangelist','nt-saint':'New Testament Saint','church-saint':'Church Saint',feast:'Feast','biblical-context':'Biblical Context'}
    },
    el:{
      father:'Πατήρ',son:'Υιός',spirit:'Άγιο Πνεύμα',trinity:'ΑΓΙΑ ΤΡΙΑΔΑ',centerSub:'Πατήρ • Υιός • Άγιο Πνεύμα',
      feastDay:'Εορτή / μνήμη',scripture:'Γραφή / παράδοση',story:'Βίος & γνώση',prayer:'Προσευχή',notes:'Σημειώσεις',
      overview:'Γνωστή διήγηση',identity:'Ταυτότητα & ορθόδοξο πλαίσιο',sources:'Πηγές & όρια',commemoration:'Μνήμη & τιμή',names:'Ονόματα & εναλλακτικές',
      search:'Αναζήτησε άγιο, απόστολο, άγγελο…',none:'Δεν βρέθηκαν αποτελέσματα',
      notVenerated:'Βιβλικό πλαίσιο: η καταχώριση δεν παρουσιάζεται ως άγιος και δεν απευθύνεται προσευχή σε αυτό το πρόσωπο.',
      source:'Κύρια πηγή / αναφορά',imageSource:'Πηγή εικόνας',detailed:'Εκτεταμένο προφίλ βασισμένο σε πηγές',localRecord:'Πλήρης τοπική καταγραφή',
      result:'αποτέλεσμα',results:'αποτελέσματα',detailLoading:'Φόρτωση πλήρους προφίλ…',detailError:'Δεν ήταν δυνατή η φόρτωση του πλήρους τοπικού προφίλ.',startup:'Προετοιμασία ολόκληρου του ιστού',startupSub:'Υπολογισμός όλων των φυσαλίδων και προφόρτωση κοντινών εικόνων…',
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
  function haystack(e){
    // Keep startup light: only index/name/role/aliases are resident before a bubble is opened.
    // Full biographies, prayers, notes, sources and calendar data live in lazy detail chunks.
    return [e.name?.en,e.name?.el,e.role?.en,e.role?.el,e.search,...(e.aliases||[])].join(' ');
  }
  const searchIndex=new Map(entries.map(e=>[e.id,norm(haystack(e))]));
  const featuredIds=['jesus-christ','holy-spirit','theotokos','archangel-michael','archangel-gabriel','archangel-raphael','john-baptist','peter','paul','andrew','john-theologian','james-zebedee','mary-magdalene','stephen','george','demetrios','nicholas','nektarios','john-chrysostom','basil-great','gregory-theologian','gregory-palamas','constantine-helen','paisios','porphyrios','seraphim-sarov','spyridon','athanasius-great','cyril-alexandria','maximus-confessor','isaac-syrian','mary-egypt','moses','elijah','david','daniel','abraham','sarah','isaac','jacob','joseph-patriarch','noah','job','pentecost','nativity-christ','theophany','transfiguration','dormition','annunciation','pascha'];
  const byId=new Map(entries.map(e=>[e.id,e]));
  const featured=featuredIds.map(id=>byId.get(id)).filter(Boolean);
  const featuredSet=new Set(featured.map(e=>e.id));
  const defaultPool=[...featured,...entries.filter(e=>!featuredSet.has(e.id))];

  function filtered(){const q=norm(state.query.trim());return q?entries.filter(e=>(searchIndex.get(e.id)||'').includes(q)):defaultPool}
  function hashString(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function unit(seed){seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296}

  /*
    Organic fixed layout. Featured figures occupy spacious inner rings. Every remaining
    entry continues into a deterministic golden-angle field, with enough jitter to look
    like a hand-spun web rather than a perfect grid. There is no entry-count ceiling.
  */
  function layout(items){
    const out=[],n=items.length;
    const rings=compact?
      [{cap:5,rx:520,ry:430,jx:95,jy:85},{cap:8,rx:910,ry:730,jx:125,jy:105},{cap:12,rx:1330,ry:1040,jx:150,jy:125},{cap:18,rx:1770,ry:1370,jx:180,jy:145}]:
      [{cap:6,rx:610,ry:500,jx:105,jy:90},{cap:10,rx:1030,ry:810,jx:140,jy:115},{cap:15,rx:1510,ry:1160,jx:170,jy:135},{cap:22,rx:2030,ry:1510,jx:205,jy:165}];
    let used=0;
    for(let ri=0;ri<rings.length&&used<n;ri++){
      const ring=rings[ri],count=Math.min(ring.cap,n-used),offset=.22*ri+(ri%2?Math.PI/Math.max(1,count):0);
      for(let j=0;j<count;j++){
        const e=items[used+j],h=hashString(e.id),a=(Math.PI*2*j/count)+offset+(unit(h)*.20-.10);
        out.push({x:CENTER.x+Math.cos(a)*ring.rx+(unit(h+11)*2-1)*ring.jx,y:CENTER.y+Math.sin(a)*ring.ry+(unit(h+37)*2-1)*ring.jy,ring:ri});
      }
      used+=count;
    }
    const golden=Math.PI*(3-Math.sqrt(5));
    const startR=compact?2120:2380,spacing=compact?255:270,yr=.79;
    for(let i=used;i<n;i++){
      const k=i-used+1,e=items[i],h=hashString(e.id),r=startR+spacing*Math.sqrt(k);
      const a=k*golden+(unit(h+91)*.30-.15);
      const radial=1+(unit(h+123)*.10-.05);
      const jx=(unit(h+17)*2-1)*105,jy=(unit(h+53)*2-1)*90;
      out.push({x:CENTER.x+Math.cos(a)*r*radial+jx,y:CENTER.y+Math.sin(a)*r*yr*radial+jy,ring:4+Math.floor(Math.sqrt(k)/4)});
    }
    return out;
  }

  function svgPath(cls,d){const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('class',cls);p.setAttribute('d',d);return p}
  function drawWeb(pos){
    if(!pos.length){svg.replaceChildren();return}
    let primary='',secondary='',center='';
    // O(n) connections: Fibonacci offsets stay locally adjacent in a golden-angle field.
    for(let i=1;i<pos.length;i++){
      const a=pos[i];
      const offsets=i<55?[1,5,8]:[13,21,34];
      offsets.forEach((off,k)=>{
        const j=i-off;if(j<0)return;const b=pos[j];
        const dx=a.x-b.x,dy=a.y-b.y,dist=Math.hypot(dx,dy);
        if(dist>(k===0?1250:980))return;
        const seg=`M${a.x.toFixed(0)} ${a.y.toFixed(0)}L${b.x.toFixed(0)} ${b.y.toFixed(0)}`;
        if(k===0)primary+=seg;else secondary+=seg;
      });
    }
    pos.slice(0,Math.min(16,pos.length)).forEach((p,i)=>{if(i%2===0)center+=`M${CENTER.x} ${CENTER.y}L${p.x.toFixed(0)} ${p.y.toFixed(0)}`});
    // A single SVG path sketches every bubble, including off-screen virtualized nodes.
    // This means the entire catalogue is visibly part of one web at overview zoom without
    // forcing 1,000+ image/button DOM elements onto a phone at once.
    let overview='',innerOverview='';
    for(let i=0;i<pos.length;i++){
      const p=pos[i],r=i<55?54:44;
      const circle=`M${(p.x-r).toFixed(0)} ${p.y.toFixed(0)}a${r} ${r} 0 1 0 ${r*2} 0a${r} ${r} 0 1 0 -${r*2} 0`;
      if(i<55)innerOverview+=circle;else overview+=circle;
    }
    const f=document.createDocumentFragment();
    if(secondary)f.appendChild(svgPath('web-thread faint',secondary));
    if(primary)f.appendChild(svgPath('web-thread',primary));
    if(center)f.appendChild(svgPath('web-thread hot',center));
    if(overview)f.appendChild(svgPath('web-bubble-overview',overview));
    if(innerOverview)f.appendChild(svgPath('web-bubble-overview inner',innerOverview));
    svg.replaceChildren(f);
  }

  function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function imageUrl(path){try{return new URL(path,document.baseURI).href}catch(_){return path}}
  const fallbackIcon='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><radialGradient id="g" cx="35%" cy="22%"><stop stop-color="#fff5b8"/><stop offset=".42" stop-color="#d9a83d"/><stop offset="1" stop-color="#30466f"/></radialGradient></defs><rect width="160" height="160" rx="80" fill="#2d4b74"/><circle cx="80" cy="80" r="59" fill="url(#g)" stroke="#fff7cb" stroke-width="4"/><text x="80" y="104" text-anchor="middle" font-family="Georgia,serif" font-size="66" fill="#17203c">☦</text></svg>`);
  function imageChain(e){
    const chain=[];
    if(e.imageLocalReal)chain.push(imageUrl(e.imageLocalReal));
    if(e.imageRemote&&navigator.onLine!==false)chain.push(e.imageRemote);
    if(e.image)chain.push(imageUrl(e.image));
    chain.push(fallbackIcon);
    return [...new Set(chain)];
  }
  function preferredImage(e){return imageChain(e)[0]}
  function installImageFallback(img,e){const chain=imageChain(e);let stage=0;img.addEventListener('error',()=>{stage+=1;if(stage<chain.length)img.src=chain[stage]})}

  let currentItems=[],currentPositions=[];
  const mounted=new Map();
  function createNode(e,p){
    const b=document.createElement('button');b.type='button';b.className='node'+(e.venerated===false?' context-node':'');b.dataset.id=e.id;
    b.style.left=`${p.x}px`;b.style.top=`${p.y}px`;b.style.setProperty('--node',colors[e.category]||'#72e8ff');
    b.setAttribute('aria-label',locText(e.name?.[state.lang]||e.name?.en||e.id));
    const label=escapeHtml(locText(e.name?.[state.lang]||e.name?.en||e.id));
    b.innerHTML=`<span class="node-art"><img draggable="false" loading="lazy" decoding="async" alt=""></span><span class="node-label">${label}</span>`;
    const img=b.querySelector('img');installImageFallback(img,e);img.src=preferredImage(e);
    return b;
  }
  function visibleBounds(){
    const b=cameraBase(),ox=b.x+state.panX+state.hoverX,oy=b.y+state.panY+state.hoverY,s=Math.max(.001,state.scale);
    const margin=Math.max(360,260/s);
    return{x0:(-ox)/s-margin,y0:(-oy)/s-margin,x1:(network.clientWidth-ox)/s+margin,y1:(network.clientHeight-oy)/s+margin};
  }
  function refreshVisible(force=false){
    if(!currentItems.length){nodesEl.replaceChildren();mounted.clear();return}
    const v=visibleBounds(),wanted=new Set();
    const overviewOnly=state.scale<.055 && currentItems.length>180;
    for(let i=0;i<currentItems.length;i++){
      const p=currentPositions[i];if(p.x<v.x0||p.x>v.x1||p.y<v.y0||p.y>v.y1)continue;
      // At extreme all-web overview scale the SVG path already draws every bubble.
      // Keep only the important central DOM icons mounted, then restore all local icons
      // automatically as soon as the user zooms in.
      if(overviewOnly&&i>=55)continue;
      const e=currentItems[i];wanted.add(e.id);
      let node=mounted.get(e.id);
      if(!node){node=createNode(e,p);mounted.set(e.id,node);nodesEl.appendChild(node)}
      else if(force){
        node.setAttribute('aria-label',locText(e.name?.[state.lang]||e.name?.en||e.id));
        const label=node.querySelector('.node-label');if(label)label.textContent=locText(e.name?.[state.lang]||e.name?.en||e.id);
      }
    }
    for(const [id,node] of [...mounted])if(!wanted.has(id)){node.remove();mounted.delete(id)}
    network.classList.toggle('far-view',state.scale<.20);
    network.classList.toggle('all-web-view',overviewOnly);
  }
  let visibleRaf=0;function requestVisible(force=false){if(visibleRaf)return;visibleRaf=requestAnimationFrame(()=>{visibleRaf=0;refreshVisible(force)})}

  function resetView(){state.panX=0;state.panY=0;state.hoverX=0;state.hoverY=0;state.scale=BASE_SCALE;applySceneTransform();requestVisible(true)}
  function render(){
    currentItems=filtered();currentPositions=layout(currentItems);
    nodesEl.replaceChildren();mounted.clear();
    emptyState.hidden=currentItems.length!==0;
    matchCount.textContent=state.query.trim()?`${currentItems.length} ${currentItems.length===1?UI[state.lang].result:UI[state.lang].results}`:`${entries.length}`;
    drawWeb(currentPositions);requestVisible(true);
  }

  function showModalSafe(){if(typeof modal.showModal==='function'){try{modal.showModal();return}catch(_){}}modal.setAttribute('open','');modal.classList.add('fallback-open')}
  function clearPublishedDetail(id){
    const store=window.ORTHODOX_ENTRY_DETAILS;if(!store||!id)return;
    delete store[id];
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
  function closeModalSafe(){
    if(typeof modal.close==='function'){try{modal.close()}catch(_){modal.removeAttribute('open')}}else modal.removeAttribute('open');
    modal.classList.remove('fallback-open');
    unloadActiveDetails();state.active=null;state.tab='story';
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
    const e=byId.get(id);if(!e)return;
    unloadActiveDetails();state.active=id;state.tab='story';
    populateModalLoading(e);showModalSafe();
    try{await ensureDetails(e);if(state.active!==id)return;modal.dataset.loading='false';document.querySelectorAll('.tab').forEach(t=>t.disabled=false);populateModal()}
    catch(err){if(String(err?.message||err)!=='Detail load cancelled')console.error(err);if(state.active===id)populateModalLoading(e,true)}
  }

  function addSection(body,title,text,cls=''){
    text=locText(text);title=locText(title);if(!text)return;
    const section=document.createElement('section');section.className='profile-section'+(cls?` ${cls}`:'');
    const h=document.createElement('h3');h.textContent=title;
    const p=document.createElement('p');p.textContent=text;
    section.append(h,p);body.append(section);
  }
  function addSources(body,sources,lang){
    if(!Array.isArray(sources)||!sources.length)return;
    const section=document.createElement('section');section.className='profile-section';
    const h=document.createElement('h3');h.textContent=lang==='el'?'Πηγές & περαιτέρω ανάγνωση':'Sources & further reading';
    const ul=document.createElement('ul');ul.className='source-list';
    for(const s of sources){
      if(!s)continue;let label=(s.label&&((typeof s.label==='object'&&s.label[lang])||s.label.en))||s.url;if(!label)continue;label=locText(label,lang);
      const li=document.createElement('li');
      if(s.url){const a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;li.append(a)}else{const span=document.createElement('span');span.textContent=label;li.append(span)}
      ul.append(li);
    }
    section.append(h,ul);body.append(section);
  }

  function populateModal(){
    const base=byId.get(state.active);if(!base||activeDetail?.id!==base.id)return;const e=detailView(base);const lang=state.lang;modal.dataset.loading='false';document.querySelectorAll('.tab').forEach(t=>t.disabled=false);
    const img=document.getElementById('modalImage');img.onerror=null;installImageFallback(img,e);img.src=preferredImage(e);img.alt=locText(e.name?.[lang]||e.name?.en||'',lang);
    const credit=document.getElementById('modalImageCredit');
    if(e.imageMeta?.sourceUrl){
      credit.hidden=false;credit.href=e.imageMeta.sourceUrl;
      const license=locText(e.imageMeta.license||'',lang);
      credit.textContent=lang==='el'?`${UI.el.imageSource} — Wikimedia Commons${license?` — ${license}`:''}`:locText(e.imageMeta.credit?.en||UI.en.imageSource,'en');
    }else{credit.hidden=true;credit.removeAttribute('href');credit.textContent=''}
    document.getElementById('modalName').textContent=locText(e.name?.[lang]||e.name?.en||e.id,lang);
    document.getElementById('modalRole').textContent=locText(e.role?.[lang]||e.role?.en||'',lang);
    document.getElementById('modalFeast').textContent=locText(e.feast?.[lang]||e.feast?.en||'—',lang);
    document.getElementById('modalScripture').textContent=locText(e.scriptureText?.[lang]||e.scriptureText?.en||e.scripture||'—',lang);
    document.getElementById('modalCategory').textContent=UI[lang].category[e.category]||locText(e.category,lang);
    const body=document.getElementById('tabBody');body.replaceChildren();

    if(state.tab==='story'){
      const k=e.knowledge?.[lang]||e.knowledge?.en;
      if(k?.sections?.length){
        const q=document.createElement('div');q.className='profile-quality';q.textContent=UI[lang].detailed;body.append(q);
        for(const s of k.sections)addSection(body,(typeof s.title==='object'?(s.title?.[lang]||s.title?.en):s.title)||'',typeof s.text==='object'?(s.text?.[lang]||s.text?.en):s.text,'long');
        addSources(body,(k.sources&&k.sources.length?k.sources:e.sources)||[],lang);
      }else if(e.profile?.[lang]){
        const q=document.createElement('div');q.className='profile-quality';q.textContent=UI[lang].localRecord;body.append(q);
        const profile=e.profile[lang];
        for(const key of ['overview','identity','sources','commemoration','names'])addSection(body,UI[lang][key]||key,profile[key]);
        addSources(body,e.sources||[],lang);
      }else addSection(body,UI[lang].overview,(e.story&&e.story[lang])||(e.story&&e.story.en)||'—');
    }else{
      body.textContent=locText((e[state.tab]&&e[state.tab][lang])||(e[state.tab]&&e[state.tab].en)||'—',lang);
    }

    const notice=document.getElementById('modalNotice');notice.hidden=e.venerated!==false;notice.textContent=UI[lang].notVenerated;
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===state.tab));
  }

  function translate(){
    document.documentElement.lang=state.lang;
    document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(UI[state.lang][k])el.textContent=UI[state.lang][k]});
    search.placeholder=UI[state.lang].search;document.querySelectorAll('.lang').forEach(b=>b.classList.toggle('active',b.dataset.lang===state.lang));
    if(state.active){const e=byId.get(state.active);if(e&&activeDetail?.id===e.id)populateModal();else if(e)populateModalLoading(e)}render();
  }

  // ---------- Camera: one composited transform for pan + pinch/wheel zoom ----------
  scene.style.width=`${WORLD.w}px`;scene.style.height=`${WORLD.h}px`;svg.setAttribute('viewBox',`0 0 ${WORLD.w} ${WORLD.h}`);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function cameraBase(scale=state.scale){const vw=network.clientWidth||innerWidth,vh=network.clientHeight||innerHeight;return{x:(vw-WORLD.w*scale)/2,y:(vh-WORLD.h*scale)/2,vw,vh}}
  function clampPan(){
    const {vw,vh}=cameraBase();
    const hx=Math.max(0,(WORLD.w*state.scale-vw)/2)+Math.max(120,vw*.34);
    const hy=Math.max(0,(WORLD.h*state.scale-vh)/2)+Math.max(120,vh*.34);
    state.panX=clamp(state.panX,-hx,hx);state.panY=clamp(state.panY,-hy,hy);
  }
  function applySceneTransform(){
    clampPan();const b=cameraBase();
    scene.style.transform=`translate3d(${(b.x+state.panX+state.hoverX).toFixed(1)}px,${(b.y+state.panY+state.hoverY).toFixed(1)}px,0) scale(${state.scale.toFixed(4)})`;
  }
  let cameraRaf=0;function requestCamera(){if(cameraRaf)return;cameraRaf=requestAnimationFrame(()=>{cameraRaf=0;applySceneTransform();requestVisible(false)})}

  function zoomAt(clientX,clientY,nextScale){
    nextScale=clamp(nextScale,minScale(),MAX_SCALE);if(Math.abs(nextScale-state.scale)<.0001)return;
    const r=network.getBoundingClientRect(),sx=clientX-r.left,sy=clientY-r.top,old=state.scale,oldBase=cameraBase(old);
    const wx=(sx-(oldBase.x+state.panX+state.hoverX))/old,wy=(sy-(oldBase.y+state.panY+state.hoverY))/old;
    state.scale=nextScale;state.hoverX=0;state.hoverY=0;
    const nb=cameraBase(nextScale);state.panX=sx-nb.x-wx*nextScale;state.panY=sy-nb.y-wy*nextScale;requestCamera();
  }

  network.addEventListener('wheel',e=>{if(modal.hasAttribute('open'))return;e.preventDefault();const factor=Math.exp(-e.deltaY*.00125);zoomAt(e.clientX,e.clientY,state.scale*factor)},{passive:false});

  const pointers=new Map();
  let gesture=null,suppressClicksUntil=0,lastTap={t:0,x:0,y:0};
  function midpoint(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  function beginPinch(){
    const p=[...pointers.values()];if(p.length<2)return;
    const a=p[0],b=p[1],m=midpoint(a,b),r=network.getBoundingClientRect();
    const sx=m.x-r.left,sy=m.y-r.top,base=cameraBase(state.scale);
    const wx=(sx-(base.x+state.panX))/state.scale,wy=(sy-(base.y+state.panY))/state.scale;
    gesture={type:'pinch',startDistance:Math.max(1,distance(a,b)),startScale:state.scale,anchorX:wx,anchorY:wy,moved:true};
    state.hoverX=0;state.hoverY=0;network.classList.add('is-dragging');
  }
  network.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    pointers.set(e.pointerId,{id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});
    try{network.setPointerCapture(e.pointerId)}catch(_){ }
    if(pointers.size>=2){beginPinch();return}
    gesture={type:'pan',id:e.pointerId,startX:e.clientX,startY:e.clientY,panX:state.panX,panY:state.panY,moved:false};network.classList.add('is-dragging');
  });
  network.addEventListener('pointermove',e=>{
    const p=pointers.get(e.pointerId);if(p){p.x=e.clientX;p.y=e.clientY;pointers.set(e.pointerId,p)}
    if(gesture?.type==='pinch'&&pointers.size>=2){
      const pts=[...pointers.values()],a=pts[0],b=pts[1],m=midpoint(a,b),ratio=distance(a,b)/gesture.startDistance;
      const next=clamp(gesture.startScale*ratio,minScale(),MAX_SCALE),r=network.getBoundingClientRect();
      const sx=m.x-r.left,sy=m.y-r.top,base=cameraBase(next);state.scale=next;state.hoverX=0;state.hoverY=0;
      state.panX=sx-base.x-gesture.anchorX*next;state.panY=sy-base.y-gesture.anchorY*next;requestCamera();suppressClicksUntil=performance.now()+260;return;
    }
    if(gesture?.type==='pan'&&gesture.id===e.pointerId){
      const dx=e.clientX-gesture.startX,dy=e.clientY-gesture.startY;if(!gesture.moved&&Math.hypot(dx,dy)>6)gesture.moved=true;
      if(gesture.moved){state.panX=gesture.panX+dx;state.panY=gesture.panY+dy;state.hoverX=0;state.hoverY=0;requestCamera();suppressClicksUntil=performance.now()+220}return;
    }
    if(!gesture&&finePointer&&e.pointerType==='mouse'){
      const r=network.getBoundingClientRect();state.hoverX=-(((e.clientX-r.left)/r.width)-.5)*7;state.hoverY=-(((e.clientY-r.top)/r.height)-.5)*5;requestCamera();
    }
  },{passive:true});
  function releasePointer(e){
    const oldGesture=gesture;pointers.delete(e.pointerId);
    if(oldGesture?.type==='pinch'){suppressClicksUntil=performance.now()+280;if(pointers.size===1){const p=[...pointers.values()][0];gesture={type:'pan',id:p.id,startX:p.x,startY:p.y,panX:state.panX,panY:state.panY,moved:false}}else gesture=null}
    else if(oldGesture?.type==='pan'&&oldGesture.id===e.pointerId){if(oldGesture.moved)suppressClicksUntil=performance.now()+220;gesture=null}
    if(!pointers.size){network.classList.remove('is-dragging');gesture=null}
  }
  network.addEventListener('pointerup',e=>{
    const p=pointers.get(e.pointerId),wasPan=gesture?.type==='pan'&&gesture.id===e.pointerId&&!gesture.moved;releasePointer(e);
    if(wasPan&&p&&e.pointerType!=='mouse'){
      const now=performance.now();if(now-lastTap.t<300&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<28){zoomAt(e.clientX,e.clientY,state.scale<1.25?Math.min(1.45,state.scale*1.65):BASE_SCALE);lastTap.t=0;suppressClicksUntil=now+260}else lastTap={t:now,x:e.clientX,y:e.clientY};
    }
  });
  network.addEventListener('pointercancel',releasePointer);
  network.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!pointers.size){state.hoverX=0;state.hoverY=0;requestCamera()}});
  network.addEventListener('dblclick',e=>{if(e.target.closest('.search-dock'))return;e.preventDefault();zoomAt(e.clientX,e.clientY,state.scale<1.25?Math.min(1.55,state.scale*1.65):BASE_SCALE)});
  network.addEventListener('click',e=>{const node=e.target.closest('.node');if(!node)return;if(performance.now()<suppressClicksUntil){e.preventDefault();return}openEntry(node.dataset.id)});
  window.addEventListener('resize',()=>{requestCamera();requestVisible(true)},{passive:true});

  document.querySelectorAll('.lang').forEach(b=>b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();state.lang=b.dataset.lang;storageSet('orthodox-lang',state.lang);translate()}));
  search.addEventListener('input',e=>{state.query=e.target.value;render();resetView()});
  search.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=filtered()[0];if(first){e.preventDefault();openEntry(first.id)}}});
  document.addEventListener('keydown',e=>{
    if(e.key==='/'&&document.activeElement!==search){e.preventDefault();search.focus();return}
    if(e.key==='Escape'&&modal.hasAttribute('open')){closeModalSafe();return}
    if(!modal.hasAttribute('open')&&(e.key==='+'||e.key==='='||e.key==='-')){e.preventDefault();const r=network.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;zoomAt(cx,cy,state.scale*(e.key==='-'?.82:1.22));return}
    if(!modal.hasAttribute('open')&&e.key==='0'){e.preventDefault();state.panX=0;state.panY=0;state.hoverX=0;state.hoverY=0;state.scale=minScale();requestCamera();requestVisible(true)}
  });
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{if(t.disabled)return;state.tab=t.dataset.tab;populateModal()}));
  document.getElementById('closeModal').addEventListener('click',closeModalSafe);modal.addEventListener('click',e=>{if(e.target===modal)closeModalSafe()});modal.addEventListener('cancel',e=>{e.preventDefault();closeModalSafe()});

  function warmInitialImages(limit=30){
    const pool=currentItems.slice(0,Math.min(limit,currentItems.length));
    let done=0;for(const e of pool){const img=new Image();img.decoding='async';img.onload=img.onerror=()=>{done+=1};img.src=imageUrl(e.image||preferredImage(e))}return pool.length;
  }
  function runStartupScreen(){
    const loader=document.getElementById('startupLoader');if(!loader)return;const bar=document.getElementById('startupBar'),pct=document.getElementById('startupPct'),title=document.getElementById('startupTitle'),sub=document.getElementById('startupSub');
    title.textContent=UI[state.lang].startup;sub.textContent=UI[state.lang].startupSub;
    const start=performance.now(),duration=5000;
    const tick=now=>{const progress=Math.min(1,(now-start)/duration);if(bar)bar.style.transform=`scaleX(${progress})`;if(pct)pct.textContent=`${Math.round(progress*100)}%`;if(progress<1)requestAnimationFrame(tick);else{loader.classList.add('done');document.body.classList.remove('startup-lock');setTimeout(()=>loader.remove(),420)}};
    requestAnimationFrame(tick);
  }

  document.body.classList.add('startup-lock');
  translate();applySceneTransform();requestVisible(true);warmInitialImages();runStartupScreen();
})();
