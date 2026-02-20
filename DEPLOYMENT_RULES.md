# Convex Deployment Rules

## Deployments

| Name | URL | Purpose |
|------|-----|---------|
| Dev | `https://original-ram-766.convex.cloud` | Local development only |
| **Production** | **`https://clever-partridge-181.convex.cloud`** | Live customer + admin apps |

---

## How the CLI decides where to deploy

`CONVEX_DEPLOYMENT` in `.env.local` identifies the **project** and sets the default target for the CLI:

```
CONVEX_DEPLOYMENT=dev:original-ram-766  # project: tedytech, team: abenezertadiyos323
```

- `npx convex dev` → always syncs to the **dev** deployment (`original-ram-766`).
- `npx convex deploy` → deploys to the **production** deployment of the same project (`clever-partridge-181`). This is the default behaviour in Convex CLI ≥1.x — there is no `--prod` flag.

**`CONVEX_DEPLOYMENT` does not need to change.** `npx convex deploy` always goes to production.

---

## Rules

### Fixing a production bug

```bash
# From repo root (d:\Ab\TedTech)
npx convex deploy
```

This atomically pushes schema + all functions to `clever-partridge-181`. Always run this after any change to `convex/` that needs to reach live users.

### Local development

```bash
npx convex dev
```

Watches `convex/` and hot-reloads to `original-ram-766`. Safe to use freely — it never touches production.

---

## Frontend URLs must match production

Both mini apps point to the production deployment. These values must never be changed to the dev URL:

| App | File | Required value |
|-----|------|----------------|
| Customer | `tedytech-Customer-miniapp/.env` | `VITE_CONVEX_URL=https://clever-partridge-181.convex.cloud` |
| Admin | `tedytech-admin-miniapp/.env` | `VITE_CONVEX_URL=https://clever-partridge-181.convex.cloud` |

If these point to `original-ram-766` the apps will hit the dev deployment and **will not reflect production schema or data**.

---

## Post-deploy verification

After every `npx convex deploy`:

1. **Dashboard** → [dashboard.convex.dev](https://dashboard.convex.dev) → project `tedytech` → switch to **Production** environment.
2. **Functions tab** → confirm the updated functions appear with a recent deploy timestamp.
3. **Data tab** → check any modified table's Indexes sub-tab to confirm new indexes are present.
4. **Logs tab** → open the app and watch for `Error` status on any function — there should be none.
5. Quick CLI smoke test:
   ```bash
   npx convex run favorites:getFavorites '{}'
   # Expected: []
   ```
