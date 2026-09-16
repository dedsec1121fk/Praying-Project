#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[2]
html=(ROOT/'index.html').read_text(encoding='utf-8');app=(ROOT/'web/assets/js/app.js').read_text(encoding='utf-8');boot=(ROOT/'web/assets/js/bootstrap.js').read_text(encoding='utf-8');runtime=(ROOT/'web/data/runtime-index.js').read_text(encoding='utf-8');search=(ROOT/'web/data/search-index.js').read_text(encoding='utf-8')
errors=[]
for token in ('id="startupPct"','id="startupBar"','startup-track-percent'):
    if token not in html: errors.append(f'loader missing {token}')
if 'preloadCatalogImages' not in app: errors.append('catalog image preload missing')
if 'preloadEverything' in app or 'fetch(`web/offline-files.json' in app: errors.append('startup still performs full-site preload')
for token in ('ensureDetails(e)','detailBundleUrl(e)','unloadActiveDetails()','warmAllBundlesInBackground'):
    if token not in app: errors.append(f'bundled lazy detail feature missing: {token}')
if 'createObjectURL' in app or '/web/data/details/' in app: errors.append('legacy per-entry script/blob detail loader remains')
if 'search-index.js?v=29' not in app: errors.append('v29 deferred search metadata loader missing')
if 'requestIdleCallback' not in app: errors.append('post-startup work is not deferred')
if '?v=29' not in boot: errors.append('bootstrap cache buster not v29')
if len(runtime.encode())>500_000: errors.append(f'runtime shell too large: {len(runtime.encode())} bytes')
for key in ('"story":','"prayer":','"knowledge":','"description":','"metadata":','"profile":','"role":'):
    if key in runtime: errors.append(f'heavy key leaked into startup runtime: {key}')
if '"story":' in search or '"prayer":' in search: errors.append('story/prayer leaked into deferred search metadata')
images=re.findall(r'"image":"([^"]+)"',runtime);bundles=re.findall(r'"detailBundle":"([^"]+)"',runtime)
if len(images)!=1186 or len(bundles)!=1186: errors.append(f'unexpected shell counts images={len(images)} bundles={len(bundles)}')
for rel in images:
    if not (ROOT/rel).is_file(): errors.append(f'missing startup image: {rel}')
unique=sorted(set(bundles))
if len(unique)!=99: errors.append(f'unexpected bundle count {len(unique)}')
for f in unique:
    p=ROOT/'web/data/detail-bundles'/f
    if not p.is_file(): errors.append(f'missing bundle {f}')
    else:
        try:
            data=json.loads(p.read_text(encoding='utf-8'))
            if len(data.get('entries',{}))>12: errors.append(f'{f}: >12 entries')
        except Exception as exc: errors.append(f'{f}: invalid JSON {exc}')
if errors:
    print('\n'.join('ERROR '+e for e in errors[:80]),file=sys.stderr);raise SystemExit(1)
print(f'Lazy startup validation: OK ({len(images)} shell images; runtime {len(runtime.encode())} bytes; search metadata {len(search.encode())} bytes; {len(unique)} detail bundles loaded only after entry).')
