#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..'),ctx={window:{},Object};ctx.window.window=ctx.window;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'web/data/runtime-index.js'),'utf8'),ctx);
const lite=ctx.window.ORTHODOX_ENTRIES||[],ids=new Set(),files=new Set();let detailCount=0;
for(const e of lite){
  if(ids.has(e.id))throw new Error(`Duplicate index id ${e.id}`);ids.add(e.id);
  if(!e.detailFile)throw new Error(`Missing detailFile for ${e.id}`);
  if(files.has(e.detailFile))throw new Error(`Duplicate detail file ${e.detailFile}`);files.add(e.detailFile);
  const localImage=path.join(root,e.image||'');if(!e.image||!fs.existsSync(localImage))throw new Error(`Missing local image for ${e.id}: ${e.image}`);
  if(e.imageLocalReal&&!fs.existsSync(path.join(root,e.imageLocalReal)))throw new Error(`Runtime references missing verified local image for ${e.id}: ${e.imageLocalReal}`);
  const f=path.join(root,'web/data/details',e.detailFile);if(!fs.existsSync(f))throw new Error(`Missing ${f}`);
  vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:e.detailFile});
  const data=ctx.window.ORTHODOX_ENTRY_DETAILS?.[e.id];if(!data)throw new Error(`Detail file ${e.detailFile} did not publish ${e.id}`);
  if(data.id!==undefined)throw new Error(`Detail payload for ${e.id} redundantly contains id`);
  for(const field of ['description','story','prayer'])for(const lang of ['en','el'])if(!String(data[field]?.[lang]||'').trim())throw new Error(`${e.id}: missing ${field}.${lang}`);
  detailCount++;delete ctx.window.ORTHODOX_ENTRY_DETAILS[e.id];
}
const extra=fs.readdirSync(path.join(root,'web/data/details')).filter(f=>/^entry-\d+\.js$/.test(f)&&!files.has(f));
if(extra.length)throw new Error(`Unexpected detail files: ${extra.slice(0,5).join(', ')}`);
console.log(`Strict lazy runtime OK: ${lite.length} index entries; ${detailCount} independent detail files; no retained validation cache.`);
