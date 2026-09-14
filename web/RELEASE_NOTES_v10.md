# v10 — Strict per-icon lazy details

- The 1,083-record web/search index stays lightweight at startup.
- Every record now has its own `web/data/details/entry-XXXX.js` detail payload.
- Tapping a bubble loads only that exact record.
- Closing the modal removes the loaded record from the app's detail store, removes its script element, clears the modal body/image, and drops active references.
- Reopening an entry loads it again rather than using an application-level biography cache.
- The five-second startup screen still prepares only the web/search/nearby images; it never preloads biography payloads.
- Relative classic scripts preserve local/offline and GitHub/static-hosting compatibility.
