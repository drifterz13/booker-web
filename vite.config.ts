import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  // React Router uses Vite preview to generate the SPA entry page at build time.
  preview: {
    host: "127.0.0.1",
  },
  optimizeDeps: {
    include: ["react-pdf"],
  },
  resolve: {
    tsconfigPaths: true,
  },
});
