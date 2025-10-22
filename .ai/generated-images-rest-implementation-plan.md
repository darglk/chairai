# API Endpoint Implementation Plan: List My Generated Images

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom o roli `client` pobranie listy wygenerowanych przez siebie obrazów AI. Obsługuje paginację oraz filtrowanie, aby wyświetlić tylko te obrazy, które nie zostały jeszcze przypisane do żadnego projektu. Odpowiedź zawiera również informację o liczbie pozostałych dostępnych generacji dla danego użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/images/generated`
- **Parametry**:
  - **Wymagane (w nagłówku)**:
    - `Authorization: Bearer {access_token}`: Token JWT uwierzytelniający użytkownika.
  - **Opcjonalne (w zapytaniu)**:
    - `page` (number, default: 1): Numer strony wyników.
    - `limit` (number, default: 20, max: 100): Liczba wyników na stronie.
    - `unused_only` (boolean, default: false): Jeśli `true`, zwraca tylko obrazy nieużyte w projektach.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **DTOs**:
  - `GeneratedImagesListResponseDTO`: Główny typ odpowiedzi.
  - `GeneratedImageDTO`: Reprezentuje pojedynczy obraz.
  - `PaginationMetaDTO`: Metadane paginacji.
- **Typy parametrów zapytania**:
  - `GeneratedImagesQueryParams`: Typ dla parametrów zapytania, który zostanie rozszerzony o `unused_only`.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "prompt": "A modern oak dining table with metal legs",
        "image_url": "https://storage.supabase.co/...",
        "created_at": "2025-10-12T10:00:00Z",
        "is_used": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "total_pages": 1
    },
    "remaining_generations": 9
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe parametry zapytania.
  - `401 Unauthorized`: Brak lub nieważny token.
  - `403 Forbidden`: Użytkownik nie ma roli `client`.
  - `500 Internal Server Error`: Błąd serwera.

## 5. Przepływ danych

1.  Żądanie `GET` trafia do endpointu `/api/images/generated`.
2.  Middleware Astro weryfikuje token JWT i umieszcza sesję użytkownika w `context.locals`.
3.  Handler endpointu parsuje i waliduje parametry zapytania (`page`, `limit`, `unused_only`) przy użyciu schemy Zod.
4.  Jeśli walidacja się nie powiedzie, zwracany jest błąd `400 Bad Request`.
5.  Sprawdzana jest rola użytkownika. Jeśli jest inna niż `client`, zwracany jest błąd `403 Forbidden`.
6.  Wywoływana jest metoda z serwisu `GeneratedImagesService`, przekazując `user_id` oraz zwalidowane parametry.
7.  Serwis wykonuje zapytanie do bazy danych Supabase:
    - Pobiera łączną liczbę obrazów dla danego użytkownika (z uwzględnieniem filtra `unused_only`).
    - Pobiera paginowaną listę obrazów, dołączając informację `is_used` (sprawdzając powiązanie z tabelą `projects`).
    - Pobiera liczbę pozostałych generacji dla użytkownika (logika do zdefiniowania, np. z tabeli `user_quotas`).
8.  Serwis konstruuje obiekt `GeneratedImagesListResponseDTO` i zwraca go do handlera.
9.  Handler serializuje odpowiedź do formatu JSON i wysyła ją z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp jest chroniony i wymaga ważnego tokenu JWT. Middleware Astro jest odpowiedzialne za jego weryfikację.
- **Autoryzacja**:
  - Endpoint musi weryfikować, czy rola użytkownika to `client`.
  - Wszystkie zapytania do bazy danych muszą zawierać warunek `WHERE user_id = {authenticated_user_id}`, aby zapobiec dostępowi do danych innych użytkowników.
- **Walidacja danych wejściowych**: Parametry zapytania muszą być rygorystycznie walidowane, aby zapobiec atakom (np. SQL Injection, chociaż Supabase client minimalizuje to ryzyko) i zapewnić stabilność. `limit` musi być ograniczony, aby uniknąć nadmiernego obciążenia bazy danych.

## 7. Rozważania dotyczące wydajności

- **Indeksowanie bazy danych**: Należy upewnić się, że kolumna `user_id` w tabeli `generated_images` jest zaindeksowana, aby przyspieszyć filtrowanie.
- **Paginacja**: Ograniczenie maksymalnej wartości `limit` do 100 zapobiega pobieraniu zbyt dużej ilości danych w jednym żądaniu.
- **Zapytanie o `is_used`**: Sprawdzanie, czy obraz jest używany, powinno być zoptymalizowane. Zamiast oddzielnego zapytania dla każdego obrazu, można użyć `LEFT JOIN` z tabelą `projects` i sprawdzać, czy `projects.id` jest `NULL`.

## 8. Etapy wdrożenia

1.  **Aktualizacja schemy walidacji**:
    - W pliku `src/lib/schemas.ts` rozszerzyć lub utworzyć schemę Zod dla parametrów zapytania `GeneratedImagesQueryParams`, uwzględniając `page`, `limit` i `unused_only` wraz z odpowiednimi regułami.
2.  **Utworzenie serwisu**:
    - Stworzyć plik `src/lib/services/generated-images.service.ts`.
    - Zaimplementować w nim funkcję, np. `listUserGeneratedImages(userId: string, params: ValidatedParams)`.
    - Wewnątrz funkcji zaimplementować logikę zapytań do Supabase:
      - Budowanie zapytania z dynamicznym filtrowaniem (`unused_only`).
      - Pobieranie całkowitej liczby rekordów do paginacji.
      - Pobieranie paginowanej listy obrazów.
      - Implementacja logiki pobierania `remaining_generations`.
3.  **Implementacja endpointu API**:
    - Utworzyć plik `src/pages/api/images/generated.ts`.
    - Dodać `export const prerender = false;`.
    - Zaimplementować handler `GET`.
    - Pobrać sesję z `context.locals.session`. Zwrócić `401` jeśli brak.
    - Sprawdzić rolę użytkownika. Zwrócić `403` jeśli nie jest `client`.
    - Zwalidować parametry zapytania `context.url.searchParams` przy użyciu schemy Zod. Zwrócić `400` w razie błędu.
    - Wywołać metodę z `GeneratedImagesService`.
    - Obsłużyć ewentualne błędy z serwisu, logując je i zwracając `500`.
    - Zwrócić pomyślną odpowiedź w formacie `GeneratedImagesListResponseDTO` z kodem `200`.
4.  **Testy**:
    - Dodać testy jednostkowe dla serwisu, mockując klienta Supabase.
    - Dodać testy integracyjne dla endpointu API, sprawdzając różne scenariusze (sukces, błędy walidacji, brak autoryzacji).
5.  **Dokumentacja**:
    - Upewnić się, że implementacja jest zgodna z planem i zaktualizować dokumentację OpenAPI/Swagger, jeśli istnieje w projekcie.
