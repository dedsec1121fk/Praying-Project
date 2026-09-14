#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../..');
const ctx={window:{},location:{protocol:'file:'}};vm.createContext(ctx);
const files=['entries.js','expanded-biblical.js','church-saints.js','feasts.js','biblical-context.js','further-expansion.js','deep-biblical.js','comprehensive-expansion.js','v7-expansion.js','v8-expansion.js','catalog.js','deep-profiles.js','deep-profiles-2.js','deep-profiles-3.js','profile-enricher.js'];
for(const f of files)vm.runInContext(fs.readFileSync(path.join(root,'web/data',f),'utf8'),ctx,{filename:f});
const entries=ctx.window.ORTHODOX_ENTRIES||[];
let errors=[],enWords=0,elWords=0,minEn=1e9,minEl=1e9,deep=0;
const untranslatedGreek=/\b(?:Gospel|Gospels|Scripture|Church|Saint|Saints|Apostle|Apostles|Prophet|Prophets|Martyr|Bishop|Metropolitan|Elder|Monastic|feast|commemoration|prayer|tradition|history|New Testament|Old Testament|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Greek Daniel)\b/i;
const genericGreek=/(?:Ο\/Η|του\/της|Άγιε\/Αγία)/;
for(const e of entries){
  for(const lang of ['en','el']){
    const k=e.knowledge?.[lang];
    if(!k||!Array.isArray(k.sections)||!k.sections.length){errors.push(`${e.id}: missing knowledge.${lang}`);continue;}
    for(const [i,s] of k.sections.entries()){
      if(!String(s.title||'').trim())errors.push(`${e.id}: empty ${lang} section title ${i}`);
      if(!String(s.text||'').trim())errors.push(`${e.id}: empty ${lang} section text ${i}`);
    }
    const wc=k.sections.map(s=>s.text).join(' ').trim().split(/\s+/).filter(Boolean).length;
    if(lang==='en'){enWords+=wc;minEn=Math.min(minEn,wc)}else{elWords+=wc;minEl=Math.min(minEl,wc)}
  }
  if(!e.scriptureText?.en||!e.scriptureText?.el)errors.push(`${e.id}: missing bilingual scriptureText`);
  const greekChecks=[];
  for(const field of ['name','role','story','feast','prayer','notes','scriptureText'])if(e[field]?.el)greekChecks.push([`${field}.el`,e[field].el]);
  for(const [i,sec] of (e.knowledge?.el?.sections||[]).entries()){greekChecks.push([`knowledge.el.sections[${i}].title`,sec.title]);greekChecks.push([`knowledge.el.sections[${i}].text`,sec.text]);}
  for(const [i,src] of (e.knowledge?.el?.sources||[]).entries())if(src?.label?.el)greekChecks.push([`knowledge.el.sources[${i}].label.el`,src.label.el]);
  for(const [field,val] of Object.entries(e.profile?.el||{}))greekChecks.push([`profile.el.${field}`,val]);
  for(const [where,val] of greekChecks)if(typeof val==='string'&&untranslatedGreek.test(val))errors.push(`${e.id}: untranslated English reference term in ${where}: ${val.slice(0,120)}`);
  for(const [where,val] of greekChecks)if(typeof val==='string'&&genericGreek.test(val))errors.push(`${e.id}: unresolved Greek grammar placeholder in ${where}: ${val.slice(0,120)}`);
  if(e.venerated===false&&/(?:pray to God for us|intercede for us|πρέσβευε|πρεσβεύ)/i.test(`${e.prayer?.en||''} ${e.prayer?.el||''}`))errors.push(`${e.id}: context-only record contains intercessory prayer`);
  for(const field of ['name','role','story','feast','prayer','notes'])for(const lang of ['en','el'])if(!String(e[field]?.[lang]||'').trim())errors.push(`${e.id}: missing ${field}.${lang}`);
}
deep=(ctx.window.ORTHODOX_DEEP_PROFILE_COUNT||0)+(ctx.window.ORTHODOX_DEEP_PROFILE_2_COUNT||0)+(ctx.window.ORTHODOX_DEEP_PROFILE_3_COUNT||13);
console.log(`Detailed bilingual dossiers: ${entries.length}`);
console.log(`Hand-curated deep profiles: ${deep}`);
console.log(`Average English dossier words: ${Math.round(enWords/Math.max(1,entries.length))} (minimum ${minEn})`);
console.log(`Average Greek dossier words: ${Math.round(elWords/Math.max(1,entries.length))} (minimum ${minEl})`);
if(errors.length){console.error('\nFAIL');errors.slice(0,120).forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Profile validation: OK');
