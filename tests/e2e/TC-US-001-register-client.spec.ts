import { test, expect } from "@playwright/test";

/**
 * TC-US-001: Rejestracja konta klienta
 * Historyjka: US-001 - Rejestracja konta klienta
 * Tytuł: Pomyślna rejestracja nowego klienta
 */
test.describe("TC-US-001: Rejestracja konta klienta", () => {
  const testEmail = `test.klient.${Date.now()}@example.com`;
  const testPassword = "TestPassword123!@#";

  test.beforeEach(async ({ page }) => {
    // Krok 1: Przejdź na stronę /register
    await page.goto("/register");
  });

  test("Pomyślna rejestracja nowego klienta", async ({ page }) => {
    // Krok 2: Wypełnij pole "E-mail" poprawnym adresem email
    const emailInput = page.getByLabel(/e-?mail/i);
    await expect(emailInput).toBeVisible();
    await emailInput.fill(testEmail);

    // Krok 3: Wypełnij pole "Hasło" i "Powtórz hasło" tym samym, silnym hasłem
    const passwordInput = page.getByLabel(/^hasło$/i).first();
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(testPassword);

    const confirmPasswordInput = page.getByLabel(/powtórz hasło|potwierdź hasło/i);
    await expect(confirmPasswordInput).toBeVisible();
    await confirmPasswordInput.fill(testPassword);

    // Krok 4: Zaznacz, że typ konta to "Klient"
    const clientRadio = page.getByRole("radio", { name: /klient/i });
    await expect(clientRadio).toBeVisible();
    await clientRadio.check();
    await expect(clientRadio).toBeChecked();

    // Krok 5: Kliknij przycisk "Zarejestruj się"
    const submitButton = page.getByRole("button", { name: /zarejestruj/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Oczekiwany rezultat: Użytkownik zostaje przekierowany na stronę z prośbą
    // o potwierdzenie adresu e-mail
    await expect(page).toHaveURL(/.*confirm|success|verify/i, { timeout: 10000 });

    // Weryfikacja, czy pojawia się komunikat o konieczności potwierdzenia email
    await expect(page.getByText(/potwierdź|weryfikuj|sprawdź|e-?mail/i)).toBeVisible({ timeout: 5000 });

    // Dodatkowa weryfikacja: sprawdź czy nie ma błędów walidacji
    const errorMessages = page.getByRole("alert").or(page.locator('[role="status"]'));
    const errorCount = await errorMessages.count();

    if (errorCount > 0) {
      const errorTexts = await errorMessages.allTextContents();
      // Ignoruj informacje o wysłaniu emaila, szukaj tylko prawdziwych błędów
      const hasActualErrors = errorTexts.some((text) => !text.match(/wysłano|wyslano|sprawdź|potwierdź/i));
      expect(hasActualErrors).toBe(false);
    }
  });

  test("Walidacja: Rejestracja z nieprawidłowym emailem", async ({ page }) => {
    // Wypełnij formularz z nieprawidłowym emailem
    const emailInput = page.getByLabel(/e-?mail/i);
    await emailInput.fill("nieprawidlowy-email");

    const passwordInput = page.getByLabel(/^hasło$/i).first();
    await passwordInput.fill(testPassword);

    const confirmPasswordInput = page.getByLabel(/powtórz hasło|potwierdź hasło/i);
    await confirmPasswordInput.fill(testPassword);

    const clientRadio = page.getByRole("radio", { name: /klient/i });
    await clientRadio.check();

    const submitButton = page.getByRole("button", { name: /zarejestruj/i });
    await submitButton.click();

    // Oczekiwany rezultat: Pojawia się komunikat błędu walidacji
    const errorMessage = page.getByText(/nieprawidłowy|błąd|error|invalid/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test("Walidacja: Rejestracja z niezgodnymi hasłami", async ({ page }) => {
    const emailInput = page.getByLabel(/e-?mail/i);
    await emailInput.fill(testEmail);

    const passwordInput = page.getByLabel(/^hasło$/i).first();
    await passwordInput.fill(testPassword);

    const confirmPasswordInput = page.getByLabel(/powtórz hasło|potwierdź hasło/i);
    await confirmPasswordInput.fill("InnehAslo123!@#");

    const clientRadio = page.getByRole("radio", { name: /klient/i });
    await clientRadio.check();

    const submitButton = page.getByRole("button", { name: /zarejestruj/i });
    await submitButton.click();

    // Oczekiwany rezultat: Pojawia się komunikat o niezgodnych hasłach
    const errorMessage = page.getByText(/hasła.*różn|niezgodne|nie pasują|muszą być takie same/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test("Walidacja: Rejestracja bez wybrania typu konta", async ({ page }) => {
    const emailInput = page.getByLabel(/e-?mail/i);
    await emailInput.fill(testEmail);

    const passwordInput = page.getByLabel(/^hasło$/i).first();
    await passwordInput.fill(testPassword);

    const confirmPasswordInput = page.getByLabel(/powtórz hasło|potwierdź hasło/i);
    await confirmPasswordInput.fill(testPassword);

    // Nie zaznaczamy typu konta

    const submitButton = page.getByRole("button", { name: /zarejestruj/i });
    await submitButton.click();

    // Oczekiwany rezultat: Pojawia się komunikat o konieczności wyboru typu konta
    const errorMessage = page.getByText(/wybierz|wymagane|pole.*obowiązkowe/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test("Walidacja: Rejestracja z istniejącym emailem", async ({ page }) => {
    // Ten test wymaga wcześniejszego utworzenia konta testowego
    // lub użycia znanego emaila, który już istnieje w systemie
    const existingEmail = "existing@example.com";

    const emailInput = page.getByLabel(/e-?mail/i);
    await emailInput.fill(existingEmail);

    const passwordInput = page.getByLabel(/^hasło$/i).first();
    await passwordInput.fill(testPassword);

    const confirmPasswordInput = page.getByLabel(/powtórz hasło|potwierdź hasło/i);
    await confirmPasswordInput.fill(testPassword);

    const clientRadio = page.getByRole("radio", { name: /klient/i });
    await clientRadio.check();

    const submitButton = page.getByRole("button", { name: /zarejestruj/i });
    await submitButton.click();

    // Oczekiwany rezultat: Pojawia się komunikat o istniejącym koncie
    // lub zostajemy przekierowani do strony logowania
    await page.waitForTimeout(2000); // Czekamy na odpowiedź serwera

    const possibleErrorMessage = page.getByText(/istnieje|zajęty|zarejestrowany|already exists/i);
    const isOnLoginPage = page.url().includes("/login");

    expect((await possibleErrorMessage.isVisible()) || isOnLoginPage).toBe(true);
  });

  test("UI: Weryfikacja responsywności formularza rejestracji", async ({ page }) => {
    // Test na różnych rozmiarach ekranu
    const viewports = [
      { width: 375, height: 667, name: "Mobile" },
      { width: 768, height: 1024, name: "Tablet" },
      { width: 1920, height: 1080, name: "Desktop" },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/register");

      // Sprawdź czy wszystkie elementy są widoczne
      await expect(page.getByLabel(/e-?mail/i)).toBeVisible();
      await expect(page.getByLabel(/^hasło$/i).first()).toBeVisible();
      await expect(page.getByLabel(/powtórz hasło|potwierdź hasło/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /zarejestruj/i })).toBeVisible();

      // Sprawdź czy formularz jest dostępny (nie wychodzi poza viewport)
      const form = page.locator("form").first();
      const boundingBox = await form.boundingBox();
      expect(boundingBox).not.toBeNull();
      if (boundingBox) {
        expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });

  test("Accessibility: Weryfikacja dostępności formularza", async ({ page }) => {
    // Sprawdź czy formularz ma odpowiednie etykiety ARIA
    const emailInput = page.getByLabel(/e-?mail/i);
    await expect(emailInput).toHaveAttribute("type", "email");

    const passwordInput = page.getByLabel(/^hasło$/i).first();
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Sprawdź czy można nawigować formularzem za pomocą klawiatury
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(passwordInput).toBeFocused();

    // Sprawdź czy przyciski mają odpowiednie role
    const submitButton = page.getByRole("button", { name: /zarejestruj/i });
    await expect(submitButton).toHaveAttribute("type", "submit");
  });
});
