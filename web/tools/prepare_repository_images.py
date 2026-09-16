#!/usr/bin/env python3
"""Populate repository image files for as much of the full catalog as safely possible."""
from pathlib import Path
import subprocess, sys
ROOT=Path(__file__).resolve().parents[2]

def run(cmd,check=True):
    print('+',' '.join(map(str,cmd)),flush=True)
    return subprocess.run(cmd,cwd=ROOT,check=check)

# 1) Download the hand-curated mappings first.
run([sys.executable,'web/tools/download_real_icons.py'],check=False)
# 2) Search Commons for every still-unmapped entry and store accepted files in repo.
run([sys.executable,'web/tools/resolve_commons_images.py'],check=False)
# 3) Rebuild browser manifest without remote display URLs.
run([sys.executable,'web/tools/build_media_manifest.py'])
# 4) Rebuild runtime only after actual repository files exist.
run(['node','web/tools/build_lazy_runtime.js'])
run(['node','web/tools/validate_lazy_runtime.js'])
print('Repository image preparation finished. Commit web/images/real and web/images/real-auto with the rest of the project.')
