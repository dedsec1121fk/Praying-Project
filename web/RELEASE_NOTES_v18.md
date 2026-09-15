# Release Notes v18

## Full-catalog image pass

This release applies the image overhaul to **the entire catalog**, not only a small subset.

### What changed

- Regenerated **all 1,083 local entry images** with richer offline artwork.
- Every entry keeps its own dedicated local SVG image in `web/images/catalog/`.
- Local illustrative icons are now more individualized by:
  - category
  - role keywords
  - saint / figure type
  - deterministic per-entry visual variation
- Existing packaged real-image coverage is preserved.
- The app now prefers `imageLocalReal` first when available, then falls back to the regenerated local image, so modal/detail views show the best available image more consistently.

### Result

- Catalog entries: **1083**
- Bundled local images present: **1083 / 1083**
- Lazy detail files present: **1083 / 1083**
- Real-image mappings present: **57**
- Fallback atlas regenerated for fast startup rendering.

### Notes

These generated local images remain **illustrative offline artwork**, not claims of exact historical likeness. They exist to guarantee that every saint / being / feast / context entry has a visible, dedicated image even when no curated real icon file is bundled.

