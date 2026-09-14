# Orthodox Web front end — v15

This directory contains the bilingual English/Greek Orthodox Web front end that lives beside the existing Praying Project prayer automation. The original Befunge prayer payloads, country scheduler, manifest and prayer scripts are intentionally independent from the website.

## Catalog and language coverage

The local catalog contains **1,083 searchable records** spanning Christ and the Holy Spirit, the Theotokos, angels and heavenly powers, forefathers, Old Testament righteous, prophets, apostles, New Testament saints, post-biblical Church saints, feasts/synaxes, and a broad `biblical-context` layer for additional biblical/deuterocanonical people, rulers, opponents, peoples, creatures and visionary/symbolic beings.

`biblical-context` does **not** mean saint. Context-only records are marked as such and the site never addresses a prayer to them.

Every one of the 1,083 records has English **and** Greek **Description**, **Story**, and **Prayer** content, plus name, role/title, feast or context information, notes, and a structured knowledge dossier. These three reader-facing fields are mandatory: the runtime build/validation fails if any language is missing one of them. The dossier generator preserves the distinction between Scripture, Church tradition and later historical material. When only a name, genealogy, brief event or symbolic description survives, it says so rather than inventing a missing life story.

The release contains **67 hand-curated deep-profile records**, while every record also receives an explicit evidence-status audit for central people and feasts. All remaining records receive a structured bilingual dossier assembled from their own stored facts and source/reference metadata; generic filler is not used to pretend that unknown biographical events are known.

## Search-only web interface

The public face intentionally stays simple: one centered search bar above a large irregular spider-web/constellation. The Orthodox Cross and Holy Trinity form the visual center. Person/being/feast nodes show their name directly beneath the image.

Interaction:

- one-finger or mouse drag pans the whole web;
- two-finger pinch zooms on phones/tablets;
- mouse wheel/trackpad zooms on desktop;
- double-tap/double-click performs quick zoom;
- `+`, `=` and `-` also zoom on keyboards;
- a short tap/click opens the selected record;
- dragging suppresses the accidental click that would otherwise open a record.

All **1,083 records have permanent positions in one continuous web**. At overview zoom every record is still drawn as a lightweight SVG bubble/ring, so there is no pagination, page switching, or hidden catalog slice. As you move or zoom closer, the nearby records become their full clickable image-and-name bubbles. Only those heavier image DOM elements are spatially virtualized; the complete web itself remains visible. Only one composited `.scene` element is transformed while panning/zooming. The site does not run a WebGL renderer, physics engine, or continuous per-bubble animation, which keeps the very large web usable on modest phones.

## Local `file://` and repository hosting

The catalog, scripts, styles and fallback images are all repository-relative files. No package manager, API, database, CDN, web font, `fetch()`, service worker or ES-module loader is needed for the application itself.

You can unzip the repository and open the root `index.html` directly, or serve exactly the same directory from GitHub Pages or another static host. `.nojekyll` is included and `404.html` mirrors the static application shell.

The source-based text and UI therefore remain fully available with no network connection. Real-icon downloads are an **optional media enhancement**, described below.

## Real iconography and offline fallback

`data/image-sources.json` contains **52 verified Wikimedia Commons icon/image mappings** with source pages, licenses/attribution and local cache destinations. Important central/featured people and major feasts preferentially use these real iconographic images when available.

Because a source image is a separate binary asset, the repository also keeps one local lightweight fallback image for every one of the 1,083 records. The validation suite checks that all 1,083 fallback files exist and contain valid SVG structure. The runtime builder publishes a local verified-image path only when that binary actually exists, so a missing optional cache file cannot create a broken local image reference.

To cache all currently verified real images into `web/images/real/` on a normal internet-connected machine, run from the repository root:

```bash
python web/tools/download_real_icons.py
```

Once cached, those real images are also available during completely offline `file://` use. The exact image source and license list is in `IMAGE_SOURCES.md`.

For people or beings for whom no responsibly reusable historical/iconographic image has yet been mapped, the site deliberately uses the local symbolic fallback rather than falsely presenting generated artwork as an authentic icon.

## Detailed information model

Every details window opens with the same three easy-to-read tabs in both languages:

- **Description / Περιγραφή** — a concise identity-and-context summary.
- **Story / Ιστορία** — the fuller life/narrative, evidence, feast/context, tradition, notes, and source material.
- **Prayer / Προσευχή** — a prayer for venerated figures, or a prayer addressed to God rather than to a non-venerated/context-only figure.

The Story view can also include relevant biblical/documentary evidence, Orthodox reception and tradition, theological/liturgical context, English and Greek names/aliases, source/reference links, and an explicit statement about the limits of surviving evidence.

The application does not manufacture a “complete biography” for a person whose complete life is not historically preserved. In those cases, “complete” means all information currently stored and sourced by this catalog, together with a clear statement of what is unknown.

## Main files

- `assets/css/styles.css` — responsive full-screen web, labels and details window.
- `assets/js/app.js` — bilingual search, camera pan/zoom, image fallback chain and record viewer.
- `data/*.js` — catalog layers.
- `data/deep-profiles.js`, `data/deep-profiles-2.js`, and `data/deep-profiles-3.js` — hand-curated bilingual dossiers.
- `data/profile-enricher.js` — structured bilingual dossiers for the rest of the catalog.
- `data/image-sources.json` / `data/media-manifest.js` — verified image source and runtime mapping data.
- `images/people/` — always-local lightweight fallback media.
- `images/real/` — optional cached real icon/image binaries.
- `tools/download_real_icons.py` — cache verified real images.
- `tools/validate_catalog.py` — catalog, translation and local-fallback validation.
- `tools/validate_profiles.js` — bilingual dossier coverage validation.
- `tools/check_static_site.py` — local/static/GitHub-host compatibility audit.
- `IMAGE_SOURCES.md` — media source/license index.
- `SOURCES.md` — content/source policy notes.

## Validation

Run after editing:

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

## v10 strict per-entry performance loading

The browser loads only `web/data/runtime-index.js` at startup. It contains the lightweight bubble/search index (names, roles, aliases, image pointers and one detail filename per entry), not the long biographies, prayers, notes or source dossiers.

Every catalog record has its own independent static JavaScript file under `web/data/details/` (`entry-0000.js`, `entry-0001.js`, and so on). Tapping a bubble loads only that one record. No neighboring saint/person/being details are loaded with it. When the details window closes, the app removes the script element, deletes that record from `window.ORTHODOX_ENTRY_DETAILS`, clears the modal content, and drops the active detail reference so it can be garbage-collected. Reopening the same bubble loads that one file again.

This remains compatible with `file://`, local static servers, and repository hosting because it uses relative classic `<script>` files rather than `fetch()`. Browser-level HTTP/file caching may keep the resource bytes available, but the biography object is not retained by the application after close.

The startup screen is now a real completeness gate rather than a fixed delay. After language selection it computes the complete 1,083-node web, draws the cloud/web canvas, then loads and decodes every local entry image before the web can open. There is no global startup deadline. Biography/detail files are still excluded from startup and remain strict per-entry lazy files.

After editing source catalog/profile files, regenerate and validate the browser runtime with:

```bash
node web/tools/build_lazy_runtime.js && node web/tools/validate_lazy_runtime.js
```

## v11 startup and performance
The initial overlay asks for English or Greek before loading the lightweight runtime index. After selection, startup preparation precomputes the entire web and preloads every bundled local icon; the old 30-second global cutoff no longer applies in v15. This does **not** preload biographies or prayers; those remain strict per-icon lazy files and are removed from the application state when closed. The web world is intentionally denser than v10 and node-mount virtualization is throttled during camera movement to reduce mobile lag.

## v12 performance architecture

The visible web is rasterized into a single fixed-size canvas during startup. The catalog's 1,083 bubble positions are permanent. Pan and zoom transform the scene as one composited layer rather than moving hundreds of individual image elements. Screen-space labels are refreshed only after movement pauses. Detail records remain strict per-entry lazy files under `web/data/details/` and are unloaded when their modal closes.

## v14 complete icon preload and evidence audit

The loader has no global time limit. It paints the one-file atlas first, then decodes and paints all 1,083 individual local SVG artworks before opening the web. Verified real-image mappings are then attempted. Source image objects are released after painting to keep the final canvas interaction light.

All local artwork was regenerated so context-only/non-venerated figures are halo-free, while venerated figures, angels, Christ/Holy Spirit, the Theotokos and feasts use distinct symbolic treatments. The local artwork is illustrative; it is never described as an authentic historical likeness unless an individually verified external mapping exists.

Every detail record now exposes an evidence-status label and the validators reject missing bilingual fields, untranslated common Greek-mode reference terms, generic slash-gender placeholders, missing local icons and intercessory prayers attached to non-venerated records. See `CONTENT_ACCURACY.md` and `RELEASE_NOTES_v14.md`.

## v15 Description / Story / Prayer integrity pass

Every one of the 1,083 detail files now carries explicit bilingual `description`, `story`, and `prayer` fields, and the modal exposes those exact three reader-facing tabs. The lazy-runtime validator and content-quality audit reject a build if any one of those fields is empty in English or Greek.

The Greek normalizer was tightened so Gospel/reference names are rendered as natural Greek (for example, `Ευαγγέλιο κατά Μάρκον`) without applying prayer-vocative grammar to ordinary titles or descriptions. Verified-image credits are normalized consistently while retaining the exact mapped source URL and license.

The image pipeline now checks the existence of local verified-image binaries before publishing their paths; all 1,083 bundled local fallback SVGs remain mandatory and structurally validated. A source-sensitive factual review also corrected Saint Olga of Kwethluk's OCA commemoration to **27 October** and records the official OCA source directly. See `RELEASE_NOTES_v15.md` and `CONTENT_ACCURACY.md`.
