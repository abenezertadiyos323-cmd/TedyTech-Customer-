import { mutation } from "convex/server";

/*
  WARNING: seedProducts is a privileged, destructive admin function.
  - It will insert example products into the `products` table only when
    called with a valid `adminToken` that matches the environment variable
    `CONVEX_SEED_ADMIN_TOKEN`.
  - DO NOT commit a real secret into source control. Set `CONVEX_SEED_ADMIN_TOKEN`
    in your local environment or CI only when you intend to run the seed.
  - After seeding, consider removing this file or restricting access in your
    production workflow.
*/

export const seedProducts = mutation(
  async ({ db }, args: { adminToken?: string }) => {
    // Extra safety: disallow running in production regardless of token presence.
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        message: "Refusing to run seedProducts in production environment",
      };
    }

    const expected = process.env.CONVEX_SEED_ADMIN_TOKEN;
    if (!expected) {
      return {
        ok: false,
        message: "CONVEX_SEED_ADMIN_TOKEN not configured in environment",
      };
    }
    if (!args?.adminToken || args.adminToken !== expected) {
      return {
        ok: false,
        message: "Invalid or missing adminToken. This function is admin-only.",
      };
    }

    // Proceed with seeding once the admin token is validated.
    // Seed will abort if products table already has rows.

    // Note: call this mutation with the admin token from the Convex dashboard
    // Run -> enter JSON args: { "adminToken": "<your-token>" }

    // Example (local):
    // CONVEX_SEED_ADMIN_TOKEN=xxxx npx convex dev
    // Then run seedProducts from dashboard with { "adminToken": "xxxx" }

    const existing = await db.table("products").collect();
    if (existing.length > 0) {
      return {
        ok: false,
        message: "products table already has data",
        count: existing.length,
      };
    }
    const existing = await db.table("products").collect();
    if (existing.length > 0) {
      return {
        ok: false,
        message: "products table already has data",
        count: existing.length,
      };
    }

    const sample = [
      {
        name: "iPhone 13 Pro",
        brand: "Apple",
        model: "13 Pro",
        price: 145000,
        storage: "128GB",
        condition: "New",
        images: [
          "https://images.unsplash.com/photo-1632633173522-47456de71b76?w=800&h=800&fit=crop",
        ],
        main_image_url:
          "https://images.unsplash.com/photo-1632633173522-47456de71b76?w=800&h=800&fit=crop",
        isFeatured: true,
        is_accessory: false,
        in_stock: true,
        is_popular: true,
        createdAt: Date.now(),
      },
      {
        name: "Samsung S23",
        brand: "Samsung",
        model: "S23",
        price: 210000,
        storage: "256GB",
        condition: "New",
        images: [
          "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=800&fit=crop",
        ],
        main_image_url:
          "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=800&fit=crop",
        isFeatured: false,
        is_accessory: false,
        in_stock: true,
        is_popular: false,
        createdAt: Date.now(),
      },
    ];

    for (const p of sample) {
      await db.table("products").insert(p);
    }

    return { ok: true, inserted: sample.length };
  },
);
