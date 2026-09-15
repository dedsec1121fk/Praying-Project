# v19 Audit Report

## Catalog

- Catalog records: **1,083**
- Independent detail files: **1,083**
- Required English Description / Story / Prayer: **1,083 / 1,083**
- Required Greek Περιγραφή / Ιστορία / Προσευχή: **1,083 / 1,083**

## Images

- Bundled local entry SVGs: **1,083 / 1,083**
- Distinct local SVG byte hashes: **1,083 / 1,083**
- Verified Wikimedia Commons mappings: **62**
- Required published local-real paths whose file is missing: **0**
- Verified cache binaries bundled in this release: **0** (intentional; remote upgrades are optional and local artwork is complete)

## Globe layout

The sphere uses level-of-detail on constrained views, then progressively reveals additional bubbles with zoom. The automated layout validator covers 360×640, 390×844, 768×1024, and 1440×900 viewports across four scales and four rotations (64 cases).

The completed v19 run covered **64 cases** and reported **0.31 px worst residual overlap**, with **1 overlap pair in the worst case** and up to **591 visible nodes** in the tested configurations. It also preserves protected search/featured/active nodes and keeps bubbles inside the sphere / outside the central Trinity exclusion zone.

## Language / provenance checks

The release audit rejects known Greek placeholder regressions (`Ο/Η`, `Άγιε/Αγία`, and several malformed recurring reference forms). Verified media mappings must contain a Commons File source URL, license/reuse label, English credit, and remote image URL. Local illustrations are not counted as verified historical/iconographic sources.

## Release commands

```bash
node web/tools/build_lazy_runtime.js
python web/tools/generate_local_icons.py
python web/tools/validate_catalog.py
node web/tools/validate_profiles.js
node web/tools/validate_lazy_runtime.js
node web/tools/audit_content_quality.js
node web/tools/validate_globe_layout.js
python web/tools/check_static_site.py
node --check web/assets/js/app.js
node --check web/data/profile-enricher.js
```
