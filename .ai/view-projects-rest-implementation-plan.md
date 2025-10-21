# API Endpoint Implementation Plan: View Projects

## 1. Przegląd punktu końcowego

Ten plan obejmuje implementację dwóch powiązanych punktów końcowych REST API, które umożliwiają użytkownikom przeglądanie projektów:

1.  **`GET /api/projects`**: Udostępnia listę otwartych projektów dla rzemieślników, pełniąc funkcję rynku zleceń. Obsługuje filtrowanie i paginację.
2.  **`GET /api/projects/{projectId}`**: Zwraca szczegółowe informacje o konkretnym projekcie dla jego właściciela lub uprawnionych rzemieślników.

Implementacja będzie zgodna z architekturą Astro, z logiką biznesową wyodrębnioną do dedykowanego serwisu.

## 2. Szczegóły żądania

### `GET /api/projects`

-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/api/projects`
-   **Parametry zapytania**:
    -   Wymagane: Brak
    -   Opcjonalne:
        -   `status: string` (domyślnie: `open`)
        -   `category_id: string` (UUID)
        -   `material_id: string` (UUID)
        -   `page: number` (domyślnie: `1`)
        -   `limit: number` (domyślnie: `20`, max: `100`)
-   **Request Body**: Brak

### `GET /api/projects/{projectId}`

-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/api/projects/{projectId}`
-   **Parametry ścieżki**:
    -   Wymagane: `projectId: string` (UUID)
    -   Opcjonalne: Brak
-   **Request Body**: Brak

## 3. Wykorzystywane typy

-   **`ProjectListItemDTO`**: Struktura danych dla każdego projektu na liście `GET /api/projects`.
-   **`ProjectDTO`**: Struktura danych dla szczegółów projektu w `GET /api/projects/{projectId}`.
-   **`PaginatedResponseDTO<ProjectListItemDTO>`**: Wrapper dla odpowiedzi z `GET /api/projects`, zawierający dane i metadane paginacji.
-   **`PaginationMetaDTO`**: Obiekt z informacjami o paginacji.
-   **`ProjectsQueryParams`**: Typ walidujący parametry zapytania dla `GET /api/projects`.
-   **`ApiErrorDTO`**: Standardowy format odpowiedzi dla błędów API.

## 4. Szczegóły odpowiedzi

### `GET /api/projects`

-   **200 OK**: Pomyślne pobranie listy projektów.
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "generated_image": { "id": "uuid", "image_url": "...", "prompt": "..." },
          "category": { "id": "uuid", "name": "Tables" },
          "material": { "id": "uuid", "name": "Oak" },
          "status": "open",
          "dimensions": "200cm x 90cm",
          "budget_range": "2000-3000 PLN",
          "created_at": "2025-10-12T10:00:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 50,
        "total_pages": 3
      }
    }
    ```
-   **400 Bad Request**: Błąd walidacji parametrów zapytania.
-   **401 Unauthorized**: Brak lub nieprawidłowy token uwierzytelniający.
-   **403 Forbidden**: Użytkownik nie ma roli `artisan`.
-   **500 Internal Server Error**: Błąd serwera.

### `GET /api/projects/{projectId}`

-   **200 OK**: Pomyślne pobranie szczegółów projektu.
    ```json
    {
      "id": "uuid",
      "client_id": "uuid",
      "generated_image": { "...": "..." },
      "category": { "...": "..." },
      "material": { "...": "..." },
      "status": "open",
      "dimensions": "200cm x 90cm",
      "budget_range": "2000-3000 PLN",
      "accepted_proposal_id": null,
      "accepted_price": null,
      "proposals_count": 3,
      "created_at": "2025-10-12T10:00:00Z",
      "updated_at": "2025-10-12T10:00:00Z"
    }
    ```
-   **400 Bad Request**: Nieprawidłowy format `projectId`.
-   **401 Unauthorized**: Brak lub nieprawidłowy token.
-   **403 Forbidden**: Brak uprawnień do wyświetlenia projektu.
-   **404 Not Found**: Projekt o podanym ID nie istnieje.
-   **500 Internal Server Error**: Błąd serwera.

## 5. Przepływ danych

1.  Żądanie `GET` trafia do odpowiedniego pliku endpointu w `src/pages/api/projects/`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje token JWT i dołącza obiekt `user` oraz klienta `supabase` do `context.locals`.
3.  Endpoint wywołuje `zod` w celu walidacji parametrów zapytania lub ścieżki.
4.  Endpoint wywołuje odpowiednią metodę z serwisu `project.service.ts`, przekazując klienta `supabase`, zwalidowane parametry i obiekt `user`.
5.  Serwis wykonuje następujące operacje:
    -   Sprawdza uprawnienia użytkownika (rola, własność zasobu).
    -   Konstruuje i wykonuje zapytanie SQL do bazy Supabase, używając `JOIN` do pobrania danych z tabel `categories`, `materials`, `generated_images` oraz agregując dane (np. `COUNT` dla `proposals`).
    -   Mapuje wyniki z bazy danych na odpowiednie typy DTO (`ProjectListItemDTO` lub `ProjectDTO`).
    -   W przypadku listy, oblicza metadane paginacji.
6.  Serwis zwraca zmapowane dane lub rzuca błąd (np. `ApiError`).
7.  Endpoint przechwytuje dane lub błąd i wysyła odpowiedź HTTP z odpowiednim kodem statusu i ciałem.

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie**: Wszystkie endpointy muszą być chronione. Middleware musi weryfikować token `access_token` i odrzucać żądania bez niego (401).
-   **Autoryzacja**:
    -   `GET /api/projects`: Dostęp musi być ograniczony do użytkowników z rolą `artisan`.
    -   `GET /api/projects/{projectId}`: Dostęp musi być ograniczony do właściciela projektu (`client_id`) lub rzemieślników (tylko jeśli `status` projektu to `open`).
-   **Walidacja danych wejściowych**: Wszystkie parametry (`projectId`, `page`, `limit` itd.) muszą być rygorystycznie walidowane za pomocą `zod`, aby zapobiec błędom i potencjalnym atakom (np. SQL Injection, chociaż Supabase ORM zapewnia ochronę).
-   **Zasady RLS**: Należy upewnić się, że reguły Row Level Security w Supabase są spójne z logiką autoryzacji w serwisie, aby zapewnić dodatkową warstwę ochrony na poziomie bazy danych.

## 7. Rozważania dotyczące wydajności

-   **Zapytania do bazy danych**: Zapytanie pobierające listę projektów powinno być zoptymalizowane. Należy użyć jednego zapytania z `JOIN` zamiast wielu oddzielnych zapytań (unikanie problemu N+1).
-   **Indeksowanie**: Kolumny używane do filtrowania (`status`, `category_id`, `material_id`) oraz klucze obce (`client_id`) w tabeli `projects` powinny być zaindeksowane w bazie danych, aby przyspieszyć operacje `WHERE` i `JOIN`.
-   **Paginacja**: Implementacja paginacji po stronie serwera jest kluczowa, aby unikać przesyłania dużych ilości danych. Należy ograniczyć maksymalną wartość `limit` do rozsądnej liczby (np. 100).

## 8. Etapy wdrożenia

1.  **Utworzenie plików endpointów**:
    -   Stwórz plik `src/pages/api/projects/index.ts` dla listy projektów.
    -   Stwórz plik `src/pages/api/projects/[projectId].ts` dla szczegółów projektu.
2.  **Walidacja `zod`**:
    -   W `src/lib/schemas.ts` zdefiniuj schematy `zod` do walidacji `ProjectsQueryParams` oraz `projectId`.
3.  **Implementacja serwisu**:
    -   Stwórz plik `src/lib/services/project.service.ts`.
    -   Zaimplementuj metodę `listProjects(supabase, queryParams, user)`, która:
        -   Sprawdza, czy `user.role` to `artisan`.
        -   Buduje zapytanie Supabase z dynamicznym filtrowaniem (`where`) i paginacją (`range`).
        -   Łączy tabele `generated_images`, `categories`, `materials`.
        -   Zwraca `PaginatedResponseDTO<ProjectListItemDTO>`.
    -   Zaimplementuj metodę `getProjectDetails(supabase, projectId, user)`, która:
        -   Pobiera projekt wraz z powiązanymi danymi i liczbą propozycji.
        -   Sprawdza uprawnienia dostępu (właściciel lub rzemieślnik dla otwartego projektu).
        -   Zwraca `ProjectDTO` lub rzuca `ApiError` (404/403).
4.  **Integracja w endpointach**:
    -   W plikach API (`index.ts`, `[projectId].ts`) zintegruj logikę:
        -   Pobierz `supabase` i `user` z `context.locals`.
        -   Zwaliduj parametry wejściowe za pomocą schematów `zod`.
        -   Wywołaj odpowiednią metodę z `project.service.ts`.
        -   Obsłuż błędy w bloku `try...catch` i zwróć odpowiednie odpowiedzi HTTP.
5.  **Testy**:
    -   Napisz testy jednostkowe dla logiki w `project.service.ts`, mockując klienta Supabase.
    -   Napisz testy integracyjne dla endpointów API, aby zweryfikować cały przepływ, w tym autoryzację i walidację.
6.  **Dokumentacja**:
    -   Upewnij się, że implementacja jest zgodna z planem API (`api-plan.md`). W razie potrzeby zaktualizuj dokumentację.
