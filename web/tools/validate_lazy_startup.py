#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[2]
html=(ROOT/'index.html').read_text(encoding='utf-8')
app=(ROOT/'web/assets/js/app.js').read_text(encoding='utf-8')
boot=(ROOT/'web/assets/js/bootstrap.js').read_text(encoding='utf-8')
runtime=(ROOT/'web/data/runtime-index.js').read_text(encoding='utf-8')
search=(ROOT/'web/data/search-index.js').read_text(encoding='utf-8')
errors=[]
for token in ('id="startupPct"','id="startupBar"','startup-track-percent'):
    if token not in html: errors.append(f'loader missing {token}')
if 'preloadCatalogImages' not in app: errors.append('catalog image preload missing')
if 'preloadEverything' in app: errors.append('legacy full-site startup preload still present')
if "fetch(`web/offline-files.json" in app: errors.append('startup still fetches offline manifest')
if 'ensureDetails(e)' not in app or 'detailFileUrl(e)' not in app: errors.append('on-demand detail loader missing')
if 'unloadActiveDetails()' not in app or 'clearPublishedDetail' not in app: errors.append('detail unload cleanup missing')
if "search-index.js?v=27" not in app: errors.append('post-startup search metadata loader missing')
if 'requestIdleCallback' not in app: errors.append('search metadata is not deferred until after startup')
if len(runtime.encode('utf-8')) > 500_000: errors.append(f'runtime shell too large: {len(runtime.encode("utf-8"))} bytes')
# Startup runtime should not carry the heavy content keys.
for key in ('"story":','"prayer":','"knowledge":','"description":','"metadata":','"profile":','"role":'):
    if key in runtime: errors.append(f'heavy key leaked into startup runtime: {key}')
if '"story":' in search or '"prayer":' in search: errors.append('story/prayer leaked into search metadata file')
if '?v=27' not in boot: errors.append('bootstrap cache buster not updated to v27')
# Every entry must still point at one detail file and one repository image.
images=re.findall(r'"image":"([^"]+)"',runtime)
details=re.findall(r'"detailFile":"([^"]+)"',runtime)
if len(images)!=1186 or len(details)!=1186: errors.append(f'unexpected shell counts images={len(images)} details={len(details)}')
for rel in images:
    if not (ROOT/rel).is_file(): errors.append(f'missing startup image: {rel}')
for f in details:
    if not (ROOT/'web/data/details'/f).is_file(): errors.append(f'missing lazy detail: {f}')
if errors:
    print('\n'.join('ERROR '+e for e in errors[:50]),file=sys.stderr)
    raise SystemExit(1)
print(f'Lazy startup validation: OK ({len(images)} shell images; runtime {len(runtime.encode("utf-8"))} bytes; search metadata {len(search.encode("utf-8"))} bytes; details on demand).')
