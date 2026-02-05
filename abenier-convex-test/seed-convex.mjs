#!/usr/bin/env node
/**
 * Seed script using admin app's generated types
 */
import { ConvexClient } from "convex/browser";

// Read from admin app's generated API
import { api } from "../tedytalk-manager/convex/_generated/api.js";

const DEPLOYMENT_URL = "https://original-ram-766.convex.cloud";

async function main() {
  try {
    console.log("🌱 Seeding test data into Convex...");
    const client = new ConvexClient(DEPLOYMENT_URL);

    // Create category
    console.log("📦 Creating category...");
    const categoryId = await client.mutation(api.store.createCategory, {
      name: "Phones",
      slug: "phones",
    });
    console.log("✅ Category created:", categoryId);

    // Create product
    console.log("📱 Creating test product...");
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
    console.log("✅ Product created:", productId);

    console.log("\n✨ Seed complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

main();
