import { query } from "convex/server";

// Return all products from the Convex `products` table.
export const listAllProducts = query(async ({ db }) => {
  // Return all rows from the products table. Adjust projections/indexes as needed.
  const rows = await db.table("products").collect();
  return rows;
});
