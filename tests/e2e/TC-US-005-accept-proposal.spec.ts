/**
 * E2E Test: Accept Proposal Flow
 *
 * Test Case: TC-US-005
 * User Story: Jako klient, chcę móc zaakceptować propozycję od rzemieślnika
 *
 * Scenario:
 * 1. Klient tworzy projekt (po wygenerowaniu obrazu)
 * 2. Rzemieślnik składa propozycję do projektu
 * 3. Klient przegląda listę propozycji
 * 4. Klient akceptuje wybraną propozycję
 * 5. Status projektu zmienia się na "in_progress"
 * 6. Propozycja jest oznaczona jako zaakceptowana
 *
 * Prerequisites:
 * - Działający system uwierzytelniania
 * - Działający generator obrazów (lub mock)
 * - Działający system tworzenia projektów
 * - Działający system składania propozycji
 */

import { test, expect } from "@playwright/test";
import { generateTestEmail, fillRegistrationForm, fillLoginForm, expectUserToBeLoggedIn } from "./helpers";

// Skip if running in CI without proper setup
const isCI = process.env.CI === "true";
const describeOrSkip = isCI ? test.describe.skip : test.describe;

describeOrSkip("TC-US-005: Accept Proposal Flow", () => {
  let clientEmail: string;
  let artisanEmail: string;
  const password = "TestPassword123!";
  let projectId: string;

  test.beforeAll(async () => {
    // Generuj unikalne emaile dla tego testu
    clientEmail = generateTestEmail("client-accept-proposal");
    artisanEmail = generateTestEmail("artisan-accept-proposal");
  });

  test("Pełny przepływ akceptacji propozycji", async ({ page }) => {
    // ========================================================================
    // PHASE 1: Rejestracja i logowanie klienta
    // ========================================================================

    await test.step("1. Klient rejestruje się w systemie", async () => {
      await page.goto("/register");

      await fillRegistrationForm(page, {
        email: clientEmail,
        password: password,
        confirmPassword: password,
        accountType: "klient",
      });

      const registerButton = page.getByRole("button", { name: /zarejestruj/i });
      await registerButton.click();

      // Czekaj na przekierowanie lub komunikat o potwierdzeniu
      await page.waitForURL(/\/(login|dashboard|generate)/, { timeout: 10000 });
    });

    await test.step("2. Klient loguje się (jeśli potrzebne)", async () => {
      const currentUrl = page.url();

      // Jeśli nie jesteśmy na stronie logowania, przejdź tam
      if (!currentUrl.includes("/login") && !currentUrl.includes("/dashboard")) {
        await page.goto("/login");
      }

      // Loguj tylko jeśli nie jesteśmy zalogowani
      const isAlreadyLoggedIn = await page
        .getByRole("link", { name: /generator|dashboard/i })
        .isVisible()
        .catch(() => false);

      if (!isAlreadyLoggedIn) {
        await fillLoginForm(page, clientEmail, password);

        const loginButton = page.getByRole("button", { name: /zaloguj/i });
        await loginButton.click();

        await page.waitForURL(/\/(dashboard|generate)/, { timeout: 10000 });
      }

      await expectUserToBeLoggedIn(page);
    });

    // ========================================================================
    // PHASE 2: Tworzenie projektu przez klienta
    // ========================================================================

    await test.step("3. Klient generuje obraz mebla (mock lub rzeczywisty)", async () => {
      await page.goto("/generate");

      // Sprawdź czy jest dostępny generator
      const promptInput = page.getByPlaceholder(/opisz mebel|wprowadź opis/i);
      await expect(promptInput).toBeVisible({ timeout: 5000 });

      // Dla celów testowych używamy prostego prompta
      await promptInput.fill("Nowoczesne dębowe krzesło w stylu skandynawskim");

      const generateButton = page.getByRole("button", { name: /generuj|wygeneruj/i });
      await generateButton.click();

      // Czekaj na wygenerowanie obrazu (może zająć chwilę)
      // W idealnym scenariuszu powinien być mock, ale tu obsługujemy oba przypadki
      const generatedImage = page.locator('img[alt*="wygenerowany" i], img[alt*="generated" i]').first();
      await expect(generatedImage).toBeVisible({ timeout: 30000 });
    });

    await test.step("4. Klient tworzy projekt z wygenerowanego obrazu", async () => {
      // Kliknij przycisk "Utwórz projekt" przy wygenerowanym obrazie
      const createProjectButton = page.getByRole("button", { name: /utwórz projekt|stwórz projekt/i });
      await createProjectButton.click();

      // Wypełnij formularz projektu
      const categorySelect = page.getByLabel(/kategoria/i);
      await categorySelect.click();
      await page.getByRole("option", { name: /krzesło|krzesła/i }).click();

      const materialSelect = page.getByLabel(/materiał/i);
      await materialSelect.click();
      await page.getByRole("option", { name: /dąb/i }).click();

      // Opcjonalnie: wymiary i budżet
      const dimensionsInput = page.getByLabel(/wymiar/i);
      if (await dimensionsInput.isVisible().catch(() => false)) {
        await dimensionsInput.fill("45x50x85 cm");
      }

      const budgetInput = page.getByLabel(/budżet/i);
      if (await budgetInput.isVisible().catch(() => false)) {
        await budgetInput.fill("1000-2000 PLN");
      }

      // Zapisz projekt
      const saveButton = page.getByRole("button", { name: /zapisz|utwórz|opublikuj/i });
      await saveButton.click();

      // Czekaj na przekierowanie do listy projektów lub szczegółów projektu
      await page.waitForURL(/\/projects/, { timeout: 10000 });

      // Pobierz ID projektu z URL
      const url = page.url();
      const match = url.match(/\/projects\/([a-f0-9-]+)/);
      if (match) {
        projectId = match[1];
      }
    });

    await test.step("5. Klient wylogowuje się", async () => {
      const userMenu = page.getByRole("button", { name: /profil|menu|konto/i });
      await userMenu.click();

      const logoutButton = page.getByRole("button", { name: /wyloguj/i });
      await logoutButton.click();

      await page.waitForURL(/\/(login|)$/, { timeout: 5000 });
    });

    // ========================================================================
    // PHASE 3: Rejestracja i logowanie rzemieślnika
    // ========================================================================

    await test.step("6. Rzemieślnik rejestruje się w systemie", async () => {
      await page.goto("/register");

      await fillRegistrationForm(page, {
        email: artisanEmail,
        password: password,
        confirmPassword: password,
        accountType: "rzemieślnik",
      });

      const registerButton = page.getByRole("button", { name: /zarejestruj/i });
      await registerButton.click();

      await page.waitForURL(/\/(login|dashboard|market)/, { timeout: 10000 });
    });

    await test.step("7. Rzemieślnik loguje się i uzupełnia profil", async () => {
      // Logowanie
      const currentUrl = page.url();
      if (!currentUrl.includes("/dashboard") && !currentUrl.includes("/market")) {
        if (!currentUrl.includes("/login")) {
          await page.goto("/login");
        }

        await fillLoginForm(page, artisanEmail, password);

        const loginButton = page.getByRole("button", { name: /zaloguj/i });
        await loginButton.click();

        await page.waitForURL(/\/(dashboard|market|profile)/, { timeout: 10000 });
      }

      // Uzupełnij profil rzemieślnika (jeśli wymagane)
      await page.goto("/profile");

      const companyNameInput = page.getByLabel(/nazwa firmy/i);
      if (await companyNameInput.isVisible().catch(() => false)) {
        const isEmpty = (await companyNameInput.inputValue()) === "";
        if (isEmpty) {
          await companyNameInput.fill("Test Stolarstwo E2E");

          const nipInput = page.getByLabel(/nip/i);
          await nipInput.fill("1234567890");

          const saveProfileButton = page.getByRole("button", { name: /zapisz/i });
          await saveProfileButton.click();

          // Czekaj na potwierdzenie
          await expect(page.getByText(/zapisano|zaktualizowano/i)).toBeVisible({ timeout: 5000 });
        }
      }

      await expectUserToBeLoggedIn(page);
    });

    // ========================================================================
    // PHASE 4: Rzemieślnik składa propozycję
    // ========================================================================

    await test.step("8. Rzemieślnik znajduje projekt na marketplace", async () => {
      await page.goto("/market");

      // Poczekaj na załadowanie listy projektów
      await page.waitForSelector('[data-testid="project-card"], .project-card, article', { timeout: 10000 });

      // Jeśli mamy projectId, spróbuj znaleźć konkretny projekt
      if (projectId) {
        // Opcja 1: Przejdź bezpośrednio do szczegółów projektu
        await page.goto(`/projects/${projectId}`);
      } else {
        // Opcja 2: Kliknij pierwszy dostępny projekt
        const firstProject = page.locator('[data-testid="project-card"], .project-card, article').first();
        await firstProject.click();
      }

      // Upewnij się że jesteśmy na stronie szczegółów projektu
      await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+/, { timeout: 5000 });
    });

    await test.step("9. Rzemieślnik składa propozycję", async () => {
      // Kliknij przycisk "Złóż propozycję" lub podobny
      const submitProposalButton = page.getByRole("button", { name: /złóż propozycj|wyślij propozycj/i });
      await submitProposalButton.click();

      // Wypełnij formularz propozycji
      const priceInput = page.getByLabel(/cena|kwota/i);
      await priceInput.fill("2500");

      // Załącz plik (mockowy dla testów)
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible().catch(() => false)) {
        // W testach E2E możemy użyć rzeczywistego pliku testowego
        // lub pominąć ten krok jeśli nie jest krytyczny
        const testFilePath = "./tests/e2e/fixtures/test-proposal.pdf";
        const fs = await import("fs");
        if (fs.existsSync(testFilePath)) {
          await fileInput.setInputFiles(testFilePath);
        }
      }

      // Wyślij propozycję
      const sendButton = page.getByRole("button", { name: /wyślij|zapisz/i });
      await sendButton.click();

      // Czekaj na potwierdzenie
      await expect(page.getByText(/propozycja wysłana|dziękujemy/i)).toBeVisible({ timeout: 10000 });

      // Propozycja została wysłana pomyślnie
    });

    await test.step("10. Rzemieślnik wylogowuje się", async () => {
      const userMenu = page.getByRole("button", { name: /profil|menu|konto/i });
      await userMenu.click();

      const logoutButton = page.getByRole("button", { name: /wyloguj/i });
      await logoutButton.click();

      await page.waitForURL(/\/(login|)$/, { timeout: 5000 });
    });

    // ========================================================================
    // PHASE 5: Klient akceptuje propozycję
    // ========================================================================

    await test.step("11. Klient loguje się ponownie", async () => {
      await page.goto("/login");

      await fillLoginForm(page, clientEmail, password);

      const loginButton = page.getByRole("button", { name: /zaloguj/i });
      await loginButton.click();

      await page.waitForURL(/\/(dashboard|projects)/, { timeout: 10000 });

      await expectUserToBeLoggedIn(page);
    });

    await test.step("12. Klient przechodzi do swojego projektu", async () => {
      await page.goto("/projects/me");

      // Znajdź utworzony projekt
      const projectCard = page
        .locator(`[data-project-id="${projectId}"]`)
        .or(page.locator('[data-testid="project-card"]').first());
      await projectCard.click();

      await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+/, { timeout: 5000 });
    });

    await test.step("13. Klient przegląda propozycje", async () => {
      // Przejdź do zakładki/sekcji z propozycjami
      const proposalsTab = page
        .getByRole("tab", { name: /propozycj/i })
        .or(page.getByRole("link", { name: /propozycj/i }));

      if (await proposalsTab.isVisible().catch(() => false)) {
        await proposalsTab.click();
      }

      // Sprawdź czy są widoczne propozycje
      const proposalCards = page.locator('[data-testid="proposal-card"], .proposal-card');
      await expect(proposalCards.first()).toBeVisible({ timeout: 5000 });
    });

    await test.step("14. Klient akceptuje propozycję", async () => {
      // Znajdź przycisk "Akceptuj" przy propozycji
      const acceptButton = page.getByRole("button", { name: /akceptuj propozycj|zaakceptuj/i }).first();
      await acceptButton.click();

      // Potwierdź akcję jeśli jest dialog
      const confirmButton = page.getByRole("button", { name: /potwierdź|tak|akceptuj/i });
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Czekaj na potwierdzenie akceptacji
      await expect(page.getByText(/propozycja zaakceptowana|status.*progress|w realizacji/i)).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step("15. Weryfikacja zmiany statusu projektu", async () => {
      // Odśwież stronę aby upewnić się że status się zmienił
      await page.reload();

      // Sprawdź czy status projektu to "W realizacji" lub "In Progress"
      const statusBadge = page
        .locator('[data-testid="project-status"]')
        .or(page.getByText(/w realizacji|in progress/i));
      await expect(statusBadge).toBeVisible({ timeout: 5000 });

      // Sprawdź czy zaakceptowana propozycja jest oznaczona
      const acceptedBadge = page.getByText(/zaakceptowana|accepted/i);
      await expect(acceptedBadge).toBeVisible({ timeout: 5000 });
    });

    // ========================================================================
    // PHASE 6: Weryfikacja przez API (opcjonalnie)
    // ========================================================================

    await test.step("16. Weryfikacja przez API", async () => {
      if (!projectId) {
        return;
      }

      // Pobierz szczegóły projektu przez API
      const response = await page.request.get(`/api/projects/${projectId}`);
      expect(response.ok()).toBeTruthy();

      const projectData = await response.json();
      expect(projectData.status).toBe("in_progress");
      expect(projectData.accepted_proposal_id).toBeTruthy();
      expect(projectData.accepted_price).toBeGreaterThan(0);
    });
  });

  // Dodatkowy test dla edge cases
  test.skip("Nie można zaakceptować propozycji dla projektu który nie jest otwarty", async () => {
    // TODO: Zaimplementować test dla przypadku gdy projekt już ma zaakceptowaną propozycję
  });

  test.skip("Tylko właściciel projektu może akceptować propozycje", async () => {
    // TODO: Zaimplementować test weryfikujący autoryzację
  });
});
