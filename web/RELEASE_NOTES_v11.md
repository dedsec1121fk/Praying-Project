# v11 — language-first compact preload web

- The first screen now asks the user to choose **English** or **Ελληνικά** before the catalog runtime is loaded.
- The existing EN / ΕΛ switch remains in the search bar after startup.
- Startup preparation is capped at 30 seconds from the language choice. It can finish earlier.
- During startup the app computes the complete 1,083-entry layout, draws the web, forces the cloud scene through layout/paint, and preloads all bundled bubble image assets plus available real-icon assets. Full biographies/prayers remain per-icon lazy and are not preloaded.
- The virtual world and node spacing were reduced substantially so nearby icons are closer together and less panning is required.
- Bubble/image/label dimensions and shadows were reduced to lower rendering cost.
- SVG web connections were reduced while preserving an irregular web appearance.
- Visibility virtualization is no longer recalculated on every pointer-move frame; the scene transform updates immediately and node mounting refreshes after a short idle delay / gesture completion.
- Per-entry detail behavior from v10 is unchanged: one record loads only when tapped and is removed from application memory when its dialog closes.
