#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');
const ctx={window:{},Object};ctx.window.window=ctx.window;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'web/data/runtime-index.js'),'utf8'),ctx);
const lite=ctx.window.ORTHODOX_ENTRIES||[],declared=ctx.window.ORTHODOX_DETAIL_BUNDLES||[];
const ids=new Set(),expected=new Map();let detailCount=0;
for(const e of lite){
  if(ids.has(e.id))throw new Error(`Duplicate index id ${e.id}`);ids.add(e.id);
  if(!e.detailBundle)throw new Error(`Missing detailBundle for ${e.id}`);
  if(!expected.has(e.detailBundle))expected.set(e.detailBundle,[]);expected.get(e.detailBundle).push(e.id);
  const localImage=path.join(root,e.image||'');if(!e.image||!fs.existsSync(localImage))throw new Error(`Missing local image for ${e.id}: ${e.image}`);
  if(e.imageLocalReal&&!fs.existsSync(path.join(root,e.imageLocalReal)))throw new Error(`Runtime references missing verified local image for ${e.id}: ${e.imageLocalReal}`);
  for(const heavy of ['story','prayer','knowledge','description','metadata','profile','role'])if(Object.prototype.hasOwnProperty.call(e,heavy))throw new Error(`Heavy startup field leaked for ${e.id}: ${heavy}`);
}
if(declared.length!==expected.size)throw new Error(`Declared bundle count ${declared.length} != used ${expected.size}`);
const declaredSet=new Set(declared);for(const f of expected.keys())if(!declaredSet.has(f))throw new Error(`Used bundle is not declared: ${f}`);
for(const [file,wantIds] of expected){
  const f=path.join(root,'web/data/detail-bundles',file);if(!fs.existsSync(f))throw new Error(`Missing bundle ${file}`);
  const payload=JSON.parse(fs.readFileSync(f,'utf8'));
  if(payload.version!==29)throw new Error(`${file}: wrong version ${payload.version}`);
  const records=payload.entries||{},got=Object.keys(records);
  if(got.length!==wantIds.length)throw new Error(`${file}: expected ${wantIds.length} records, got ${got.length}`);
  if(got.length>12)throw new Error(`${file}: too many records (${got.length})`);
  for(const id of wantIds){
    const d=records[id];if(!d)throw new Error(`${file}: missing ${id}`);
    if(d.id!==undefined)throw new Error(`${file}/${id}: redundant id in detail payload`);
    for(const field of ['description','story','prayer'])for(const lang of ['en','el'])if(!String(d[field]?.[lang]||'').trim())throw new Error(`${id}: missing ${field}.${lang}`);
    for(const lang of ['en','el'])if(!Array.isArray(d.knowledge?.[lang]?.sections)||!d.knowledge[lang].sections.length)throw new Error(`${id}: missing knowledge.${lang}`);
    detailCount++;
  }
}
const disk=fs.readdirSync(path.join(root,'web/data/detail-bundles')).filter(f=>/^bundle-\d+\.json$/.test(f));
const extra=disk.filter(f=>!declaredSet.has(f));if(extra.length)throw new Error(`Unexpected detail bundles: ${extra.slice(0,5).join(', ')}`);
console.log(`Bundled lazy runtime OK: ${lite.length} index entries; ${detailCount} detail records; ${declared.length} JSON bundles; max 12 records per bundle.`);
