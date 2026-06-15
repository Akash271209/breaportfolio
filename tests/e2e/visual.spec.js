import { test, expect } from "@playwright/test";

// Visual regression baselines. Run `npx playwright test --update-snapshots`
// after an intentional design change to refresh the baseline images.
const pages = [
  { name: "home", path: "/" },
  { name: "gallery", path: "/gallery" },
  { name: "bio", path: "/bio" },
  { name: "contact", path: "/contact" },
];

for (const { name, path } of pages) {
  test(`${name} page visual snapshot`, async ({ page }) => {
    await page.goto(path);
    // wait for the page-enter fade transition to finish
    await page.locator(".page-wrapper.visible").waitFor();
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
