#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');
const scripts=[
  'web/data/entries.js','web/data/expanded-biblical.js','web/data/church-saints.js','web/data/feasts.js',
  'web/data/biblical-context.js','web/data/further-expansion.js','web/data/deep-biblical.js','web/data/comprehensive-expansion.js',
  'web/data/v7-expansion.js','web/data/v8-expansion.js','web/data/v24-expansion.js','web/data/catalog.js','web/data/media-manifest.js',
  'web/data/deep-profiles.js','web/data/deep-profiles-2.js','web/data/deep-profiles-3.js','web/data/profile-enricher.js'
];
const ctx={window:{},console,encodeURIComponent,decodeURIComponent,URL,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Date};ctx.window.window=ctx.window;vm.createContext(ctx);
for(const rel of scripts)vm.runInContext(fs.readFileSync(path.join(root,rel),'utf8'),ctx,{filename:rel});
const entries=ctx.window.ORTHODOX_ENTRIES||[];
for(const e of entries){if(e.imageLocalReal&&!fs.existsSync(path.join(root,e.imageLocalReal)))delete e.imageLocalReal}
const detailsDir=path.join(root,'web/data/details');fs.mkdirSync(detailsDir,{recursive:true});
for(const f of fs.readdirSync(detailsDir))if(/^(?:details-[0-9a-f]|entry-\d+)\.js$/.test(f))fs.unlinkSync(path.join(detailsDir,f));

// Startup shell: only identity + image location + the tiny fields required to
// draw the grid. Rich content is intentionally excluded and lives in the
// per-entry detail file loaded only when the user taps a card.
const shellSourceKeys=new Set(['id','name','category','image','imageLocalReal']);
function flattenText(value,out=[]){
  if(value==null)return out;
  if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'){out.push(String(value));return out;}
  if(Array.isArray(value)){for(const v of value)flattenText(v,out);return out;}
  if(typeof value==='object'){for(const v of Object.values(value))flattenText(v,out);return out;}
  return out;
}
function compactSearch(e){
  // Search metadata is deliberately separate from the startup shell. Do not
  // include descriptions, stories, prayers or knowledge body text here.
  const pieces=[...flattenText(e.name),...flattenText(e.role),...flattenText(e.aliases),...flattenText(e.metadata),...flattenText(e.feast),e.scripture||'',e.category||''];
  return [...new Set(pieces.map(x=>String(x).replace(/\s+/g,' ').trim()).filter(Boolean))].join(' ');
}
const searchIndex=Object.create(null);
const lite=entries.map((e,i)=>{
  const detailFile=`entry-${String(i).padStart(4,'0')}.js`;
  const out={id:e.id,name:e.name,category:e.category,image:e.image||'',detailFile};
  if(e.imageLocalReal)out.imageLocalReal=e.imageLocalReal;
  searchIndex[e.id]=compactSearch(e);
  const detail={};
  for(const [k,v] of Object.entries(e))if(!shellSourceKeys.has(k))detail[k]=v;
  const code=`(()=>{window.ORTHODOX_ENTRY_DETAILS=window.ORTHODOX_ENTRY_DETAILS||Object.create(null);window.ORTHODOX_ENTRY_DETAILS[${JSON.stringify(e.id)}]=${JSON.stringify(detail)};})();\n`;
  fs.writeFileSync(path.join(detailsDir,detailFile),code);
  return out;
});
fs.writeFileSync(path.join(root,'web/data/runtime-index.js'),`(()=>{window.ORTHODOX_ENTRIES=${JSON.stringify(lite)};})();\n`);
fs.writeFileSync(path.join(root,'web/data/search-index.js'),`(()=>{window.ORTHODOX_SEARCH_INDEX=${JSON.stringify(searchIndex)};})();\n`);
console.log(`Built lean lazy runtime: ${lite.length} startup entries + ${lite.length} on-demand detail files + separate search metadata.`);
