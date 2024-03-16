import { build, defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import htmlMinifierTerser from "vite-plugin-html-minifier-terser";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    htmlMinifierTerser({
      removeAttributeQuotes: true,
      collapseWhitespace: true,
    }),
  ],
  build:{
    sourcemap:false
  }
});
