import { test, expect } from "@playwright/test";

test.describe("Core pages", () => {
  test("homepage loads with no broken images", async ({ page }) => {
    const failedRequests = [];
    page.on("response", (res) => {
      if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
    });

    await page.goto("/");
    await expect(page.locator(".navbar")).toBeVisible();
    await expect(page.locator(".bio-portrait-img")).toBeVisible();

    // every <img> must report a positive natural size (i.e. actually loaded)
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const naturalWidth = await images.nth(i).evaluate((img) => img.naturalWidth);
      expect(naturalWidth, `image ${i} failed to load`).toBeGreaterThan(0);
    }

    expect(failedRequests, `Found failed network requests:\n${failedRequests.join("\n")}`).toEqual([]);
  });

  test("gallery page loads work cards and lightbox", async ({ page }) => {
    const failedRequests = [];
    page.on("response", (res) => {
      if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
    });

    await page.goto("/gallery");
    await expect(page.locator(".work-hero-image img")).toBeVisible();

    // scroll through the page so lazy-loaded images below the fold are triggered
    await page.locator(".site-footer").scrollIntoViewIfNeeded();

    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el) => el.naturalWidth), {
        message: `image ${i} failed to load`,
      }).toBeGreaterThan(0);
    }
    expect(failedRequests, `Found failed network requests:\n${failedRequests.join("\n")}`).toEqual([]);

    const cards = page.locator(".work-card");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);

    // open the lightbox on the first card
    await cards.first().locator(".work-card-image").click();
    await expect(page.locator(".lightbox-overlay")).toBeVisible();
    await expect(page.locator(".lightbox-image").first()).toBeVisible();

    // close it
    await page.locator(".lightbox-close").click();
    await expect(page.locator(".lightbox-overlay")).toBeHidden();
  });

  test("bio page loads portrait and content sections", async ({ page }) => {
    await page.goto("/bio");
    await expect(page.locator(".bio-portrait-img")).toBeVisible();
    await expect(page.locator(".bio-section.biography")).toBeVisible();
    await expect(page.locator(".bio-section.education")).toBeVisible();
  });

  test("contact page works: email link, copy button, instagram link", async ({ page, browserName }) => {
    await page.goto("/contact");

    await expect(page.locator(".contact-title")).toHaveText("Brea Freeburn");

    const emailLink = page.locator('a.contact-link[href^="mailto:"]');
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute("href", /^mailto:Bfreeburn820@gmail\.com/);

    const copyBtn = page.locator(".copy-btn");
    await expect(copyBtn).toHaveText("Copy");
    await copyBtn.click();
    // Clipboard permission isn't grantable on all browsers (e.g. WebKit),
    // so only assert the "Copied" state where the write can actually succeed.
    if (browserName === "chromium") {
      await expect(copyBtn).toHaveText("Copied");
    }

    const instagramLink = page.locator('a.contact-link[href*="instagram.com"]');
    await expect(instagramLink).toBeVisible();
    await expect(instagramLink).toHaveAttribute("target", "_blank");
  });
});

test.describe("Navigation", () => {
  async function goToViaNavbar(page, linkName, urlPattern) {
    const hamburger = page.locator(".nav-hamburger");
    if (await hamburger.isVisible()) {
      await hamburger.click();
    }
    await page.locator(".navbar").getByRole("link", { name: linkName }).click();
    await expect(page).toHaveURL(urlPattern);
  }

  test("navbar links route correctly", async ({ page }) => {
    await page.goto("/gallery");
    await goToViaNavbar(page, "Bio", /\/bio$/);
    await goToViaNavbar(page, "Contact", /\/contact$/);
    await goToViaNavbar(page, "Gallery", /\/gallery$/);
  });
});
