#!/usr/bin/env python3
"""Prepare only manually reviewed repository images.

Automatic image discovery is intentionally disabled. Wrong identity is worse
than missing historical artwork. Every catalog entry always has its dedicated
repository illustration under web/images/catalog/; only hand-reviewed Commons
mappings may override it.
"""
from pathlib import Path
import json, shutil, subprocess, sys
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'web/data/image-sources.json'
AUTO=ROOT/'web/images/real-auto'

def run(cmd,check=True):
    print('+',' '.join(map(str,cmd)),flush=True)
    return subprocess.run(cmd,cwd=ROOT,check=check)

# Purge every historical automatic image file and every automatic mapping.
if AUTO.exists():
    shutil.rmtree(AUTO)
AUTO.mkdir(parents=True,exist_ok=True)
manifest=json.loads(SRC.read_text(encoding='utf-8')) if SRC.exists() else {}
removed=[]
for eid in list(manifest):
    m=manifest[eid]
    if m.get('autoResolved') or m.get('identityVerified')!='manual-commons-source-review':
        removed.append(eid)
        local=m.get('local')
        if local:
            try:(ROOT/local).unlink(missing_ok=True)
            except Exception:pass
        del manifest[eid]
SRC.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Remove any stale/unreferenced files from the reviewed-real directory too.
real_dir=ROOT/'web/images/real'
real_dir.mkdir(parents=True,exist_ok=True)
expected={Path(m['local']).name for m in manifest.values() if m.get('local','').startswith('web/images/real/')}
for f in real_dir.iterdir():
    if f.is_file() and f.name!='README.txt' and f.name not in expected:
        f.unlink(missing_ok=True)
print(f'Manual-only image policy: {len(manifest)} approved mappings; purged {len(removed)} automatic/unapproved mappings; removed stale unreferenced real-image files.')

# Audit before network access, download only the manual whitelist, audit again.
run([sys.executable,'web/tools/audit_image_identity.py'])
run([sys.executable,'web/tools/download_real_icons.py'],check=False)
run([sys.executable,'web/tools/audit_image_identity.py'])
run([sys.executable,'web/tools/build_media_manifest.py'])
run(['node','web/tools/build_lazy_runtime.js'])
run(['node','web/tools/validate_lazy_runtime.js'])
run([sys.executable,'web/tools/build_offline_manifest.py'])
print('Repository image preparation finished: automatic image search is disabled; only manually reviewed Commons mappings are used.')
