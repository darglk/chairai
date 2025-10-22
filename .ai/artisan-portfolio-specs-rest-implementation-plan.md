# Plan Implementacji API: Zarządzanie Portfolio Rzemieślnika

## 1. Przegląd Punktów Końcowych

Ten dokument opisuje plan wdrożenia czterech punktów końcowych REST API przeznaczonych do zarządzania specjalizacjami i portfolio rzemieślnika. Umożliwiają one dodawanie i usuwanie specjalizacji oraz przesyłanie i usuwanie zdjęć z portfolio. Wszystkie operacje wymagają uwierzytelnienia i autoryzacji na poziomie roli 'artisan'.

## 2. Szczegóły Żądań i Odpowiedzi

### 2.1. Dodawanie Specjalizacji Rzemieślnika

- **Opis**: Dodaje jedną lub więcej specjalizacji do profilu zalogowanego rzemieślnika.
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/artisans/me/specializations`
- **Request Body**:
  ```json
  {
    "specialization_ids": ["uuid1", "uuid2"]
  }
  ```
- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "specializations": [
      { "id": "uuid1", "name": "Tables" },
      { "id": "uuid2", "name": "Chairs" }
    ]
  }
  ```

### 2.2. Usuwanie Specjalizacji Rzemieślnika

- **Opis**: Usuwa pojedynczą specjalizację z profilu zalogowanego rzemieślnika.
- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/artisans/me/specializations/{specializationId}`
- **Parametry URL**:
  - Wymagane: `specializationId` (UUID)
- **Odpowiedź sukcesu**: `204 No Content`

### 2.3. Przesyłanie Obrazu do Portfolio

- **Opis**: Przesyła nowy obraz do portfolio zalogowanego rzemieślnika.
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/artisans/me/portfolio`
- **Request Body**: `multipart/form-data` z polem `image`.
- **Odpowiedź sukcesu (201 Created)**:
  ```json
  {
    "id": "uuid",
    "artisan_id": "uuid",
    "image_url": "https://storage.supabase.co/...",
    "created_at": "2025-10-12T10:00:00Z"
  }
  ```

### 2.4. Usuwanie Obrazu z Portfolio

- **Opis**: Usuwa obraz z portfolio zalogowanego rzemieślnika.
- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/artisans/me/portfolio/{imageId}`
- **Parametry URL**:
  - Wymagane: `imageId` (UUID)
- **Odpowiedź sukcesu**: `204 No Content`

## 3. Wykorzystywane Typy i Schematy Walidacji

- **`AddArtisanSpecializationsSchema` (Zod)**: Do walidacji ciała żądania `POST /specializations`.
  ```typescript
  // src/lib/schemas.ts
  export const AddArtisanSpecializationsSchema = z.object({
    specialization_ids: z
      .array(z.string().uuid({ message: "Invalid UUID format." }))
      .min(1, "At least one specialization ID is required."),
  });
  ```
- **`PortfolioImageUploadSchema` (Zod)**: Do walidacji przesyłanego pliku.

  ```typescript
  // src/lib/schemas.ts
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

  export const PortfolioImageUploadSchema = z.object({
    image: z
      .instanceof(File)
      .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
      .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), "Only .jpg, .png and .webp formats are supported."),
  });
  ```

- **DTOs**: `ArtisanSpecializationDto`, `PortfolioImageDto` (zdefiniowane w `src/types.ts`).

## 4. Przepływ Danych

1.  **Middleware (`src/middleware/index.ts`)**:
    - Przechwytuje żądanie.
    - Weryfikuje token JWT z `Astro.cookies`.
    - Pobiera dane użytkownika z Supabase.
    - Sprawdza, czy użytkownik ma rolę `artisan`. Jeśli nie, zwraca `403 Forbidden`.
    - Przekazuje `context.locals.user` i `context.locals.supabase` do handlera endpointu.

2.  **Handler Endpointu (np. `src/pages/api/artisans/me/specializations/index.ts`)**:
    - Odbiera żądanie.
    - Parsuje i waliduje dane wejściowe (ciało żądania, parametry URL) za pomocą schematów Zod.
    - Wywołuje odpowiednią metodę w `ArtisanProfileService`, przekazując ID użytkownika i zwalidowane dane.
    - Obsługuje wynik z serwisu (`Result.success` lub `Result.failure`).
    - W przypadku sukcesu, zwraca odpowiedź z odpowiednim kodem statusu (200, 201, 204) i danymi (jeśli dotyczy).
    - W przypadku błędu, mapuje typ błędu na kod statusu HTTP (400, 404, 500) i zwraca ustandaryzowany obiekt błędu.

3.  **Serwis (`src/lib/services/artisan-profile.service.ts`)**:
    - Otrzymuje wywołanie od handlera.
    - Wykonuje logikę biznesową, komunikując się z klientem Supabase (`supabase` z `context.locals`).
    - **Dodawanie specjalizacji**: Weryfikuje istnienie `specialization_ids`, a następnie wstawia rekordy do tabeli `artisan_specializations`.
    - **Usuwanie specjalizacji**: Usuwa rekord z `artisan_specializations` na podstawie `artisan_id` i `specialization_id`.
    - **Przesyłanie obrazu**: Przesyła plik do Supabase Storage (`portfolio-images` bucket), a następnie zapisuje URL i metadane w tabeli `portfolio_images`.
    - **Usuwanie obrazu**: Sprawdza logikę biznesową (min. 5 zdjęć dla profilu publicznego), a następnie usuwa plik z Supabase Storage i rekord z tabeli `portfolio_images`.
    - Zwraca obiekt `Result` z danymi lub błędem.

## 5. Względy Bezpieczeństwa

- **Autoryzacja**: Middleware globalnie weryfikuje rolę `artisan` dla wszystkich endpointów w tej grupie.
- **Walidacja**: Wszystkie dane wejściowe są rygorystycznie walidowane za pomocą Zod, aby zapobiec atakom takim jak SQL Injection czy XSS.
- **IDOR**: Każda operacja w serwisie musi zawierać warunek `where('user_id', 'eq', userId)`, aby upewnić się, że rzemieślnik modyfikuje tylko własne zasoby.
- **Zarządzanie Plikami**:
  - Typ i rozmiar pliku są walidowane po stronie serwera.
  - Pliki są przechowywane w Supabase Storage z włączonymi politykami RLS, aby zapewnić dostęp tylko właścicielowi lub publicznie (w zależności od polityki).
- **Rate Limiting**: Należy zaimplementować mechanizm rate limiting (np. w `src/lib/rate-limit.ts`) dla endpointów przesyłających pliki, aby zapobiec nadużyciom.

## 6. Obsługa Błędów

Błędy będą kategoryzowane i zwracane w ustandaryzowanym formacie. Serwis będzie zwracał typowane błędy, np. `ValidationError`, `NotFoundError`, `ForbiddenError`.

| Kod HTTP                    | Opis Błędu                                 | Przykładowe Scenariusze                                                                                                  |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `400 Bad Request`           | Błąd walidacji danych wejściowych.         | Nieprawidłowy format UUID, brak wymaganego pola, plik za duży, próba usunięcia ostatniego zdjęcia z publicznego profilu. |
| `401 Unauthorized`          | Brak lub nieważny token uwierzytelniający. | Obsługiwane przez Supabase i middleware.                                                                                 |
| `403 Forbidden`             | Brak uprawnień do wykonania operacji.      | Użytkownik nie ma roli 'artisan', próba modyfikacji cudzych zasobów.                                                     |
| `404 Not Found`             | Zasób nie został znaleziony.               | Próba usunięcia nieistniejącej specjalizacji lub obrazu.                                                                 |
| `500 Internal Server Error` | Wewnętrzny błąd serwera.                   | Błąd połączenia z bazą danych, nieobsłużony wyjątek w logice biznesowej.                                                 |

## 7. Rozważania dotyczące Wydajności

- **Operacje na Bazie Danych**: Należy upewnić się, że wszystkie zapytania wykorzystują indeksy, zwłaszcza na kluczach obcych (`artisan_id`, `specialization_id`) i kolumnach używanych w klauzulach `WHERE`.
- **Przesyłanie Plików**: Operacje na plikach są kosztowne. Należy zoptymalizować proces, np. poprzez bezpośrednie przesyłanie z klienta do Supabase Storage, jeśli to możliwe, z uprzednim uzyskaniem podpisanego URL od naszego backendu. W obecnym podejściu (przesyłanie przez nasz serwer) kluczowa jest walidacja rozmiaru pliku.
- **Zapytania**: Unikać zapytań typu N+1, zwłaszcza przy pobieraniu danych powiązanych.

## 8. Etapy Wdrożenia

1.  **Konfiguracja Środowiska**:
    - Utworzyć nowe pliki dla endpointów w `src/pages/api/artisans/me/`.
    - Zaktualizować `src/middleware/index.ts`, aby zabezpieczyć nowe ścieżki i wymagać roli `artisan`.

2.  **Definicja Schematów i Typów**:
    - Dodać `AddArtisanSpecializationsSchema` i `PortfolioImageUploadSchema` do `src/lib/schemas.ts`.
    - Upewnić się, że wszystkie potrzebne DTOs (`ArtisanSpecializationDto`, `PortfolioImageDto`) istnieją w `src/types.ts`.

3.  **Implementacja Logiki w Serwisie (`artisan-profile.service.ts`)**:
    - Zaimplementować metodę `addSpecializationsToProfile`.
    - Zaimplementować metodę `removeSpecializationFromProfile`.
    - Zaimplementować metodę `uploadPortfolioImage`, włączając w to logikę przesyłania do Supabase Storage.
    - Zaimplementować metodę `deletePortfolioImage`, włączając w to logikę usuwania z Supabase Storage i walidację biznesową.

4.  **Implementacja Handlerów Endpointów**:
    - Utworzyć `src/pages/api/artisans/me/specializations/index.ts` dla `POST`.
    - Utworzyć `src/pages/api/artisans/me/specializations/[specializationId].ts` dla `DELETE`.
    - Utworzyć `src/pages/api/artisans/me/portfolio/index.ts` dla `POST`.
    - Utworzyć `src/pages/api/artisans/me/portfolio/[imageId].ts` dla `DELETE`.
    - W każdym handlerze zaimplementować walidację, wywołanie serwisu i obsługę odpowiedzi.

5.  **Testowanie**:
    - Napisać testy jednostkowe dla logiki w `artisan-profile.service.ts`.
    - Napisać testy integracyjne dla każdego punktu końcowego, symulując żądania HTTP i sprawdzając odpowiedzi oraz stan bazy danych.

6.  **Dokumentacja**:
    - Zaktualizować kolekcję Postman lub OpenAPI/Swagger, aby odzwierciedlić nowe punkty końcowe.
