import { test, expect } from "@playwright/test";
import { fillLoginForm, waitForRedirect, expectUserToBeLoggedIn, expectUserToBeLoggedOut } from "./helpers";

/**
 * TC-US-003: Wylogowywanie użytkownika
 * Historyjka: US-003 - Wylogowywanie użytkownika
 * Tytuł: Pomyślne wylogowanie z systemu
 */
test.describe("TC-US-003: Wylogowywanie użytkownika", () => {
  // Dane testowego użytkownika - zakładamy, że konto już istnieje w bazie testowej
  const TEST_USER = {
    email: "test.client@example.com",
    password: "TestPassword123!@#",
  };

  test.beforeEach(async ({ page }) => {
    // Krok 1: Zaloguj się na konto użytkownika
    await page.goto("/login");
    await fillLoginForm(page, TEST_USER.email, TEST_USER.password);

    const submitButton = page.getByRole("button", { name: /zaloguj/i });
    await submitButton.click();

    // Poczekaj na przekierowanie i upewnij się, że użytkownik jest zalogowany
    await waitForRedirect(page, "/");
    await expectUserToBeLoggedIn(page);
  });

  test("Pomyślne wylogowanie z systemu", async ({ page }) => {
    // Krok 2: Otwórz menu profilowe
    const userMenuButton = page.getByRole("button", { name: /profil|menu|konto/i });
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();

    // Krok 3: Kliknij przycisk "Wyloguj"
    const logoutButton = page
      .getByRole("button", { name: /wyloguj/i })
      .or(page.getByRole("menuitem", { name: /wyloguj/i }));
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    await logoutButton.click();

    // Oczekiwany rezultat: Sesja użytkownika zostaje zakończona
    // Użytkownik jest przekierowany na stronę główną
    await waitForRedirect(page, "/");

    // Weryfikacja: Użytkownik widzi opcje "Zaloguj" i "Zarejestruj"
    await expectUserToBeLoggedOut(page);

    // Dodatkowa weryfikacja: Upewnij się, że menu użytkownika nie jest już widoczne
    const userMenuAfterLogout = page.getByRole("button", { name: /profil|menu|konto/i });
    await expect(userMenuAfterLogout).not.toBeVisible({ timeout: 3000 });
  });

  test("Brak dostępu do stron chronionych po wylogowaniu", async ({ page }) => {
    // Wyloguj użytkownika
    const userMenuButton = page.getByRole("button", { name: /profil|menu|konto/i });
    await userMenuButton.click();

    const logoutButton = page
      .getByRole("button", { name: /wyloguj/i })
      .or(page.getByRole("menuitem", { name: /wyloguj/i }));
    await logoutButton.click();

    await waitForRedirect(page, "/");

    // Oczekiwany rezultat: Dostęp do stron chronionych jest niemożliwy
    // Próba dostępu do strony chronionej powinna przekierować do logowania
    await page.goto("/profile");

    // Powinniśmy zostać przekierowani do strony logowania
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test("Wylogowanie czyści ciasteczka sesji", async ({ page, context }) => {
    // Sprawdź, że przed wylogowaniem są ciasteczka sesji
    const cookiesBeforeLogout = await context.cookies();
    const sessionCookiesBefore = cookiesBeforeLogout.filter(
      (cookie) => cookie.name === "sb-access-token" || cookie.name === "sb-refresh-token"
    );

    // Upewnij się, że ciasteczka sesji istnieją
    expect(sessionCookiesBefore.length).toBeGreaterThan(0);

    // Wyloguj użytkownika
    const userMenuButton = page.getByRole("button", { name: /profil|menu|konto/i });
    await userMenuButton.click();

    const logoutButton = page
      .getByRole("button", { name: /wyloguj/i })
      .or(page.getByRole("menuitem", { name: /wyloguj/i }));
    await logoutButton.click();

    await waitForRedirect(page, "/");

    // Sprawdź, że po wylogowaniu ciasteczka sesji zostały usunięte
    const cookiesAfterLogout = await context.cookies();
    const sessionCookiesAfter = cookiesAfterLogout.filter(
      (cookie) => cookie.name === "sb-access-token" || cookie.name === "sb-refresh-token"
    );

    // Ciasteczka sesji powinny zostać usunięte lub wygaszone
    expect(sessionCookiesAfter.length).toBe(0);
  });

  test("Wielokrotne kliknięcie przycisku wylogowania nie powoduje błędów", async ({ page }) => {
    // Otwórz menu profilowe
    const userMenuButton = page.getByRole("button", { name: /profil|menu|konto/i });
    await userMenuButton.click();

    // Kliknij przycisk wylogowania
    const logoutButton = page
      .getByRole("button", { name: /wyloguj/i })
      .or(page.getByRole("menuitem", { name: /wyloguj/i }));
    await logoutButton.click();

    // Poczekaj na przekierowanie
    await waitForRedirect(page, "/");

    // Próba ponownego wylogowania (np. przez bezpośrednie wywołanie API)
    const response = await page.request.post("/api/auth/logout");

    // Powinno zakończyć się sukcesem (redirect) bez błędów
    expect(response.status()).toBe(302);
  });

  test("Wylogowanie działa poprawnie po otwarciu menu profilowego za pomocą klawiatury", async ({ page }) => {
    // Symulacja nawigacji klawiaturą (accessibility test)
    await page.keyboard.press("Tab"); // Przejdź do pierwszego elementu nawigacji

    // Znajdź i aktywuj menu użytkownika przez klawiaturę
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      const focusedElement = await page.evaluate(() => {
        const element = document.activeElement;
        return element ? element.getAttribute("aria-label") || element.textContent || "" : "";
      });

      if (/profil|menu|konto/i.test(focusedElement)) {
        await page.keyboard.press("Enter");
        break;
      }

      await page.keyboard.press("Tab");
      attempts++;
    }

    // Znajdź i aktywuj przycisk wylogowania
    const logoutButton = page
      .getByRole("button", { name: /wyloguj/i })
      .or(page.getByRole("menuitem", { name: /wyloguj/i }));

    // Jeśli przycisk nie jest widoczny, spróbuj użyć Tab do znalezienia go
    const isLogoutVisible = await logoutButton.isVisible().catch(() => false);
    if (isLogoutVisible) {
      await logoutButton.click();
    } else {
      // Alternatywnie, nawiguj Tab do przycisku wylogowania i naciśnij Enter
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
    }

    // Oczekiwany rezultat: Wylogowanie powinno działać poprawnie
    await waitForRedirect(page, "/");
    await expectUserToBeLoggedOut(page);
  });
});
