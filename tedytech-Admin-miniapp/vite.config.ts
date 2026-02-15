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
        convex_generated: path.resolve(__dirname, "./src/convex/_generated"),
      },
    },
  };
});
