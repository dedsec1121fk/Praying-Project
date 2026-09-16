#!/usr/bin/env python3
# Kept under the historical filename so existing validation commands continue
# to work. v27 intentionally validates a lean catalog-shell preload rather than
# the old full-site startup preload.
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('validate_lazy_startup.py')),run_name='__main__')
