import { test, expect } from "@playwright/test";
import { fillLoginForm, waitForRedirect, expectUserToBeLoggedIn } from "./helpers";

/**
 * TC-US-002: Logowanie użytkownika
 * Historyjka: US-002 - Logowanie użytkownika
 * Tytuł: Logowanie na istniejące konto klienta
 */
test.describe("TC-US-002: Logowanie użytkownika", () => {
  // Dane testowego użytkownika - zakładamy, że konto już istnieje w bazie testowej
  const TEST_USER = {
    email: "test.client@example.com",
    password: "TestPassword123!@#",
  };

  test.beforeEach(async ({ page }) => {
    // Krok 1: Przejdź na stronę /login
    await page.goto("/login");
  });

  test("Pomyślne logowanie na istniejące konto klienta", async ({ page }) => {
    // Krok 2: Wprowadź e-mail i hasło istniejącego użytkownika
    await fillLoginForm(page, TEST_USER.email, TEST_USER.password);

    // Krok 3: Kliknij przycisk "Zaloguj"
    const submitButton = page.getByRole("button", { name: /zaloguj/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Oczekiwany rezultat: Użytkownik zostaje zalogowany i przekierowany na stronę główną
    await waitForRedirect(page, "/");

    // Weryfikacja: W nagłówku widoczna jest ikona profilu lub menu użytkownika
    await expectUserToBeLoggedIn(page);
  });

  test("Walidacja: Logowanie z pustym emailem", async ({ page }) => {
    // Pozostaw email pusty, wypełnij tylko hasło
    const passwordInput = page.getByLabel(/hasło/i);
    await passwordInput.fill(TEST_USER.password);

    const submitButton = page.getByRole("button", { name: /zaloguj/i });
    await submitButton.click();

    // Oczekiwany rezultat: Pojawia się komunikat błędu walidacji
    const errorMessage = page.getByText(/wymagane|required/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Użytkownik nie zostaje przekierowany
    await expect(page).toHaveURL(/.*login/);
  });

  test("Walidacja: Logowanie z pustym hasłem", async ({ page }) => {
    // Wypełnij email, pozostaw hasło puste
    const emailInput = page.getByLabel(/e-?mail/i);
    await emailInput.fill(TEST_USER.email);

    const submitButton = page.getByRole("button", { name: /zaloguj/i });
    await submitButton.click();

    // Oczekiwany rezultat: Pojawia się komunikat błędu walidacji
    const errorMessage = page.getByText(/wymagane|required/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Użytkownik nie zostaje przekierowany
    await expect(page).toHaveURL(/.*login/);
  });

  test("Walidacja: Logowanie z nieprawidłowym emailem", async ({ page }) => {
    // Wprowadź nieprawidłowy format email
    await fillLoginForm(page, "nieprawidlowy-email", TEST_USER.password);

    const submitButton = page.getByRole("button", { name: /zaloguj/i });
    await submitButton.click();

    // Oczekiwany rezultat: Pojawia się komunikat błędu walidacji lub autoryzacji
    const errorMessage = page.getByText(/nieprawidłowy|invalid|błąd|error/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test("Walidacja: Logowanie z nieprawidłowym hasłem", async ({ page }) => {
    // Wprowadź poprawny email, ale nieprawidłowe hasło
    await fillLoginForm(page, TEST_USER.email, "WrongPassword123!@#");

    const submitButton = page.getByRole("button", { name: /zaloguj/i });
    await submitButton.click();

    // Oczekiwany rezultat: Pojawia się komunikat o nieprawidłowych danych logowania
    const errorMessage = page.getByText(/nieprawidłowy|invalid|błędne dane|incorrect/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Użytkownik nie zostaje przekierowany
    await expect(page).toHaveURL(/.*login/);
  });

  test("Walidacja: Logowanie z nieistniejącym kontem", async ({ page }) => {
    // Wprowadź email, który nie istnieje w systemie
    await fillLoginForm(page, "nieistniejacy.uzytkownik@example.com", "Password123!@#");

    const submitButton = page.getByRole("button", { name: /zaloguj/i });
    await submitButton.click();

    // Oczekiwany rezultat: Pojawia się komunikat o nieprawidłowych danych logowania
    const errorMessage = page.getByText(/nieprawidłowy|invalid|błędne dane|incorrect/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Użytkownik nie zostaje przekierowany
    await expect(page).toHaveURL(/.*login/);
  });

  test("UI: Wyświetlanie stanu ładowania podczas logowania", async ({ page }) => {
    // Wprowadź poprawne dane
    await fillLoginForm(page, TEST_USER.email, TEST_USER.password);

    const submitButton = page.getByRole("button", { name: /zaloguj/i });

    // Kliknij przycisk submit
    await submitButton.click();

    // Sprawdź czy przycisk jest wyłączony podczas ładowania
    await expect(submitButton).toBeDisabled({ timeout: 1000 });

    // Sprawdź czy tekst przycisku zmienia się na "Logowanie..."
    await expect(submitButton).toHaveText(/logowanie/i);
  });

  test("Accessibility: Pola formularza mają odpowiednie atrybuty", async ({ page }) => {
    // Sprawdź pole email
    const emailInput = page.getByLabel(/e-?mail/i);
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("autocomplete", "email");

    // Sprawdź pole hasła
    const passwordInput = page.getByLabel(/hasło/i);
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
  });

  test("Accessibility: Błędy walidacji są poprawnie oznaczone", async ({ page }) => {
    // Wyślij formularz bez danych
    const submitButton = page.getByRole("button", { name: /zaloguj/i });
    await submitButton.click();

    // Sprawdź czy błędy są powiązane z polami przez aria-describedby
    const emailInput = page.getByLabel(/e-?mail/i);
    await expect(emailInput).toHaveAttribute("aria-invalid", "true");

    // Sprawdź czy istnieje komunikat błędu
    const errorMessage = page.getByText(/wymagane|required/i);
    await expect(errorMessage).toBeVisible();
  });

  test("Integracja: Link do odzyskiwania hasła jest widoczny", async ({ page }) => {
    // Sprawdź czy istnieje link do strony odzyskiwania hasła
    const recoveryLink = page.getByRole("link", { name: /zapomniałeś hasła|odzyskaj hasło|reset hasła/i });
    await expect(recoveryLink).toBeVisible();

    // Sprawdź czy link prowadzi do odpowiedniej strony
    await expect(recoveryLink).toHaveAttribute("href", /password-recovery|forgot-password|reset/);
  });

  test("Integracja: Link do rejestracji jest widoczny", async ({ page }) => {
    // Sprawdź czy istnieje link do strony rejestracji
    const registerLink = page.getByRole("link", { name: /zarejestruj|utwórz konto|załóż konto/i });
    await expect(registerLink).toBeVisible();

    // Sprawdź czy link prowadzi do odpowiedniej strony
    await expect(registerLink).toHaveAttribute("href", /register|rejestracja/);
  });

  test("Funkcjonalność: Wysłanie formularza klawiszem Enter", async ({ page }) => {
    // Wprowadź dane logowania
    const emailInput = page.getByLabel(/e-?mail/i);
    const passwordInput = page.getByLabel(/hasło/i);

    await emailInput.fill(TEST_USER.email);
    await passwordInput.fill(TEST_USER.password);

    // Naciśnij Enter w polu hasła
    await passwordInput.press("Enter");

    // Oczekiwany rezultat: Formularz zostaje wysłany
    await waitForRedirect(page, "/");
    await expectUserToBeLoggedIn(page);
  });
});
