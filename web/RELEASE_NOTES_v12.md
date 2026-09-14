# v12 — Raster Web Performance Pass

This release changes the visual web from many moving DOM image/button elements to a single pre-rendered canvas.

- The startup language picker remains first.
- The startup preparation phase is capped at 30 seconds and rasterizes all 1,083 bubble shells, web threads, and as many bubble images as possible before the cap.
- The web is substantially more compact than v11.
- Pan and pinch/wheel zoom move only one composited scene transform.
- Bubble names are screen-space labels refreshed after movement stops instead of moving DOM nodes.
- Bubble taps use coordinate hit-testing against the fixed catalog layout.
- Search keeps every bubble in the same web and marks the first match without rebuilding the web.
- Per-entry details still load only when that bubble is opened and are removed from the app's detail store when the modal closes.
- The cloud background is static CSS and does not animate.
