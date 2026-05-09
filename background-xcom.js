(() => {
  const MENU_ID = "cpdown-xcom-markdown";

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
        title: "Copy X.com Markdown",
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

        const LANG_MARKERS = new Set(["python", "bash", "sh", "shell", "yaml", "yml", "json", "javascript", "js"]);

        function normalizeSpaces(value) {
          return String(value || "")
            .replace(/\u00a0/g, " ")
            .replace(/[ \t]+/g, " ")
            .replace(/\n[ \t]+/g, "\n")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
        }

        function isUiLine(line) {
          const value = normalizeSpaces(line);
          return !value || UI_LINE_PATTERNS.some((pattern) => pattern.test(value));
        }

        function escapeInline(value) {
          return String(value || "").replace(/[ \t]+/g, " ");
        }

        function absoluteUrl(href) {
          try { return new URL(href, location.href).href; } catch { return href || ""; }
        }

        function codeFence(text, lang = "") {
          const value = String(text || "").replace(/\n{3,}/g, "\n\n").trim();
          if (!value) return "";
          const fence = value.includes("```") ? "````" : "```";
          return `\n\n${fence}${lang}\n${value}\n${fence}\n\n`;
        }

        function nodeToMarkdown(node, insideCode = false) {
          if (!node) return "";
          if (node.nodeType === Node.TEXT_NODE) return insideCode ? (node.nodeValue || "") : escapeInline(node.nodeValue || "");
          if (node.nodeType !== Node.ELEMENT_NODE) return "";

          const tag = node.tagName.toLowerCase();
          if (["script", "style", "svg", "canvas", "button", "nav"].includes(tag)) return "";
          if (node.getAttribute("role") === "button") return "";

          if (tag === "pre") return codeFence(node.textContent || "");
          if (tag === "code") {
            const parentTag = node.parentElement?.tagName?.toLowerCase();
            if (parentTag === "pre") return codeFence(node.textContent || "");
            const text = (node.textContent || "").replace(/`/g, "\\`").trim();
            return text ? `\`${text}\`` : "";
          }

          const children = Array.from(node.childNodes).map((child) => nodeToMarkdown(child, insideCode || tag === "code" || tag === "pre")).join("");
          const inner = normalizeSpaces(children);

          if (tag === "br") return "\n";
          if (/^h[1-6]$/.test(tag)) return inner ? `\n\n${"#".repeat(Number(tag[1]))} ${inner}\n\n` : "";
          if (tag === "p") return inner ? `\n\n${inner}\n\n` : "";
          if (tag === "strong" || tag === "b") return inner ? `**${inner}**` : "";
          if (tag === "em" || tag === "i") return inner ? `*${inner}*` : "";
          if (tag === "blockquote") return inner ? `\n\n${inner.split("\n").map((line) => `> ${line}`).join("\n")}\n\n` : "";
          if (tag === "li") return inner ? `\n- ${inner}` : "";
          if (tag === "ul" || tag === "ol") return inner ? `\n${inner}\n` : "";
          if (tag === "a") {
            const href = node.getAttribute("href");
            if (!href || !inner) return inner;
            const url = absoluteUrl(href);
            if (url === inner) return url;
            return `[${inner}](${url})`;
          }

          return children;
        }

        function looksLikeCodeLine(line) {
          const value = String(line || "").trim();
          return /^(import |from |def |class |if |elif |else:|for |while |try:|except |with |return\b|print\(|async |await |[a-zA-Z_][\w_]*\s*=|r\s*=\s*requests\.|requests\.|subprocess\.|open\(|os\.|sys\.|json=|headers=|payload=|curl\b|pip\b|npm\b|git\b|docker\b|python3?\b|crontab\b|mkdir\b|gbrain\b|which\b|find\b|[A-Z_]+\s*=)/.test(value) || /[:{}[\],]$/.test(value) && /[=:{}/]/.test(value);
        }

        function looksLikeYamlLine(line) {
          return /^\s*[A-Za-z0-9_.-]+:\s*(\||>|.*)?$/.test(line) || /^\s*-\s+/.test(line);
        }

        function normalizeLang(lang) {
          const value = String(lang || "").toLowerCase();
          if (value === "sh" || value === "shell") return "bash";
          if (value === "yml") return "yaml";
          if (value === "js") return "javascript";
          return value;
        }

        function rebuildLanguageBlocks(markdown) {
          const rawLines = String(markdown || "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
          const output = [];
          let i = 0;

          while (i < rawLines.length) {
            const line = rawLines[i];

            if (LANG_MARKERS.has(line.toLowerCase()) && i + 1 < rawLines.length) {
              const lang = normalizeLang(line.toLowerCase());
              const codeLines = [];
              let j = i + 1;
              while (j < rawLines.length) {
                const next = rawLines[j];
                const nextLower = next.toLowerCase();
                if (LANG_MARKERS.has(nextLower)) break;
                const codeish = lang === "yaml" ? looksLikeYamlLine(next) : looksLikeCodeLine(next);
                if (!codeish && codeLines.length > 0 && next.length > 120 && /[.!?]$/.test(next)) break;
                if (!codeish && codeLines.length === 0 && next.length > 120 && /[.!?]$/.test(next)) break;
                codeLines.push(next);
                j += 1;
                if (codeLines.length > 80) break;
              }
              if (codeLines.length) {
                output.push(codeFence(codeLines.join("\n"), lang));
                i = j;
                continue;
              }
            }

            if (!isUiLine(line)) output.push(line);
            i += 1;
          }

          return output.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
        }

        function cleanMarkdown(markdown) {
          const rebuilt = rebuildLanguageBlocks(markdown);
          const lines = rebuilt.split(/\n+/).map((line) => line.trim()).filter((line) => line && !isUiLine(line));
          const output = [];
          const seen = new Set();
          let inFence = false;

          for (const line of lines) {
            if (line.startsWith("```")) {
              inFence = !inFence;
              output.push(line);
              continue;
            }
            if (!inFence) {
              const key = line.toLowerCase();
              if (seen.has(key) && line.length > 20) continue;
              seen.add(key);
            }
            output.push(line);
          }

          return output.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
        }

        function useful(markdown) {
          const value = normalizeSpaces(markdown.replace(/[`*_#>\[\]()\-]/g, " "));
          return value.length >= 40 && value.split(/\s+/).filter(Boolean).length >= 6;
        }

        function collectBlocks() {
          const root = document.querySelector("main") || document.body;
          if (!root) return [];
          const selectors = ["[data-testid='tweetText']", "div[lang]", "article", "[role='article']"];
          const blocks = [];
          for (const selector of selectors) {
            for (const element of root.querySelectorAll(selector)) {
              const markdown = cleanMarkdown(nodeToMarkdown(element));
              if (!useful(markdown)) continue;
              if (blocks.some((existing) => existing.includes(markdown) || markdown.includes(existing))) continue;
              blocks.push(markdown);
            }
          }
          return blocks.sort((a, b) => b.length - a.length).slice(0, 10);
        }

        function authorFromUrl() {
          const first = location.pathname.split("/").filter(Boolean)[0] || "";
          return first && !["home", "explore", "notifications", "messages", "i", "settings", "search"].includes(first) ? `@${first}` : "";
        }

        function showPageToast(message, type = "success") {
          const id = "cpdown-xcom-toast";
          document.getElementById(id)?.remove();
          const toast = document.createElement("div");
          toast.id = id;
          toast.textContent = message;
          toast.style.cssText = [
            "position:fixed", "right:18px", "top:18px", "z-index:2147483647", "max-width:380px",
            "padding:12px 14px", "border-radius:10px", "font:13px/1.4 system-ui,-apple-system,Segoe UI,sans-serif",
            "box-shadow:0 8px 30px rgba(0,0,0,.22)", `background:${type === "error" ? "#7f1d1d" : "#14532d"}`, "color:#fff"
          ].join(";");
          document.documentElement.appendChild(toast);
          setTimeout(() => toast.remove(), 4500);
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
          if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
          return fallbackCopy(text);
        }

        const blocks = collectBlocks();
        if (!blocks.length) {
          showPageToast("cpdown X.com: no text blocks found", "error");
          return { ok: false, error: "No text blocks found" };
        }

        const author = authorFromUrl();
        const markdown = [
          `# ${document.title || "X.com content"}`,
          "",
          `**Source:** ${location.href}`,
          author ? `**Author:** ${author}` : "",
          "",
          "---",
          "",
          blocks.join("\n\n")
        ].filter(Boolean).join("\n");

        return copyMarkdown(markdown).then(() => {
          showPageToast(`cpdown X.com: copied ${blocks.length} block(s)`);
          return { ok: true, blockCount: blocks.length };
        }).catch((error) => {
          showPageToast(`cpdown X.com: copy failed (${error.message})`, "error");
          return { ok: false, error: error.message };
        });
      }
    });
  });
})();
