// Aggregates uptime, Lighthouse, Sentry, broken-link, image-size and CI data
// into a weekly health report. Compares against last week's snapshot and
// fixed thresholds, then opens a GitHub issue if anything has degraded.
//
// Expects to run after `npm run build`, `npm run lhci` and `npm run check:links`
// (their output files are read from .lighthouseci/ and .reports/).
//
// Optional env vars (skip a section if unset):
//   SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT  - Sentry unresolved issues
//   UPTIMEROBOT_API_KEY                            - UptimeRobot 7-day uptime
//   GITHUB_REPOSITORY, GH_TOKEN/GITHUB_TOKEN       - CI run history + issue creation
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportsDir = join(root, ".reports");
const historyDir = join(reportsDir, "history");
mkdirSync(historyDir, { recursive: true });

const today = new Date().toISOString().slice(0, 10);

function getLighthouse() {
  const manifestPath = join(root, ".lighthouseci", "manifest.json");
  if (!existsSync(manifestPath)) return null;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const result = {};
  for (const entry of manifest) {
    if (!entry.isRepresentativeRun || !entry.summary) continue;
    const path = new URL(entry.url).pathname || "/";
    result[path] = {
      performance: Math.round(entry.summary.performance * 100),
      accessibility: Math.round(entry.summary.accessibility * 100),
    };
  }
  return Object.keys(result).length ? result : null;
}

function getImages() {
  const p = join(reportsDir, "image-sizes.json");
  if (!existsSync(p)) return null;
  const data = JSON.parse(readFileSync(p, "utf8"));
  return {
    totalCount: data.images.length,
    oversizedCount: data.oversized.length,
    largestKB: data.images.length ? Math.max(...data.images.map((i) => i.sizeKB)) : 0,
    oversized: data.oversized.map((i) => `${i.path} (${i.sizeKB}KB)`),
  };
}

function getLinks() {
  const p = join(reportsDir, "link-check.json");
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

async function getSentry() {
  const { SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT, SENTRY_API_BASE } = process.env;
  if (!SENTRY_AUTH_TOKEN || !SENTRY_ORG || !SENTRY_PROJECT) return null;
  const base = SENTRY_API_BASE || "https://sentry.io";
  try {
    const res = await fetch(
      `${base}/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/?query=is:unresolved&statsPeriod=14d&limit=100&sort=freq`,
      { headers: { Authorization: `Bearer ${SENTRY_AUTH_TOKEN}` } }
    );
    if (!res.ok) return { error: `Sentry API returned ${res.status}` };
    const issues = await res.json();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newIssues = issues.filter((i) => new Date(i.firstSeen).getTime() > sevenDaysAgo);
    const activeLast7d = issues.filter((i) => new Date(i.lastSeen).getTime() > sevenDaysAgo);
    const eventsApprox7d = activeLast7d.reduce((sum, i) => sum + Number(i.count || 0), 0);
    return {
      unresolvedTotal: issues.length,
      newIssues7d: newIssues.length,
      eventsApprox7d,
      topIssues: issues.slice(0, 5).map((i) => `${i.title} (${i.count} events)`),
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function getUptime() {
  const { UPTIMEROBOT_API_KEY } = process.env;
  if (!UPTIMEROBOT_API_KEY) return null;
  try {
    const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        api_key: UPTIMEROBOT_API_KEY,
        format: "json",
        custom_uptime_ratios: "7",
      }),
    });
    const data = await res.json();
    if (data.stat !== "ok") return { error: `UptimeRobot API: ${data.error?.message || "unknown error"}` };
    const result = {};
    for (const m of data.monitors) {
      result[m.friendly_name || m.url] = Number(m.custom_uptime_ratio);
    }
    return result;
  } catch (e) {
    return { error: e.message };
  }
}

function getCI() {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) return null;
  try {
    const out = execSync(`gh api repos/${repo}/actions/runs?per_page=30`, { encoding: "utf8" });
    const data = JSON.parse(out);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = data.workflow_runs.filter((r) => new Date(r.created_at).getTime() > sevenDaysAgo);
    const failed = recent.filter((r) => r.conclusion === "failure");
    return {
      totalRuns7d: recent.length,
      failedRuns7d: failed.length,
      failedRunUrls: failed.map((r) => `${r.name}: ${r.html_url}`),
    };
  } catch (e) {
    return { error: e.message };
  }
}

function loadPrevious() {
  const files = readdirSync(historyDir)
    .filter((f) => f.endsWith(".json") && f !== `${today}.json`)
    .sort();
  if (!files.length) return null;
  return JSON.parse(readFileSync(join(historyDir, files[files.length - 1]), "utf8"));
}

function findDegradations(report, previous) {
  const issues = [];

  if (report.lighthouse) {
    for (const [page, scores] of Object.entries(report.lighthouse)) {
      if (scores.performance < 80) issues.push(`🔴 Lighthouse Performance for \`${page}\` is ${scores.performance} (threshold: >= 80)`);
      if (scores.accessibility < 90) issues.push(`🔴 Lighthouse Accessibility for \`${page}\` is ${scores.accessibility} (threshold: >= 90)`);
      const prev = previous?.lighthouse?.[page];
      if (prev) {
        if (scores.performance < prev.performance - 5) issues.push(`🟡 Lighthouse Performance for \`${page}\` dropped from ${prev.performance} to ${scores.performance}`);
        if (scores.accessibility < prev.accessibility - 5) issues.push(`🟡 Lighthouse Accessibility for \`${page}\` dropped from ${prev.accessibility} to ${scores.accessibility}`);
      }
    }
  }

  if (report.images) {
    if (report.images.oversizedCount > 0) {
      issues.push(`🔴 ${report.images.oversizedCount} image(s) over 500KB: ${report.images.oversized.join(", ")}`);
    }
    const prev = previous?.images;
    if (prev && report.images.largestKB > prev.largestKB * 1.1) {
      issues.push(`🟡 Largest image grew from ${prev.largestKB}KB to ${report.images.largestKB}KB`);
    }
  }

  if (report.links) {
    if (report.links.internalErrors > 0) issues.push(`🔴 ${report.links.internalErrors} internal route(s) broken`);
    if (report.links.externalErrors > 0) issues.push(`🔴 ${report.links.externalErrors} external link(s) broken`);
  }

  if (report.sentry && !report.sentry.error) {
    if (report.sentry.newIssues7d > 0) issues.push(`🔴 ${report.sentry.newIssues7d} new Sentry issue(s) in the last 7 days`);
    const prev = previous?.sentry;
    if (prev && !prev.error && report.sentry.eventsApprox7d > 10 && report.sentry.eventsApprox7d > prev.eventsApprox7d * 1.5) {
      issues.push(`🟡 Sentry events increased from ~${prev.eventsApprox7d} to ~${report.sentry.eventsApprox7d} in the last 7 days`);
    }
  }

  if (report.uptime && !report.uptime.error) {
    for (const [name, pct] of Object.entries(report.uptime)) {
      if (pct < 99) issues.push(`🔴 Uptime for ${name} is ${pct}% (threshold: >= 99%)`);
    }
    const prev = previous?.uptime;
    if (prev && !prev.error) {
      for (const [name, pct] of Object.entries(report.uptime)) {
        if (prev[name] != null && pct < prev[name] - 0.5) {
          issues.push(`🟡 Uptime for ${name} dropped from ${prev[name]}% to ${pct}%`);
        }
      }
    }
  }

  if (report.ci && !report.ci.error) {
    if (report.ci.failedRuns7d > 0) {
      issues.push(`🔴 ${report.ci.failedRuns7d} of ${report.ci.totalRuns7d} CI run(s) failed in the last 7 days: ${report.ci.failedRunUrls.join(", ")}`);
    }
  }

  return issues;
}

function buildMarkdown(report, issues) {
  const lines = [];
  lines.push(`# Weekly Health Report — ${report.date}`, "");

  lines.push("## Lighthouse");
  if (report.lighthouse) {
    lines.push("| Page | Performance | Accessibility |", "| --- | --- | --- |");
    for (const [page, s] of Object.entries(report.lighthouse)) {
      lines.push(`| ${page} | ${s.performance} | ${s.accessibility} |`);
    }
  } else {
    lines.push("_No Lighthouse data — run `npm run lhci` first._");
  }
  lines.push("");

  lines.push("## Uptime (7-day)");
  if (report.uptime && !report.uptime.error) {
    for (const [name, pct] of Object.entries(report.uptime)) lines.push(`- ${name}: ${pct}%`);
  } else if (report.uptime?.error) {
    lines.push(`_Error: ${report.uptime.error}_`);
  } else {
    lines.push("_Not configured — set `UPTIMEROBOT_API_KEY`._");
  }
  lines.push("");

  lines.push("## Sentry (last 7 days)");
  if (report.sentry && !report.sentry.error) {
    lines.push(`- Unresolved issues total: ${report.sentry.unresolvedTotal}`);
    lines.push(`- New issues in last 7 days: ${report.sentry.newIssues7d}`);
    lines.push(`- Approx. events in last 7 days: ${report.sentry.eventsApprox7d}`);
    if (report.sentry.topIssues.length) {
      lines.push("- Top issues:");
      for (const t of report.sentry.topIssues) lines.push(`  - ${t}`);
    }
  } else if (report.sentry?.error) {
    lines.push(`_Error: ${report.sentry.error}_`);
  } else {
    lines.push("_Not configured — set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`._");
  }
  lines.push("");

  lines.push("## Broken links");
  if (report.links) {
    lines.push(`- Internal routes checked, broken: ${report.links.internalErrors}`);
    lines.push(`- External/mailto links checked: ${report.links.totalLinksChecked}, broken: ${report.links.externalErrors}`);
    lines.push(`- Known placeholder links skipped: ${report.links.placeholderCount}`);
  } else {
    lines.push("_No link-check data — run `npm run check:links` first._");
  }
  lines.push("");

  lines.push("## Image sizes");
  if (report.images) {
    lines.push(`- Total images: ${report.images.totalCount}`);
    lines.push(`- Largest image: ${report.images.largestKB}KB`);
    lines.push(`- Over 500KB: ${report.images.oversizedCount}`);
    if (report.images.oversized.length) for (const o of report.images.oversized) lines.push(`  - ${o}`);
  } else {
    lines.push("_No image-size data — run `npm run audit` (part of `npm run build`) first._");
  }
  lines.push("");

  lines.push("## CI runs (last 7 days)");
  if (report.ci && !report.ci.error) {
    lines.push(`- Total runs: ${report.ci.totalRuns7d}, failed: ${report.ci.failedRuns7d}`);
    for (const f of report.ci.failedRunUrls) lines.push(`  - ${f}`);
  } else if (report.ci?.error) {
    lines.push(`_Error: ${report.ci.error}_`);
  } else {
    lines.push("_Not running in GitHub Actions — no CI run data._");
  }
  lines.push("");

  lines.push("## Degradations detected");
  if (issues.length) {
    for (const i of issues) lines.push(`- ${i}`);
  } else {
    lines.push("✅ None — all metrics within thresholds and no regressions vs. last week.");
  }

  return lines.join("\n") + "\n";
}

function createIssue(report, md) {
  const title = `Weekly health report ${report.date}: ${report.degradationCount} issue(s) detected`;
  try {
    execSync("gh label create automated-report --color FBCA04 --description 'Auto-generated weekly health report' --force", {
      stdio: "ignore",
    });
  } catch {
    // label may already exist or gh may lack permission; ignore
  }
  try {
    execSync(`gh issue create --title ${JSON.stringify(title)} --body-file - --label automated-report`, {
      input: md,
      encoding: "utf8",
    });
  } catch {
    try {
      execSync(`gh issue create --title ${JSON.stringify(title)} --body-file -`, { input: md, encoding: "utf8" });
    } catch (e2) {
      console.error("Failed to create GitHub issue:", e2.message);
    }
  }
}

async function main() {
  const report = {
    date: today,
    lighthouse: getLighthouse(),
    images: getImages(),
    links: getLinks(),
    sentry: await getSentry(),
    uptime: await getUptime(),
    ci: getCI(),
  };

  const previous = loadPrevious();
  const issues = findDegradations(report, previous);
  report.degradationCount = issues.length;

  const md = buildMarkdown(report, issues);
  writeFileSync(join(reportsDir, "latest-report.md"), md);
  writeFileSync(join(historyDir, `${today}.json`), JSON.stringify(report, null, 2));

  console.log(md);

  if (issues.length && process.env.GITHUB_ACTIONS) {
    createIssue(report, md);
    console.log(`\nOpened a GitHub issue for ${issues.length} degradation(s).`);
  } else if (issues.length) {
    console.log(`\n${issues.length} degradation(s) detected (no GitHub issue created — not running in GitHub Actions).`);
  } else {
    console.log("\n✓ No degradations detected.");
  }
}

main();
