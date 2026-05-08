(() => {
  if (window.__cpdownXComExtractorLoaded) return;
  window.__cpdownXComExtractorLoaded = true;

  const SOURCE_ID = "cpdown-xcom-markdown-source";
  const MIN_TEXT_LENGTH = 120;
  const UPDATE_DELAY_MS = 450;
  const PERIODIC_UPDATE_MS = 1500;

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

  function normalizeText(value) {
    return String(value || "")
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
    return UI_LINE_PATTERNS.some((pattern) => pattern.test(value));
  }

  function cleanLines(text) {
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
    });
  }

  function textFromElement(element) {
    if (!element || !isVisible(element)) return "";
    const clone = element.cloneNode(true);
    clone.querySelectorAll([
      "script",
      "style",
      "svg",
      "canvas",
      "button",
      "nav",
      "[role='button']",
      "[aria-label]",
      "[data-testid='caret']",
      "[data-testid='reply']",
      "[data-testid='retweet']",
      "[data-testid='like']",
      "[data-testid='bookmark']",
      "[data-testid='share']"
    ].join(",")).forEach((node) => node.remove());
    return normalizeText(clone.innerText || clone.textContent || "");
  }

  function getAuthorFromUrl() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (!parts.length) return "";
    const first = parts[0];
    if (["home", "explore", "notifications", "messages", "i", "settings", "search"].includes(first)) return "";
    return `@${first}`;
  }

  function getPageKind() {
    if (/\/status\/\d+/i.test(location.pathname)) return "X.com post/thread";
    if (/\/articles?\//i.test(location.pathname)) return "X.com article";
    return "X.com page";
  }

  function collectTweetTexts() {
    const blocks = [];
    document.querySelectorAll("[data-testid='tweetText']").forEach((element) => {
      const lines = cleanLines(textFromElement(element));
      const text = lines.join("\n");
      if (text.length >= 20) blocks.push(text);
    });
    return blocks;
  }

  function collectArticleCandidates() {
    const root = document.querySelector("main") || document.body;
    if (!root) return [];

    return Array.from(root.querySelectorAll("article, [role='article'], div"))
      .filter(isVisible)
      .map((element) => cleanLines(textFromElement(element)).join("\n"))
      .filter((text) => text.length >= MIN_TEXT_LENGTH)
      .filter((text) => {
        const lineCount = text.split("\n").length;
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        return lineCount >= 2 || wordCount >= 35;
      });
  }

  function pickBestBlocks() {
    const tweetTexts = collectTweetTexts();
    const candidates = collectArticleCandidates();
    const combined = [...tweetTexts, ...candidates]
      .map(normalizeText)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    const selected = [];
    const seen = new Set();

    for (const text of combined) {
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      if (selected.some((existing) => existing.includes(text) || text.includes(existing))) continue;
      seen.add(key);
      selected.push(text);
      if (selected.join("\n\n").length > 30000) break;
    }

    return selected;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderSource(blocks) {
    const existing = document.getElementById(SOURCE_ID);
    if (!blocks.length) {
      existing?.remove();
      return;
    }

    const title = document.title || getPageKind();
    const author = getAuthorFromUrl();
    const source = location.href;

    const html = `
      <article id="${SOURCE_ID}" data-cpdown-xcom-source="true">
        <h1>${escapeHtml(title)}</h1>
        <p><strong>Source:</strong> ${escapeHtml(source)}</p>
        ${author ? `<p><strong>Author:</strong> ${escapeHtml(author)}</p>` : ""}
        <p><strong>Content type:</strong> ${escapeHtml(getPageKind())}</p>
        ${blocks.map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`).join("\n")}
      </article>
    `;

    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const sourceNode = template.content.firstElementChild;

    sourceNode.style.cssText = [
      "position:absolute",
      "left:-100000px",
      "top:0",
      "width:720px",
      "max-width:720px",
      "height:auto",
      "overflow:visible",
      "pointer-events:none",
      "user-select:text",
      "z-index:-1",
      "background:white",
      "color:black"
    ].join(";");

    existing?.remove();
    (document.body || document.documentElement).prepend(sourceNode);
  }

  let updateTimer = null;
  let lastUrl = location.href;
  let lastText = "";

  function scheduleUpdate() {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      if (!isXHost()) return;
      const blocks = pickBestBlocks();
      const text = blocks.join("\n\n");
      if (text !== lastText || location.href !== lastUrl) {
        lastText = text;
        lastUrl = location.href;
        renderSource(blocks);
      }
    }, UPDATE_DELAY_MS);
  }

  const observer = new MutationObserver(scheduleUpdate);

  function start() {
    scheduleUpdate();
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
    setInterval(() => {
      if (location.href !== lastUrl) scheduleUpdate();
      else if (!document.getElementById(SOURCE_ID)) scheduleUpdate();
    }, PERIODIC_UPDATE_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
