# Quick Start - Testy Jednostkowe i Integracyjne

## Instalacja

Wszystkie zależności zostały już zainstalowane podczas setup projektu.

## Uruchomienie Testów

### Podstawowe Komendy

```bash
# Uruchom testy w trybie watch (automatyczne przeładowanie)
npm test

# Uruchom testy raz (dla CI)
npm run test:run

# Uruchom testy z UI (interaktywny interfejs w przeglądarce)
npm run test:ui

# Wygeneruj raport pokrycia kodu
npm run test:coverage
```

## Przykłady

### Uruchom tylko testy jednostkowe

```bash
npm test -- tests/unit
```

### Uruchom tylko testy integracyjne

```bash
npm test -- tests/integration
```

### Uruchom konkretny plik testowy

```bash
npm test -- tests/unit/lib/utils.test.ts
```

### Uruchom testy z nazwą zawierającą "Login"

```bash
npm test -- -t "Login"
```

## Struktura

```
tests/
├── unit/                    # Testy jednostkowe
│   └── lib/
│       ├── utils.test.ts
│       ├── schemas.test.ts
│       └── api-utils.test.ts
└── integration/             # Testy integracyjne
    └── components/
        ├── LoginForm.test.tsx
        └── RegisterForm.test.tsx
```

## Sprawdzenie Pokrycia

```bash
npm run test:coverage
```

Otwórz plik `coverage/index.html` w przeglądarce aby zobaczyć szczegółowy raport.

## Troubleshooting

### Testy nie uruchamiają się

```bash
# Wyczyść cache
rm -rf node_modules/.vite

# Przeinstaluj zależności
npm install
```

### Testy failują losowo

- Sprawdź czy nie ma konfliktów w mockach (`beforeEach(() => vi.resetAllMocks())`)
- Upewnij się że testy są niezależne
- Użyj `waitFor()` dla operacji asynchronicznych

## Więcej Informacji

Zobacz [tests/UNIT-INTEGRATION-TESTS.md](tests/UNIT-INTEGRATION-TESTS.md) dla pełnej dokumentacji.
