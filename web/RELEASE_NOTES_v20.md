# Release Notes v20

## Main UI change

This release replaces the laggier interactive globe with a **simple scrollable saints catalog**.

### New layout

- **Cloud background** retained.
- Saints / persons / beings now appear as **cards**.
- Each card shows:
  - the **icon/image on top**
  - the **name below**
  - a visible **border** around the card
- **Phone layout:** 3 cards per row.
- **PC / larger screens:** as many cards per row as the screen can fit.
- Navigation is now **vertical scrolling only**.
- There are **no draggable / moving bubbles**.

## Performance improvements

- Removed the 3D globe rendering and bubble web drawing.
- Removed pan / drag / zoom interaction from the main catalog page.
- The catalog now renders as a lightweight responsive grid.
- Startup only prepares the catalog and first visible icons instead of blocking on the heavier globe logic.
- Card images use native lazy loading.

## Content / modal behavior

- Clicking a card still opens the full detail modal.
- Description / Story / Prayer remain intact.
- Search and language switching remain intact.
- Image coverage remains intact.

## Integrity

- Runtime catalog entries: 1083
- Local images present: 1083 / 1083
- Detail files present: 1083 / 1083

