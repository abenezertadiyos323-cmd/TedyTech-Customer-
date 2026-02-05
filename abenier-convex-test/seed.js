#!/usr/bin/env node

/**
 * Seed script to add test data to Convex
 * Run with: node seed.js
 */

const https = require("https");

// Configuration
const CONVEX_URL = "https://original-ram-766.convex.cloud";

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONVEX_URL);
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = https.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function seed() {
  console.log("🌱 Starting seed script...");

  try {
    // Create test category
    console.log("📦 Creating test category...");
    const categoryRes = await makeRequest("/api/createCategory", "POST", {
      name: "Phones",
      slug: "phones",
    });
    console.log("Category response:", categoryRes.body);
    const categoryId = categoryRes.body?.result;

    if (!categoryId) {
      throw new Error("Failed to create category");
    }

    // Create test product
    console.log("📱 Creating test product...");
    const productRes = await makeRequest("/api/createProduct", "POST", {
      name: "Test Phone",
      description: "This is a test phone to verify Convex integration",
      price: 29999,
      categoryId: categoryId,
      images: [
        "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400",
      ],
      isActive: true,
    });
    console.log("Product response:", productRes.body);

    if (productRes.status === 200) {
      console.log("✅ Seed data created successfully!");
      console.log("Product ID:", productRes.body?.result);
    } else {
      console.warn(
        "⚠️  Unexpected response:",
        productRes.status,
        productRes.body,
      );
    }
  } catch (error) {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  }
}

seed();
