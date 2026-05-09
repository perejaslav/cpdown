(() => {
  if (window.__cpdownXComExtractorLoaded) return;
  window.__cpdownXComExtractorLoaded = true;

  const SOURCE_ID = "cpdown-xcom-markdown-source";
  const STYLE_ID = "cpdown-xcom-markdown-source-style";
  const UPDATE_DELAY_MS = 350;
  const PERIODIC_UPDATE_MS = 1200;
  const MIN_TEXT_LENGTH = 40;

  const UI_LINE_PATTERNS = [
    /^(reply|replies|repost|reposts|quote|quotes|like|likes|view|views|share|bookmark|bookmarks)$/i,
    /^(follow|following|subscribe|subscribed|sign in|log in|create account|show more|show this thread)$/i,
    /^(post|posts|for you|following|explore|notifications|messages|communities|premium|profile|more)$/i,
    /^\d+([.,]\d+)?\s*[kmb]?$/i,
    /^\d+\s+(reply|replies|repost|reposts|quote|quotes|like|likes|view|views)$/i
  ];

  function isXHost() {
    const host = location.hostname.toLowerCase();
    return host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host.endsWith(".twitter.com");
  }

  if (!isXHost()) return;

  function decodeEntities(value) {
    return String(value || "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  function normalizeText(value) {
    return decodeEntities(String(value || ""))
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function isVisible(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  function isUiLine(line) {
    const value = normalizeText(line);
    if (!value) return true;
    if (value.length > 240) return false;
    return UI_LINE_PATTERNS.some((pattern) => pattern.test(value));
  }

  function cleanText(text) {
    const seen = new Set();
    const lines = normalizeText(text)
      .split(/\n+/)
      .map((line) => normalizeText(line))
      .filter((line) => line && !isUiLine(line));

    return lines.filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).join("\n");
  }

  function useful(text) {
    const value = normalizeText(text);
    if (value.length < MIN_TEXT_LENGTH) return false;
    const words = value.split(/\s+/).filter(Boolean).length;
    return words >= 6;
  }

  function cloneText(element) {
    if (!element || !isVisible(element)) return "";
    const clone = element.cloneNode(true);
    clone.querySelectorAll("script,style,svg,canvas,button,nav,[role='button'],[data-testid='reply'],[data-testid='retweet'],[data-testid='like'],[data-testid='bookmark'],[data-testid='share']")
      .forEach((node) => node.remove());
    return cleanText(clone.innerText || clone.textContent || "");
  }

  function collectBlocks() {
    const root = document.querySelector("main") || document.body;
    if (!root) return [];

    const selectors = [
      "[data-testid='tweetText']",
      "[data-testid='cellInnerDiv']",
      "article",
      "[role='article']",
      "div[lang]",
      "main div"
    ];

    const blocks = [];
    const seen = new Set();

    for (const selector of selectors) {
      root.querySelectorAll(selector).forEach((element) => {
        const text = cloneText(element);
        if (!useful(text)) return;
        const key = text.toLowerCase();
        if (seen.has(key)) return;
        if (blocks.some((existing) => existing.includes(text) || text.includes(existing))) return;
        seen.add(key);
        blocks.push(text);
      });
    }

    return blocks.sort((a, b) => b.length - a.length).slice(0, 8);
  }

  function getAuthorFromUrl() {
    const first = location.pathname.split("/").filter(Boolean)[0] || "";
    if (!first || ["home", "explore", "notifications", "messages", "i", "settings", "search"].includes(first)) return "";
    return `@${first}`;
  }

  function getPageKind() {
    if (/\/status\/\d+/i.test(location.pathname)) return "X.com post/thread/article";
    if (/\/articles?\//i.test(location.pathname)) return "X.com article";
    return "X.com page";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${SOURCE_ID} {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 760px !important;
        max-width: 760px !important;
        max-height: 2px !important;
        overflow: hidden !important;
        opacity: .02 !important;
        pointer-events: none !important;
        user-select: text !important;
        z-index: 1 !important;
        background: white !important;
        color: black !important;
        font-size: 16px !important;
        line-height: 1.5 !important;
      }
      #${SOURCE_ID} * { color: black !important; background: transparent !important; }
    `;
    document.documentElement.appendChild(style);
  }

  function renderSource(blocks) {
    const existing = document.getElementById(SOURCE_ID);
    if (!blocks.length) {
      existing?.remove();
      return;
    }

    ensureStyle();

    const title = document.title || getPageKind();
    const author = getAuthorFromUrl();
    const body = blocks.map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`).join("\n");
    const html = `
      <article id="${SOURCE_ID}" role="article" data-cpdown-xcom-source="true">
        <h1>${escapeHtml(title)}</h1>
        <p><strong>Source:</strong> ${escapeHtml(location.href)}</p>
        ${author ? `<p><strong>Author:</strong> ${escapeHtml(author)}</p>` : ""}
        <p><strong>Content type:</strong> ${escapeHtml(getPageKind())}</p>
        ${body}
      </article>
    `;

    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const sourceNode = template.content.firstElementChild;

    existing?.remove();
    const main = document.querySelector("main");
    if (main?.parentNode) main.parentNode.insertBefore(sourceNode, main);
    else (document.body || document.documentElement).prepend(sourceNode);
  }

  let updateTimer = null;
  let lastText = "";
  let lastUrl = location.href;

  function update() {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      const blocks = collectBlocks();
      const text = blocks.join("\n\n");
      if (text !== lastText || location.href !== lastUrl) {
        lastText = text;
        lastUrl = location.href;
        renderSource(blocks);
      }
    }, UPDATE_DELAY_MS);
  }

  const observer = new MutationObserver(update);

  function start() {
    update();
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    setInterval(update, PERIODIC_UPDATE_MS);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
