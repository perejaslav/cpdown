(() => {
  const MENU_ID = "cpdown-xcom-markdown-alpha";

  function isXUrl(url) {
    try {
      const parsed = new URL(url || "");
      const host = parsed.hostname.toLowerCase();
      return host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host.endsWith(".twitter.com");
    } catch {
      return false;
    }
  }

  function createMenu() {
    chrome.contextMenus.remove(MENU_ID, () => {
      chrome.runtime.lastError;
      chrome.contextMenus.create({
        id: MENU_ID,
        title: "Copy X.com Markdown (alpha)",
        contexts: ["page", "selection"],
        documentUrlPatterns: ["https://x.com/*", "https://twitter.com/*"]
      });
    });
  }

  chrome.runtime.onInstalled.addListener(createMenu);
  chrome.runtime.onStartup.addListener(createMenu);
  createMenu();

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== MENU_ID || !tab?.id || !isXUrl(info.pageUrl || tab.url)) return;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const UI_LINE_PATTERNS = [
          /^(reply|replies|repost|reposts|quote|quotes|like|likes|view|views|share|bookmark|bookmarks)$/i,
          /^(follow|following|subscribe|subscribed|sign in|log in|create account|show more|show this thread)$/i,
          /^\d+([.,]\d+)?\s*[kmb]?$/i,
          /^\d+\s+(reply|replies|repost|reposts|quote|quotes|like|likes|view|views)$/i
        ];

        function normalizeText(value) {
          return String(value || "")
            .replace(/\u00a0/g, " ")
            .replace(/[ \t]+/g, " ")
            .replace(/\n[ \t]+/g, "\n")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
        }

        function isUiLine(line) {
          const value = normalizeText(line);
          return !value || UI_LINE_PATTERNS.some((pattern) => pattern.test(value));
        }

        function cleanText(text) {
          const seen = new Set();
          return normalizeText(text)
            .split(/\n+/)
            .map((line) => normalizeText(line))
            .filter((line) => line && !isUiLine(line))
            .filter((line) => {
              const key = line.toLowerCase();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            })
            .join("\n");
        }

        function useful(text) {
          const value = normalizeText(text);
          return value.length >= 40 && value.split(/\s+/).filter(Boolean).length >= 6;
        }

        function elementText(element) {
          if (!element) return "";
          const clone = element.cloneNode(true);
          clone.querySelectorAll("script,style,svg,canvas,button,nav,[role='button']").forEach((node) => node.remove());
          return cleanText(clone.innerText || clone.textContent || "");
        }

        function collectBlocks() {
          const root = document.querySelector("main") || document.body;
          if (!root) return [];
          const selectors = ["[data-testid='tweetText']", "div[lang]", "article", "[role='article']"];
          const blocks = [];
          for (const selector of selectors) {
            for (const element of root.querySelectorAll(selector)) {
              const text = elementText(element);
              if (!useful(text)) continue;
              if (blocks.some((existing) => existing.includes(text) || text.includes(existing))) continue;
              blocks.push(text);
            }
          }
          return blocks.sort((a, b) => b.length - a.length).slice(0, 10);
        }

        function authorFromUrl() {
          const first = location.pathname.split("/").filter(Boolean)[0] || "";
          return first && !["home", "explore", "notifications", "messages", "i", "settings", "search"].includes(first) ? `@${first}` : "";
        }

        function showPageToast(message, type = "success") {
          const id = "cpdown-xcom-alpha-toast";
          document.getElementById(id)?.remove();
          const toast = document.createElement("div");
          toast.id = id;
          toast.textContent = message;
          toast.style.cssText = [
            "position:fixed",
            "right:18px",
            "top:18px",
            "z-index:2147483647",
            "max-width:360px",
            "padding:12px 14px",
            "border-radius:10px",
            "font:13px/1.4 system-ui,-apple-system,Segoe UI,sans-serif",
            "box-shadow:0 8px 30px rgba(0,0,0,.22)",
            `background:${type === "error" ? "#7f1d1d" : "#14532d"}`,
            "color:#fff"
          ].join(";");
          document.documentElement.appendChild(toast);
          setTimeout(() => toast.remove(), 4000);
        }

        function fallbackCopy(text) {
          const area = document.createElement("textarea");
          area.value = text;
          area.setAttribute("readonly", "");
          area.style.cssText = "position:fixed;left:-9999px;top:0";
          document.documentElement.appendChild(area);
          area.select();
          const ok = document.execCommand("copy");
          area.remove();
          if (!ok) throw new Error("execCommand copy failed");
        }

        async function copyMarkdown(text) {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
          }
          fallbackCopy(text);
        }

        const blocks = collectBlocks();
        if (!blocks.length) {
          showPageToast("cpdown X.com alpha: no text blocks found", "error");
          return { ok: false, error: "No text blocks found" };
        }

        const title = document.title || "X.com content";
        const author = authorFromUrl();
        const markdown = [
          `# ${title}`,
          "",
          `**Source:** ${location.href}`,
          author ? `**Author:** ${author}` : "",
          "",
          "---",
          "",
          blocks.join("\n\n")
        ].filter(Boolean).join("\n");

        return copyMarkdown(markdown)
          .then(() => {
            showPageToast(`cpdown X.com alpha: copied ${blocks.length} block(s)`);
            return { ok: true, blockCount: blocks.length };
          })
          .catch((error) => {
            showPageToast(`cpdown X.com alpha: copy failed (${error.message})`, "error");
            return { ok: false, error: error.message };
          });
      }
    });
  });
})();
