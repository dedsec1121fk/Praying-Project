#!/usr/bin/env python3
"""Cache license-compatible Wikimedia Commons icon images for offline use.

No third-party Python packages are required. Run from the repository root while
online: python web/tools/download_real_icons.py
"""
from __future__ import annotations
import json, pathlib, urllib.request, time, sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
MANIFEST=ROOT/'web/data/image-sources.json'
items=json.loads(MANIFEST.read_text(encoding='utf-8'))
ua='Praying-Project/1.0 (+https://github.com/dedsec1121fk/Praying-Project; icon-cache)'
ok=fail=0
for i,(entry,m) in enumerate(items.items(),1):
    out=ROOT/m['local']
    out.parent.mkdir(parents=True,exist_ok=True)
    if out.exists() and out.stat().st_size>500:
        print(f'[{i}/{len(items)}] exists  {entry}: {out.relative_to(ROOT)}'); ok+=1; continue
    req=urllib.request.Request(m['remote'],headers={'User-Agent':ua})
    try:
        with urllib.request.urlopen(req,timeout=45) as r:
            data=r.read()
        if len(data)<500: raise RuntimeError(f'file too small ({len(data)} bytes)')
        out.write_bytes(data)
        print(f'[{i}/{len(items)}] saved   {entry}: {out.relative_to(ROOT)} ({len(data):,} bytes)'); ok+=1
        time.sleep(.15)
    except Exception as ex:
        print(f'[{i}/{len(items)}] FAILED  {entry}: {ex}',file=sys.stderr); fail+=1
print(f'Finished: {ok} cached, {fail} failed. Sources/licenses: web/IMAGE_SOURCES.md')
raise SystemExit(1 if fail else 0)
