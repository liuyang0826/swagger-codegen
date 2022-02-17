import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import vueJSX from "@vitejs/plugin-vue-jsx"
import pages from "vite-plugin-pages"

export default defineConfig({
  build: {
    outDir: "lib/static",
  },
  plugins: [
    vue(),
    vueJSX(),
    pages({
      dirs: "src/pages",
      exclude: ["**/components/**"],
      extensions: ["tsx"],
    }),
  ],
  css: {
    modules: {
      generateScopedName: "[local]_[hash:base64:5]",
    },
  },
})
