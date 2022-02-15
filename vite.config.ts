import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import vueJSX from "@vitejs/plugin-vue-jsx"

export default defineConfig({
  build: {
    outDir: "lib/static",
  },
  plugins: [vue(), vueJSX()],
  css: {
    modules: {
      generateScopedName: "[local]_[hash:base64:5]",
    },
  },
})
