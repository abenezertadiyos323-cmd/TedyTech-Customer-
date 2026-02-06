## Customer App

This folder holds the frontend package for the TEDYTECH customer mini-app. The Convex backend remains at the repository root in `convex/` so it can be shared with other packages.

Quick migration steps (run from repo root) to move the frontend files into `customer-app/` using git (preserves history):

1. Create the folder (already present).
2. Move files with git mv:

```bash
git mv src customer-app/src
git mv public customer-app/public
git mv package.json customer-app/package.json
git mv vite.config.ts customer-app/vite.config.ts
git mv tsconfig.* customer-app/ || true
```

3. Commit the moves:

```bash
git add -A
git commit -m "Move frontend into customer-app/ (prepare monorepo layout)"
```

4. From `customer-app/` you can install dependencies and run the dev server:

```bash
cd customer-app
npm install
npm run dev
```

Notes:

- `convex/` stays at repository root and is intentionally shared between packages.
- If you prefer I can perform the `git mv` moves here; I left the moves in your hands to preserve working tree and installs.
