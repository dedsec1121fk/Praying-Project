# Orthodox saints catalog front end

This directory contains the bilingual English/Greek static catalog used by the Praying Project website.

## Catalog coverage

The catalog contains **1,083 searchable records** covering Christ and the Holy Spirit, the Theotokos, angels and heavenly powers, forefathers, Old Testament righteous, prophets, apostles, New Testament saints, Church saints, feasts/synaxes, and a broad `biblical-context` layer.

Every record has bilingual **Description**, **Story**, and **Prayer** content. Context-only records are not presented as saints and their prayers are directed to God rather than to the context figure.

## Interface

The main page is a lightweight vertically scrolling card grid on a static cloud background.

- Phones use **3 cards per row**.
- Larger screens automatically fit as many cards per row as practical.
- Each card has an image above the name and a visible border.
- There is no draggable bubble map, globe, canvas animation, or horizontal navigation.
- Search and English/Greek switching remain available at the top.
- Selecting a card opens the Description / Story / Prayer detail viewer.

## Repository images

Every entry has a repository fallback illustration in `images/catalog/`, so there is always a local image file.

Verified reusable iconography is mapped in `data/image-sources.json`. To place those image binaries inside the repository, run this from the repository root while online:

```bash
python web/tools/prepare_repository_images.py
```

That command downloads verified images into `web/images/real/`, rebuilds `data/runtime-index.js`, and validates the lazy runtime. The browser prefers an existing `web/images/real/...` file and falls back to `web/images/catalog/...` only when no verified local file exists.

After running the preparation script, commit both `web/images/real/` and the rebuilt runtime files. The deployed site then displays repository-hosted images rather than depending on Wikimedia at page-view time.

`IMAGE_SOURCES.md` contains the source and reuse information for mapped verified imagery.

## Static architecture

The site uses repository-relative JavaScript, CSS, data, and image paths. No database, package manager, CDN, service worker, or remote image host is required at page-view time after the repository image preparation step has been committed.

Main files:

- `assets/js/app.js` — responsive catalog, search, language switch, and detail viewer.
- `assets/css/styles.css` — cloud background, card grid, and modal styling.
- `data/runtime-index.js` — lightweight startup/search index.
- `data/details/` — one lazy detail file per record.
- `data/image-sources.json` / `data/media-manifest.js` — verified image source mappings.
- `images/catalog/` — dedicated repository fallback images.
- `images/real/` — downloaded verified repository-hosted icon files.
- `tools/download_real_icons.py` — downloads verified mapped images.
- `tools/prepare_repository_images.py` — downloads images, rebuilds runtime, and validates it.

## Validation

Run from the repository root:

```bash
node web/tools/build_lazy_runtime.js
python web/tools/validate_catalog.py
node web/tools/validate_profiles.js
node web/tools/validate_lazy_runtime.js
node web/tools/audit_content_quality.js
python web/tools/check_static_site.py
node --check web/assets/js/app.js
node --check web/assets/js/bootstrap.js
```
