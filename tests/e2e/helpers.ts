import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Helpery dla testów E2E w projekcie ChairAI
 */

/**
 * Generuje unikalny adres email dla testów
 * @param prefix - Prefix emaila (domyślnie "test")
 * @returns Unikalny adres email
 */
export function generateTestEmail(prefix = "test"): string {
  return `${prefix}.${Date.now()}@example.com`;
}

/**
 * Sprawdza czy użytkownik jest zalogowany
 * @param page - Instancja strony Playwright
 */
export async function expectUserToBeLoggedIn(page: Page): Promise<void> {
  // Sprawdź czy w nagłówku widoczne jest menu użytkownika lub ikona profilu
  const userMenu = page.getByRole("button", { name: /profil|menu|konto/i });
  const userAvatar = page.locator('[aria-label*="profil" i], [aria-label*="użytkownik" i]');

  const isMenuVisible = await userMenu.isVisible().catch(() => false);
  const isAvatarVisible = await userAvatar.isVisible().catch(() => false);

  expect(isMenuVisible || isAvatarVisible).toBe(true);
}

/**
 * Sprawdza czy użytkownik jest wylogowany
 * @param page - Instancja strony Playwright
 */
export async function expectUserToBeLoggedOut(page: Page): Promise<void> {
  // Sprawdź czy widoczne są linki do logowania i rejestracji
  const loginLink = page.getByRole("link", { name: /zaloguj/i });
  const registerLink = page.getByRole("link", { name: /zarejestruj/i });

  await expect(loginLink.or(registerLink)).toBeVisible();
}

/**
 * Wypełnia formularz rejestracji
 * @param page - Instancja strony Playwright
 * @param options - Opcje rejestracji
 */
export async function fillRegistrationForm(
  page: Page,
  options: {
    email: string;
    password: string;
    confirmPassword?: string;
    accountType?: "klient" | "rzemieślnik";
  }
): Promise<void> {
  const { email, password, confirmPassword = password, accountType = "klient" } = options;

  // Wypełnij email
  const emailInput = page.getByLabel(/e-?mail/i);
  await emailInput.fill(email);

  // Wypełnij hasło
  const passwordInput = page.getByLabel(/^hasło$/i).first();
  await passwordInput.fill(password);

  // Wypełnij potwierdzenie hasła
  const confirmPasswordInput = page.getByLabel(/powtórz hasło|potwierdź hasło/i);
  await confirmPasswordInput.fill(confirmPassword);

  // Wybierz typ konta
  if (accountType) {
    const accountTypeRadio = page.getByRole("radio", { name: new RegExp(accountType, "i") });
    await accountTypeRadio.check();
  }
}

/**
 * Wypełnia formularz logowania
 * @param page - Instancja strony Playwright
 * @param email - Adres email
 * @param password - Hasło
 */
export async function fillLoginForm(page: Page, email: string, password: string): Promise<void> {
  const emailInput = page.getByLabel(/e-?mail/i);
  await emailInput.fill(email);

  const passwordInput = page.getByLabel(/hasło|password/i);
  await passwordInput.fill(password);
}

/**
 * Czeka na przekierowanie po udanej akcji
 * @param page - Instancja strony Playwright
 * @param expectedPattern - Wzorzec URL do którego oczekujemy przekierowania
 * @param timeout - Timeout w milisekundach
 */
export async function waitForRedirect(page: Page, expectedPattern: RegExp | string, timeout = 10000): Promise<void> {
  await expect(page).toHaveURL(expectedPattern, { timeout });
}

/**
 * Sprawdza czy na stronie nie ma błędów
 * @param page - Instancja strony Playwright
 */
export async function expectNoErrors(page: Page): Promise<void> {
  const errorMessages = page.getByRole("alert").locator(':has-text("błąd"), :has-text("error")');
  const errorCount = await errorMessages.count();

  if (errorCount > 0) {
    const errorTexts = await errorMessages.allTextContents();
    throw new Error(`Znaleziono błędy na stronie: ${errorTexts.join(", ")}`);
  }
}

/**
 * Testowe dane użytkownika
 */
export const TEST_USERS = {
  client: {
    email: "test.client@example.com",
    password: "TestPassword123!@#",
    type: "klient" as const,
  },
  artisan: {
    email: "test.artisan@example.com",
    password: "TestPassword123!@#",
    type: "rzemieślnik" as const,
    nip: "1234567890",
  },
};

/**
 * Testowe dane projektów
 */
export const TEST_PROJECT_DATA = {
  furniture: {
    prompt: "Nowoczesne dębowe krzesło w stylu skandynawskim",
    category: "Krzesła",
    material: "Dąb",
    size: "Standardowy",
    budget: "1000-2000 PLN",
  },
  table: {
    prompt: "Drewniany stół jadalniany w stylu rustykalnym",
    category: "Stoły",
    material: "Sosna",
    size: "Duży",
    budget: "2000-5000 PLN",
  },
};
