Optional offline cache for verified real iconographic images.

The application always has a bundled local fallback image for every catalog
record, so this directory may contain no cached image binaries and the site
still works from file:// with no network connection.

The v15 runtime builder publishes an imageLocalReal path only when the matching
binary actually exists. A missing optional cache file therefore cannot become
a broken local image reference.

To cache the 52 currently verified Wikimedia Commons images here, run from the
repository root while internet access is available:

    python web/tools/download_real_icons.py

Image source pages and licenses are recorded in web/IMAGE_SOURCES.md and
web/data/image-sources.json. Do not add an image as an authentic icon/portrait
unless its identity and redistribution terms have been checked.
