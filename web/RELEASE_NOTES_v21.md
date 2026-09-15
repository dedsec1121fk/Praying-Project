# Release Notes v21

## Repository-contained images

The catalog no longer relies on remote image URLs for normal card or modal display.

### Changes

- Moved all **1,083 dedicated entry images** into the repository folder:
  - `web/images/catalog/`
- Updated all catalog/data generators and source files to reference that repository folder.
- Runtime entries now publish **0 remote image URLs** for display.
- Cards and detail modals load their normal images from repository paths only.
- Wikimedia/source metadata can still remain in the project for attribution and research, but it is no longer required to render the catalog images.
- The v20 cloud-background responsive grid remains unchanged:
  - 3 cards per row on phone
  - responsive multi-column layout on larger screens
  - vertical scrolling only

## Integrity

- Runtime entries: 1083
- Repository image files: 1083
- Missing runtime image files: 0
- Remote runtime display URLs: 0
- Detail files: 1083
