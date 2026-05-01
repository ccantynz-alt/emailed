// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "node:path";
var __electron_vite_injected_dirname = "/home/user/AlecRae.com/apps/desktop";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__electron_vite_injected_dirname, "src/main.ts"),
        formats: ["cjs"],
        fileName: () => "main.cjs"
      },
      outDir: "dist",
      emptyOutDir: true
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__electron_vite_injected_dirname, "src/preload.ts"),
        formats: ["cjs"],
        fileName: () => "preload.cjs"
      },
      outDir: "dist",
      emptyOutDir: false
    }
  }
});
export {
  electron_vite_config_default as default
};
