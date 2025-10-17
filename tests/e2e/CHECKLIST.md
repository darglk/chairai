# Checklist - Następne kroki dla testów E2E

## ✅ Zakończone

- [x] Zainstalowany Playwright i zależności
- [x] Utworzona konfiguracja Playwright (`playwright.config.ts`)
- [x] Zaimplementowane testy dla TC-US-001 (Rejestracja konta klienta)
- [x] Zaimplementowane testy dla TC-US-002 (Logowanie użytkownika)
- [x] Utworzone funkcje pomocnicze (`helpers.ts`)
- [x] Dodane skrypty npm do `package.json`
- [x] Utworzony workflow GitHub Actions
- [x] Zaktualizowana dokumentacja (README.md, TESTING.md)
- [x] Dodane wpisy do `.gitignore`

## 📋 Do zrobienia przed uruchomieniem testów

### 1. Upewnij się, że strona `/register` działa poprawnie
```bash
npm run dev
# Sprawdź http://localhost:4321/register
```

### 2. Dostosuj selektory w testach do faktycznego UI
Obecne testy używają ogólnych selektorów ARIA. Może być konieczne dopasowanie ich do rzeczywistej implementacji formularza rejestracji.

### 3. Uruchom pierwszy test
```bash
npm run test:e2e:ui
```

### 4. Jeśli testy failują
- Sprawdź czy formularz ma odpowiednie `aria-label` lub `<label>` dla inputów
- Sprawdź czy przyciski mają odpowiednie role i nazwy
- Użyj Playwright Inspector (`--debug`) aby zobaczyć co się dzieje

### 5. Dostosuj timeouty jeśli potrzeba
W `playwright.config.ts` możesz zwiększyć globalne timeouty jeśli aplikacja potrzebuje więcej czasu na odpowiedź.

## 🎯 Następne scenariusze do implementacji

Kolejność zgodna z `test-plan.md`:

1. ~~**TC-US-001**: Rejestracja konta klienta~~ ✅
2. ~~**TC-US-002**: Logowanie użytkownika~~ ✅
3. **TC-US-003**: Wylogowywanie użytkownika  
4. **TC-US-004**: Generowanie obrazu mebla
5. **TC-US-005**: Tworzenie projektu na podstawie obrazu
6. **TC-US-006**: Przeglądanie i akceptacja propozycji
7. **TC-US-007**: Komunikacja z rzemieślnikiem
8. **TC-US-008**: Zakończenie i ocena projektu
9. **TC-US-009**: Rejestracja i uzupełnienie profilu rzemieślnika
10. **TC-US-010**: Przeglądanie rynku projektów
10. **TC-US-011**: Składanie propozycji do projektu
11. **TC-US-012**: Oczekiwanie na akceptację i realizacja
12. **TC-US-013**: Otrzymanie oceny

## 💡 Wskazówki

### Szablon dla nowego testu:

```typescript
import { test, expect } from "@playwright/test";

test.describe("TC-US-XXX: Nazwa scenariusza", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/odpowiednia-strona");
  });

  test("Główny scenariusz - happy path", async ({ page }) => {
    // Implementacja kroków z test-plan.md
  });

  test("Walidacja: Edge case 1", async ({ page }) => {
    // Test negatywnej ścieżki
  });
});
```

### Używanie helperów:

```typescript
import { fillRegistrationForm, expectUserToBeLoggedIn } from "./helpers";

test("Test z helperami", async ({ page }) => {
  await fillRegistrationForm(page, {
    email: "test@example.com",
    password: "Password123!",
    accountType: "klient"
  });
  
  await expectUserToBeLoggedIn(page);
});
```

## 🔍 Debugging

Jeśli test failuje:

1. **Użyj trybu UI**:
   ```bash
   npm run test:e2e:ui
   ```

2. **Użyj trybu debug**:
   ```bash
   npm run test:e2e:debug
   ```

3. **Zobacz screenshot z błędu**:
   Screenshots są automatycznie zapisywane w `test-results/`

4. **Zobacz trace**:
   ```bash
   npx playwright show-trace test-results/trace.zip
   ```

## 📊 Monitorowanie pokrycia

Śledź pokrycie testami w pliku `TC-US-001-IMPLEMENTATION.md` i twórz podobne pliki dla kolejnych scenariuszy.

## 🚀 CI/CD

GitHub Actions automatycznie uruchomi testy przy każdym pushu do głównych branchy (main, master, develop).

Raporty będą dostępne jako artifacts w Actions.
