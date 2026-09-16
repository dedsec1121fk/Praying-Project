# Orthodox saints and Scripture catalog front end

This directory contains the bilingual English/Greek static catalog used by the Praying Project website.

## Catalog coverage

The current built catalog contains **1,186 searchable records**. It covers Christ and the Holy Spirit, the Theotokos, angels and heavenly powers, forefathers, Old Testament righteous, prophets, apostles, New Testament saints, Church saints, feasts/synaxes, a broad biblical-context layer, plus dedicated **Psalms, parables, and Scripture stories**.

Every record has bilingual **Description**, **Story**, and **Prayer** content. Context-only records are not presented as saints and their prayers are directed to God rather than to the context figure. Search indexing also includes roles, aliases, feast/scripture data, metadata, patronage/associations, story text, and knowledge-section headings.

## Interface

The main page is a lightweight vertically scrolling card grid on a static cloud background.

- Phones use **3 cards per row**.
- Larger screens automatically fit as many cards per row as practical.
- Each card has an image above the name and a visible border.
- Navigation is vertical only; there is no draggable bubble map, globe, or horizontal navigation.
- A right-side scroll guide displays scroll percentage and can be dragged or tapped to move through the catalog quickly.
- Search and English/Greek switching remain available at the top.
- Selecting a card opens the Description / Story / Prayer detail viewer and displays searchable metadata when available.

## Repository images

Every entry has a repository fallback illustration in `images/catalog/`, so there is always a local image file.

Verified reusable iconography is mapped in `data/image-sources.json`. `tools/prepare_repository_images.py` downloads only the manually reviewed Commons whitelist. Automatic image discovery is disabled: ambiguous identities are never guessed, and a dedicated repository illustration is used whenever a reviewed real/iconographic source is unavailable. Approved files are stored under `images/real/`, after which the runtime and offline manifest are rebuilt. The deployed browser UI uses repository-hosted files rather than Wikimedia URLs at page-view time.

Psalms, parables, and Scripture-story cards intentionally use their dedicated bundled artwork rather than attempting to match them to an unrelated web image.

## Browser offline installation

The download button in the top search bar installs the complete deployed site into browser Cache Storage. The cache manifest includes the startup shell, all lazy detail bundles, catalog data, CSS/JavaScript, and repository images. A service worker then serves cached same-origin files when the network is unavailable.

The browser must serve the site from **HTTPS** (or localhost) for service workers and Cache Storage. The installer requests persistent storage when supported, but browsers retain final control over storage quotas and eviction.

Files involved:

- `service-worker.js` — same-origin cache-first service worker.
- `web-app.webmanifest` — installable web-app metadata.
- `data/offline-files.json` — generated list of files for complete offline installation.
- `tools/build_offline_manifest.py` — regenerates the list after content/image changes.

## Main files

- `assets/js/app.js` — responsive catalog, rich search, metadata display, scroll guide, offline installer, language switch, and detail viewer.
- `assets/css/styles.css` — cloud background, card grid, scroll guide, offline UI, and modal styling.
- `data/runtime-index.js` — lightweight startup/search index.
- `data/detail-bundles/` — compact JSON bundles (up to 12 records each) warmed after startup; only the tapped record is parsed into active page memory.
- `data/v24-expansion.js` — additional lesser-known saints/beings, Psalms, parables, and Scripture stories.
- `data/image-sources.json` / `data/media-manifest.js` — verified image source mappings.
- `images/catalog/` — dedicated repository fallback images for every record.
- `images/real/` — downloaded repository-hosted, manually reviewed images when available.
- `tools/prepare_repository_images.py` — downloads only the reviewed image whitelist, rebuilds the bundled runtime, validates it, and refreshes the offline manifest.

## Validation

Run from the repository root:

```bash
node web/tools/build_lazy_runtime.js
python web/tools/generate_local_icons.py
python web/tools/build_offline_manifest.py
python web/tools/validate_catalog.py
node web/tools/validate_profiles.js
node web/tools/validate_lazy_runtime.js
node web/tools/audit_content_quality.js
python web/tools/check_static_site.py
python web/tools/audit_image_identity.py
python web/tools/audit_bilingual_v29.py
python web/tools/validate_lazy_startup.py
node --check web/assets/js/app.js
node --check web/assets/js/bootstrap.js
node --check service-worker.js
```

## Startup loading

After language selection, the startup screen shows only a percentage and progress bar. Startup prepares the lightweight catalog shell: **names/cards plus the 1,186 card images**. Long-form stories, prayers, parables, Psalms, biographies, sources, and metadata dossiers do **not** delay entry.

Once the catalog is visible, small detail bundles near the current scroll position are warmed as raw Cache Storage bytes. Opening a card parses only that record; closing the card releases the parsed dossier from active page memory. The remaining bundles can warm later at low concurrency, while the explicit offline-download button is still the only action that intentionally installs the complete site for offline use.
