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

  const BUBBLE_MIN=compact?9:10;
  const BUBBLE_MAX=compact?16:19;
  const BASE_SCALE=compact?0.94:1;
  const MAX_SCALE=2.9;
  const NORMAL_MIN_SCALE=compact?0.74:0.68;
  const ROTATE_SPEED=0.0068;

  let activeDetail=null;
  let detailScript=null;
  let detailLoadToken=0;
  let renderReady=false;
  let ctx=null;
  let labelTimer=0;
  let drawRaf=0;
  let projectCache=[];
  let geometry=[];
  let edges=[];
  let preferredVisible=[];
  const labelMap=new Map();
  const byId=new Map(entries.map(e=>[e.id,e]));
  const geometryById=new Map();
  const localImageCache=new Map();
  const upgradedImageCache=new Map();

  function storageGet(key,fallback){try{return localStorage.getItem(key)||fallback}catch(_){return fallback}}
  function storageSet(key,value){try{localStorage.setItem(key,value)}catch(_){} }

  const state={
    lang:(window.ORTHODOX_BOOT_LANG==='el'?'el':window.ORTHODOX_BOOT_LANG==='en'?'en':storageGet('orthodox-lang','en')),
    query:'',active:null,tab:'description',scale:BASE_SCALE,rotX:.22,rotY:-.56
  };

  const UI={
    en:{
      father:'Father',son:'Son',spirit:'Holy Spirit',trinity:'HOLY TRINITY',centerSub:'Father • Son • Holy Spirit',
      feastDay:'Feast / commemoration',scripture:'Scripture / tradition',description:'Description',story:'Story',prayer:'Prayer',notes:'Notes & cautions',
      overview:'Known account',identity:'Identity & Orthodox context',sources:'Sources & limits',commemoration:'Commemoration & veneration',names:'Names & aliases',
      search:'Search a saint, apostle, angel…',none:'No matches',
      notVenerated:'Biblical context: this entry is not presented as a saint and no prayer is addressed to this figure.',
      source:'Primary source / reference',imageSource:'Image source',localIllustration:'Local illustrative artwork — verified source not loaded',detailed:'Expanded source-based profile',localRecord:'Complete local record',
      result:'match',results:'matches',detailLoading:'Loading full profile…',detailError:'The full local profile could not be loaded.',
      startup:'Loading every image',startupSub:'Checking and decoding every local image before the globe opens…',
      category:{christ:'Christ & Spirit',theotokos:'Theotokos',angel:'Angel / Heavenly Power',forefather:'Forefather',righteous:'Old Testament Righteous',prophet:'Prophet',apostle:'Apostle / Evangelist','nt-saint':'New Testament Saint','church-saint':'Church Saint',feast:'Feast','biblical-context':'Biblical Context'}
    },
    el:{
      father:'Πατήρ',son:'Υιός',spirit:'Άγιο Πνεύμα',trinity:'ΑΓΙΑ ΤΡΙΑΔΑ',centerSub:'Πατήρ • Υιός • Άγιο Πνεύμα',
      feastDay:'Εορτή / μνήμη',scripture:'Γραφή / παράδοση',description:'Περιγραφή',story:'Ιστορία',prayer:'Προσευχή',notes:'Σημειώσεις & επιφυλάξεις',
      overview:'Γνωστή διήγηση',identity:'Ταυτότητα & ορθόδοξο πλαίσιο',sources:'Πηγές & όρια',commemoration:'Μνήμη & τιμή',names:'Ονόματα & εναλλακτικές',
      search:'Αναζήτησε άγιο, απόστολο, άγγελο…',none:'Δεν βρέθηκαν αποτελέσματα',
      notVenerated:'Βιβλικό πλαίσιο: η καταχώριση δεν παρουσιάζεται ως άγιος και δεν απευθύνεται προσευχή σε αυτό το πρόσωπο.',
      source:'Κύρια πηγή / αναφορά',imageSource:'Πηγή εικόνας',localIllustration:'Τοπική εικονογραφική απεικόνιση — η επαληθευμένη πηγή δεν έχει φορτωθεί',detailed:'Εκτεταμένο προφίλ βασισμένο σε πηγές',localRecord:'Πλήρης τοπική καταγραφή',
      result:'αποτέλεσμα',results:'αποτελέσματα',detailLoading:'Φόρτωση πλήρους προφίλ…',detailError:'Δεν ήταν δυνατή η φόρτωση του πλήρους τοπικού προφίλ.',
      startup:'Φόρτωση κάθε εικόνας',startupSub:'Έλεγχος και αποκωδικοποίηση κάθε τοπικής εικόνας πριν ανοίξει η σφαίρα…',
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

  function imageUrl(path){try{return new URL(path,document.baseURI).href}catch(_){return path}}
  const fallbackIcon='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="#203b66"/><circle cx="80" cy="80" r="60" fill="#d6a93c" stroke="#fff3b7" stroke-width="5"/><text x="80" y="105" text-anchor="middle" font-family="Georgia,serif" font-size="68" fill="#17203c">☦</text></svg>`);
  function localImageChain(e){
    const chain=[];
    if(e.imageLocalReal)chain.push(imageUrl(e.imageLocalReal));
    if(e.image)chain.push(imageUrl(e.image));
    chain.push(fallbackIcon);
    return [...new Set(chain)];
  }
  function preferredLocalImage(e){return localImageChain(e)[0]}
  function preferredModalImage(e){
    if(e.imageLocalReal)return {src:imageUrl(e.imageLocalReal),verified:true};
    if(e.imageRemote&&upgradedImageCache.has(e.id))return {src:e.imageRemote,verified:true};
    return {src:e.image?imageUrl(e.image):fallbackIcon,verified:false};
  }
  function loadImageSource(src,remoteTimeout=12000){
    return new Promise(resolve=>{
      const img=new Image();let done=false,timer=0;const remote=/^https?:/i.test(src);
      const finish=async value=>{if(done)return;done=true;if(timer)clearTimeout(timer);img.onload=img.onerror=null;if(value){try{if(img.decode)await img.decode()}catch(_){}resolve(img)}else resolve(null)};
      img.decoding='async';img.onload=()=>finish(img);img.onerror=()=>finish(null);img.src=src;
      if(remote&&remoteTimeout>0)timer=setTimeout(()=>finish(null),remoteTimeout);
    });
  }
  function setModalMedia(e){
    const lang=state.lang,img=document.getElementById('modalImage'),credit=document.getElementById('modalImageCredit');
    const choice=preferredModalImage(e);let settled=false;
    img.onerror=()=>{if(settled)return;settled=true;const fallback=e.image?imageUrl(e.image):fallbackIcon;if(img.src!==fallback)img.src=fallback;credit.hidden=false;credit.removeAttribute('href');credit.textContent=e.imageMeta?.sourceUrl?UI[lang].localIllustration:locText(e.imageQuality?.label?.[lang]||e.imageQuality?.label?.en||UI[lang].localIllustration,lang)};
    img.src=choice.src;img.alt=locText(e.name?.[lang]||e.name?.en||'',lang);
    if(choice.verified&&e.imageMeta?.sourceUrl){
      credit.hidden=false;credit.href=e.imageMeta.sourceUrl;const license=locText(e.imageMeta.license||'',lang);credit.textContent=lang==='el'?`${UI.el.imageSource} — Wikimedia Commons${license?` — ${license}`:''}`:locText(e.imageMeta.credit?.en||UI.en.imageSource,'en');
    }else{
      credit.hidden=false;credit.removeAttribute('href');credit.textContent=e.imageMeta?.sourceUrl?UI[lang].localIllustration:locText(e.imageQuality?.label?.[lang]||e.imageQuality?.label?.en||UI[lang].localIllustration,lang);
    }
  }

  function buildLayout(){
    geometry=[];geometryById.clear();edges=[];
    const n=ordered.length;
    const golden=Math.PI*(3-Math.sqrt(5));
    const featuredCount=Math.min(42,featured.length);
    for(let i=0;i<n;i++){
      const e=ordered[i];
      let x,y,z;
      if(i<featuredCount){
        const ring=i<8?0:i<20?1:2;
        const start=ring===0?0:ring===1?8:20;
        const count=ring===0?8:ring===1?12:22;
        const t=(i-start)/count;
        const lon=(t*Math.PI*2)+ring*.17;
        const lat=(ring===0?.18:ring===1?-.08:-.34)+(unit(hashString(e.id))*0.10-0.05);
        const cl=Math.cos(lat);
        x=Math.sin(lon)*cl; y=Math.sin(lat); z=Math.cos(lon)*cl;
        z=Math.abs(z);
      }else{
        const k=i-featuredCount+0.5;
        y=1-2*(k/(Math.max(1,n-featuredCount)));
        const r=Math.sqrt(Math.max(0,1-y*y));
        const theta=golden*k + (unit(hashString(e.id))*0.20-0.10);
        x=Math.cos(theta)*r; z=Math.sin(theta)*r;
      }
      const g={id:e.id,x,y,z};
      geometry.push(g); geometryById.set(e.id,g);
    }
    const edgeSet=new Set();
    function link(a,b){ if(a===b)return; const k=a<b?`${a}|${b}`:`${b}|${a}`; if(edgeSet.has(k))return; edgeSet.add(k); edges.push([a,b]); }
    for(let i=0;i<n;i++){
      if(i+1<n)link(ordered[i].id,ordered[i+1].id);
      if(i+5<n)link(ordered[i].id,ordered[i+5].id);
      if(i+13<n)link(ordered[i].id,ordered[i+13].id);
      if(i<featuredCount && i+featuredCount<n)link(ordered[i].id,ordered[i+featuredCount]);
    }
  }

  function currentViewport(){
    const rect=network.getBoundingClientRect();
    const w=Math.max(320,Math.round(rect.width||innerWidth||360));
    const h=Math.max(420,Math.round(rect.height||innerHeight||640));
    return {w,h,cx:w/2,cy:h/2};
  }
  function currentGlobeRadius(vp=currentViewport()){
    const raw=Math.min(vp.w,vp.h)*(compact?0.33:0.39)*state.scale;
    return Math.max(compact?118:180, raw);
  }
  function rotatePoint(p){
    const cy=Math.cos(state.rotY), sy=Math.sin(state.rotY);
    const cx=Math.cos(state.rotX), sx=Math.sin(state.rotX);
    const x1=p.x*cy + p.z*sy;
    const z1=-p.x*sy + p.z*cy;
    const y2=p.y*cx - z1*sx;
    const z2=p.y*sx + z1*cx;
    return {x:x1,y:y2,z:z2};
  }
  function projectVisible(){
    const vp=currentViewport();
    const R=currentGlobeRadius(vp);
    const nodes=[];
    for(const e of ordered){
      const g=geometryById.get(e.id);if(!g)continue;
      const r=rotatePoint(g);
      const depth=(r.z+1)/2;
      nodes.push({id:e.id,e,rx:r.x,ry:r.y,rz:r.z,visible:false,depth,x:vp.cx+r.x*R,y:vp.cy+r.y*R,r:0});
    }

    // Level of detail: when the sphere is physically too small to fit hundreds
    // of portraits without overlap, show a deterministic, well-distributed
    // subset. More portraits appear automatically as the user zooms in.
    const front=nodes.filter(n=>n.rz>-.10);
    const gap=compact?2.4:3.2,minTargetR=compact?5.2:6.4;
    const usableArea=Math.PI*R*R*.44;
    const nominalFootprint=Math.pow(minTargetR*2+gap,2);
    const capacity=Math.max(featured.length+12,Math.min(front.length,Math.floor(usableArea/nominalFootprint)));
    const forced=new Set();
    for(const e of featured)forced.add(e.id);
    if(state.active)forced.add(state.active);
    if(state.query.trim())for(const e of matches().slice(0,12))forced.add(e.id);
    front.sort((a,b)=>{
      const af=forced.has(a.id),bf=forced.has(b.id);if(af!==bf)return af?-1:1;
      const as=unit(hashString(a.id+'|lod'))-Math.max(0,a.rz)*.17;
      const bs=unit(hashString(b.id+'|lod'))-Math.max(0,b.rz)*.17;
      return as-bs;
    });
    const selected=new Set(front.slice(0,capacity).map(n=>n.id));
    for(const n of nodes)n.visible=selected.has(n.id);
    const visibleNodes=nodes.filter(n=>n.visible).sort((a,b)=>a.rz-b.rz);

    const areaPer=Math.PI*R*R*.60/Math.max(1,visibleNodes.length);
    const densityCap=Math.max(minTargetR,Math.min(BUBBLE_MAX,Math.sqrt(areaPer)*.39));
    for(const n of visibleNodes){
      const depthR=(BUBBLE_MIN+(BUBBLE_MAX-BUBBLE_MIN)*Math.max(0,Math.min(1,n.depth)))*(0.90+Math.max(0,n.rz)*.24);
      n.r=Math.min(depthR,densityCap);
    }

    // Spatial-hash collision relaxation. Each visible bubble gets several
    // chances to separate, while keeping the moving layer responsive.
    const cell=Math.max(12,(densityCap*2)+gap+2);
    for(let pass=0;pass<10;pass++){
      const grid=new Map();
      const key=(gx,gy)=>`${gx},${gy}`;
      for(const n of visibleNodes){
        const gx=Math.floor(n.x/cell),gy=Math.floor(n.y/cell);
        for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){
          const bucket=grid.get(key(gx+ox,gy+oy));if(!bucket)continue;
          for(const a of bucket){
            const minD=a.r+n.r+gap;let dx=n.x-a.x,dy=n.y-a.y,d=Math.hypot(dx,dy);
            if(d>=minD)continue;
            if(d<.001){const h=hashString(a.id+'|'+n.id);dx=unit(h)-.5;dy=unit(h+17)-.5;d=Math.hypot(dx,dy)||1;}
            const overlap=(minD-d)*.56;dx/=d;dy/=d;
            const frontN=Math.max(0,n.rz),frontA=Math.max(0,a.rz),sum=frontN+frontA+1;
            const moveA=.42+.16*(frontN/sum),moveN=1-moveA;
            a.x-=dx*overlap*moveA;a.y-=dy*overlap*moveA;
            n.x+=dx*overlap*moveN;n.y+=dy*overlap*moveN;
          }
        }
        const ngX=Math.floor(n.x/cell),ngY=Math.floor(n.y/cell),k=key(ngX,ngY);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(n);
      }
      for(const n of visibleNodes){
        let dx=n.x-vp.cx,dy=n.y-vp.cy,dist=Math.hypot(dx,dy)||1,max=Math.max(4,R-n.r-3);
        if(dist>max){const sc=max/dist;n.x=vp.cx+dx*sc;n.y=vp.cy+dy*sc;dx=n.x-vp.cx;dy=n.y-vp.cy;dist=Math.hypot(dx,dy)||1;}
        // Keep portraits from disappearing beneath the central Trinity cluster.
        const ex=compact?86:118,ey=compact?72:96,ellipse=Math.sqrt((dx*dx)/(ex*ex)+(dy*dy)/(ey*ey));
        if(ellipse<1){const sc=1.04/Math.max(.001,ellipse);n.x=vp.cx+dx*sc;n.y=vp.cy+dy*sc;}
      }
    }

    // Rare residual collisions at dense overview levels are resolved by
    // shrinking only the affected bubbles, never by drawing one on top of another.
    for(let pass=0;pass<8;pass++){
      const grid=new Map(),cell2=Math.max(12,(densityCap*2)+gap+2),key=(gx,gy)=>`${gx},${gy}`;
      for(const n of visibleNodes){
        const gx=Math.floor(n.x/cell2),gy=Math.floor(n.y/cell2);
        for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){
          const bucket=grid.get(key(gx+ox,gy+oy));if(!bucket)continue;
          for(const a of bucket){const d=Math.hypot(n.x-a.x,n.y-a.y),need=a.r+n.r+gap;if(d<need){const reduce=(need-d)*.50;a.r=Math.max(2.2,a.r-reduce);n.r=Math.max(2.2,n.r-reduce);}}
        }
        const k=key(gx,gy);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(n);
      }
    }
    projectCache=nodes;preferredVisible=visibleNodes;
    return {vp,R,nodes,visibleNodes};
  }
  function nodeById(id){return projectCache.find(n=>n.id===id)||null}
  function drawFallbackInBubble(x,y,r){
    ctx.save(); ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.clip();
    const g=ctx.createRadialGradient(x-r*.28,y-r*.34,2,x,y,r);
    g.addColorStop(0,'#fff1ad'); g.addColorStop(.48,'#c99734'); g.addColorStop(1,'#2e4770');
    ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);
    ctx.fillStyle='#17203c'; ctx.font=`bold ${Math.round(r*1.04)}px Georgia,serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('☦',x,y+1); ctx.restore();
  }
  function drawImageInBubble(img,x,y,r){
    ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();
    const iw=img.naturalWidth||img.width||1,ih=img.naturalHeight||img.height||1; const d=r*2,scale=Math.min(d/iw,d/ih),w=iw*scale,h=ih*scale;
    ctx.fillStyle='#152444';ctx.fillRect(x-r,y-r,r*2,r*2); ctx.drawImage(img,x-w/2,y-h/2,w,h); ctx.restore();
  }
  function bestBubbleImage(e){ return upgradedImageCache.get(e.id)||localImageCache.get(e.id)||null }

  function drawGlobe(){
    if(!ctx)return;
    const {vp,R,visibleNodes}=projectVisible();
    canvas.width=vp.w; canvas.height=vp.h; canvas.style.width=`${vp.w}px`; canvas.style.height=`${vp.h}px`;
    scene.style.width=`${vp.w}px`; scene.style.height=`${vp.h}px`;
    ctx.clearRect(0,0,vp.w,vp.h);

    const outer=ctx.createRadialGradient(vp.cx-R*0.25,vp.cy-R*0.35,R*0.08,vp.cx,vp.cy,R*1.18);
    outer.addColorStop(0,'rgba(216,246,255,.18)'); outer.addColorStop(.62,'rgba(53,121,175,.11)'); outer.addColorStop(1,'rgba(19,42,86,.03)');
    ctx.fillStyle=outer; ctx.beginPath(); ctx.arc(vp.cx,vp.cy,R*1.16,0,Math.PI*2); ctx.fill();

    const globe=ctx.createRadialGradient(vp.cx-R*0.34,vp.cy-R*0.44,R*0.08,vp.cx,vp.cy,R);
    globe.addColorStop(0,'#f9fcff'); globe.addColorStop(.10,'#caebff'); globe.addColorStop(.38,'#84c6f0'); globe.addColorStop(.72,'#2f75ad'); globe.addColorStop(1,'#15365f');
    ctx.fillStyle=globe; ctx.beginPath(); ctx.arc(vp.cx,vp.cy,R,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.78)'; ctx.lineWidth=2.2; ctx.stroke();

    // latitude / longitude hints
    ctx.save(); ctx.beginPath(); ctx.arc(vp.cx,vp.cy,R,0,Math.PI*2); ctx.clip();
    ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1;
    for(let i=-2;i<=2;i++){
      ctx.beginPath(); ctx.ellipse(vp.cx,vp.cy+i*(R*0.13),R*Math.sqrt(Math.max(.18,1-(i*.17)**2)),R*.18,0,0,Math.PI*2); ctx.stroke();
    }
    for(let i=-3;i<=3;i++){
      ctx.beginPath(); ctx.ellipse(vp.cx+i*(R*0.12),vp.cy,R*.16,R*Math.sqrt(Math.max(.14,1-(i*.16)**2)),0,0,Math.PI*2); ctx.stroke();
    }

    // web lines
    for(const [aId,bId] of edges){
      const a=nodeById(aId), b=nodeById(bId); if(!a||!b||!a.visible||!b.visible)continue;
      const alpha=.08+((a.depth+b.depth)/2)*.22;
      ctx.strokeStyle=`rgba(255,247,198,${alpha.toFixed(3)})`;
      ctx.lineWidth=.7 + ((a.depth+b.depth)/2)*.9;
      const mx=(a.x+b.x)/2, my=(a.y+b.y)/2, curve=((a.rz+b.rz)/2)*10;
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.quadraticCurveTo(mx,my-curve,b.x,b.y); ctx.stroke();
    }

    // nodes back to front
    for(const n of visibleNodes){
      const c=colors[n.e.category]||'#72e8ff';
      ctx.beginPath();ctx.arc(n.x,n.y,n.r+3,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.94)';ctx.fill();
      ctx.beginPath();ctx.arc(n.x,n.y,n.r+1.3,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();
      ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fillStyle='#16284a';ctx.fill();
      const img=bestBubbleImage(n.e);
      if(img)drawImageInBubble(img,n.x,n.y,Math.max(3,n.r-1.8)); else drawFallbackInBubble(n.x,n.y,Math.max(3,n.r-1.8));
      if(state.active===n.id){ctx.strokeStyle='rgba(255,255,255,.96)';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(n.x,n.y,n.r+5.5,0,Math.PI*2);ctx.stroke()}
    }
    ctx.restore();

    const rim=ctx.createRadialGradient(vp.cx,vp.cy,R*.68,vp.cx,vp.cy,R*1.01);
    rim.addColorStop(.72,'rgba(0,0,0,0)'); rim.addColorStop(.88,'rgba(11,41,79,.08)'); rim.addColorStop(1,'rgba(255,255,255,.42)');
    ctx.fillStyle=rim; ctx.beginPath(); ctx.arc(vp.cx,vp.cy,R*1.01,0,Math.PI*2); ctx.fill();
    renderReady=true;
  }
  function requestRender(){ if(drawRaf)return; drawRaf=requestAnimationFrame(()=>{drawRaf=0; drawGlobe(); refreshLabels(); updateSearchMarker();}); }

  function clearLabels(){labelsEl.replaceChildren();labelMap.clear()}
  function refreshLabels(){
    if(!renderReady&&!preferredVisible.length)return;
    clearLabels();
    const queryMatches=state.query.trim()?new Set(matches().map(e=>e.id)):null;
    const candidates=[];
    const vw=network.clientWidth||innerWidth, vh=network.clientHeight||innerHeight;
    for(const n of preferredVisible){
      if(n.x<-80||n.x>vw+80||n.y<-80||n.y>vh+80)continue;
      const priority=queryMatches?.has(n.id)?-100000:Math.hypot(n.x-vw/2,n.y-vh/2)-n.rz*50;
      candidates.push({n,priority});
    }
    candidates.sort((a,b)=>a.priority-b.priority);
    const boxes=[]; const cap=compact?38:56;
    for(const c of candidates){
      if(labelMap.size>=cap)break;
      const n=c.n;
      const label=document.createElement('div'); label.className='canvas-label';
      if(n.e.venerated===false)label.classList.add('context-label');
      label.textContent=locText(n.e.name?.[state.lang]||n.e.name?.en||n.id,state.lang);
      const w=compact?104:112; const h=compact?28:30; const offset=Math.max(12,n.r+6); const x=n.x-w/2; const y=n.y+offset;
      const rect={l:x,t:y,r:x+w,b:y+h};
      let overlaps=false;
      for(const b of boxes){ if(!(rect.r<b.l||rect.l>b.r||rect.b<b.t||rect.t>b.b)){ overlaps=true; break; } }
      if(overlaps)continue;
      boxes.push(rect);
      label.style.transform=`translate3d(${n.x.toFixed(1)}px,${(n.y+offset).toFixed(1)}px,0) translateX(-50%)`;
      labelsEl.appendChild(label); labelMap.set(n.id,label);
    }
  }
  function updateSearchMarker(){
    const ms=matches(); const q=state.query.trim();
    if(!q||!ms.length){searchMarker.hidden=true; return}
    const n=nodeById(ms[0].id); if(!n||!n.visible){searchMarker.hidden=true; return}
    const size=Math.max(28,Math.min(82,(n.r*2+16)));
    searchMarker.hidden=false; searchMarker.style.width=`${size}px`; searchMarker.style.height=`${size}px`;
    searchMarker.style.transform=`translate3d(${n.x.toFixed(1)}px,${n.y.toFixed(1)}px,0) translate(-50%,-50%)`;
  }
  function scheduleLabels(delay=90){clearTimeout(labelTimer);labelTimer=setTimeout(()=>{refreshLabels(); updateSearchMarker();},delay)}

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
    modal.classList.remove('fallback-open');unloadActiveDetails();state.active=null;state.tab='description';requestRender();
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
    const img=document.getElementById('modalImage');img.onerror=null;img.src=preferredLocalImage(e);img.alt=locText(e.name?.[lang]||e.name?.en||'',lang);
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
    const e=byId.get(id);if(!e)return;unloadActiveDetails();state.active=id;state.tab='description';populateModalLoading(e);showModalSafe();requestRender();
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
    setModalMedia(e);
    document.getElementById('modalName').textContent=locText(e.name?.[lang]||e.name?.en||e.id,lang);document.getElementById('modalRole').textContent=locText(e.role?.[lang]||e.role?.en||'',lang);document.getElementById('modalFeast').textContent=locText(e.feast?.[lang]||e.feast?.en||'—',lang);document.getElementById('modalScripture').textContent=locText(e.scriptureText?.[lang]||e.scriptureText?.en||e.scripture||'—',lang);document.getElementById('modalCategory').textContent=UI[lang].category[e.category]||locText(e.category,lang);
    const body=document.getElementById('tabBody');body.replaceChildren();
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
    const notice=document.getElementById('modalNotice');notice.hidden=e.venerated!==false;notice.textContent=UI[lang].notVenerated;document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===state.tab));
  }

  function translate(){
    document.documentElement.lang=state.lang;document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(UI[state.lang][k])el.textContent=UI[state.lang][k]});search.placeholder=UI[state.lang].search;document.querySelectorAll('.lang').forEach(b=>b.classList.toggle('active',b.dataset.lang===state.lang));
    if(state.active){const e=byId.get(state.active);if(e&&activeDetail?.id===e.id)populateModal();else if(e)populateModalLoading(e)}
    requestRender();updateSearchUI();
  }

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function minScale(){ return NORMAL_MIN_SCALE }
  function zoomAt(_clientX,_clientY,nextScale){ state.scale=clamp(nextScale,minScale(),MAX_SCALE); labelsEl.classList.add('moving'); requestRender(); scheduleLabels(90); }
  function hitEntry(clientX,clientY){
    const r=network.getBoundingClientRect(); const x=clientX-r.left,y=clientY-r.top; let best=null,bestD=1e9;
    for(const n of preferredVisible){ const extra=Math.max(6,12/state.scale); const d=Math.hypot(x-n.x,y-n.y); if(d<n.r+extra && d<bestD){ bestD=d; best=n.e; } }
    return best;
  }
  function orientToEntry(e,scale=Math.max(1.08,state.scale)){
    const g=geometryById.get(e.id); if(!g)return; const lon=Math.atan2(g.x,g.z); const lat=Math.atan2(g.y,Math.hypot(g.x,g.z));
    state.rotY=-lon; state.rotX=-lat; state.scale=clamp(scale,minScale(),MAX_SCALE); requestRender(); scheduleLabels(90);
  }

  network.addEventListener('wheel',e=>{if(modal.hasAttribute('open'))return;e.preventDefault();zoomAt(e.clientX,e.clientY,state.scale*Math.exp(-e.deltaY*.00135))},{passive:false});
  const pointers=new Map(); let gesture=null,lastTap={t:0,x:0,y:0};
  const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2}),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function beginPinch(){const ps=[...pointers.values()];if(ps.length<2)return;const a=ps[0],b=ps[1];gesture={type:'pinch',startDistance:Math.max(1,distance(a,b)),startScale:state.scale};labelsEl.classList.add('moving');network.classList.add('is-dragging')}
  network.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;pointers.set(e.pointerId,{id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});try{network.setPointerCapture(e.pointerId)}catch(_){}if(pointers.size>=2){beginPinch();return}gesture={type:'rotate',id:e.pointerId,startX:e.clientX,startY:e.clientY,rotX:state.rotX,rotY:state.rotY,moved:false};labelsEl.classList.add('moving');network.classList.add('is-dragging')});
  network.addEventListener('pointermove',e=>{
    const p=pointers.get(e.pointerId); if(p){p.x=e.clientX;p.y=e.clientY;pointers.set(e.pointerId,p)}
    if(gesture?.type==='pinch'&&pointers.size>=2){const ps=[...pointers.values()],a=ps[0],b=ps[1],next=clamp(gesture.startScale*(distance(a,b)/gesture.startDistance),minScale(),MAX_SCALE);state.scale=next;requestRender();return}
    if(gesture?.type==='rotate'&&gesture.id===e.pointerId){const dx=e.clientX-gesture.startX,dy=e.clientY-gesture.startY;if(!gesture.moved&&Math.hypot(dx,dy)>5)gesture.moved=true;if(gesture.moved){state.rotY=gesture.rotY+dx*ROTATE_SPEED;state.rotX=clamp(gesture.rotX+dy*ROTATE_SPEED*0.82,-1.22,1.22);requestRender()}return}
  },{passive:true});
  function releasePointer(e){const g=gesture,p=pointers.get(e.pointerId);pointers.delete(e.pointerId);if(g?.type==='pinch'){if(pointers.size===1){const q=[...pointers.values()][0];gesture={type:'rotate',id:q.id,startX:q.x,startY:q.y,rotX:state.rotX,rotY:state.rotY,moved:true}}else gesture=null}else if(g?.type==='rotate'&&g.id===e.pointerId)gesture=null;if(!pointers.size){network.classList.remove('is-dragging');labelsEl.classList.remove('moving');scheduleLabels(45)}return{g,p}}
  network.addEventListener('pointerup',e=>{const {g,p}=releasePointer(e);if(!p||g?.type!=='rotate'||g.moved)return;const hit=hitEntry(e.clientX,e.clientY);if(hit){openEntry(hit.id);return}const now=performance.now();if(e.pointerType!=='mouse'&&now-lastTap.t<300&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<28){zoomAt(e.clientX,e.clientY,state.scale<1.2?state.scale*1.45:BASE_SCALE);lastTap.t=0}else lastTap={t:now,x:e.clientX,y:e.clientY}});
  network.addEventListener('pointercancel',releasePointer);
  network.addEventListener('dblclick',e=>{e.preventDefault();const hit=hitEntry(e.clientX,e.clientY);if(hit){openEntry(hit.id);return}zoomAt(e.clientX,e.clientY,state.scale<1.2?state.scale*1.42:BASE_SCALE)});
  window.addEventListener('resize',()=>{requestRender();scheduleLabels(80)},{passive:true});

  function updateSearchUI(){
    const ms=matches(),q=state.query.trim();emptyState.hidden=ms.length!==0;matchCount.textContent=q?`${ms.length} ${ms.length===1?UI[state.lang].result:UI[state.lang].results}`:`${entries.length}`;updateSearchMarker();
  }
  let searchDebounce=0;
  search.addEventListener('input',e=>{state.query=e.target.value;clearTimeout(searchDebounce);searchDebounce=setTimeout(()=>{updateSearchUI();refreshLabels()},55)});
  search.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=matches()[0];if(first){e.preventDefault();orientToEntry(first,Math.max(1.14,state.scale));openEntry(first.id)}}});
  document.querySelectorAll('.lang').forEach(b=>b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();state.lang=b.dataset.lang;storageSet('orthodox-lang',state.lang);translate()}));
  document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==search){e.preventDefault();search.focus();return}if(e.key==='Escape'&&modal.hasAttribute('open')){closeModalSafe();return}if(!modal.hasAttribute('open')&&(e.key==='+'||e.key==='='||e.key==='-')){e.preventDefault();zoomAt(0,0,state.scale*(e.key==='-'?.82:1.22));return}if(!modal.hasAttribute('open')&&e.key==='0'){e.preventDefault();state.rotX=.22;state.rotY=-.56;state.scale=BASE_SCALE;requestRender();scheduleLabels(60)}});
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{if(t.disabled)return;state.tab=t.dataset.tab;populateModal()})); document.getElementById('closeModal').addEventListener('click',closeModalSafe); modal.addEventListener('click',e=>{if(e.target===modal)closeModalSafe()}); modal.addEventListener('cancel',e=>{e.preventDefault();closeModalSafe()});

  async function preloadLocalImages(onProgress){
    let cursor=0,done=0,failed=0;
    const concurrency=lowMemory?3:(compact?6:10);
    async function worker(){
      while(true){
        const i=cursor++;if(i>=ordered.length)return;const e=ordered[i];
        const img=e.image?await loadImageSource(imageUrl(e.image),0):null;
        if(img)localImageCache.set(e.id,img);else failed++;
        done++;onProgress?.({done,total:ordered.length,failed});
        if((done&31)===0)await new Promise(r=>setTimeout(r,0));
      }
    }
    await Promise.all(Array.from({length:Math.min(concurrency,Math.max(1,ordered.length))},()=>worker()));
    return {localTotal:ordered.length,localFailed:failed};
  }
  function loadVerifiedImagesInBackground(){
    const upgrades=ordered.filter(e=>e.imageLocalReal||(e.imageRemote&&navigator.onLine!==false));
    if(!upgrades.length)return;
    let cursor=0;
    const concurrency=lowMemory?1:(compact?2:4);
    async function worker(){
      while(true){
        const i=cursor++;if(i>=upgrades.length)return;const e=upgrades[i];let img=null;
        if(e.imageLocalReal)img=await loadImageSource(imageUrl(e.imageLocalReal),0);
        if(!img&&e.imageRemote&&navigator.onLine!==false)img=await loadImageSource(e.imageRemote,9000);
        if(img){
          upgradedImageCache.set(e.id,img);requestRender();
          if(state.active===e.id&&activeDetail?.id===e.id)setModalMedia(detailView(e));
        }
        if((i&7)===0)await new Promise(r=>setTimeout(r,0));
      }
    }
    Promise.all(Array.from({length:Math.min(concurrency,upgrades.length)},()=>worker())).catch(()=>{});
  }
  async function runStartup(){
    const loader=document.getElementById('startupLoader');if(!loader){document.body.classList.remove('startup-lock');loadVerifiedImagesInBackground();return}
    const bar=document.getElementById('startupBar'),pct=document.getElementById('startupPct'),title=document.getElementById('startupTitle'),sub=document.getElementById('startupSub');title.textContent=UI[state.lang].startup;sub.textContent=UI[state.lang].startupSub;
    const setProgress=(fraction,text)=>{const v=Math.max(0,Math.min(.995,fraction));if(bar)bar.style.transform=`scaleX(${v})`;if(pct)pct.textContent=`${Math.round(v*100)}%`;if(sub&&text)sub.textContent=text};
    setProgress(.02,UI[state.lang].startupSub);
    const result=await preloadLocalImages(info=>{
      const f=.04+(info.done/Math.max(1,info.total))*.95;
      setProgress(f,state.lang==='el'?`Τοπικές εικόνες ${info.done}/${info.total}${info.failed?` • αποτυχίες ${info.failed}`:''}`:`Local images ${info.done}/${info.total}${info.failed?` • failures ${info.failed}`:''}`);
    });
    requestRender();updateSearchUI();
    if(bar)bar.style.transform='scaleX(1)';if(pct)pct.textContent='100%';
    if(sub)sub.textContent=state.lang==='el'?`Έτοιμο: ${result.localTotal-result.localFailed}/${result.localTotal} τοπικές εικόνες. Οι επαληθευμένες διαδικτυακές εικόνες φορτώνονται προαιρετικά στο παρασκήνιο.`:`Ready: ${result.localTotal-result.localFailed}/${result.localTotal} local images. Verified online images upgrade quietly in the background.`;
    await new Promise(r=>setTimeout(r,180));loader.classList.add('done');document.body.classList.remove('startup-lock');setTimeout(()=>loader.remove(),360);
    loadVerifiedImagesInBackground();
  }

  document.body.classList.add('startup-lock');
  buildLayout();
  ctx=canvas.getContext('2d',{alpha:true,desynchronized:true}); if(ctx)ctx.imageSmoothingEnabled=true;
  translate(); requestRender(); runStartup();
})();
