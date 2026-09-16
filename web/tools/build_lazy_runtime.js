#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');
const scripts=[
  'web/data/entries.js','web/data/expanded-biblical.js','web/data/church-saints.js','web/data/feasts.js',
  'web/data/biblical-context.js','web/data/further-expansion.js','web/data/deep-biblical.js','web/data/comprehensive-expansion.js',
  'web/data/v7-expansion.js','web/data/v8-expansion.js','web/data/v24-expansion.js','web/data/catalog.js','web/data/media-manifest.js',
  'web/data/deep-profiles.js','web/data/deep-profiles-2.js','web/data/deep-profiles-3.js','web/data/profile-enricher.js',
  'web/data/v29-content.js'
].filter(rel=>fs.existsSync(path.join(root,rel)));
const ctx={window:{},console,encodeURIComponent,decodeURIComponent,URL,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Date};ctx.window.window=ctx.window;vm.createContext(ctx);
for(const rel of scripts)vm.runInContext(fs.readFileSync(path.join(root,rel),'utf8'),ctx,{filename:rel});
const entries=ctx.window.ORTHODOX_ENTRIES||[];
for(const e of entries){if(e.imageLocalReal&&!fs.existsSync(path.join(root,e.imageLocalReal)))delete e.imageLocalReal}

const oldDetails=path.join(root,'web/data/details');
if(fs.existsSync(oldDetails))fs.rmSync(oldDetails,{recursive:true,force:true});
const bundlesDir=path.join(root,'web/data/detail-bundles');
fs.rmSync(bundlesDir,{recursive:true,force:true});fs.mkdirSync(bundlesDir,{recursive:true});

const shellSourceKeys=new Set(['id','name','category','image','imageLocalReal']);
function flattenText(value,out=[]){
  if(value==null)return out;
  if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'){out.push(String(value));return out;}
  if(Array.isArray(value)){for(const v of value)flattenText(v,out);return out;}
  if(typeof value==='object'){for(const v of Object.values(value))flattenText(v,out);return out;}
  return out;
}
function compactSearch(e){
  const pieces=[...flattenText(e.name),...flattenText(e.role),...flattenText(e.aliases),...flattenText(e.metadata),...flattenText(e.feast),e.scripture||'',e.category||''];
  return [...new Set(pieces.map(x=>String(x).replace(/\s+/g,' ').trim()).filter(Boolean))].join(' ');
}

const BUNDLE_SIZE=12;
const searchIndex=Object.create(null),lite=[],bundles=[];
for(let start=0;start<entries.length;start+=BUNDLE_SIZE){
  const index=Math.floor(start/BUNDLE_SIZE),bundleFile=`bundle-${String(index).padStart(3,'0')}.json`;
  const records=Object.create(null);
  for(let i=start;i<Math.min(entries.length,start+BUNDLE_SIZE);i++){
    const e=entries[i];
    const out={id:e.id,name:e.name,category:e.category,image:e.image||'',detailBundle:bundleFile};
    if(e.imageLocalReal)out.imageLocalReal=e.imageLocalReal;
    lite.push(out);searchIndex[e.id]=compactSearch(e);
    const detail={};for(const [k,v] of Object.entries(e))if(!shellSourceKeys.has(k))detail[k]=v;
    records[e.id]=detail;
  }
  const payload={version:29,bundle:index,entries:records};
  fs.writeFileSync(path.join(bundlesDir,bundleFile),JSON.stringify(payload));
  bundles.push(bundleFile);
}
fs.writeFileSync(path.join(root,'web/data/runtime-index.js'),`(()=>{window.ORTHODOX_ENTRIES=${JSON.stringify(lite)};window.ORTHODOX_DETAIL_BUNDLES=${JSON.stringify(bundles)};})();\n`);
fs.writeFileSync(path.join(root,'web/data/search-index.js'),`(()=>{window.ORTHODOX_SEARCH_INDEX=${JSON.stringify(searchIndex)};})();\n`);
console.log(`Built v29 bundled runtime: ${lite.length} startup entries + ${bundles.length} JSON detail bundles (${BUNDLE_SIZE} entries max each) + separate search metadata.`);
