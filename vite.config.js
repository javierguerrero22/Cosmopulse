import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  root: "src/",
  publicDir: "../public",
  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        explore: resolve(__dirname, "src/explore.html"),
        favorites: resolve(__dirname, "src/favorites.html"),
        radar: resolve(__dirname, "src/radar.html"),
      },
    },
  },
});
