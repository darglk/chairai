# API Endpoint Implementation Plan: Get Artisan Reviews

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia pobranie wszystkich recenzji dla danego rzemieślnika. Odpowiedź jest paginowana i zawiera podsumowanie statystyk, takie jak średnia ocena, całkowita liczba recenzji i rozkład ocen. Punkt końcowy jest publicznie dostępny i nie wymaga uwierzytelniania.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/artisans/{artisanId}/reviews`
- **Parametry**:
  - **Ścieżki (wymagane)**:
    - `artisanId` (string, UUID): Unikalny identyfikator rzemieślnika.
  - **Zapytania (opcjonalne)**:
    - `page` (number, domyślnie: 1): Numer strony wyników.
    - `limit` (number, domyślnie: 20, max: 100): Liczba wyników na stronę.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **`ReviewDTO`**: Reprezentuje pojedynczą recenzję.
- **`ReviewerDTO`**: Zawiera publiczne dane recenzenta (po modyfikacji, aby nie ujawniać e-maila).
- **`ReviewProjectDTO`**: Zawiera podstawowe dane o projekcie powiązanym z recenzją.
- **`ReviewSummaryDTO`**: Zawiera zagregowane dane o recenzjach.
- **`PaginationMetaDTO`**: Zawiera metadane paginacji.
- **`ReviewsQueryParams`**: Typ dla parametrów zapytania.
- **`ArtisanReviewsResponseDTO` (nowy)**: Wrapper dla całej odpowiedzi, zawierający `data`, `pagination` i `summary`.
- **`ApiErrorDTO`**: Standardowy format odpowiedzi błędu.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "project": {
          "id": "uuid",
          "category": { "name": "Tables" }
        },
        "reviewer": {
          "id": "uuid",
          "name": "John D."
        },
        "rating": 5,
        "comment": "Excellent craftsmanship and communication",
        "created_at": "2025-10-12T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "total_pages": 1
    },
    "summary": {
      "average_rating": 4.5,
      "total_reviews": 12,
      "rating_distribution": { "5": 8, "4": 3, "3": 1, "2": 0, "1": 0 }
    }
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe parametry zapytania.
  - `404 Not Found`: Rzemieślnik nie został znaleziony.
  - `500 Internal Server Error`: Błędy serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do endpointu Astro: `src/pages/api/artisans/[artisanId]/reviews.astro`.
2.  Endpoint używa `zod` do walidacji i parsowania parametrów `artisanId`, `page` i `limit`.
3.  Wywoływana jest funkcja `getArtisanReviews(artisanId, page, limit)` z serwisu `review.service.ts`.
4.  Serwis sprawdza, czy rzemieślnik o podanym `artisanId` istnieje w tabeli `artisan_profiles`. Jeśli nie, zwraca błąd, który zostanie zmapowany na 404.
5.  Serwis wykonuje pojedyncze wywołanie funkcji PostgreSQL (`rpc`) w celu pobrania zarówno paginowanej listy recenzji, jak i zagregowanych statystyk. Funkcja bazy danych połączy tabele `reviews`, `projects`, `categories` i `users` (dla danych recenzenta).
6.  Serwis transformuje wyniki z bazy danych na struktury DTO, w tym anonimizuje dane recenzenta.
7.  Serwis zwraca obiekt `ArtisanReviewsResponseDTO` do endpointu.
8.  Endpoint Astro serializuje obiekt do formatu JSON i wysyła go jako odpowiedź z kodem statusu 200.

## 6. Względy bezpieczeństwa
- **Walidacja danych wejściowych**: Wszystkie parametry wejściowe (`artisanId`, `page`, `limit`) będą ściśle walidowane przy użyciu `zod`, aby zapobiec atakom typu SQL Injection i zapewnić integralność danych.
- **Ochrona danych osobowych**: Dane recenzenta w `ReviewerDTO` zostaną zanonimizowane. Zamiast pełnego adresu e-mail, odpowiedź będzie zawierać tylko publicznie bezpieczne informacje (np. imię i pierwsza litera nazwiska lub w pełni zanonimizowana nazwa).
- **Ograniczenie zapytań**: Parametr `limit` będzie ograniczony do maksymalnie 100, aby zapobiec nadużyciom i atakom DoS poprzez żądanie zbyt dużej ilości danych naraz.

## 7. Rozważania dotyczące wydajności
- **Zapytania do bazy danych**: Zamiast wielu oddzielnych zapytań (jedno dla recenzji, drugie dla liczby całkowitej, trzecie dla statystyk), zostanie użyta jedna funkcja PostgreSQL (`rpc`). To minimalizuje liczbę rund do bazy danych i przenosi logikę agregacji na poziom bazy danych, co jest znacznie bardziej wydajne.
- **Paginacja**: Paginacja po stronie serwera jest kluczowa dla wydajności, ponieważ zapobiega ładowaniu całego zbioru danych do pamięci.
- **Indeksy bazy danych**: Należy upewnić się, że kolumny używane w klauzulach `WHERE` i `JOIN` (`reviews.project_id`, `reviews.reviewer_id`, `projects.client_id` itp.) są odpowiednio zindeksowane.

## 8. Etapy wdrożenia
1.  **Aktualizacja typów**:
    - W pliku `src/types.ts` zmodyfikuj `ReviewerDTO`, aby usunąć pole `email` i zastąpić je bezpiecznym publicznie polem, np. `name: string`.
    - Dodaj nowy typ `ArtisanReviewsResponseDTO` do `src/types.ts`.
2.  **Tworzenie funkcji bazy danych**:
    - Utwórz nową migrację Supabase.
    - Zdefiniuj funkcję PostgreSQL `get_artisan_reviews_and_summary(artisan_id uuid, page_num int, page_size int)`, która zwraca paginowane recenzje oraz obiekt JSON z podsumowaniem.
3.  **Implementacja serwisu**:
    - Utwórz plik `src/lib/services/review.service.ts`.
    - Zaimplementuj funkcję `getArtisanReviews(artisanId, page, limit)`, która:
      - Sprawdza istnienie rzemieślnika.
      - Wywołuje funkcję `rpc` z Supabase.
      - Mapuje wyniki na `ArtisanReviewsResponseDTO`.
4.  **Implementacja endpointu API**:
    - Utwórz plik `src/pages/api/artisans/[artisanId]/reviews.astro`.
    - Zaimplementuj logikę `GET`.
    - Użyj `zod` do walidacji parametrów `artisanId`, `page` i `limit`.
    - Wywołaj serwis `review.service.ts`.
    - Zaimplementuj obsługę błędów, mapując błędy z serwisu na odpowiednie kody statusu HTTP (400, 404, 500).
    - Zwróć pomyślną odpowiedź w formacie JSON.
5.  **Testowanie**:
    - Dodaj testy integracyjne dla nowego endpointu, obejmujące:
      - Scenariusz pomyślny z domyślnymi parametrami.
      - Scenariusz z niestandardowymi parametrami `page` i `limit`.
      - Przypadek, gdy rzemieślnik nie ma recenzji (oczekiwana pusta tablica `data`).
      - Obsługę błędów dla nieistniejącego `artisanId` (404).
      - Obsługę błędów dla nieprawidłowych parametrów zapytania (400).
