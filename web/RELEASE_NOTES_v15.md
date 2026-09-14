# v15 — Description / Story / Prayer + final integrity audit

- Every one of the **1,083** records now has explicit bilingual **Description / Περιγραφή**, **Story / Ιστορία**, and **Prayer / Προσευχή** fields.
- The details modal uses those exact three tabs and opens on Description for faster reading. Story keeps the fuller evidence-aware dossier; Prayer remains a separate readable section.
- The runtime builder and validators now fail if any of the three required fields is missing or empty in either English or Greek.
- All **1,083 bundled local SVG fallback images** are checked for file existence and SVG structure.
- A local verified-image path is emitted only when its cached binary actually exists. Optional verified Wikimedia mappings can therefore never create a broken local-file reference; the bundled fallback remains authoritative for offline availability.
- Greek prose and prayer grammar are normalized separately. Ordinary roles/descriptions stay nominative, while prayer invocations may use vocative forms.
- Gospel/reference names were tightened to natural Greek forms (for example, `Ευαγγέλιο κατά Μάρκον`) instead of mixed-language legacy text.
- Verified-image attribution text is normalized consistently in Greek while preserving the mapped source URL and license.
- Saint Olga of Kwethluk was corrected to the OCA annual commemoration of **27 October**, with direct official OCA source links and a more precise distinction between the 2023 synodal decision and the June 2025 public glorification.
- Evidence labels remain explicit (`source-expanded`, `source-linked`, `scripture-grounded`, or `catalog-summary`) so sparse, traditional, or disputed material is not presented with false certainty.

## Release validation

Run from the repository root:

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
