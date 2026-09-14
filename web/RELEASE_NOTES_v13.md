# v13 — Cloud background + guaranteed bubble images

- The cloud/sky environment is now painted directly into the rasterized web canvas and also applied to the network element, so it cannot disappear behind the canvas stack.
- Every one of the 1,083 entries gets a visible local image immediately from `web/images/fallback-atlas.webp`.
- The fallback atlas is a single ~700 KB WebP built from all 1,083 bundled local entry artworks, replacing more than one thousand startup image requests.
- Verified real iconographic mappings still upgrade their corresponding bubbles when available online; a failed remote image never leaves a bubble blank.
- Per-entry biography/detail lazy loading and unload-on-close behavior remains unchanged.
- Pan/zoom still moves one raster layer only.
