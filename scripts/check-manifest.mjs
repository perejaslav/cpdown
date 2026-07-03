#!/usr/bin/env node
/**
 * Validates the built manifest against expected values.
 * Run after `pnpm build`.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const manifestPath = resolve(root, ".output/chrome-mv3/manifest.json");
const pkgPath = resolve(root, "package.json");

let failed = false;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed = true;
  }
}

// --- Load files ---
if (!existsSync(manifestPath)) {
  console.error("✗ Built manifest not found at .output/chrome-mv3/manifest.json");
  console.error("  Run `pnpm build` first.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

console.log("\nManifest validation:\n");

// --- Basic checks ---
check("manifest_version is 3", manifest.manifest_version === 3);
check("version matches package.json", manifest.version === pkg.version, `manifest: ${manifest.version}, package: ${pkg.version}`);

// --- Permission checks ---
const EXPECTED_PERMISSIONS = ["activeTab", "clipboardWrite", "contextMenus", "scripting", "storage"];
const EXPECTED_HOST_PERMISSIONS = ["<all_urls>"];

const actualPerms = [...(manifest.permissions || [])].sort();
const expectedPerms = [...EXPECTED_PERMISSIONS].sort();
check(
  "permissions match expected set",
  JSON.stringify(actualPerms) === JSON.stringify(expectedPerms),
  `got: [${actualPerms.join(", ")}]`
);

const actualHost = [...(manifest.host_permissions || [])].sort();
const expectedHost = [...EXPECTED_HOST_PERMISSIONS].sort();
check(
  "host_permissions match expected set",
  JSON.stringify(actualHost) === JSON.stringify(expectedHost),
  `got: [${actualHost.join(", ")}]`
);

// --- Entry point checks ---
check("background service_worker exists", !!manifest.background?.service_worker);
check("content_scripts array exists", Array.isArray(manifest.content_scripts));

console.log("");
if (failed) {
  console.error("Manifest validation FAILED.\n");
  process.exit(1);
} else {
  console.log("Manifest validation passed.\n");
}
