# Testy Jednostkowe i Integracyjne

## Przegląd

Projekt wykorzystuje **Vitest** jako framework do testów jednostkowych i integracyjnych, oraz **React Testing Library** do testowania komponentów React.

## Struktura Testów

```
tests/
├── setup.ts                          # Konfiguracja testów
├── vitest.d.ts                       # Deklaracje typów
├── unit/                             # Testy jednostkowe
│   └── lib/
│       ├── utils.test.ts            # Testy funkcji pomocniczych
│       ├── schemas.test.ts          # Testy schematów walidacji Zod
│       └── api-utils.test.ts        # Testy utils API
└── integration/                      # Testy integracyjne
    └── components/
        ├── LoginForm.test.tsx       # Testy komponentu logowania
        └── RegisterForm.test.tsx    # Testy komponentu rejestracji
```

## Uruchamianie Testów

### Podstawowe Komendy

```bash
# Uruchom wszystkie testy w trybie watch
npm test

# Uruchom testy raz (CI mode)
npm run test:run

# Uruchom testy z interfejsem UI
npm run test:ui

# Uruchom testy w trybie watch
npm run test:watch

# Wygeneruj raport pokrycia kodu
npm run test:coverage
```

### Filtrowanie Testów

```bash
# Uruchom tylko testy jednostkowe
npm test -- tests/unit

# Uruchom tylko testy integracyjne
npm test -- tests/integration

# Uruchom konkretny plik
npm test -- tests/unit/lib/utils.test.ts

# Uruchom testy zawierające konkretną nazwę
npm test -- -t "LoginForm"
```

## Zaimplementowane Testy

### Testy Jednostkowe (Unit Tests)

#### 1. **utils.test.ts** - Funkcje pomocnicze

- ✅ Podstawowa funkcjonalność `cn()`
- ✅ Łączenie wielu klas
- ✅ Ignorowanie wartości falsy
- ✅ Obsługa warunków
- ✅ Tailwind merge (konfliktujące klasy)
- ✅ Tablice i obiekty klas
- ✅ Edge cases (puste wartości, itp.)

**Pokrycie:** 100%

#### 2. **schemas.test.ts** - Schematy walidacji Zod

- ✅ LoginSchema - walidacja email i hasła
- ✅ RegisterSchema - walidacja rejestracji
  - Długość hasła (min 8 znaków)
  - Złożoność hasła (wielkie, małe litery, cyfry)
  - Zgodność haseł
  - Typ konta (client/artisan)
- ✅ PasswordRecoverySchema - walidacja emaila
- ✅ PasswordResetSchema - walidacja resetu hasła
- ✅ Edge cases (znaki specjalne, Unicode, długie wartości)

**Pokrycie:** 100%

#### 3. **api-utils.test.ts** - Funkcje API

- ✅ `createErrorResponse()` - tworzenie odpowiedzi błędu
- ✅ `createSuccessResponse()` - tworzenie odpowiedzi sukcesu
- ✅ Różne kody statusu
- ✅ Szczegóły błędów
- ✅ Formatowanie JSON
- ✅ Edge cases (długie wiadomości, znaki specjalne)

**Pokrycie:** 100%

### Testy Integracyjne (Integration Tests)

#### 1. **LoginForm.test.tsx** - Komponent logowania

- ✅ Renderowanie formularza
- ✅ Walidacja po stronie klienta
- ✅ Integracja z API
  - Wysyłanie poprawnych danych
  - Stan loading
  - Obsługa błędów walidacji
  - Obsługa błędów autoryzacji
  - Obsługa błędów sieciowych
- ✅ Interakcje użytkownika
  - Wpisywanie danych
  - Wysyłanie przez Enter
- ✅ Accessibility
  - Typy inputów
  - ARIA labels
  - Powiązanie błędów z polami

**Pokrycie:** ~95%

#### 2. **RegisterForm.test.tsx** - Komponent rejestracji

- ✅ Renderowanie formularza
- ✅ Opcje typu konta
- ✅ Walidacja hasła
  - Za krótkie hasło
  - Brak wielkiej litery
  - Niezgodne hasła
- ✅ Wybór typu konta (klient/rzemieślnik)
- ✅ Pomyślna rejestracja
- ✅ Obsługa błędów (email exists, itp.)
- ✅ Accessibility

**Pokrycie:** ~95%

## Statystyki

- **Całkowita liczba testów jednostkowych:** 75+
- **Całkowita liczba testów integracyjnych:** 40+
- **Pokrycie kodu:** Cel 70%+
  - `src/lib/utils.ts`: 100%
  - `src/lib/schemas.ts`: 100%
  - `src/lib/api-utils.ts`: 100%
  - `src/components/auth/*.tsx`: ~95%

## Best Practices

### 1. Struktura Testów

```typescript
describe("Nazwa komponentu/funkcji", () => {
  describe("Kategoria testów", () => {
    it("powinien wykonać konkretną akcję", () => {
      // Arrange
      const input = "test";

      // Act
      const result = someFunction(input);

      // Assert
      expect(result).toBe("expected");
    });
  });
});
```

### 2. Nazewnictwo

- Używaj polskich opisów w `describe()` i `it()`
- Nazwy powinny opisywać **co** test robi, nie **jak**
- Używaj wzorca: "powinien [wykonać akcję] gdy [warunek]"

### 3. Izolacja Testów

- Każdy test powinien być niezależny
- Używaj `beforeEach()` do resetowania stanu
- Mockuj zewnętrzne zależności (API, localStorage, itp.)

### 4. Testing Library

- Preferuj `getByRole()`, `getByLabelText()` nad `getByTestId()`
- Używaj `waitFor()` dla operacji asynchronicznych
- Testuj zachowanie, nie implementację

### 5. Mockowanie

```typescript
// Mock fetch API
global.fetch = vi.fn();

// Mock konkretnej odpowiedzi
vi.mocked(global.fetch).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ success: true }),
});
```

## Debugowanie Testów

### Tryb Debug

```bash
# Uruchom z debuggerem Node.js
node --inspect-brk node_modules/.bin/vitest run

# Uruchom w przeglądarce (UI mode)
npm run test:ui
```

### Użyteczne Komendy w Testach

```typescript
import { screen, debug } from "@testing-library/react";

// Wydrukuj aktualny DOM
screen.debug();

// Wydrukuj konkretny element
const element = screen.getByRole("button");
debug(element);

// Sprawdź czy element istnieje
screen.logTestingPlaygroundURL(); // Sugeruje najlepsze selektory
```

## Coverage Report

Wygeneruj raport pokrycia kodu:

```bash
npm run test:coverage
```

Raport będzie dostępny w:

- Terminal: podsumowanie w konsoli
- HTML: `coverage/index.html`

## CI/CD

Testy są automatycznie uruchamiane w GitHub Actions przy każdym pushu.

```yaml
# .github/workflows/test.yml
- name: Run unit and integration tests
  run: npm run test:run

- name: Run E2E tests
  run: npm run test:e2e
```

## Następne Kroki

### Kolejne komponenty do przetestowania:

1. PasswordRecoveryForm
2. PasswordResetForm
3. UI Components (Button, Input, Label)
4. Services (jeśli będą utworzone)

### Rozszerzenie pokrycia:

- [ ] Testy dla middleware
- [ ] Testy dla API endpoints (mock Supabase)
- [ ] Testy dla stron Astro
- [ ] Snapshot testy dla komponentów UI

## Wskazówki

### Testowanie komponentów z formularzami

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("submit form", async () => {
  const user = userEvent.setup();
  render(<MyForm />);

  await user.type(screen.getByLabelText(/email/i), "test@example.com");
  await user.click(screen.getByRole("button", { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

### Testowanie asynchronicznych operacji

```typescript
test("async operation", async () => {
  render(<MyComponent />);

  // Czekaj na pojawienie się elementu
  const element = await screen.findByText(/loaded/i);
  expect(element).toBeInTheDocument();

  // Lub użyj waitFor
  await waitFor(
    () => {
      expect(screen.getByText(/loaded/i)).toBeInTheDocument();
    },
    { timeout: 3000 }
  );
});
```

### Testowanie błędów

```typescript
test("handles error", async () => {
  // Mock błędu
  vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

  render(<MyComponent />);
  await user.click(screen.getByRole("button"));

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
