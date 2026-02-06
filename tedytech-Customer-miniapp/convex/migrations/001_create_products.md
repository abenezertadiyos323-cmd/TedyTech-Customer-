# Migration: Create `products` table (instructions)

This document explains how to create the `products` table and add indexes in Convex.

Because Convex manages schema and indexes via the dashboard or CLI, follow either the manual or CLI-assisted approach below.

Manual (recommended via Convex Dashboard):

1. Run the local dev server:

   ```bash
   npx convex dev
   ```

2. Open the Convex dashboard for your dev environment (the URL is printed in the `convex dev` output).

3. Create a new table named `products` with the following fields (types shown):
   - `name` (string)
   - `brand` (string)
   - `model` (string, optional)
   - `price` (number)
   - `storage` (string, optional)
   - `condition` (string, optional)
   - `images` (string[] optional)
   - `main_image_url` (string optional)
   - `isFeatured` (boolean optional)
   - `is_accessory` (boolean optional)
   - `in_stock` (boolean optional)
   - `is_popular` (boolean optional)
   - `is_premium` (boolean optional)
   - `createdAt` (number optional)
   - `updatedAt` (number optional)

4. Create indexes:
   - `by_brand` on field `brand`.
   - `by_isFeatured` on field `isFeatured`.

   Use the dashboard's Indexes section to add these indexes.

CLI / Script approach:

If you prefer to use Convex CLI or automation, create a seed or admin mutation (we provide `convex/seedProducts.ts`) and run it in your dev environment once `npx convex dev` is running. The seed mutation will insert example products into the `products` table.

Notes:

- Index creation in Convex is currently done via the dashboard or via the Convex team-provided migration tooling. The above documents the explicit fields and indexes to add.
- After creating the table and indexes, call the seed mutation `seedProducts` (provided in `convex/seedProducts.ts`) from the dashboard or via an admin client to populate sample data.
