# v14 — Complete icon preload + evidence audit

- Startup no longer has a 30-second global cutoff. After language selection, the web stays on the loading screen until every one of the **1,083 local entry images** has been loaded/decoded and painted into the web canvas.
- The single fallback atlas is painted first, so the progress screen itself can never leave a bubble blank. Every individual local SVG is then decoded and repainted before the web opens.
- Verified real-image mappings are attempted after local coverage. Each remote request has a per-request safety bound so a dead external host cannot trap startup forever; there is **no overall startup deadline**.
- Decoded source images are released after being painted into the canvas to reduce post-startup memory pressure. Concurrency is intentionally low on phones because startup speed is less important than smooth interaction after loading.
- All **1,083 local illustrations were regenerated**. Venerated figures use halo-style symbolic artwork; context-only/non-venerated records do not receive saint halos. Christ, the Holy Spirit, the Theotokos, angels and feasts have distinct treatments.
- The strict per-entry detail model remains unchanged: biography/prayer/source data for an entry is loaded only after that bubble is tapped and removed from application state after the modal closes.
- Every detail record now carries an evidence-status label (`source-expanded`, `source-linked`, `scripture-grounded`, or `catalog-summary`) so limited/disputed evidence is not presented with the same certainty as a well-sourced record.
- Greek generated text is scrubbed of legacy `Ο/Η`, `του/της`, and `Άγιε/Αγία` placeholders, and validation now fails if those placeholders return.
- The validation suite rejects intercessory prayers on non-venerated/context-only records.
- `web/CONTENT_ACCURACY.md` documents the source/evidence and image policy.
