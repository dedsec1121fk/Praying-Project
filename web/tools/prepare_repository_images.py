#!/usr/bin/env python3
"""Populate repository image files for as much of the full catalog as safely possible."""
from pathlib import Path
import subprocess, sys
ROOT=Path(__file__).resolve().parents[2]

def run(cmd,check=True):
    print('+',' '.join(map(str,cmd)),flush=True)
    return subprocess.run(cmd,cwd=ROOT,check=check)

# 1) Reject any unverified/legacy image mappings before downloading.
run([sys.executable,'web/tools/audit_image_identity.py'])
# 2) Download the hand-reviewed Commons mappings first.
run([sys.executable,'web/tools/download_real_icons.py'],check=False)
# 3) Strict resolver: exact distinctive identity + religious/iconographic context only.
#    There is intentionally no Wikipedia lead-image fallback.
run([sys.executable,'web/tools/resolve_commons_images.py'],check=False)
# 4) Audit again after any strict automatic additions.
run([sys.executable,'web/tools/audit_image_identity.py'])
# 5) Rebuild browser manifest without remote display URLs.
run([sys.executable,'web/tools/build_media_manifest.py'])
# 6) Rebuild runtime only after actual repository files exist.
run(['node','web/tools/build_lazy_runtime.js'])
run(['node','web/tools/validate_lazy_runtime.js'])
# 7) Refresh the complete browser-offline file list after any downloaded images were added.
run([sys.executable,'web/tools/build_offline_manifest.py'])
print('Repository image preparation finished. Commit web/images/real and web/images/real-auto with the rest of the project.')
