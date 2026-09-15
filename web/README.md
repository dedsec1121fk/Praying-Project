# Orthodox Web front end — v19

This directory contains the bilingual English/Greek Orthodox Web front end that lives beside the existing Praying Project prayer automation. The Befunge prayer payloads, country scheduler, manifest, and prayer scripts remain independent from the website.

## Catalog coverage

The local catalog contains **1,083 searchable records** covering Christ and the Holy Spirit, the Theotokos, angels and heavenly powers, forefathers, Old Testament righteous, prophets, apostles, New Testament saints, post-biblical Church saints, feasts/synaxes, and a broad `biblical-context` layer.

`biblical-context` does **not** mean saint. Context-only records are marked non-venerated, and their Prayer tab addresses God rather than the context figure.

Every record has bilingual English/Greek **Description**, **Story**, and **Prayer** fields. The build and validation suite rejects a record if one of these core fields is absent. The longer Story dossier distinguishes Scripture, Church tradition, later historical material, and uncertainty instead of inventing a complete biography where the sources do not preserve one.

## Sphere / globe interface

The catalog is presented as a rotatable **round sphere** with web-like connections between visible bubbles. The Holy Trinity remains at the visual center of the interface.

Interaction:

- drag with a mouse or one finger to rotate the sphere;
- pinch, mouse wheel, double-click/double-tap, or `+` / `-` to zoom;
- tap/click a bubble to open its record;
- search and press Enter to rotate the requested entry toward the viewer and open it;
- press `0` to return to the default globe view.

A phone-sized sphere cannot physically display all 1,083 image bubbles at once without overlap. v19 therefore uses **level-of-detail (LOD)**: important/search/active bubbles are retained, a stable non-overlapping subset is shown at distant zoom levels, and more entries are progressively revealed as the user zooms in. Visible bubbles are relaxed through a spatial-hash collision solver, kept inside the sphere, and kept out of the central Trinity overlay. This preserves readability instead of pretending every bubble can fit simultaneously at every zoom.

`web/tools/validate_globe_layout.js` tests the layout across desktop/tablet/mobile viewports, multiple rotations, and multiple zoom levels.

## Images and provenance

Every one of the **1,083 records has its own bundled local SVG illustration** in `web/images/catalog/`. The v19 audit verifies that all 1,083 files exist and that all 1,083 SVG byte hashes are distinct.

These local SVGs are intentionally labeled as **illustrative artwork**, not as historical likenesses or canonical icon reproductions. Their category/role-aware styling gives Christ, the Theotokos, angels, prophets, apostles, monastics, bishops, warriors, feasts, and non-venerated context records different visual treatments.

Separately, `data/image-sources.json` contains **62 verified Wikimedia Commons mappings** with a specific Commons file page, reuse/license information, English credit, and remote image URL. Verified imagery is an optional enhancement, not a requirement for the application to work.

The browser opens as soon as all bundled local images are ready. Verified remote images then upgrade bubbles in the background when available, so a slow or unavailable remote host cannot trap the startup screen. The detail window only displays a Wikimedia source credit when verified imagery is actually being shown; otherwise it explicitly labels the displayed artwork as local illustration.

To cache the verified Commons mappings for offline use on an internet-connected machine:

```bash
python web/tools/download_real_icons.py
```

The exact verified source/license inventory is in `IMAGE_SOURCES.md`. `images/real/` may legitimately contain no cached binaries in the distributed ZIP; the application still has complete local image coverage.

## Detail viewer

Every record opens with exactly three reader-facing tabs:

- **Description / Περιγραφή** — concise identity and context.
- **Story / Ιστορία** — fuller narrative, evidence layers, commemoration/context, notes, and sources.
- **Prayer / Προσευχή** — prayer for a venerated figure, or a God-directed prayer for a non-venerated context entry.

v19 also normalizes several recurring Greek grammar/reference problems, including legacy slash-gender placeholders, common Gospel reference forms, collective angelic invocations, and frequently generated vocative endings.

## Static/offline architecture

The application uses repository-relative classic scripts, styles, data, and images. No package manager, database, CDN, web font, service worker, `fetch()`, or ES-module loader is required for the core UI. It can run from `file://` or a static host such as GitHub Pages.

`web/data/runtime-index.js` is the lightweight startup/search index. Each record's longer content lives in its own `web/data/details/entry-XXXX.js` file and is loaded only when that record is opened. Closing the modal removes the active detail object from application state.

## Main files

- `assets/js/app.js` — sphere projection, rotation/zoom, LOD/collision handling, image loading, bilingual search, and detail viewer.
- `assets/css/styles.css` — full-screen globe/search/modal styling.
- `data/runtime-index.js` — lightweight 1,083-entry browser index.
- `data/details/` — 1,083 independent lazy detail records.
- `data/profile-enricher.js` — structured bilingual dossier and language normalization logic.
- `data/image-sources.json` / `data/media-manifest.js` — canonical verified image mappings and runtime media mapping.
- `images/people/` — 1,083 dedicated bundled illustrations.
- `images/real/` — optional local cache for verified real/iconographic media.
- `tools/generate_local_icons.py` — regenerates the 1,083 dedicated local illustrations and fallback atlas.
- `tools/validate_globe_layout.js` — multi-viewport sphere overlap/LOD validation.
- `CONTENT_ACCURACY.md` — evidence and accuracy policy.
- `IMAGE_SOURCES.md` — verified media source/license index.

## Release validation

Run from the repository root after source edits:

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

The release process also re-extracts the final ZIP and repeats the validators against the packaged copy.
