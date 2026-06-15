// Crawls the built site (served locally) and verifies every internal route
// resolves and every internal/external link returns a non-error status.
import { spawn } from "child_process";
import { setTimeout as sleep } from "timers/promises";
import { writeFileSync, mkdirSync } from "fs";

const PORT = 4600;
const BASE = `http://localhost:${PORT}`;
const INTERNAL_ROUTES = ["/", "/gallery", "/bio", "/contact"];

// Known placeholder links awaiting real URLs from the artist — tracked here so
// they're visible but don't block CI. Remove an entry once it's filled in.
const KNOWN_PLACEHOLDER_LINKS = [
  "https://drive.google.com/your-2025-gallery-link",
  "https://drive.google.com/your-2023-gallery-link",
  "https://drive.google.com/your-2022-degree-show-link",
  "https://drive.google.com/your-2022-liquid-arsenal-link",
];

function startServer() {
  const proc = spawn("npx", ["serve", "-s", "dist", "-l", String(PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  return proc;
}

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(BASE + "/");
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await sleep(500);
  }
  throw new Error("Local server did not start in time");
}

async function checkInternalRoutes() {
  const errors = [];
  for (const route of INTERNAL_ROUTES) {
    const url = BASE + route;
    try {
      const res = await fetch(url);
      if (!res.ok) errors.push(`Internal route ${route} returned ${res.status}`);
    } catch (e) {
      errors.push(`Internal route ${route} failed: ${e.message}`);
    }
  }
  return errors;
}

async function extractLinks() {
  // Pull <a href> values out of the built HTML + JS bundles (good enough for
  // this small static site — every link is hardcoded, not generated at runtime
  // from external data).
  const { readFileSync, readdirSync } = await import("fs");
  const { join } = await import("path");

  const links = new Set();
  // Only <a href="..."> anchors — skip <link> tags (preconnect/stylesheet
  // hrefs aren't navigable pages and commonly 404 on HEAD requests).
  const anchorRegex = /<a\s[^>]*href=["']([^"']+)["']/g;
  const jsxHrefRegex = /href:\s*["'`]([a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^"'`]+)["'`]/g;

  function scan(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(full);
      } else if (entry.name.endsWith(".html") || entry.name.endsWith(".js")) {
        const content = readFileSync(full, "utf8");
        for (const m of content.matchAll(anchorRegex)) links.add(m[1]);
        for (const m of content.matchAll(jsxHrefRegex)) links.add(m[1]);
      }
    }
  }

  scan("dist");
  return [...links].filter((l) => l.startsWith("http://") || l.startsWith("https://") || l.startsWith("mailto:"));
}

async function checkExternalLinks(links) {
  const errors = [];
  let placeholderCount = 0;
  for (const link of links) {
    if (KNOWN_PLACEHOLDER_LINKS.includes(link)) {
      console.warn(`⚠️  Skipping known placeholder link (needs a real URL): ${link}`);
      placeholderCount++;
      continue;
    }
    if (link.startsWith("mailto:")) {
      if (!/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+/.test(link)) {
        errors.push(`Invalid mailto link: ${link}`);
      }
      continue;
    }
    try {
      let res = await fetch(link, { method: "HEAD", redirect: "follow" });
      if (res.status === 405 || res.status === 403) {
        // some sites block HEAD requests; retry with GET
        res = await fetch(link, { method: "GET", redirect: "follow" });
      }
      if (!res.ok) errors.push(`External link ${link} returned ${res.status}`);
    } catch (e) {
      errors.push(`External link ${link} failed: ${e.message}`);
    }
  }
  return { errors, placeholderCount };
}

async function main() {
  const server = startServer();
  let internalErrors = [];
  let externalErrors = [];
  let placeholderCount = 0;
  let linkCount = 0;
  try {
    await waitForServer();
    internalErrors = await checkInternalRoutes();

    const links = await extractLinks();
    linkCount = links.length;
    console.log(`Found ${links.length} external/mailto link(s) to check:`, links);
    const result = await checkExternalLinks(links);
    externalErrors = result.errors;
    placeholderCount = result.placeholderCount;
  } finally {
    server.kill();
  }

  mkdirSync(".reports", { recursive: true });
  writeFileSync(
    ".reports/link-check.json",
    JSON.stringify(
      {
        internalErrors: internalErrors.length,
        externalErrors: externalErrors.length,
        placeholderCount,
        totalLinksChecked: linkCount,
        errors: [...internalErrors, ...externalErrors],
      },
      null,
      2
    )
  );

  const errors = [...internalErrors, ...externalErrors];
  if (errors.length) {
    console.error("\nLink check failed:");
    for (const e of errors) console.error("✖ " + e);
    process.exit(1);
  }
  console.log("\n✓ All internal routes and external links are reachable.");
}

main();
