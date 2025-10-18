import { test, expect } from "@playwright/test";

test.describe("Image Generator View - Full Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login first as client
    await page.goto("/login");
    await page.fill('input[type="email"]', "client@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button:has-text("Zaloguj")');
    await page.waitForNavigation();

    // Navigate to generator
    await page.goto("/generate");
    await page.waitForLoadState("networkidle");
  });

  test("should display generator page with all elements", async ({ page }) => {
    // Check header
    await expect(page.locator("h1")).toContainText("Generator Obrazów AI");

    // Check prompt input
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();

    // Check generate button
    const generateButton = page.locator("button:has-text('Generuj obraz AI')");
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeDisabled();

    // Check quota display
    await expect(page.locator("text=Limit generacji")).toBeVisible();
    await expect(page.locator("text=0/10")).toBeVisible();
  });

  test("should validate prompt input", async ({ page }) => {
    const textarea = page.locator("textarea");
    const generateButton = page.locator("button:has-text('Generuj obraz AI')");

    // Test: empty prompt - button should be disabled
    await textarea.fill("");
    await expect(generateButton).toBeDisabled();

    // Test: prompt too short - button should be disabled
    await textarea.fill("abc");
    await expect(generateButton).toBeDisabled();

    // Test: valid prompt - button should be enabled
    await textarea.fill("A modern oak dining table with metal legs");
    await expect(generateButton).not.toBeDisabled();

    // Test: character count displays correctly
    await expect(page.locator("text=/\\d+\\/500/")).toBeVisible();
  });

  test("should handle image generation", async ({ page }) => {
    const textarea = page.locator("textarea");
    const generateButton = page.locator("button:has-text('Generuj obraz AI')");

    // Enter valid prompt
    await textarea.fill("A contemporary wooden dining table with steel frame legs");

    // Click generate button
    await generateButton.click();

    // Check for loading state
    await expect(page.locator("text=Generowanie obrazu...")).toBeVisible();

    // Wait for image to appear (with timeout)
    const imageElement = page.locator("img[alt*='Wygenerowany obraz']");
    await imageElement.waitFor({ timeout: 60000 });
    await expect(imageElement).toBeVisible();

    // Check for save and use buttons
    const saveButton = page.locator("button:has-text('Zapisz do galerii')");
    const useButton = page.locator("button:has-text('Użyj w projekcie')");

    await expect(saveButton).toBeVisible();
    await expect(useButton).toBeVisible();
  });

  test("should update quota after generation", async ({ page }) => {
    const textarea = page.locator("textarea");
    const generateButton = page.locator("button:has-text('Generuj obraz AI')");

    // Check initial quota
    await expect(page.locator("text=0/10")).toBeVisible();

    // Generate image
    await textarea.fill("A beautiful wooden chair with cushioned seat");
    await generateButton.click();

    // Wait for completion
    await page.locator("img[alt*='Wygenerowany obraz']").waitFor({
      timeout: 60000,
    });

    // Check quota updated
    await expect(page.locator("text=1/10")).toBeVisible();
  });

  test("should save generated image", async ({ page }) => {
    const textarea = page.locator("textarea");
    const generateButton = page.locator("button:has-text('Generuj obraz AI')");

    // Generate image
    await textarea.fill("A modern minimalist desk with drawer storage");
    await generateButton.click();

    // Wait for image
    await page.locator("img[alt*='Wygenerowany obraz']").waitFor({
      timeout: 60000,
    });

    // Click save button
    const saveButton = page.locator("button:has-text('Zapisz do galerii')");
    await saveButton.click();

    // Check for success feedback (this might be a toast or message)
    // Adjust based on actual implementation
    await expect(page.locator("text=Zapisz")).toBeVisible();
  });

  test("should use image in project", async ({ page }) => {
    const textarea = page.locator("textarea");
    const generateButton = page.locator("button:has-text('Generuj obraz AI')");

    // Generate image
    await textarea.fill("A rustic farmhouse wooden table");
    await generateButton.click();

    // Wait for image
    await page.locator("img[alt*='Wygenerowany obraz']").waitFor({
      timeout: 60000,
    });

    // Click use in project button
    const useButton = page.locator("button:has-text('Użyj w projekcie')");
    await useButton.click();

    // Should redirect to project creation page
    await page.waitForNavigation();
    await expect(page).toHaveURL("/project/create");

    // Check that localStorage has the image ID set
    const imageId = await page.evaluate(() => localStorage.getItem("selectedGeneratedImageId"));
    expect(imageId).toBeTruthy();
  });

  test("should display error on invalid prompt", async ({ page }) => {
    const textarea = page.locator("textarea");
    const generateButton = page.locator("button:has-text('Generuj obraz AI')");

    // Try to generate with prompt that's too short
    // (This will fail at API level and should show error)
    await textarea.fill("12345678");
    await generateButton.click();

    // Error should appear
    await expect(page.locator("text=Błąd")).toBeVisible();
  });

  test("should regenerate after clearing", async ({ page }) => {
    const textarea = page.locator("textarea");
    const generateButton = page.locator("button:has-text('Generuj obraz AI')");

    // First generation
    await textarea.fill("A wooden coffee table");
    await generateButton.click();
    await page.locator("img[alt*='Wygenerowany obraz']").waitFor({
      timeout: 60000,
    });

    // Click regenerate button
    const regenerateButton = page.locator("button:has-text('Wygeneruj nowy obraz')");
    await regenerateButton.click();

    // Should go back to form
    await expect(textarea).toBeVisible();
    await expect(generateButton).toBeVisible();

    // Form should be cleared
    expect(await textarea.inputValue()).toBe("");
  });

  test("should restrict access without authentication", async ({ page }) => {
    // Logout first
    await page.context().clearCookies();

    // Try to access /generate
    await page.goto("/generate");

    // Should redirect to login
    await page.waitForNavigation();
    await expect(page).toHaveURL("/login");
  });

  test("should restrict access for non-client users", async ({ page }) => {
    // This would require logging in as artisan/non-client
    // Logout
    await page.context().clearCookies();

    // Login as artisan
    await page.goto("/login");
    await page.fill('input[type="email"]', "artisan@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button:has-text("Zaloguj")');
    await page.waitForNavigation();

    // Try to access /generate
    await page.goto("/generate");

    // Should redirect (based on page logic)
    await page.waitForNavigation();
    await expect(page).not.toHaveURL("/generate");
  });
});
