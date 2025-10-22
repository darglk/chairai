# API Endpoint Implementation Plan: Create Review

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom (zarówno klientom, jak i rzemieślnikom) przesyłanie oceny i komentarza (recenzji) dla projektu, który został zakończony. Zapewnia to mechanizm informacji zwrotnej, kluczowy dla budowania zaufania na platformie.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/projects/{projectId}/reviews`
- **Parametry**:
  - **Wymagane**:
    - `projectId` (w ścieżce): `uuid` identyfikujący projekt.
- **Request Body**:
  - **Typ zawartości**: `application/json`
  - **Struktura**:
    ```json
    {
      "rating": 5,
      "comment": "Excellent craftsmanship and communication"
    }
    ```
  - **Pola**:
    - `rating` (wymagane): `integer` w zakresie od 1 do 5.
    - `comment` (wymagane): `string` zawierający treść recenzji.

## 3. Wykorzystywane typy

- **Command Model**: `CreateReviewCommand` - Definiuje strukturę danych przychodzących (`rating`, `comment`).
- **Data Transfer Object (DTO)**: `ReviewDTO` - Definiuje strukturę danych w odpowiedzi na pomyślne utworzenie recenzji.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created)**: Zwraca nowo utworzony obiekt recenzji.
  ```json
  {
    "id": "uuid",
    "project_id": "uuid",
    "reviewer_id": "uuid",
    "reviewee_id": "uuid",
    "rating": 5,
    "comment": "Excellent craftsmanship and communication",
    "created_at": "2025-10-12T10:00:00Z"
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe dane wejściowe (np. `rating` poza zakresem) lub projekt nie ma statusu `completed`.
  - `401 Unauthorized`: Brakujący, nieprawidłowy lub wygasły token dostępowy.
  - `403 Forbidden`: Użytkownik nie jest zaangażowany w projekt lub już go zrecenzował.
  - `404 Not Found`: Projekt o podanym `projectId` nie istnieje.
  - `409 Conflict`: Użytkownik już przesłał recenzję dla tego projektu.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera, np. problem z połączeniem z bazą danych.

## 5. Przepływ danych

1.  Żądanie `POST` trafia do punktu końcowego `/api/projects/[projectId]/reviews.ts`.
2.  Middleware Astro weryfikuje token JWT z nagłówka `Authorization` i umieszcza dane użytkownika w `context.locals.user`.
3.  Endpoint pobiera `projectId` z parametrów ścieżki.
4.  Treść żądania jest walidowana za pomocą schemy `zod` (`CreateReviewSchema`). W przypadku błędu zwracany jest status `400`.
5.  Wywoływana jest metoda `createReview` z nowego serwisu `ReviewService` (`src/lib/services/review.service.ts`), przekazując `projectId`, dane użytkownika (`reviewerId`) oraz zwalidowaną treść żądania.
6.  **Wewnątrz `ReviewService`**:
    a. Pobierane są dane projektu z bazy danych na podstawie `projectId`. Jeśli projekt nie istnieje, zwracany jest błąd `404`.
    b. Sprawdzany jest status projektu. Jeśli jest inny niż `completed`, zwracany jest błąd `400`.
    c. Weryfikowane jest, czy `reviewerId` jest równy `client_id` projektu lub `artisan_id` z zaakceptowanej propozycji. Jeśli nie, zwracany jest błąd `403`.
    d. Sprawdzane jest, czy recenzja od tego `reviewerId` dla tego `projectId` już istnieje w tabeli `reviews`. Jeśli tak, zwracany jest błąd `409`.
    e. Ustalany jest `reviewee_id`: jeśli recenzentem jest klient, `reviewee_id` to ID rzemieślnika; jeśli recenzentem jest rzemieślnik, `reviewee_id` to ID klienta.
    f. Nowy rekord jest wstawiany do tabeli `reviews` w bazie danych.
7.  `ReviewService` zwraca pełny obiekt nowo utworzonej recenzji.
8.  Endpoint formatuje odpowiedź jako `ReviewDTO` i wysyła ją z kodem statusu `201 Created`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wszystkie żądania muszą zawierać prawidłowy token JWT, weryfikowany przez middleware.
- **Autoryzacja**: Logika serwisu musi rygorystycznie sprawdzać, czy użytkownik jest uprawniony do recenzowania danego projektu (jest klientem lub wykonawcą). Zapobiega to dodawaniu recenzji przez osoby postronne.
- **Walidacja danych wejściowych**: Użycie `zod` do walidacji ciała żądania chroni przed nieprawidłowymi danymi, np. oceną spoza skali.
- **Ochrona przed duplikacją**: Zarówno logika aplikacji, jak i unikalny klucz w bazie danych na `(project_id, reviewer_id)` zapobiegają wielokrotnemu recenzowaniu tego samego projektu przez jednego użytkownika.

## 7. Rozważania dotyczące wydajności

- Operacje na bazie danych powinny być zoptymalizowane. Zapytania weryfikujące (o projekt, o istniejącą recenzję) powinny wykorzystywać indeksy (`PRIMARY KEY` na `id` projektu, unikalny indeks na `(project_id, reviewer_id)`).
- Ilość zapytań do bazy danych w jednym żądaniu jest niewielka (odczyt projektu, odczyt propozycji, sprawdzenie recenzji, zapis recenzji), więc nie przewiduje się problemów z wydajnością przy standardowym obciążeniu.

## 8. Etapy wdrożenia

1.  **Utworzenie schemy walidacji**: W pliku `src/lib/schemas.ts` dodać `CreateReviewSchema` używając `zod` do walidacji `rating` i `comment`.
2.  **Utworzenie serwisu**: Stworzyć nowy plik `src/lib/services/review.service.ts`.
3.  **Implementacja metody `createReview`**: W `ReviewService` zaimplementować logikę opisaną w sekcji "Przepływ danych", w tym wszystkie walidacje biznesowe i operacje na bazie danych.
4.  **Utworzenie pliku endpointu**: Stworzyć plik `src/pages/api/projects/[projectId]/reviews.ts`.
5.  **Implementacja endpointu**: W pliku endpointu zaimplementować obsługę żądania `POST`:
    - Zintegrować walidację `zod`.
    - Wywołać metodę `ReviewService.createReview`.
    - Obsłużyć pomyślną odpowiedź oraz wszystkie możliwe błędy, zwracając odpowiednie kody statusu i komunikaty.
6.  **Testy jednostkowe**: Dodać testy jednostkowe dla `ReviewService`, obejmujące wszystkie ścieżki logiczne (sukces, błędy walidacji, brak uprawnień itp.).
7.  **Testy integracyjne**: Dodać testy integracyjne dla punktu końcowego API, symulując rzeczywiste żądania HTTP i sprawdzając odpowiedzi oraz stan bazy danych.
