#!/usr/bin/env python3
"""Build the browser media manifest from image-sources.json.

The runtime is repository-only: remote URLs are retained in image-sources.json
for downloading/provenance, but are NOT published as display URLs to the app.
"""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[2]
src=ROOT/'web/data/image-sources.json'
out=ROOT/'web/data/media-manifest.js'
media=json.loads(src.read_text(encoding='utf-8'))
# Keep only fields the browser needs. Remote/download URLs deliberately omitted.
public={}
for eid,m in media.items():
    item={}
    for k in ('file','local','sourceUrl','license','credit','autoResolved'):
        if m.get(k) not in (None,'',{}): item[k]=m[k]
    if item.get('local'): public[eid]=item
code=("(()=>{\n  'use strict';\n  const media="+json.dumps(public,ensure_ascii=False,separators=(',',':'))+";\n"
      "  const entries=Array.isArray(window.ORTHODOX_ENTRIES)?window.ORTHODOX_ENTRIES:[];\n"
      "  const byId=new Map(entries.map(e=>[e.id,e]));\n"
      "  for(const [id,m] of Object.entries(media)){const e=byId.get(id);if(!e)continue;if(m.local)e.imageLocalReal=m.local;if(m.sourceUrl)e.imageMeta={sourceUrl:m.sourceUrl,license:m.license,credit:m.credit};}\n"
      "  window.ORTHODOX_MEDIA=media;\n})();\n")
out.write_text(code,encoding='utf-8')
print(f'Built repository-only media manifest: {len(public)} mappings; no remote display URLs.')
