# Przykłady Użycia - Testy E2E

## Podstawowe Użycie

### Uruchomienie wszystkich testów

```bash
npm run test:e2e
```

### Uruchomienie w trybie interaktywnym (polecane dla developmentu)

```bash
npm run test:e2e:ui
```

### Uruchomienie konkretnego pliku testowego

```bash
npx playwright test TC-US-001-register-client.spec.ts
```

### Uruchomienie konkretnego testu

```bash
npx playwright test TC-US-001-register-client.spec.ts -g "Pomyślna rejestracja"
```

### Uruchomienie tylko na jednej przeglądarce

```bash
npx playwright test --project=chromium
```

## Debugowanie

### Tryb debug - krok po kroku

```bash
npm run test:e2e:debug
```

### Uruchomienie z widocznymi przeglądarkami

```bash
npm run test:e2e:headed
```

### Wyświetlenie raportu HTML

```bash
npm run test:e2e:report
```

### Trace viewer (po uruchomieniu testów)

```bash
npx playwright show-trace test-results/.../trace.zip
```

## Zaawansowane Użycie

### Uruchomienie tylko testów walidacji

```bash
npx playwright test TC-US-001-register-client.spec.ts -g "Walidacja"
```

### Uruchomienie tylko testów accessibility

```bash
npx playwright test TC-US-001-register-client.spec.ts -g "Accessibility"
```

### Uruchomienie z większą liczbą workerów (równolegle)

```bash
npx playwright test --workers=4
```

### Uruchomienie w trybie headed tylko dla chromium

```bash
npx playwright test --headed --project=chromium
```

### Generowanie kodu testu z Playwright Inspector

```bash
npx playwright codegen http://localhost:4321/register
```

## CI/CD

### Lokalna symulacja CI

```bash
CI=true npm run test:e2e
```

### Sprawdzenie co zostanie uruchomione

```bash
npx playwright test --list
```

### Uruchomienie z timeoutem

```bash
npx playwright test --timeout=60000
```

## Przykłady Workflow Deweloperskiego

### 1. Tworzenie nowego testu

```bash
# 1. Uruchom codegen aby nagrać interakcje
npx playwright codegen http://localhost:4321/register

# 2. Skopiuj wygenerowany kod do nowego pliku .spec.ts

# 3. Uruchom test w trybie UI
npm run test:e2e:ui

# 4. Debug jeśli potrzeba
npm run test:e2e:debug
```

### 2. Debugowanie failing testu

```bash
# 1. Uruchom w trybie headed aby zobaczyć co się dzieje
npx playwright test TC-US-001-register-client.spec.ts --headed

# 2. Jeśli nadal nie wiesz co jest nie tak, użyj debug
npx playwright test TC-US-001-register-client.spec.ts --debug

# 3. Zobacz screenshot z błędu
ls test-results/

# 4. Zobacz trace
npx playwright show-trace test-results/.../trace.zip
```

### 3. Aktualizacja testów po zmianach w UI

```bash
# 1. Uruchom test aby zobaczyć co failuje
npm run test:e2e:ui

# 2. Użyj Playwright Inspector aby znaleźć nowe selektory
npx playwright codegen http://localhost:4321/register

# 3. Zaktualizuj selektory w testach

# 4. Uruchom ponownie
npm run test:e2e
```

## Użycie Helperów

### Przykład 1: Rejestracja użytkownika w setupie

```typescript
import { test } from "@playwright/test";
import { fillRegistrationForm, generateTestEmail } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/register");

  await fillRegistrationForm(page, {
    email: generateTestEmail("client"),
    password: "TestPassword123!",
    accountType: "klient",
  });

  const submitButton = page.getByRole("button", { name: /zarejestruj/i });
  await submitButton.click();
});
```

### Przykład 2: Weryfikacja stanu po akcji

```typescript
import { test } from "@playwright/test";
import { expectUserToBeLoggedIn, fillLoginForm } from "./helpers";

test("Po zalogowaniu użytkownik widzi swój profil", async ({ page }) => {
  await page.goto("/login");

  await fillLoginForm(page, "test@example.com", "Password123!");

  const loginButton = page.getByRole("button", { name: /zaloguj/i });
  await loginButton.click();

  await expectUserToBeLoggedIn(page);
});
```

### Przykład 3: Użycie predefiniowanych danych

```typescript
import { test } from "@playwright/test";
import { TEST_USERS, fillLoginForm } from "./helpers";

test("Logowanie jako klient", async ({ page }) => {
  await page.goto("/login");

  await fillLoginForm(page, TEST_USERS.client.email, TEST_USERS.client.password);

  // ... reszta testu
});
```

## Wskazówki

### Gdy test jest flaky (niestabilny)

```bash
# Uruchom 10 razy aby zobaczyć czy zawsze failuje
npx playwright test TC-US-001-register-client.spec.ts --repeat-each=10
```

### Gdy chcesz zobaczyć tylko failed testy

```bash
# Uruchom ponownie tylko failed
npx playwright test --last-failed
```

### Gdy chcesz zaktualizować snapshoty

```bash
npx playwright test --update-snapshots
```

## Więcej Informacji

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Guide](https://playwright.dev/docs/ci)
