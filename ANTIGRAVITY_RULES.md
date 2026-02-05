# Antigravity Execution Rules — TEDYTECH Project

Root folder: `tedytech/`

Subfolders:
- `admin/` → Admin mini-app (Vite + React)
- `customer/` → Customer mini-app
- `convex/` → Convex backend
- Other folders (tests, configs, experiments)

These rules are STRICT and must be followed at all times.

---

## 🔒 IMMUTABLE RULES

1. Project structure is fixed.
   - Do NOT rename, move, or delete folders (`admin`, `customer`, `convex`).
2. Convex is READ-ONLY by default.
   - Do NOT rename or delete tables
   - Do NOT rename or delete existing queries or mutations
   - Do NOT change auth logic
3. Do NOT add libraries or packages unless explicitly approved.
4. Do NOT modify deployment configs or env files.

---

## 🔓 CONDITIONAL CONVEX ACCESS

Convex may only be modified when explicitly allowed:

- Allowed edits:
  - Add new tables for missing features
  - Add queries/mutations to support new UI cards or counts
- Forbidden:
  - Rename or delete existing tables/functions
  - Merge tables or change auth logic
- If Convex edits are NOT explicitly allowed, treat `convex/` as read-only.

---

## ✅ ALLOWED ACTIONS (SCOPED)

### Admin mini-app (`admin/`)
- Connect UI buttons to existing Convex queries/mutations
- Add missing UI → Convex calls where backend exists
- Remove unused buttons/components/routes
- Add small UI features using existing patterns
- Clean unused imports or dead code

### Customer mini-app (`customer/`)
- Connect UI to existing Convex queries/mutations
- Remove unused buttons or features
- Add small customer UI features using existing patterns

### Convex (`convex/`)
- Only editable when explicitly unlocked per Conditional Convex Access rules
- Only minimal schema/queries/mutations for specific dashboard or feature needs

---

## 🧭 REQUIRED WORKFLOW (STEP-BY-STEP)

For each task:

1. Specify folder: `admin/` or `customer/`
2. Identify exact UI component file(s)
3. Identify exact Convex mutation/query (verify it exists)
4. Describe minimal change plan
5. Apply the change
6. Stop

If a required Convex function does NOT exist, stop and ask.

---

## 🚫 FORBIDDEN BEHAVIOR

- Do NOT batch multiple features
- Do NOT refactor for cleanliness
- Do NOT improve architecture
- Do NOT guess mutation/query names
- Do NOT silently apply changes
- Do NOT touch files outside the folder in scope

---

## 🎯 PRIMARY GOAL

- All admin buttons and customer actions map correctly to Convex
- Admin and Customer mini-apps are functional
- Stability > speed
- Claude Sonnet must follow rules strictly
