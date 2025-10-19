# API Endpoint Implementation Plan: Create/Update Artisan Profile

## 1. Przegląd punktu końcowego
Ten punkt końcowy `PUT /api/artisans/me` umożliwia uwierzytelnionemu użytkownikowi z rolą "rzemieślnik" (artisan) utworzenie lub zaktualizowanie swojego profilu zawodowego. Operacja jest idempotentna, co oznacza, że wielokrotne wywołania z tymi samymi danymi wejściowymi będą miały ten sam efekt. Endpoint wykorzystuje metodę `upsert` do modyfikacji danych w tabeli `artisan_profiles`.

## 2. Szczegóły żądania
- **Metoda HTTP**: `PUT`
- **Struktura URL**: `/api/artisans/me`
- **Nagłówki**:
  - `Authorization`: `Bearer {access_token}` (Wymagany)
  - `Content-Type`: `application/json` (Wymagany)
- **Request Body**:
  ```json
  {
    "company_name": "string",
    "nip": "string"
  }
  ```
- **Parametry**:
  - **Wymagane w body**:
    - `company_name`: `string`, niepusty.
    - `nip`: `string`, musi składać się z dokładnie 10 cyfr.

## 3. Wykorzystywane typy
- **DTO (Data Transfer Object)**: `ArtisanProfilePutDto` zostanie zdefiniowany w `src/lib/schemas.ts` przy użyciu `zod` w celu walidacji danych wejściowych.
  ```typescript
  // src/lib/schemas.ts
  import { z } from 'zod';

  export const ArtisanProfilePutDtoSchema = z.object({
    company_name: z.string().min(1, { message: "Company name cannot be empty" }),
    nip: z.string().regex(/^\d{10}$/, { message: "NIP must be a 10-digit string" })
  });

  export type ArtisanProfilePutDto = z.infer<typeof ArtisanProfilePutDtoSchema>;
  ```
- **Entity**: `ArtisanProfile` w `src/types.ts` będzie reprezentować strukturę danych w tabeli `artisan_profiles`.
  ```typescript
  // src/types.ts
  export interface ArtisanProfile {
    user_id: string;
    company_name: string;
    nip: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
  }
  ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**: Zwraca obiekt JSON z danymi utworzonego lub zaktualizowanego profilu rzemieślnika.
  ```json
  {
    "user_id": "uuid",
    "company_name": "Master Woodworks",
    "nip": "1234567890",
    "is_public": false,
    "updated_at": "2025-10-12T10:00:00Z"
  }
  ```
- **Odpowiedzi błędów**: Zgodnie ze standardem projektu, błędy będą zwracane w formacie:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable error message"
    }
  }
  ```
  (Szczegółowe kody w sekcji "Obsługa błędów").

## 5. Przepływ danych
1.  Żądanie `PUT` trafia do endpointu `/api/artisans/me`.
2.  Astro middleware (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token JWT, pobiera sesję i dane użytkownika z Supabase, a następnie umieszcza je w `context.locals`.
3.  Handler API (`src/pages/api/artisans/me.ts`) jest wywoływany.
4.  Handler sprawdza, czy `context.locals.user.role` jest równy `artisan`.
5.  Handler waliduje ciało żądania przy użyciu schematu `ArtisanProfilePutDtoSchema` (Zod).
6.  Handler wywołuje funkcję `upsertArtisanProfile` z nowego serwisu `src/lib/services/artisan-profile.service.ts`, przekazując jej instancję klienta Supabase (`context.locals.supabase`), ID użytkownika oraz zwalidowane dane.
7.  Serwis `artisan-profile.service` wykonuje logikę biznesową:
    a. Sprawdza, czy podany NIP już istnieje w tabeli `artisan_profiles` i czy jest przypisany do innego użytkownika.
    b. Wykonuje operację `upsert` na tabeli `artisan_profiles` z danymi: `user_id`, `company_name`, `nip`.
8.  Serwis zwraca wynik operacji `upsert` do handlera.
9.  Handler formatuje odpowiedź i wysyła ją do klienta ze statusem `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp jest chroniony przez middleware, które weryfikuje token JWT z Supabase Auth. Żądania bez ważnego tokenu są odrzucane z kodem `401 Unauthorized`.
- **Autoryzacja**: Handler API jawnie sprawdza, czy rola zalogowanego użytkownika to `artisan`. Użytkownicy z inną rolą (np. `client`) otrzymają odpowiedź `403 Forbidden`.
- **Walidacja danych wejściowych**: Użycie `zod` do walidacji formatu i typów danych (`company_name`, `nip`) chroni przed niepoprawnymi danymi.
- **Ochrona przed SQL Injection**: Wykorzystanie klienta Supabase (`@supabase/supabase-js`) zapewnia parametryzację zapytań, co eliminuje ryzyko SQL Injection.
- **Row-Level Security (RLS)**: Chociaż logika autoryzacji jest w handlerze, należy upewnić się, że w bazie danych Supabase istnieją odpowiednie polityki RLS dla tabeli `artisan_profiles`, pozwalające rzemieślnikowi na modyfikację tylko własnego profilu.

## 7. Obsługa błędów
- **400 Bad Request**: Zwracany, gdy walidacja `zod` nie powiedzie się (np. NIP ma nieprawidłowy format). Odpowiedź będzie zawierać szczegóły błędu walidacji.
- **401 Unauthorized**: Zwracany przez middleware, gdy token jest nieprawidłowy, wygasł lub go brakuje.
- **403 Forbidden**: Zwracany, gdy uwierzytelniony użytkownik nie ma roli `artisan`.
- **409 Conflict**: Zwracany, gdy podany NIP jest już używany przez innego rzemieślnika.
- **500 Internal Server Error**: Zwracany w przypadku nieoczekiwanych błędów po stronie serwera, np. problemów z połączeniem z bazą danych. Każdy taki błąd powinien być logowany po stronie serwera w celu dalszej analizy.

## 8. Rozważania dotyczące wydajności
- Operacja `upsert` jest pojedynczym zapytaniem do bazy danych, co jest wydajne.
- Sprawdzenie unikalności NIP wymaga dodatkowego zapytania `SELECT` przed `upsert`. Aby zoptymalizować ten proces, na kolumnie `nip` w tabeli `artisan_profiles` powinien znajdować się indeks. Jeśli na kolumnie `nip` istnieje ograniczenie `UNIQUE`, można polegać na obsłudze błędu bazy danych, co upraszcza kod i redukuje liczbę zapytań do jednego.
- Czas odpowiedzi będzie głównie zależał od wydajności bazy danych Supabase.

## 9. Etapy wdrożenia
1.  **Aktualizacja typów**: Dodać lub zweryfikować typ `ArtisanProfile` w pliku `src/types.ts`.
2.  **Definicja schematu walidacji**: Dodać `ArtisanProfilePutDtoSchema` do pliku `src/lib/schemas.ts`.
3.  **Utworzenie serwisu**: Stworzyć nowy plik `src/lib/services/artisan-profile.service.ts`.
4.  **Implementacja logiki serwisu**: W `artisan-profile.service.ts` zaimplementować funkcję `upsertArtisanProfile`, która będzie zawierać logikę sprawdzania unikalności NIP oraz operację `upsert` na bazie danych.
5.  **Utworzenie pliku endpointu**: Stworzyć plik `src/pages/api/artisans/me.ts`.
6.  **Implementacja handlera API**: W `me.ts` napisać handler `PUT`, który:
    a. Korzysta z `context.locals` do pobrania danych użytkownika i klienta Supabase.
    b. Implementuje logikę autoryzacji (sprawdzenie roli).
    c. Waliduje dane wejściowe przy użyciu `ArtisanProfilePutDtoSchema`.
    d. Wywołuje serwis `artisanProfileService.upsertArtisanProfile`.
    e. Obsługuje błędy i zwraca odpowiednie kody statusu.
    f. Zwraca pomyślną odpowiedź `200 OK`.
7.  **Testy jednostkowe**: Napisać testy dla serwisu `artisan-profile.service.ts`, symulując klienta Supabase i sprawdzając logikę biznesową (np. obsługę konfliktu NIP).
8.  **Testy integracyjne/E2E**: Napisać test dla endpointu API, który obejmuje różne scenariusze: pomyślne utworzenie/aktualizację, błędy walidacji, brak autoryzacji i konflikt NIP.
9.  **Dokumentacja**: Zaktualizować dokumentację API (np. w Postmanie lub Swaggerze), jeśli jest używana w projekcie.
