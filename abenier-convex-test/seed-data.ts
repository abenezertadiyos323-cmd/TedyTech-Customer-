import { ConvexClient } from "convex/browser";
import { api } from "./convex/_generated/api";

const client = new ConvexClient("https://original-ram-766.convex.cloud");

async function seedData() {
  console.log("Creating test category...");

  // Create category
  const categoryId = await client.mutation(api.store.createCategory, {
    name: "Phones",
    slug: "phones",
  });
  console.log("Category created:", categoryId);

  // Create product
  const productId = await client.mutation(api.store.createProduct, {
    name: "Test Phone",
    description: "This is a test phone to verify Convex integration",
    price: 29999,
    categoryId: categoryId,
    images: [
      "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400",
    ],
    isActive: true,
  });
  console.log("Product created:", productId);

  console.log("Seed complete!");
  process.exit(0);
}

seedData().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
