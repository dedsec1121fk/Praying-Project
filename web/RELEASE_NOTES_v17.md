# Release Notes v17

## Main additions

- Added a **small saint-image expansion pack** so more entries now open with actual icon artwork instead of only the plain local SVG illustration.
- Added packaged local icon images for these entries:
  - Saint Porphyrios of Kavsokalyvia
  - Patriarch Isaac
  - Righteous Joseph the Patriarch
  - Apostle Philip
  - Apostle Bartholomew
- These new images are **local-packaged** in `web/images/real/` so they show immediately without depending on a remote fetch.
- Existing globe / sphere network layout from v16 is kept.

## Technical changes

- `web/data/image-sources.json` expanded from **52** to **57** real-image mappings.
- `web/data/media-manifest.js` updated so mappings can be either:
  - full verified source mappings, or
  - local-only packaged icon images.
- `web/tools/download_real_icons.py` now safely skips local-only packaged images instead of failing.

## Current integrity

- Runtime catalog entries: 1083
- Bundled local entry images present: 1083 / 1083
- Real-image mappings present: 57
- Lazy detail files present: 1083 / 1083

