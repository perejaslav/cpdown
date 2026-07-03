import { defineConfig } from "wxt";

export default defineConfig({
  manifest: () => ({
    name: "cpdown",
    description: "Copy any webpage/YouTube subtitle as clean markdown",
    permissions: ["activeTab", "clipboardWrite", "contextMenus", "scripting", "storage"],
    host_permissions: ["<all_urls>"],
    commands: {
      "copy-as-markdown": {
        description: "Copy current page as clean markdown",
        suggested_key: { default: "Ctrl+Shift+T", mac: "Ctrl+T" }
      }
    }
  }),
  vite: () => ({
    build: { sourcemap: true }
  })
});
