(() => {
  if (window.__cpdownXComExtractorLoaded) return;
  window.__cpdownXComExtractorLoaded = true;

  const SOURCE_ID = "cpdown-xcom-markdown-source";
  const STYLE_ID = "cpdown-xcom-markdown-source-style";

  function isXHost() {
    const host = location.hostname.toLowerCase();
    return host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host.endsWith(".twitter.com");
  }

  if (!isXHost()) return;

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

    return blocks.sort((a, b) => b.length - a.length).slice(0, 5);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function authorFromUrl() {
    const first = location.pathname.split("/").filter(Boolean)[0] || "";
    return first && !["home", "explore", "notifications", "messages", "i", "settings", "search"].includes(first) ? `@${first}` : "";
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${SOURCE_ID} {
        display: block !important;
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 680px !important;
        max-height: 1px !important;
        overflow: hidden !important;
        opacity: 0.01 !important;
        pointer-events: none !important;
        background: white !important;
        color: black !important;
        font-size: 16px !important;
        line-height: 1.5 !important;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function renderOnce() {
    try {
      const blocks = collectBlocks();
      const existing = document.getElementById(SOURCE_ID);
      if (!blocks.length) {
        existing?.remove();
        return;
      }

      ensureStyle();

      const title = document.title || "X.com content";
      const author = authorFromUrl();
      const body = blocks.map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`).join("\n");
      const html = `
        <article id="${SOURCE_ID}" role="article" data-cpdown-xcom-source="true">
          <h1>${escapeHtml(title)}</h1>
          <p><strong>Source:</strong> ${escapeHtml(location.href)}</p>
          ${author ? `<p><strong>Author:</strong> ${escapeHtml(author)}</p>` : ""}
          ${body}
        </article>
      `;

      const template = document.createElement("template");
      template.innerHTML = html.trim();
      existing?.remove();
      document.body?.prepend(template.content.firstElementChild);
    } catch (error) {
      console.warn("cpdown x.com adapter failed:", error);
    }
  }

  function start() {
    setTimeout(renderOnce, 1000);
    setTimeout(renderOnce, 3000);
    setTimeout(renderOnce, 6000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
