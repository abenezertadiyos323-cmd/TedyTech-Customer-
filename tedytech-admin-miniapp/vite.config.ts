import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const plugins: Array<any> = [react()];

  return {
    server: {
      host: "::",
      port: 5174,
    },
    plugins,
    define: {
      __ADMIN_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        convex_generated: path.resolve(__dirname, "../convex/_generated"),
        // Ensure `convex/server` (imported by the generated api.js outside
        // this package) resolves to this app's own node_modules, not the
        // root node_modules which doesn't exist on Vercel.
        convex: path.resolve(__dirname, "./node_modules/convex"),
      },
    },
  };
});
