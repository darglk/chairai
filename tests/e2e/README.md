# Testy E2E - ChairAI

Ten katalog zawiera testy End-to-End (E2E) dla aplikacji ChairAI, napisane przy użyciu Playwright.

## Struktura

- `TC-US-001-register-client.spec.ts` - Testy rejestracji konta klienta (US-001)
- `helpers.ts` - Funkcje pomocnicze i dane testowe

## Uruchamianie testów

### Wszystkie testy

```bash
npm run test:e2e
```

### Testy w trybie UI (interaktywny)

```bash
npm run test:e2e:ui
```

### Testy w trybie debug

```bash
npm run test:e2e:debug
```

### Konkretny plik testowy

```bash
npx playwright test TC-US-001-register-client.spec.ts
```

## Konwencje nazewnictwa

Pliki testowe powinny być nazwane według wzorca:

- `TC-US-XXX-<nazwa-testu>.spec.ts`

gdzie:

- `TC-US-XXX` - ID scenariusza testowego z test-plan.md
- `<nazwa-testu>` - krótki opis w formacie kebab-case

## Organizacja testów

Każdy plik testowy powinien:

1. Zawierać `test.describe()` z ID scenariusza testowego
2. Mieć `beforeEach` hook do przygotowania stanu
3. Zawierać co najmniej jeden test "happy path"
4. Zawierać testy walidacji dla edge cases
5. Opcjonalnie zawierać testy UI/UX i dostępności

## Helpery

Plik `helpers.ts` zawiera:

- Funkcje pomocnicze do wypełniania formularzy
- Funkcje do weryfikacji stanu aplikacji
- Stałe z danymi testowymi
- Generatory danych testowych

## Najlepsze praktyki

1. **Używaj selektorów ARIA**: Preferuj `getByRole()`, `getByLabel()` nad selektorami CSS
2. **Auto-waiting**: Playwright automatycznie czeka na elementy - nie używaj `waitForTimeout()` bez potrzeby
3. **Izolacja testów**: Każdy test powinien być niezależny
4. **Unikalność danych**: Używaj `generateTestEmail()` dla unikalnych emaili
5. **Opisowe nazwy**: Nazwy testów powinny jasno określać co testują
6. **Grupowanie**: Używaj `test.describe()` do logicznego grupowania testów

## Raportowanie

Po uruchomieniu testów, raport HTML jest dostępny w:

```bash
npx playwright show-report
```

## CI/CD

Testy są automatycznie uruchamiane w GitHub Actions przy każdym push do repozytorium.
