Verified icon image cache.

Run:
  python web/tools/prepare_repository_images.py

The script downloads reusable images listed in web/data/image-sources.json into
this folder, rebuilds runtime-index.js, and validates that the published runtime
points only to files that actually exist in the repository.

Afterwards, commit/push web/images/real/ together with the rebuilt runtime files.
