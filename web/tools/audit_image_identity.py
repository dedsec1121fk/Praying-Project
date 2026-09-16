#!/usr/bin/env python3
"""Fail-closed audit for image identity/provenance mappings."""
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'web/data/image-sources.json'
RUNTIME=ROOT/'web/data/runtime-index.js'
BAD=('logo','company','corporation','business','brand','product','album','film','television','actor','actress','singer','rapper','football','soccer','politician','president','ceo','university','software','trademark')
allowed_verification={'manual-commons-source-review','strict-commons-title-metadata-v1'}
manifest=json.loads(SRC.read_text(encoding='utf-8'))
errors=[]
for eid,m in manifest.items():
    status=m.get('identityVerified')
    if status not in allowed_verification:errors.append(f'{eid}: missing accepted identityVerified status')
    source=m.get('sourceUrl','')
    if not source.startswith('https://commons.wikimedia.org/wiki/File:'):errors.append(f'{eid}: source is not a Commons File page')
    hay=' '.join(str(m.get(k,'')) for k in ('file','sourceUrl')).lower()
    if any(x in hay for x in BAD):errors.append(f'{eid}: suspicious non-religious image term in mapping')
    local=m.get('local','')
    if local and not (local.startswith('web/images/real/') or local.startswith('web/images/real-auto/')):errors.append(f'{eid}: unexpected repository image path {local}')
    if m.get('autoResolved') and status!='strict-commons-title-metadata-v1':errors.append(f'{eid}: legacy/loose autoResolved mapping prohibited')
# Every runtime item must always have a dedicated local illustration path.
text=RUNTIME.read_text(encoding='utf-8')
images=re.findall(r'"image":"([^"]+)"',text)
for p in images:
    if not (ROOT/p).exists():errors.append(f'missing dedicated catalog image: {p}')
print(f'Image identity audit: {len(manifest)} trusted real-image mappings; {len(images)} dedicated catalog images.')
if errors:
    print('\n'.join('ERROR '+e for e in errors),file=sys.stderr)
    raise SystemExit(1)
print('Image identity/provenance audit: OK')
