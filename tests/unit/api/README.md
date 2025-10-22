# Testy Jednostkowe API

Ten katalog zawiera testy jednostkowe dla endpointów API aplikacji ChairAI.

## Struktura

```
tests/unit/api/
└── auth/
    ├── login.test.ts          # Testy dla POST /api/auth/login
    └── register.test.ts       # TODO: Testy dla POST /api/auth/register
```

## Uruchomienie Testów

### Wszystkie testy API

```bash
npm run test:unit tests/unit/api
```

### Konkretny endpoint

```bash
npm run test:unit tests/unit/api/auth/login.test.ts
```

### Tryb watch

```bash
npm run test:unit -- --watch tests/unit/api/auth/login.test.ts
```

### Z pokryciem kodu

```bash
npm run test:unit -- --coverage tests/unit/api
```

## Zaimplementowane Testy

### ✅ POST /api/auth/login (17 testów)

**Plik:** `auth/login.test.ts`

#### Kategorie testów:

1. **Pomyślne logowanie** (2 testy)
   - Logowanie z poprawnymi danymi
   - Ustawianie ciasteczek sesji

2. **Walidacja danych wejściowych** (6 testów)
   - Puste pola (email, hasło)
   - Brakujące pola (email, hasło)
   - Nieprawidłowy format email
   - Dodatkowe pola (ignorowane przez Zod)

3. **Błędy autoryzacji** (3 testy)
   - 401 dla nieprawidłowych danych logowania
   - 400 dla innych błędów autoryzacji
   - 500 gdy nie można utworzyć sesji

4. **Obsługa błędów** (2 testy)
   - Błąd parsowania JSON
   - Nieoczekiwane błędy z Supabase

5. **Bezpieczeństwo** (3 testy)
   - Ukrywanie szczegółów błędów
   - httpOnly ciasteczka
   - sameSite ciasteczka

6. **Integracja z Supabase** (1 test)
   - Wywołanie z poprawnymi parametrami

## Konwencje Testów

### Nazewnictwo

- Pliki testowe: `{endpoint}.test.ts`
- Testy w języku polskim dla lepszej komunikacji z zespołem
- Struktura: `describe` → `it`

### Przykład

```typescript
describe("POST /api/auth/login", () => {
  describe("Pomyślne logowanie", () => {
    it("powinien zalogować użytkownika z poprawnymi danymi", async () => {
      // Test implementation
    });
  });
});
```

### Mock Data

```typescript
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
};

function createMockContext(body: unknown): APIContext {
  return {
    request: { json: async () => body } as unknown as Request,
    locals: {
      supabase: { auth: mockSupabaseAuth },
      user: null,
    } as unknown as APIContext["locals"],
    cookies: {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    } as unknown as APIContext["cookies"],
  } as unknown as APIContext;
}
```

## Testowane Aspekty

### ✅ Walidacja

- Sprawdzanie wszystkich wymaganych pól
- Walidacja formatów (email, hasło)
- Komunikaty błędów w języku polskim

### ✅ Bezpieczeństwo

- httpOnly flaga dla ciasteczek
- sameSite: lax
- secure w produkcji
- Ukrywanie szczegółów błędów wewnętrznych

### ✅ Kody Statusu HTTP

- 200: Sukces
- 400: Błąd autoryzacji (ogólny)
- 401: Nieprawidłowe dane logowania
- 422: Błąd walidacji danych
- 500: Błąd serwera

### ✅ Integracja z Supabase

- Wywołanie odpowiednich metod
- Przekazywanie poprawnych parametrów
- Obsługa odpowiedzi z błędem
- Obsługa odpowiedzi z sukcesem

## Pokrycie Kodu

Cel: **>80%** pokrycia dla endpointów API

### Aktualne pokrycie:

- `src/pages/api/auth/login.ts`: **100%**

## Następne Kroki

### Do zaimplementowania:

1. ⬜ `auth/register.test.ts` - testy dla rejestracji
2. ⬜ `auth/logout.test.ts` - testy dla wylogowania
3. ⬜ `auth/password-recovery.test.ts` - testy dla odzyskiwania hasła
4. ⬜ `auth/password-reset.test.ts` - testy dla resetowania hasła

### Rekomendacje:

- Dodać testy performance (benchmarking)
- Rozważyć testy security (rate limiting)
- Dodać testy dla middleware
- Rozważyć contract testing dla API

## Best Practices

### 1. Izolacja Testów

✅ Każdy test jest niezależny  
✅ Mockowanie zależności zewnętrznych  
✅ Reset mocków w `beforeEach`

### 2. Czytelność

✅ Opisowe nazwy testów  
✅ AAA Pattern (Arrange, Act, Assert)  
✅ Grupowanie powiązanych testów

### 3. Kompletność

✅ Happy path  
✅ Edge cases  
✅ Error handling  
✅ Security aspects

### 4. Utrzymywalność

✅ Helper functions dla tworzenia mock data  
✅ Reużywalne fixtures  
✅ Dokumentacja w komentarzach

## Troubleshooting

### Problem: Błędy TypeScript z mockowanym context

**Rozwiązanie:** Użyj `as unknown as APIContext` dla złożonych mocków

```typescript
return {
  // ... mock properties
} as unknown as APIContext;
```

### Problem: Testy nie resetują się między runs

**Rozwiązanie:** Użyj `beforeEach` do czyszczenia mocków

```typescript
beforeEach(() => {
  vi.resetAllMocks();
});
```

### Problem: Async testy timeout

**Rozwiązanie:** Zwiększ timeout w `vitest.config.ts`

```typescript
test: {
  testTimeout: 10000, // 10 sekund
}
```

## Linki

- [Vitest Documentation](https://vitest.dev/)
- [Astro API Routes](https://docs.astro.build/en/core-concepts/endpoints/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Zod Validation](https://zod.dev/)
