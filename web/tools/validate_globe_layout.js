#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');
const ctx={window:{}};ctx.window.window=ctx.window;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'web/data/runtime-index.js'),'utf8'),ctx);
const entries=ctx.window.ORTHODOX_ENTRIES||[];
const byId=new Map(entries.map(e=>[e.id,e]));
const featuredIds=['jesus-christ','holy-spirit','theotokos','archangel-michael','archangel-gabriel','archangel-raphael','john-baptist','peter','paul','andrew','john-theologian','james-zebedee','mary-magdalene','stephen','george','demetrios','nicholas','nektarios','john-chrysostom','basil-great','gregory-theologian','gregory-palamas','constantine-helen','paisios','porphyrios','seraphim-sarov','spyridon','athanasius-great','cyril-alexandria','maximus-confessor','isaac-syrian','mary-egypt','moses','elijah','david','daniel','abraham','sarah','isaac','jacob','joseph-patriarch','noah','job','pentecost','nativity-christ','theophany','transfiguration','dormition','annunciation','pascha'];
const featured=featuredIds.map(id=>byId.get(id)).filter(Boolean),set=new Set(featured.map(e=>e.id));
const ordered=[...featured,...entries.filter(e=>!set.has(e.id))];
function hashString(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function unit(seed){seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296}
function geometry(){
 const out=[],n=ordered.length,golden=Math.PI*(3-Math.sqrt(5)),featuredCount=Math.min(42,featured.length);
 for(let i=0;i<n;i++){
  const e=ordered[i];let x,y,z;
  if(i<featuredCount){const ring=i<8?0:i<20?1:2,start=ring===0?0:ring===1?8:20,count=ring===0?8:ring===1?12:22,t=(i-start)/count,lon=t*Math.PI*2+ring*.17,lat=(ring===0?.18:ring===1?-.08:-.34)+(unit(hashString(e.id))*.10-.05),cl=Math.cos(lat);x=Math.sin(lon)*cl;y=Math.sin(lat);z=Math.abs(Math.cos(lon)*cl)}
  else{const k=i-featuredCount+.5;y=1-2*(k/Math.max(1,n-featuredCount));const r=Math.sqrt(Math.max(0,1-y*y)),theta=golden*k+(unit(hashString(e.id))*.20-.10);x=Math.cos(theta)*r;z=Math.sin(theta)*r}
  out.push({id:e.id,x,y,z});
 }
 return out;
}
const G=geometry();
function solve({w,h,scale,rotX,rotY,compact}){
 const cx=w/2,cy=h/2,BUBBLE_MIN=compact?9:10,BUBBLE_MAX=compact?16:19;
 const R=Math.max(compact?118:180,Math.min(w,h)*(compact?.33:.39)*scale);
 const cosy=Math.cos(rotY),siny=Math.sin(rotY),cosx=Math.cos(rotX),sinx=Math.sin(rotX),nodes=[];
 for(const p of G){const x1=p.x*cosy+p.z*siny,z1=-p.x*siny+p.z*cosy,y2=p.y*cosx-z1*sinx,z2=p.y*sinx+z1*cosx,depth=(z2+1)/2;nodes.push({id:p.id,rz:z2,depth,visible:false,x:cx+x1*R,y:cy+y2*R,r:0})}
 const front=nodes.filter(n=>n.rz>-.10),gap=compact?2.4:3.2,minTargetR=compact?5.2:6.4,usableArea=Math.PI*R*R*.44,nominalFootprint=Math.pow(minTargetR*2+gap,2),capacity=Math.max(featured.length+12,Math.min(front.length,Math.floor(usableArea/nominalFootprint))),forced=new Set(featured.map(e=>e.id));
 front.sort((a,b)=>{const af=forced.has(a.id),bf=forced.has(b.id);if(af!==bf)return af?-1:1;const as=unit(hashString(a.id+'|lod'))-Math.max(0,a.rz)*.17,bs=unit(hashString(b.id+'|lod'))-Math.max(0,b.rz)*.17;return as-bs});
 const selected=new Set(front.slice(0,capacity).map(n=>n.id));for(const n of nodes)n.visible=selected.has(n.id);
 const visible=nodes.filter(n=>n.visible).sort((a,b)=>a.rz-b.rz),areaPer=Math.PI*R*R*.60/Math.max(1,visible.length),densityCap=Math.max(minTargetR,Math.min(BUBBLE_MAX,Math.sqrt(areaPer)*.39)),cell=Math.max(12,densityCap*2+gap+2),key=(x,y)=>`${x},${y}`;
 for(const n of visible){const depthR=(BUBBLE_MIN+(BUBBLE_MAX-BUBBLE_MIN)*Math.max(0,Math.min(1,n.depth)))*(.90+Math.max(0,n.rz)*.24);n.r=Math.min(depthR,densityCap)}
 for(let pass=0;pass<10;pass++){
  const grid=new Map();
  for(const n of visible){const gx=Math.floor(n.x/cell),gy=Math.floor(n.y/cell);for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){const bucket=grid.get(key(gx+ox,gy+oy));if(!bucket)continue;for(const a of bucket){const minD=a.r+n.r+gap;let dx=n.x-a.x,dy=n.y-a.y,d=Math.hypot(dx,dy);if(d>=minD)continue;if(d<.001){const hsh=hashString(a.id+'|'+n.id);dx=unit(hsh)-.5;dy=unit(hsh+17)-.5;d=Math.hypot(dx,dy)||1}const overlap=(minD-d)*.56;dx/=d;dy/=d;const frontN=Math.max(0,n.rz),frontA=Math.max(0,a.rz),sum=frontN+frontA+1,moveA=.42+.16*(frontN/sum),moveN=1-moveA;a.x-=dx*overlap*moveA;a.y-=dy*overlap*moveA;n.x+=dx*overlap*moveN;n.y+=dy*overlap*moveN}}
   const k=key(Math.floor(n.x/cell),Math.floor(n.y/cell));if(!grid.has(k))grid.set(k,[]);grid.get(k).push(n)}
  for(const n of visible){let dx=n.x-cx,dy=n.y-cy,dist=Math.hypot(dx,dy)||1,max=Math.max(4,R-n.r-3);if(dist>max){const sc=max/dist;n.x=cx+dx*sc;n.y=cy+dy*sc;dx=n.x-cx;dy=n.y-cy;dist=Math.hypot(dx,dy)||1}const ex=compact?86:118,ey=compact?72:96,ellipse=Math.sqrt((dx*dx)/(ex*ex)+(dy*dy)/(ey*ey));if(ellipse<1){const sc=1.04/Math.max(.001,ellipse);n.x=cx+dx*sc;n.y=cy+dy*sc}}
 }
 for(let pass=0;pass<8;pass++){const grid=new Map(),cell2=Math.max(12,densityCap*2+gap+2);for(const n of visible){const gx=Math.floor(n.x/cell2),gy=Math.floor(n.y/cell2);for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){const bucket=grid.get(key(gx+ox,gy+oy));if(!bucket)continue;for(const a of bucket){const d=Math.hypot(n.x-a.x,n.y-a.y),need=a.r+n.r+gap;if(d<need){const reduce=(need-d)*.50;a.r=Math.max(2.2,a.r-reduce);n.r=Math.max(2.2,n.r-reduce)}}}const k=key(gx,gy);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(n)}}
 let overlaps=0,maxOverlap=0,minGap=Infinity;
 for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){const a=visible[i],b=visible[j],d=Math.hypot(a.x-b.x,a.y-b.y),margin=d-(a.r+b.r);minGap=Math.min(minGap,margin);if(margin<-.25){overlaps++;maxOverlap=Math.max(maxOverlap,-margin)}}
 return {count:visible.length,capacity,frontCount:front.length,overlaps,maxOverlap,minGap,densityCap,R};
}
const cases=[];
for(const vp of [{w:360,h:640},{w:390,h:844},{w:768,h:1024},{w:1440,h:900}])for(const scale of [.75,1,1.6,2.5])for(const rot of [[.22,-.56],[0,0],[.65,1.2],[-.8,-2.1]])cases.push({...vp,scale,rotX:rot[0],rotY:rot[1],compact:vp.w<=620});
let failures=0,worst=null;
for(const c of cases){const r=solve(c);if(!worst||r.maxOverlap>worst.r.maxOverlap)worst={c,r};const allowed=Math.max(4,Math.ceil(r.count*.015));if(r.overlaps>allowed||r.maxOverlap>3.2){failures++;console.error('Layout collision excess',c,r)}}
console.log(`Globe layout cases: ${cases.length}; worst overlap: ${worst.r.maxOverlap.toFixed(2)}px; worst-case overlap pairs: ${worst.r.overlaps}; visible nodes: ${worst.r.count}`);
if(failures){console.error(`Globe layout validation failed in ${failures} cases.`);process.exit(1)}
console.log('Globe layout validation: OK');
