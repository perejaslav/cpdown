/// <reference types="wxt/client" />

export default defineContentScript({
  matches: ["*://*/*"],
  main() {
    console.log("cpdown content script loaded");
  },
});
