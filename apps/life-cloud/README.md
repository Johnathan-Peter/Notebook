# Jonathan's 日常 — private cloud companion

The existing Notebook GitHub Pages site links to this owner-private Sites app.

- `app.html`: single-file UI, all record modules, offline cache and revision-aware synchronization.
- `worker/handler.js`: authenticated same-origin JSON API. Records are namespaced by the stable Sites user ID and persisted in R2. Conditional writes prevent silent overwrites.
- `worker/validation.js`: server-side record normalization, shared with the UI.
- `scripts/build.mjs`: builds one self-contained Worker and its hosting manifest. No dependencies required.

`npm run test && npm run build` validates the source. Publish the built `dist/server/index.js` with the Sites manifest. The platform provisions the `BUCKET` R2 binding, supplies authentication, and controls owner-only access. No credentials or personal records are stored in source.

Local browser storage is a draft/cache only. The UI confirms cloud persistence only after a successful server response. Conflicts preserve local drafts and require a deliberate choice; JSON export remains available. To migrate previous browser-only records, export JSON on the original Notebook domain and import in this app.
