#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');
const ctx={window:{},console};ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'web/data/runtime-index.js'),'utf8'),ctx);
const entries=ctx.window.ORTHODOX_ENTRIES||[];
const media=JSON.parse(fs.readFileSync(path.join(root,'web/data/image-sources.json'),'utf8'));
const bundleCache=new Map();
function detail(e){if(!bundleCache.has(e.detailBundle))bundleCache.set(e.detailBundle,JSON.parse(fs.readFileSync(path.join(root,'web/data/detail-bundles',e.detailBundle),'utf8')));return bundleCache.get(e.detailBundle).entries?.[e.id]}
const stats={quality:{},images:{local:0,verifiedMapped:0},errors:[]};
for(const [id,m] of Object.entries(media)){
  if(!m.sourceUrl||!m.license||!m.credit?.en||!m.remote)stats.errors.push(`${id}: incomplete verified image provenance`);
  if(m.sourceUrl&&!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/i.test(m.sourceUrl))stats.errors.push(`${id}: verified image source is not a Wikimedia Commons file page`);
  if(m.identityVerified!=='manual-commons-source-review'||m.autoResolved)stats.errors.push(`${id}: mapping is not manual-review-only`);
}
for(const e of entries){
  const img=path.join(root,e.image||'');if(fs.existsSync(img))stats.images.local++;else stats.errors.push(`${e.id}: missing local icon ${e.image}`);
  if(e.imageLocalReal&&!fs.existsSync(path.join(root,e.imageLocalReal)))stats.errors.push(`${e.id}: runtime points to missing verified local image ${e.imageLocalReal}`);
  if(media[e.id]?.sourceUrl&&e.imageLocalReal)stats.images.verifiedMapped++;
  const d=detail(e);if(!d){stats.errors.push(`${e.id}: missing bundle detail`);continue}
  for(const lang of ['en','el']){
    if(!d.description?.[lang])stats.errors.push(`${e.id}: missing description.${lang}`);
    if(!d.story?.[lang])stats.errors.push(`${e.id}: missing story.${lang}`);
    if(!d.prayer?.[lang])stats.errors.push(`${e.id}: missing prayer.${lang}`);
    if(!d.knowledge?.[lang]?.sections?.length)stats.errors.push(`${e.id}: missing knowledge.${lang}`);
  }
  const level=d.contentQuality?.level||'missing';stats.quality[level]=(stats.quality[level]||0)+1;
  const greek=JSON.stringify({story:d.story?.el,prayer:d.prayer?.el,knowledge:d.knowledge?.el});
  if(/Ο\/Η|Άγιε\/Αγία|της Ορθόδοξη Εκκλησία|στο (?:Ιωάννης|Ματθαίος|Μάρκος|Λουκάς)/.test(greek))stats.errors.push(`${e.id}: unresolved generic Greek grammar marker`);
  if(!Array.isArray(d.sources)&&!Array.isArray(d.knowledge?.en?.sources))stats.errors.push(`${e.id}: missing source/reference collection`);
}
console.log(`Records: ${entries.length}`);console.log(`Local icons: ${stats.images.local}/${entries.length}`);console.log(`Verified real images packaged now: ${stats.images.verifiedMapped}/${Object.keys(media).length} approved mappings`);console.log('Content quality levels:');for(const [k,v] of Object.entries(stats.quality).sort())console.log(`  ${k}: ${v}`);
if(stats.errors.length){console.error(`\nFAIL (${stats.errors.length})`);for(const e of stats.errors.slice(0,120))console.error(' -',e);process.exit(1)}
console.log('\nContent/source integrity audit: OK');
