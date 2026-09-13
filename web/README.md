# Orthodox Web front end

This folder contains the bilingual, processor-light web front end added alongside the existing Praying Project. The original prayer automation, Befunge payloads, country data, manifest, scripts, and GitHub workflows remain separate from the website.

## Current catalog

The catalog now contains **909 searchable entries**. This is intentionally broader than a saint list: it combines Christ and the Holy Spirit, the Theotokos, angels and heavenly powers, forefathers, Old Testament righteous, prophets, apostles, New Testament saints, post-biblical Church saints, feasts/synaxes, and a large **biblical-context** collection for additional people, peoples, rulers, opponents, parable figures, and visionary/symbolic beings.

Current category totals are generated in `data/catalog-stats.json`.

The expansion includes the Orthodox Synaxis list of the Seventy Apostles, the nine traditional ranks of bodiless powers, many ancestors and lesser-known names from Scripture, figures from the deuterocanonical books used in Orthodox Bibles, a broader set of ancient/Byzantine/Slavic/Greek/Western pre-schism/modern saints, North American saints, Great Lent and Paschal-cycle commemorations, synaxes, and Revelation/Daniel visionary figures clearly marked as biblical context where they are not saints.

**909 entries does not mean 909 canonized saints.** The UI deliberately separates venerated people from biblical-context records. Context entries never address a prayer to the person or symbol; their prayer panel addresses God for discernment.

## Files

- `assets/css/styles.css` — bright responsive UI and light CSS 3D.
- `assets/js/app.js` — bilingual pre-indexed search/filtering, paginated constellation, drag, random explorer, modal, and optional pointer tilt.
- `data/entries.js` — original 131-entry base web catalog.
- `data/expanded-biblical.js` — additional biblical saints, ancestors, angels, and the Seventy Apostles.
- `data/church-saints.js` — first post-biblical Orthodox saint expansion.
- `data/feasts.js` — first feast/liturgical expansion.
- `data/biblical-context.js` — first contextual biblical layer.
- `data/further-expansion.js` — large second expansion: saints, righteous figures, feasts, and many more biblical names.
- `data/deep-biblical.js` — deeper biblical genealogy, Table of Nations, minor named figures, visionary beings/symbols, and additional saints.
- `data/catalog.js` — merges every runtime dataset.
- `data/catalog-stats.json` — generated count report.
- `images/people/` — one local lightweight SVG medallion for every catalog entry.
- `tools/build_catalog.py` — regenerates the first expansion datasets and generated medallions.
- `tools/add_more_catalog.py` — generates the second large additive expansion.
- `tools/add_deep_biblical.py` — generates the deeper biblical/additional-saints layer.
- `tools/validate_catalog.py` — validates unique IDs, bilingual fields, categories, and image paths across all datasets.
- `SOURCES.md` — source/reference and content-policy notes.

## Performance

The entire 909-entry catalog is searchable, but only one constellation page is mounted at once: 42 nodes on ordinary desktop devices, 32 on lower-memory devices when browser memory information is available, and 26 on small screens. The 3D effect uses CSS transforms only—no WebGL, no physics engine, and no continuous animation loop. Pointer tilt is `requestAnimationFrame`-throttled and ignored on coarse-pointer devices. Drag-line and resize redraws are also frame-throttled.

Search text is normalized **once at startup** into a small in-memory index rather than rebuilding/normalizing all 909 records on every keystroke. `prefers-reduced-motion` is respected, and 3D can be disabled manually.

## Search and navigation

The search bar stays at the top-center on desktop and searches English and Greek names, roles, stories, feast text, Scripture references, aliases, and extra keywords. Press `/` to focus it and `Enter` to open the first matching entry.

`Random / Τυχαίο` opens a random result from the currently active category/search result set, which makes the large catalog easier to explore without mounting more bubbles.

## Validate after editing

```bash
python web/tools/validate_catalog.py
```

The additive data generators are intentionally separated so future work can extend the catalog without hand-editing the large generated JavaScript arrays.

## Images

The local images are deliberately small original **illustrative medallions**, not canonical liturgical icons. This keeps the repository self-contained and avoids silently copying copyrighted icon photography. Properly licensed icon files can be substituted later entry-by-entry without changing the catalog schema.
