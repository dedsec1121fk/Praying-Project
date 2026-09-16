#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[2]
html=(ROOT/'index.html').read_text(encoding='utf-8')
app=(ROOT/'web/assets/js/app.js').read_text(encoding='utf-8')
manifest=json.loads((ROOT/'web/offline-files.json').read_text(encoding='utf-8'))
errors=[]
for token in ('id="startupPct"','id="startupBar"','startup-track-percent'):
    if token not in html:errors.append(f'loader missing {token}')
if 'preloadEverything' not in app or "fetch('web/offline-files.json'" not in app:errors.append('complete manifest preload not wired')
if 'preloadFirstIcons' in app:errors.append('legacy partial image preload still present')
if "Fail closed: the user is not put into a partially loaded website." not in app:errors.append('startup does not fail closed')
files=set(manifest.get('files') or [])
# Runtime must have all image and detail paths represented in the full offline/preload manifest.
runtime=(ROOT/'web/data/runtime-index.js').read_text(encoding='utf-8')
images=re.findall(r'"image":"([^"]+)"',runtime)
details=re.findall(r'"detailFile":"([^"]+)"',runtime)
for p in images:
    if './'+p not in files:errors.append(f'image omitted from preload manifest: {p}')
for p in details:
    rel='./web/data/details/'+p
    if rel not in files:errors.append(f'detail omitted from preload manifest: {rel}')
if errors:
    print('\n'.join('ERROR '+e for e in errors[:30]),file=sys.stderr)
    raise SystemExit(1)
print(f'Complete startup preload validation: OK ({len(files)} files; {len(images)} catalog images; {len(details)} detail files).')
