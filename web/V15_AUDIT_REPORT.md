# v15 final audit report

This release was rebuilt around three mandatory reader-facing fields for every catalog record:

- **Description / Περιγραφή**
- **Story / Ιστορία**
- **Prayer / Προσευχή**

## Coverage checked

- Catalog records: **1,083**
- Independent lazy detail files: **1,083 / 1,083**
- Records with non-empty English Description / Story / Prayer: **1,083 / 1,083**
- Records with non-empty Greek Περιγραφή / Ιστορία / Προσευχή: **1,083 / 1,083**
- Bundled local fallback images: **1,083 / 1,083**
- Verified Wikimedia mappings retained: **52**
- Missing cached-real paths published to the runtime: **0**

Every bundled fallback image is checked for file existence and SVG structure. Optional verified iconography remains source-mapped, but the runtime only exposes a local cached-real path when that exact binary is physically present. This prevents a missing optional cache from becoming a broken local image.

## Language and readability checks

The details window now uses the same three tabs for all entries and opens on Description. Greek prose normalization and prayer-invocation grammar are handled separately, so normal roles and descriptions are not accidentally converted to vocative prayer forms. Common Gospel labels are rendered in established Greek forms such as **Ευαγγέλιο κατά Μάρκον** rather than mixed English/Greek legacy text.

## Accuracy policy

The release keeps evidence-status labels (`source-expanded`, `source-linked`, `scripture-grounded`, and `catalog-summary`). Sparse or disputed traditions are therefore not upgraded into false historical certainty. Context-only/non-venerated records remain explicitly distinguished from saints and are not given intercessory prayers directed to them.

A source-sensitive review corrected **Saint Olga of Kwethluk** to the Orthodox Church in America's annual commemoration of **27 October**, and distinguishes the November 2023 Holy Synod decision from the June 2025 public glorification services. The entry links directly to the official OCA saint page and canonization schedule.

## Release checks

All of the following pass in this release:

```bash
node web/tools/build_lazy_runtime.js
python web/tools/validate_catalog.py
node web/tools/validate_profiles.js
node web/tools/validate_lazy_runtime.js
node web/tools/audit_content_quality.js
python web/tools/check_static_site.py
node --check web/assets/js/app.js
node --check web/data/profile-enricher.js
```
