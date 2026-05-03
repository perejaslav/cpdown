(() => {
  if (window.__cpdownSaveSelectionLoaded) return;
  window.__cpdownSaveSelectionLoaded = true;

  const BUTTON_ID = "cpdown-save-selection-button";
  const META_ID = "cpdown-save-selection-meta";

  function escapeMarkdown(text) {
    return text.replace(/\\/g, "\\\\").replace(/([`*_{}[\]()#+\-.!>])/g, "\\$1");
  }

  function textContent(node) {
    return (node.textContent || "").replace(/\s+/g, " ").trim();
  }

  function childrenToMarkdown(node) {
    return Array.from(node.childNodes).map(nodeToMarkdown).join("");
  }

  function nodeToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) return escapeMarkdown(node.nodeValue || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const tag = node.tagName.toLowerCase();
    const inner = childrenToMarkdown(node);

    switch (tag) {
      case "h1": return `\n# ${textContent(node)}\n\n`;
      case "h2": return `\n## ${textContent(node)}\n\n`;
      case "h3": return `\n### ${textContent(node)}\n\n`;
      case "h4": return `\n#### ${textContent(node)}\n\n`;
      case "h5": return `\n##### ${textContent(node)}\n\n`;
      case "h6": return `\n###### ${textContent(node)}\n\n`;
      case "p": return `\n${inner.trim()}\n\n`;
      case "br": return "\n";
      case "strong":
      case "b": return inner.trim() ? `**${inner.trim()}**` : "";
      case "em":
      case "i": return inner.trim() ? `*${inner.trim()}*` : "";
      case "code": return `\`${(node.textContent || "").replace(/`/g, "\\`")}\``;
      case "pre": return `\n\n\`\`\`\n${node.textContent || ""}\n\`\`\`\n\n`;
      case "blockquote": return `\n${inner.trim().split("\n").map(line => `> ${line}`).join("\n")}\n\n`;
      case "a": {
        const href = node.getAttribute("href");
        return href ? `[${inner.trim() || href}](${new URL(href, location.href).href})` : inner;
      }
      case "li": return `- ${inner.trim()}\n`;
      case "ul":
      case "ol": return `\n${inner}\n`;
      case "img": {
        const src = node.getAttribute("src");
        const alt = node.getAttribute("alt") || "";
        return src ? `![${escapeMarkdown(alt)}](${new URL(src, location.href).href})` : "";
      }
      case "script":
      case "style":
      case "noscript": return "";
      default: return inner;
    }
  }

  function htmlToMarkdown(html, fallbackText) {
    const template = document.createElement("template");
    template.innerHTML = html || "";
    const md = childrenToMarkdown(template.content).replace(/\n{3,}/g, "\n\n").trim();
    return md || escapeMarkdown(fallbackText || "");
  }

  function safeFileName(value) {
    return (value || "selection")
      .replace(/[\\/:*?"<>|\u0000-\u001F]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "selection";
  }

  async function saveMarkdown(markdown, fileName) {
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: "Markdown", accept: { "text/markdown": [".md"] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(markdown);
      await writable.close();
      return;
    }

    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.documentElement.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function buildMarkdown(selection) {
    const body = htmlToMarkdown(selection.html, selection.text);
    return `# Selected Text\n\n**Title:** ${document.title || "Untitled"}\n\n**Source:** ${location.href}\n\n**Date:** ${new Date().toISOString()}\n\n---\n\n${body}\n`;
  }

  function findCurrentToast() {
    const toasts = Array.from(document.querySelectorAll("[data-sonner-toast]"));
    return toasts.find(toast => toast.textContent && toast.textContent.includes("Markdown:")) || toasts[toasts.length - 1] || null;
  }

  function addButtonToExistingToast(selection) {
    document.getElementById(BUTTON_ID)?.remove();
    document.getElementById(META_ID)?.remove();

    const toast = findCurrentToast();
    if (!toast) return false;

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "Sel";
    button.title = "Save selected text";
    button.setAttribute("data-button", "");
    button.setAttribute("data-cancel", "");
    button.style.whiteSpace = "nowrap";
    button.style.flexShrink = "0";
    button.style.paddingLeft = "7px";
    button.style.paddingRight = "7px";
    button.style.marginLeft = "0";
    button.addEventListener("click", async () => {
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Saving…";
      try {
        await saveMarkdown(buildMarkdown(selection), `${safeFileName(document.title)} - selection.md`);
        button.textContent = "Saved";
      } catch (error) {
        button.disabled = false;
        button.textContent = error && error.name === "AbortError" ? originalText : "Save failed";
        if (!(error && error.name === "AbortError")) setTimeout(() => { button.textContent = originalText; }, 1500);
      }
    });

    const content = toast.querySelector("[data-content]");
    if (content) {
      content.style.minWidth = "0";
      content.style.flex = "1 1 auto";
    }

    Array.from(toast.querySelectorAll("button")).forEach(btn => {
      btn.style.whiteSpace = "nowrap";
      btn.style.flexShrink = "0";
    });

    const savePageButton = Array.from(toast.querySelectorAll("button")).find(btn => btn.textContent && btn.textContent.includes("Save .md"));
    if (savePageButton) {
      savePageButton.insertAdjacentElement("afterend", button);
    } else {
      toast.appendChild(button);
    }

    const meta = document.createElement("div");
    meta.id = META_ID;
    meta.textContent = `Selected text: ${(selection.text || "").trim().length} chars`;
    meta.style.cssText = "font-size:11px;line-height:1.35;opacity:.72;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";

    if (content) content.appendChild(meta);
    else toast.appendChild(meta);

    requestAnimationFrame(() => {
      const height = `${toast.offsetHeight}px`;
      toast.style.setProperty("--initial-height", height);
      toast.style.setProperty("--front-toast-height", height);
      toast.style.height = "auto";
    });

    return true;
  }

  function attachWhenToastExists(selection) {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (addButtonToExistingToast(selection) || attempts >= 20) clearInterval(timer);
    }, 50);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === "CPDOWN_SELECTION_READY" && message.selection && (message.selection.text || "").trim()) {
      attachWhenToastExists(message.selection);
    }
  });
})();
