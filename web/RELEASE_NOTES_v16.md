# Release Notes v16

## Main changes

- Reworked the main visual network from a flat free-pan layout into a **round globe / sphere** presentation.
- Added **web-like connecting threads** across the sphere.
- Added **best-effort bubble collision reduction** so visible bubbles are less likely to cover one another.
- Changed bubble image preference so the app now **shows the bundled local image first** for every entry, then upgrades to verified real imagery when available.
- This guarantees that the app always starts with a present local image for every catalog entry whose bundled SVG exists.
- Search now rotates the globe to bring the selected entry forward before opening it.

## Data / asset integrity

- Runtime catalog entries: 1083
- Local entry image paths present: 1083 / 1083
- Lazy detail files present: 1083 / 1083

