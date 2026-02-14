import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    fs: {
      allow: [".."],
    },
    // Handle Chrome DevTools protocol requests
    proxy: {
      "/.well-known": {
        target: "http://localhost:5173",
        bypass: (req) => {
          if (req.url?.includes(".well-known")) {
            // Return a 404 response
            return false; // false means don't proxy, let Vite handle it
          }
        }
      }
    }
  }
});