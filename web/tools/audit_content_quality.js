#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');
const runtime=path.join(root,'web/data/runtime-index.js');
const ctx={window:{},console};ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext(fs.readFileSync(runtime,'utf8'),ctx,{filename:runtime});
const entries=ctx.window.ORTHODOX_ENTRIES||[];
const stats={quality:{},images:{local:0,verifiedMapped:0},errors:[]};
for(const e of entries){
  const img=path.join(root,e.image||'');if(fs.existsSync(img)){stats.images.local++;const raw=fs.readFileSync(img,'utf8');if(/\.svg$/i.test(img)&&(!/<svg\b/i.test(raw)||!/<\/svg>/i.test(raw)))stats.errors.push(`${e.id}: invalid SVG icon ${e.image}`)}else stats.errors.push(`${e.id}: missing local icon ${e.image}`);
  if(e.imageLocalReal&&!fs.existsSync(path.join(root,e.imageLocalReal)))stats.errors.push(`${e.id}: runtime points to missing verified local image ${e.imageLocalReal}`);
  if(e.imageLocalReal||e.imageRemote)stats.images.verifiedMapped++;
  const detailPath=path.join(root,'web/data/details',e.detailFile||'');
  if(!fs.existsSync(detailPath)){stats.errors.push(`${e.id}: missing detail file`);continue}
  const dctx={window:{},console};dctx.window.window=dctx.window;vm.createContext(dctx);vm.runInContext(fs.readFileSync(detailPath,'utf8'),dctx,{filename:detailPath});
  const d=dctx.window.ORTHODOX_ENTRY_DETAILS?.[e.id];if(!d){stats.errors.push(`${e.id}: detail file does not publish record`);continue}
  for(const lang of ['en','el']){
    if(!d.description?.[lang])stats.errors.push(`${e.id}: missing description.${lang}`);
    if(!d.story?.[lang])stats.errors.push(`${e.id}: missing story.${lang}`);
    if(!d.prayer?.[lang])stats.errors.push(`${e.id}: missing prayer.${lang}`);
    if(!d.knowledge?.[lang]?.sections?.length)stats.errors.push(`${e.id}: missing knowledge.${lang}`);
  }
  const level=d.contentQuality?.level||'missing';stats.quality[level]=(stats.quality[level]||0)+1;
  const greek=JSON.stringify({story:d.story?.el,prayer:d.prayer?.el,knowledge:d.knowledge?.el});
  if(/Ο\/Η|Άγιε\/Αγία\s+(?:Άγιος|Αγία|Όσιος|Οσία|Απόστολος|Προφήτης)/.test(greek))stats.errors.push(`${e.id}: unresolved generic Greek grammar marker`);
  if(!Array.isArray(d.sources)&&!Array.isArray(d.knowledge?.en?.sources))stats.errors.push(`${e.id}: missing source/reference collection`);
}
console.log(`Records: ${entries.length}`);
console.log(`Local icons: ${stats.images.local}/${entries.length}`);
console.log(`Verified real-image mappings: ${stats.images.verifiedMapped}`);
console.log('Content quality levels:');for(const [k,v] of Object.entries(stats.quality).sort())console.log(`  ${k}: ${v}`);
if(stats.errors.length){console.error(`\nFAIL (${stats.errors.length})`);for(const e of stats.errors.slice(0,100))console.error(' -',e);if(stats.errors.length>100)console.error(` ... ${stats.errors.length-100} more`);process.exit(1)}
console.log('\nContent/source integrity audit: OK');
