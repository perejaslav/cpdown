function applyTheme() {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

if (document.body) {
  applyTheme();
} else {
  document.addEventListener("DOMContentLoaded", applyTheme);
}

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", applyTheme);
