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
        // Allow serving files from the repository root (for shared `convex/` folder)
        allow: [path.resolve(__dirname, "..")],
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
