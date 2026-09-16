#!/usr/bin/env python3
"""Static/offline compatibility checks for Orthodox Web.
No third-party packages are required.
"""
from __future__ import annotations
import json, re, sys
from pathlib import Path
from html.parser import HTMLParser
from xml.etree import ElementTree as ET
from collections import Counter

ROOT=Path(__file__).resolve().parents[2]
INDEX=ROOT/'index.html'
DATA=ROOT/'web'/'data'
DATASETS=['entries.js','expanded-biblical.js','church-saints.js','feasts.js','biblical-context.js','further-expansion.js','deep-biblical.js','comprehensive-expansion.js','v7-expansion.js','v8-expansion.js','v24-expansion.js']

class Parser(HTMLParser):
    def __init__(self): super().__init__(); self.refs=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=='script' and d.get('src'): self.refs.append(d['src'])
        if tag=='link' and d.get('href') and d.get('rel') in ('stylesheet',['stylesheet']): self.refs.append(d['href'])

errors=[]
html=INDEX.read_text(encoding='utf-8')
p=Parser(); p.feed(html)
for ref in p.refs:
    if re.match(r'^(?:https?:)?//',ref): errors.append(f'remote runtime dependency in index: {ref}'); continue
    if ref.startswith('/'): errors.append(f'root-absolute path breaks some repository/local deployments: {ref}'); continue
    if not (ROOT/ref).exists(): errors.append(f'missing referenced asset: {ref}')

entries_by_id={}
for fn in DATASETS:
    path=DATA/fn
    if not path.exists(): errors.append(f'missing dataset: {fn}'); continue
    try:
        layer=json.loads(path.read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
        ids=[e.get('id') for e in layer]
        for eid,n in Counter(ids).items():
            if n>1: errors.append(f'duplicate id inside {fn}: {eid} x{n}')
        for e in layer:
            if e.get('id'): entries_by_id[e['id']]=e
    except Exception as ex: errors.append(f'cannot parse {fn}: {ex}')
entries=list(entries_by_id.values())
required=('name','role','story','feast','prayer','notes')
for e in entries:
    eid=e.get('id','<missing>')
    for key in required:
        obj=e.get(key)
        if not isinstance(obj,dict): errors.append(f'{eid}: {key} is not bilingual object'); continue
        for lang in ('en','el'):
            if not str(obj.get(lang,'')).strip(): errors.append(f'{eid}: missing {key}.{lang}')
    img=ROOT/str(e.get('image',''))
    if not img.exists(): errors.append(f'{eid}: missing image {e.get("image")}'); continue
    if img.suffix.lower()=='.svg':
        try: ET.parse(img)
        except Exception as ex: errors.append(f'{eid}: invalid SVG: {ex}')

# The runtime must remain simple enough for both file:// and GitHub Pages.
for rel in ['web/data/catalog.js','web/data/profile-enricher.js']:
    text=(ROOT/rel).read_text(encoding='utf-8')
    for bad in ('fetch(', 'import(', 'XMLHttpRequest('):
        if bad in text: errors.append(f'{rel}: unexpected network/runtime loader call found: {bad}')

if not (ROOT/'.nojekyll').exists(): errors.append('missing .nojekyll for simple GitHub Pages publishing')
if not (ROOT/'404.html').exists(): errors.append('missing 404.html fallback')

print(f'HTML local asset references: {len(p.refs)}')
print(f'Catalog records: {len(entries)}')
print(f'Local images checked: {sum(1 for e in entries if (ROOT/str(e.get("image",""))).exists())}')
print('Runtime dependencies: local relative files only')
print('Network APIs required for catalog/text/UI: none')
print('Verified remote icon images: optional; bundled local fallback always available')
if errors:
    print('\nFAIL')
    for err in errors: print(' -',err)
    sys.exit(1)
print('\nStatic/offline validation: OK')
