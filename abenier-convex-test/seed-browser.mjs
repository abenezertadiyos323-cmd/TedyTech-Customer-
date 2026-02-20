#!/usr/bin/env node
import { ConvexClient } from "convex/browser";

// Note: This needs to be run with proper environment setup
const DEPLOYMENT_URL = "https://clever-partridge-181.convex.cloud";

async function seed() {
  console.log("Seeding test data...");

  try {
    const client = new ConvexClient(DEPLOYMENT_URL);

    // This approach won't work directly because we need the generated API types
    // Instead, let's try a different method
    console.log("Note: Direct seeding requires proper Convex setup.");
  } catch (error) {
    console.error("Error:", error);
  }
}

seed();
