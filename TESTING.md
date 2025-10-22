# Testy - Quick Start

Ten projekt wykorzystuje kompleksową strategię testowania obejmującą testy jednostkowe, integracyjne i End-to-End.

## Rodzaje Testów

### 1. Testy Jednostkowe i Integracyjne (Vitest + React Testing Library)

**Framework:** Vitest  
**Biblioteka:** React Testing Library

#### Co testujemy?

- Funkcje pomocnicze (`src/lib/utils.ts`)
- Schematy walidacji Zod (`src/lib/schemas.ts`)
- API utilities (`src/lib/api-utils.ts`)
- Komponenty React (`src/components/**/*.tsx`)

#### Uruchamianie

```bash
# Tryb watch (polecany do developmentu)
npm test

# Uruchom raz (CI mode)
npm run test:run

# Interaktywny UI
npm run test:ui

# Z raportem pokrycia
npm run test:coverage
```

#### Filtrowanie testów

```bash
# Tylko testy jednostkowe
npm test -- tests/unit

# Tylko testy integracyjne
npm test -- tests/integration

# Konkretny plik
npm test -- tests/unit/lib/utils.test.ts

# Testy zawierające "Login"
npm test -- -t "Login"
```

**📄 Dokumentacja:** [tests/UNIT-INTEGRATION-TESTS.md](tests/UNIT-INTEGRATION-TESTS.md)

---

#### Uruchamianie

````bash
# Wszystkie testy E2E

**Framework:** Playwright

#### Co testujemy?
- Pełne ścieżki użytkownika (od rejestracji po zakończenie projektu)
- Interakcje między komponentami
- Integracje z backendem (Supabase)
- Responsywność i accessibility

#### Uruchamianie
```bash
npm run test:e2e
````

### Tryb interaktywny (UI)

```bash
npm run test:e2e:ui
```

### Tryb debug (krok po kroku)

```bash
npm run test:e2e:debug
```

### Z widocznymi przeglądarkami

```bash
npm run test:e2e:headed
```

### Raport z testów

```bash
npm run test:e2e:report
```

**📄 Dokumentacja:** [tests/e2e/README.md](tests/e2e/README.md)

---

## Szybki Start

### Development Workflow

1. **Rozpocznij development**

   ```bash
   npm run dev
   ```

2. **Uruchom testy jednostkowe w watch mode** (w drugim terminalu)

   ```bash
   npm test
   ```

3. **Po zakończeniu pracy - uruchom testy E2E**
   ```bash
   npm run test:e2e:ui
   ```

### Przed Commitowaniem

```bash
# 1. Linting
npm run lint

# 2. Testy jednostkowe
npm run test:run

# 3. Testy E2E
npm run test:e2e

# 4. Coverage (opcjonalnie)
npm run test:coverage
```

---

## Statystyki Testów

### Testy Jednostkowe i Integracyjne

- **55 testów** w 5 plikach
- **Pokrycie:** ~98% dla testowanych modułów
- **Czas wykonania:** <1s

### Testy E2E

- **35 przypadków testowych** (7 testów × 5 przeglądarek)
- **Przeglądarki:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Czas wykonania:** ~2-5 min

### Razem

- **90+ testów**
- **Pełne pokrycie** kluczowych funkcjonalności

---

## Struktura Plików

```
tests/
├── setup.ts                          # Konfiguracja testów
├── vitest.d.ts                       # Deklaracje typów
├── UNIT-INTEGRATION-TESTS.md         # Dokumentacja unit/integration
├── QUICK-START.md                    # Quick start guide
├── RAPORT-UNIT-INTEGRATION.md        # Raport implementacji
│
├── unit/                             # Testy jednostkowe
│   └── lib/
│       ├── utils.test.ts            # cn() function
│       ├── schemas.test.ts          # Zod schemas
│       └── api-utils.test.ts        # API helpers
│
├── integration/                      # Testy integracyjne
│   └── components/
│       ├── LoginForm.test.tsx       # Logowanie
│       └── RegisterForm.test.tsx    # Rejestracja
│
└── e2e/                              # Testy E2E
    ├── README.md
    ├── CHECKLIST.md
    ├── EXAMPLES.md
    ├── helpers.ts
    └── TC-US-001-register-client.spec.ts
```

---

## CI/CD

Testy są automatycznie uruchamiane w GitHub Actions:

### Workflow: Unit & Integration Tests

- Uruchamia się przy każdym push/PR
- Generuje raport pokrycia kodu
- Upload do Codecov

### Workflow: Playwright Tests

- Uruchamia się przy każdym push/PR do main/master/develop
- Testuje na Chromium, Firefox i WebKit
- Upload raportów jako artifacts

---

```

## Struktura testów

Testy znajdują się w katalogu `tests/e2e/`:
- `TC-US-001-register-client.spec.ts` - Testy rejestracji konta klienta
- `helpers.ts` - Funkcje pomocnicze

## Więcej informacji

Zobacz pełną dokumentację w [tests/e2e/README.md](tests/e2e/README.md)

## Zaimplementowane scenariusze

- ✅ **TC-US-001**: Rejestracja konta klienta
  - Pomyślna rejestracja
  - Walidacja nieprawidłowego emaila
  - Walidacja niezgodnych haseł
  - Walidacja braku wyboru typu konta
  - Walidacja istniejącego emaila
  - Test responsywności
  - Test dostępności (accessibility)
```
