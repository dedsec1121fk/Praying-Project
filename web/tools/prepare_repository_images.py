#!/usr/bin/env python3
"""Populate verified image files in the repository, then rebuild the lazy runtime."""
from pathlib import Path
import subprocess, sys
ROOT=Path(__file__).resolve().parents[2]

def run(cmd,check=True):
    print('+',' '.join(map(str,cmd)))
    return subprocess.run(cmd,cwd=ROOT,check=check)

# Continue even if an individual Commons file is temporarily unavailable; the
# downloader leaves the repository fallback image in place for that entry.
run([sys.executable,'web/tools/download_real_icons.py'],check=False)
run(['node','web/tools/build_lazy_runtime.js'])
run(['node','web/tools/validate_lazy_runtime.js'])
print('Repository image preparation finished.')
