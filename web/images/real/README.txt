Optional offline cache for verified iconographic/historical images.

Every one of the 1,083 catalog records already has a dedicated bundled local
SVG illustration under web/images/people/, so this directory may contain no
cached binaries and the application still works offline.

The v19 source inventory contains 62 individually mapped Wikimedia Commons
files. A mapping is treated as verified only when it records a concrete Commons
File page, license/reuse label, credit, and remote image URL.

The runtime builder publishes imageLocalReal only if the cache binary actually
exists. Missing optional cache files therefore cannot become broken local image
references. Remote verified images upgrade the already-loaded local artwork in
the background and do not block application startup.

To populate this cache while online, run from the repository root:

    python web/tools/download_real_icons.py

See web/IMAGE_SOURCES.md and web/data/image-sources.json for the exact source
and license inventory. Do not add a file as verified merely because it visually
resembles the named person; identity and reuse terms must be checked first.
