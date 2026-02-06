import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const plugins: Array<any> = [react()];

  return {
    server: {
      host: "::",
      port: 5174,
      fs: {
        // Allow only the generated convex client and local node_modules
        allow: [
          path.resolve(__dirname, "../convex/_generated"),
          path.resolve(__dirname, "node_modules"),
        ],
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        convex_generated: path.resolve(__dirname, "../convex/_generated"),
      },
    },
  };
});
