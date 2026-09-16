#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[2]
GREEK=re.compile(r'[\u0370-\u03ff\u1f00-\u1fff]')
EN_LEAK=re.compile(r'\b(?:Saint|Church|Gospel|Scripture|Apostle|Prophet|Martyr|Bishop|Metropolitan|Elder|Monastic|protector|patronage|commemoration|prayer|tradition|history)\b',re.I)
errors=[];records=[]
for p in sorted((ROOT/'web/data/detail-bundles').glob('bundle-*.json')):
    payload=json.loads(p.read_text(encoding='utf-8'))
    records.extend(payload.get('entries',{}).items())
for eid,e in records:
    for field in ('role','description','story','prayer','feast','notes','scriptureText'):
        obj=e.get(field,{})
        if not isinstance(obj,dict): continue
        for lang in ('en','el'):
            if not str(obj.get(lang,'')).strip(): errors.append(f'{eid}: empty {field}.{lang}')
        el=str(obj.get('el',''))
        if el and not GREEK.search(el): errors.append(f'{eid}: {field}.el contains no Greek')
        if el and EN_LEAK.search(el): errors.append(f'{eid}: suspicious English UI term in {field}.el: {el[:120]}')
    for lang in ('en','el'):
        sections=e.get('knowledge',{}).get(lang,{}).get('sections',[])
        if not sections: errors.append(f'{eid}: no knowledge.{lang} sections');continue
        wc=sum(len(str(s.get('text','')).split()) for s in sections)
        if wc<145: errors.append(f'{eid}: knowledge.{lang} too thin ({wc} words)')
        for i,s in enumerate(sections):
            title=str(s.get('title','')).strip();text=str(s.get('text','')).strip()
            if not title or not text: errors.append(f'{eid}: empty {lang} section {i}')
            if lang=='el':
                if title and not GREEK.search(title): errors.append(f'{eid}: Greek section title lacks Greek: {title}')
                if text and EN_LEAK.search(text): errors.append(f'{eid}: suspicious English term in Greek section {i}: {text[:120]}')
    if e.get('category')=='parable':
        if len(str(e.get('story',{}).get('en','')).split())<65 or len(str(e.get('story',{}).get('el','')).split())<60: errors.append(f'{eid}: parable retelling still too short')
    if e.get('category')=='scripture-story':
        if len(str(e.get('story',{}).get('en','')).split())<75 or len(str(e.get('story',{}).get('el','')).split())<75: errors.append(f'{eid}: scripture-story retelling still too short')
print(f'Bilingual v29 audit: {len(records)} records checked.')
if errors:
    print('\n'.join('ERROR '+x for x in errors[:100]),file=sys.stderr)
    if len(errors)>100: print(f'... {len(errors)-100} more',file=sys.stderr)
    raise SystemExit(1)
print('Translation/detail-depth audit: OK')
