#!/usr/bin/env python3
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[2]
include=[ROOT/'index.html',ROOT/'404.html',ROOT/'web-app.webmanifest',ROOT/'service-worker.js']
for base in [ROOT/'web/assets',ROOT/'web/data',ROOT/'web/images']:
    if not base.exists(): continue
    for p in base.rglob('*'):
        if not p.is_file(): continue
        if '/tools/' in p.as_posix(): continue
        if p.name.startswith('RELEASE_NOTES'): continue
        include.append(p)
# manifest includes itself so a complete cache can be refreshed from one file
rel=sorted({'./'+p.relative_to(ROOT).as_posix() for p in include})
manifest={'cacheName':'praying-project-offline-v25','files':rel}
out=ROOT/'web/offline-files.json'
out.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print(f'Offline manifest: {len(rel)} files')
