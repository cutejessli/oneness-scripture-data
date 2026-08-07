# Oneness Scripture Reader

This is the standalone frontend for the Oneness Scripture data project. It is intentionally separate from every other app or product.

## Architecture

- `scripture/` remains the canonical content store.
- `metadata/library-index.json` is the lightweight discovery manifest used by the reader.
- `scripts/build-library-index.mjs` scans the repository and rebuilds that manifest.
- `frontend/` is a static reader that loads the current manifest and chapter JSON directly from the repository.
- `.github/workflows/rebuild-library-index.yml` refreshes the manifest whenever scripture files change.
- `.github/workflows/deploy-reader.yml` deploys the reader to GitHub Pages when frontend files change.

The restored/source-audited and mystical layers remain separate at the data level and can be viewed independently or side-by-side in the UI.

## Reader features

- Canon-order book library
- Search
- Chapter navigation
- Restored / Mystical / Both view
- Translation notes, editorial safeguards, witness flags, and contemplative notes
- URL hash state for direct links
- Light/dark mode
- Responsive mobile layout
- Optional display of upcoming books

The reader does not need a frontend rebuild when new scripture is added. It fetches the latest `metadata/library-index.json` and chapter files from `main`.
