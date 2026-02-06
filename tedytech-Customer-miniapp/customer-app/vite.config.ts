import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins: Array<any> = [react()];

  if (mode === "development") {
    try {
      const mod = await import("lovable-tagger");
      if (mod?.componentTagger) plugins.push(mod.componentTagger());
    } catch (e) {
      // optional dev dependency not installed - skip
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      fs: {
        // Restrict Vite file serving to only the generated convex client and local node_modules
        allow: [
          path.resolve(__dirname, "../../convex/_generated"),
          path.resolve(__dirname, "node_modules"),
        ],
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // Alias to the shared convex generated client in the repo root
        convex_generated: path.resolve(__dirname, "../../convex/_generated"),
      },
    },
  };
});
