# Admin Mini App

This folder will contain the code for the Admin-facing mini app. It will share the Convex backend located at the root `convex/` directory.

## Structure
- `src/` — React source code for the Admin app
- `public/` — Static assets

## Shared Backend
Both the Customer and Admin mini apps will use the shared backend in the root `convex/` folder. Keep all backend logic, schema, and mutations in `convex/`.

## Next Steps
- Scaffold your Admin app in `src/` as needed (e.g., with Vite or Create React App)
- Point both apps to the same Convex backend in their respective configs
