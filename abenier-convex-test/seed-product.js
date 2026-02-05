const { spawnSync } = require("child_process");
const fs = require("fs");

const categoryId = "j57fy74g76pabjd7cf3httfjr1802dw6";

const productData = {
  name: "Test Phone",
  description: "This is a test phone to verify Convex integration",
  price: 29999,
  categoryId: categoryId,
  images: [
    "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400",
  ],
  isActive: true,
};

const jsonStr = JSON.stringify(productData);

console.log("Creating product with data:", productData);
console.log("JSON:", jsonStr);

const result = spawnSync(
  "npx",
  ["convex", "run", "store:createProduct", jsonStr],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
  },
);

process.exit(result.status);
