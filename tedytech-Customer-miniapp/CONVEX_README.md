# Convex Setup & Seeding

# Convex Setup & Seeding

Local development

1. Start Convex dev (runs local Convex server + dashboard):

```bash
npx convex dev
```

2. Open the Convex dashboard URL printed by the command.

Creating the `products` table and indexes

- Use the dashboard to create a table named `products` and add fields described in `convex/schema.ts`.
- Add indexes `by_brand` (field `brand`) and `by_isFeatured` (field `isFeatured`) via the dashboard Indexes UI.

Seeding initial product data

- We provide a Convex mutation `seedProducts` in `convex/seedProducts.ts`. After `npx convex dev` is running you can execute `seedProducts` from the dashboard's "Run function" UI or call it from an admin script.

Example (run from the dashboard):

- Open the Dashboard → Functions → select `seedProducts` → Run.

Deployment Checklist (quick)

1. Start local dev and validate the app with the Convex dev server:

```bash
npx convex dev
npm run dev # or start your frontend dev server
```

2. Create the `products` table and add the indexes:

- Dashboard → Data → Tables → `products` → Fields: create fields (see `convex/schema.ts`).
- Dashboard → Data → Tables → `products` → Indexes: add `by_brand` (field `brand`) and `by_isFeatured` (field `isFeatured`).

3. Seed initial data (one-time):

- Dashboard → Functions → `seedProducts` → Run (returns `{ ok: true, inserted: N }`).
- After confirming data seeded, you can either delete `convex/seedProducts.ts` or keep it as an admin-only function.

4. Deploy Convex production and set env var:

```bash
npx convex deploy
```

- In your hosting provider (Vercel/Netlify), set an environment variable:
  - Key: `VITE_CONVEX_URL`
  - Value: `https://<your-app>.convex.cloud`

- For Vercel: Project → Settings → Environment Variables → Add `VITE_CONVEX_URL` (Production).
- For Netlify: Site settings → Build & deploy → Environment → Add variable `VITE_CONVEX_URL`.

Index verification

- To verify indexes are active: Dashboard → Data → Tables → `products` → Indexes — confirm `by_brand` and `by_isFeatured` exist.
- Functional check: run a filtered query in the Dashboard or your app (e.g., filter by `brand` or `isFeatured`) and confirm results return quickly.

Seed file lifecycle (recommended)

- Keep `convex/seedProducts.ts` only as long as you need to seed or re-seed data. Options:
  - Remove the file after seeding (safe cleanup): `git rm convex/seedProducts.ts` and commit.
  - Keep it as an admin-protected function (recommended if you may re-seed). If you keep it, restrict execution to your admin workflow.

Notes

- Replace the placeholder `convex/_generated/api.ts` with the real generated API from `npx convex dev` for full type safety once you run the dev server.
- When ready, run your frontend production build and ensure `VITE_CONVEX_URL` is set in your production environment.
