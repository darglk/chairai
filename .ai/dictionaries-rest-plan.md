# API Endpoint Implementation Plan: Dictionary Resources

## 1. Przegląd punktu końcowego
Celem jest wdrożenie trzech publicznych punktów końcowych REST API, które będą służyć do pobierania podstawowych danych słownikowych z aplikacji: kategorii mebli, materiałów i specjalizacji rzemieślników. Punkty te są kluczowe dla dynamicznego renderowania opcji wyboru w interfejsie użytkownika, np. w formularzach.

- `GET /api/categories`
- `GET /api/materials`
- `GET /api/specializations`

Wszystkie punkty końcowe są przeznaczone tylko do odczytu i nie wymagają uwierzytelniania.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**:
  - `/api/categories`
  - `/api/materials`
  - `/api/specializations`
- **Parametry**:
  - **Wymagane**: Brak
  - **Opcjonalne**: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy
Do implementacji zostaną wykorzystane następujące typy z `src/types.ts`:

- `CategoryDTO`: Dla elementów z `/api/categories`.
- `MaterialDTO`: Dla elementów z `/api/materials`.
- `SpecializationDTO`: Dla elementów z `/api/specializations`.
- `ApiErrorDTO`: Do ustandaryzowanej obsługi błędów.

## 4. Szczegóły odpowiedzi
### Pomyślna odpowiedź
- **Kod stanu**: `200 OK`
- **Struktura body**: Obiekt JSON zawierający klucz `data`, którego wartością jest tablica obiektów. Każdy obiekt w tablicy reprezentuje pojedynczy zasób słownikowy.

**Przykład dla `GET /api/categories`:**
```json
{
  "data": [
    { "id": "uuid-1", "name": "Krzesła" },
    { "id": "uuid-2", "name": "Stoły" }
  ]
}
```

### Odpowiedź błędu
- **Kod stanu**: `500 Internal Server Error`
- **Struktura body**: Obiekt `ApiErrorDTO` w przypadku problemów z połączeniem z bazą danych.

**Przykład:**
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Wystąpił nieoczekiwany błąd serwera."
  }
}
```

## 5. Przepływ danych
1. Użytkownik (lub aplikacja kliencka) wysyła żądanie `GET` do jednego z punktów końcowych (np. `/api/categories`).
2. Plik routingu Astro (`src/pages/api/[resource].ts`) przechwytuje żądanie.
3. Handler `GET` wywołuje odpowiednią metodę z nowo utworzonego serwisu `DictionaryService` (np. `dictionaryService.getCategories()`).
4. Metoda serwisowa używa klienta Supabase do wykonania zapytania `SELECT * FROM [tabela]`.
5. Baza danych Supabase zwraca listę rekordów.
6. Serwis mapuje wyniki na odpowiednie typy DTO (`CategoryDTO`, `MaterialDTO`, `SpecializationDTO`).
7. Handler `GET` w pliku Astro opakowuje otrzymaną tablicę DTO w obiekt `{ data: [...] }` i zwraca ją jako odpowiedź JSON z kodem stanu `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie i autoryzacja**: Punkty końcowe są publiczne i nie wymagają żadnych mechanizmów uwierzytelniania ani autoryzacji, co jest zgodne z ich przeznaczeniem.
- **Walidacja danych**: Brak parametrów wejściowych minimalizuje ryzyko ataków. Nie jest wymagana dodatkowa walidacja.
- **Ograniczenie dostępu (Rate Limiting)**: Należy rozważyć zaimplementowanie globalnego mechanizmu ograniczania liczby żądań w `src/middleware/index.ts`, aby chronić serwer przed atakami typu Denial-of-Service (DoS).

## 7. Rozważania dotyczące wydajności
- **Buforowanie (Caching)**: Dane słownikowe zmieniają się rzadko. Warto zaimplementować mechanizm buforowania po stronie serwera (np. cache w pamięci z krótkim czasem wygaśnięcia) lub po stronie klienta (za pomocą odpowiednich nagłówków HTTP, np. `Cache-Control`), aby zminimalizować liczbę zapytań do bazy danych.
- **Indeksowanie bazy danych**: Tabele `categories`, `materials` i `specializations` są małe, ale dla zachowania dobrych praktyk, klucz główny `id` powinien być zindeksowany.

## 8. Etapy wdrożenia
1.  **Utworzenie serwisu**:
    *   Stwórz nowy plik `src/lib/services/dictionary.service.ts`.
    *   W pliku zaimplementuj klasę `DictionaryService` z trzema publicznymi metodami: `getCategories`, `getMaterials`, `getSpecializations`.
    *   Każda metoda powinna przyjmować instancję `SupabaseClient` jako zależność.
    *   Wewnątrz metod, użyj `supabase.from('nazwa_tabeli').select('*')` do pobrania danych.
    *   Dodaj obsługę błędów – w bloku `catch` loguj błąd i rzucaj go dalej.

2.  **Implementacja punktów końcowych**:
    *   Utwórz trzy nowe pliki w katalogu `src/pages/api/`:
        *   `categories.ts`
        *   `materials.ts`
        *   `specializations.ts`
    *   W każdym pliku zaimplementuj handler `GET` zgodnie ze standardami Astro (`export async function GET({ locals }: APIContext)`).
    *   Wewnątrz handlera, pobierz klienta Supabase z `locals.supabase`.
    *   Utwórz instancję `DictionaryService`, przekazując do niej klienta Supabase.
    *   Wywołaj odpowiednią metodę serwisu (np. `await dictionaryService.getCategories()`).
    *   Zwróć dane w formacie `{ data: [...] }` używając `new Response(JSON.stringify({ data }), { status: 200 })`.
    *   Dodaj blok `try...catch` do obsługi błędów z warstwy serwisu i zwracaj `ApiErrorDTO` z kodem `500`.

3.  **Konfiguracja `prerender`**:
    *   W każdym z plików endpointów (`categories.ts`, `materials.ts`, `specializations.ts`) dodaj `export const prerender = false;`, aby zapewnić, że są one traktowane jako dynamiczne punkty końcowe API.

4.  **Testowanie (opcjonalne, ale zalecane)**:
    *   Dodaj testy integracyjne dla każdego punktu końcowego, aby zweryfikować poprawność zwracanych danych i kodów stanu.
    *   Sprawdź, czy obsługa błędów działa poprawnie, symulując błąd połączenia z bazą danych.
