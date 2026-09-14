#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');
const scripts=[
  'web/data/entries.js','web/data/expanded-biblical.js','web/data/church-saints.js','web/data/feasts.js',
  'web/data/biblical-context.js','web/data/further-expansion.js','web/data/deep-biblical.js','web/data/comprehensive-expansion.js',
  'web/data/v7-expansion.js','web/data/v8-expansion.js','web/data/catalog.js','web/data/media-manifest.js',
  'web/data/deep-profiles.js','web/data/deep-profiles-2.js','web/data/deep-profiles-3.js','web/data/profile-enricher.js'
];
const ctx={window:{},console,encodeURIComponent,decodeURIComponent,URL,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Set,Map,Date};ctx.window.window=ctx.window;vm.createContext(ctx);
for(const rel of scripts)vm.runInContext(fs.readFileSync(path.join(root,rel),'utf8'),ctx,{filename:rel});
const entries=ctx.window.ORTHODOX_ENTRIES||[];
const detailsDir=path.join(root,'web/data/details');fs.mkdirSync(detailsDir,{recursive:true});
for(const f of fs.readdirSync(detailsDir))if(/^(?:details-[0-9a-f]|entry-\d+)\.js$/.test(f))fs.unlinkSync(path.join(detailsDir,f));
const lightKeys=new Set(['id','name','category','role','search','aliases','venerated','image','imageLocalReal','imageRemote']);
const lite=entries.map((e,i)=>{
  const detailFile=`entry-${String(i).padStart(4,'0')}.js`;
  const out={id:e.id,name:e.name,category:e.category,role:e.role,search:e.search||'',aliases:e.aliases||[],venerated:e.venerated!==false,image:e.image||'',detailFile,atlasIndex:i};
  if(e.imageLocalReal)out.imageLocalReal=e.imageLocalReal;if(e.imageRemote)out.imageRemote=e.imageRemote;
  const detail={};for(const [k,v] of Object.entries(e))if(!lightKeys.has(k))detail[k]=v;
  const code=`(()=>{window.ORTHODOX_ENTRY_DETAILS=window.ORTHODOX_ENTRY_DETAILS||Object.create(null);window.ORTHODOX_ENTRY_DETAILS[${JSON.stringify(e.id)}]=${JSON.stringify(detail)};})();\n`;
  fs.writeFileSync(path.join(detailsDir,detailFile),code);
  return out;
});
fs.writeFileSync(path.join(root,'web/data/runtime-index.js'),`(()=>{window.ORTHODOX_ENTRIES=${JSON.stringify(lite)};})();\n`);
console.log(`Built strict per-entry lazy runtime: ${lite.length} lightweight entries + ${lite.length} individual detail files.`);
