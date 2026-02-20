#!/usr/bin/env node
/**
 * Seed test data into Convex using the HTTP API
 */

const CONVEX_URL = "https://clever-partridge-181.convex.cloud";

async function callConvex(functionName, args) {
  const url = `${CONVEX_URL}/api/call/${functionName}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to call ${functionName}:`, error);
    throw error;
  }
}

async function main() {
  console.log("🌱 Seeding test data into Convex...\n");

  try {
    // Step 1: Create category
    console.log("📦 Creating category...");
    const categoryResult = await callConvex("store:createCategory", {
      name: "Phones",
      slug: "phones",
    });
    console.log("✅ Category created:", categoryResult);

    // Extract category ID from result
    const categoryId = categoryResult;

    // Step 2: Create product
    console.log("\n📱 Creating test product...");
    const productResult = await callConvex("store:createProduct", {
      name: "Test Phone",
      description: "This is a test phone to verify Convex integration",
      price: 29999,
      categoryId: categoryId,
      images: [
        "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400",
      ],
      isActive: true,
    });
    console.log("✅ Product created:", productResult);

    console.log("\n✨ Seed complete! Product should appear in inventory.");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

main();
