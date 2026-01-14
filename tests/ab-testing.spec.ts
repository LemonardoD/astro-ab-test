import { test, expect } from "@playwright/test";

test.describe("A/B Testing Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies before each test
    await page.context().clearCookies();
  });

  test("No cookie, no query - show first variants, no meta", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator('[data-experiment="pricing:a"]')).toBeVisible();
    await expect(page.locator('[data-experiment="pricing:b"]')).toBeHidden();
    await expect(page.locator('[data-experiment="cta:x"]')).toBeVisible();
    await expect(page.locator('[data-experiment="cta:y"]')).toBeHidden();
    await expect(page.locator('meta[name="experiment"]')).toHaveCount(0);
  });

  test("With cookies - show cookie variants, add meta", async ({ page }) => {
    await page.context().addCookies([
      { name: "experiment-pricing", value: "b", url: "http://localhost:4321" },
      { name: "experiment-cta", value: "y", url: "http://localhost:4321" }
    ]);
    await page.goto("/about");
    await expect(page.locator('[data-experiment="pricing:b"]')).toBeVisible();
    await expect(page.locator('[data-experiment="pricing:a"]')).toBeHidden();
    await expect(page.locator('[data-experiment="cta:y"]')).toBeVisible();
    await expect(page.locator('[data-experiment="cta:x"]')).toBeHidden();
    await expect(page.locator('meta[name="experiment"][content="pricing:b"]')).toHaveCount(1);
    await expect(page.locator('meta[name="experiment"][content="cta:y"]')).toHaveCount(1);
  });

  test("With query - show query variants, add meta", async ({ page }) => {
    await page.goto("/about?experiment=pricing:b,cta:y");
    await expect(page.locator('[data-experiment="pricing:b"]')).toBeVisible();
    await expect(page.locator('[data-experiment="pricing:a"]')).toBeHidden();
    await expect(page.locator('[data-experiment="cta:y"]')).toBeVisible();
    await expect(page.locator('[data-experiment="cta:x"]')).toBeHidden();
    await expect(page.locator('meta[name="experiment"][content="pricing:b"]')).toHaveCount(1);
    await expect(page.locator('meta[name="experiment"][content="cta:y"]')).toHaveCount(1);
  });

  test("Query overwrites cookie", async ({ page }) => {
    await page.context().addCookies([
      { name: "experiment-pricing", value: "a", url: "http://localhost:4321" },
      { name: "experiment-cta", value: "x", url: "http://localhost:4321" }
    ]);
    await page.goto("/about?experiment=pricing:b,cta:y");
    await expect(page.locator('[data-experiment="pricing:b"]')).toBeVisible();
    await expect(page.locator('[data-experiment="cta:y"]')).toBeVisible();
    await expect(page.locator('meta[name="experiment"][content="pricing:b"]')).toHaveCount(1);
    await expect(page.locator('meta[name="experiment"][content="cta:y"]')).toHaveCount(1);
  });

  test("Wrong variant in query - ignore, show first", async ({ page }) => {
    await page.goto("/about?experiment=pricing:z,cta:w");
    await expect(page.locator('[data-experiment="pricing:a"]')).toBeVisible();
    await expect(page.locator('[data-experiment="cta:x"]')).toBeVisible();
    await expect(page.locator('meta[name="experiment"]')).toHaveCount(0);
  });

  test("Wrong variant in cookie - ignore cookie, show first", async ({ page }) => {
    await page.context().addCookies([
      { name: "experiment-pricing", value: "z", url: "http://localhost:4321" },
      { name: "experiment-cta", value: "w", url: "http://localhost:4321" }
    ]);
    await page.goto("/about");
    await expect(page.locator('[data-experiment="pricing:a"]')).toBeVisible();
    await expect(page.locator('[data-experiment="cta:x"]')).toBeVisible();
    await expect(page.locator('meta[name="experiment"]')).toHaveCount(0);
  });

  test("Partial query - only specified experiments", async ({ page }) => {
    await page.goto("/about?experiment=pricing:b");
    await expect(page.locator('[data-experiment="pricing:b"]')).toBeVisible();
    await expect(page.locator('[data-experiment="cta:x"]')).toBeVisible(); // first for cta
    expect(page.locator('meta[name="experiment"][content="pricing:b"]')).toBeTruthy();
    await expect(page.locator('meta[name="experiment"][content="cta:x"]')).toHaveCount(0); // no meta for default
  });

  test("Dictionary variant one - with de", async ({ page }) => {
    await page.goto("/de/multilang?experiment=lang:one");
    await expect(page.locator('[data-experiment="lang:one"]')).toBeVisible();
    await expect(page.locator('[data-experiment="lang:two"]')).toBeHidden();
    await expect(page.locator("h2").getByText("Sprachoptionen")).toBeVisible();
    await expect(page.locator("p").getByText("Viele")).toBeVisible();
    expect(page.locator('meta[name="experiment"][content="lang:one"]')).toBeTruthy();
  });

  test("Dictionary variant two - with de", async ({ page }) => {
    await page.goto("/de/multilang?experiment=lang:two");
    await expect(page.locator('[data-experiment="lang:two"]')).toBeVisible();
    await expect(page.locator('[data-experiment="lang:one"]')).toBeHidden();
    await expect(page.locator("h2").getByText("New text")).toBeVisible();
    await expect(page.locator("p").getByText("Completly different text")).toBeVisible();
    expect(page.locator('meta[name="experiment"][content="lang:two"]')).toBeTruthy();
  });
});
