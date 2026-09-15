# Release Notes v19 — Deep audit and globe readability

## Scope

v19 is a full-project quality pass over the 1,083-entry bilingual catalog rather than a small content patch.

## Images

- 1,083 / 1,083 records have dedicated bundled local SVG artwork.
- The 1,083 local SVG files have 1,083 distinct SHA-256 byte hashes.
- Verified Commons mappings increased to 62.
- Five earlier local-only binaries that lacked complete provenance were removed from verified status.
- Ten source-checked Commons mappings were added for Apostle Philip, Apostle Bartholomew, Gregory of Nyssa, Catherine, Jude Thaddeus, Barbara, Marina, Panteleimon, Anthony the Great, and Paraskevi.
- Modal credits now describe the image actually shown: verified source information appears only when verified media is displayed; otherwise the UI explicitly identifies local illustrative artwork.
- Verified remote upgrades happen after local startup so a slow network cannot hold the application on the loading screen.

## Globe / bubble layout

- Added level-of-detail so distant/mobile views show a readable subset instead of stacking hundreds of bubbles on top of one another.
- Search, active, and featured nodes are protected in LOD selection.
- More bubbles are progressively revealed as zoom increases.
- Added spatial-hash collision relaxation, sphere-boundary clamping, a Trinity-center exclusion area, and final residual-overlap shrinking.
- Added `web/tools/validate_globe_layout.js` for repeatable mobile/tablet/desktop overlap tests.

## Greek and content integrity

- Removed recurring generated slash-gender placeholders.
- Improved common vocative endings and collective angelic prayers.
- Corrected recurring Gospel/reference constructions and several mixed-language place/reference fragments.
- Core bilingual Description / Story / Prayer requirements remain enforced for all 1,083 records.

## Static architecture

The project remains a static/offline-friendly site. All 1,083 local illustrations and all text are bundled; verified remote imagery is optional. Long details remain strict one-file-per-entry lazy records.
