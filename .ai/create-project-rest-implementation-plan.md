
# Plan implementacji punktu końcowego API: Create Project

## 1. Przegląd punktu końcowego
Ten dokument opisuje plan implementacji punktu końcowego `POST /api/projects`. Punkt końcowy umożliwia uwierzytelnionym użytkownikom z rolą "klient" tworzenie nowego ogłoszenia o projekcie meblarskim. Projekt jest tworzony na podstawie wcześniej wygenerowanego przez AI obrazu i zawiera szczegóły takie jak kategoria, materiał, wymiary i budżet.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/projects`
- **Nagłówki**:
  - `Authorization`: `Bearer {access_token}` (Wymagane)
  - `Content-Type`: `application/json`
- **Parametry**: Brak parametrów URL.
- **Ciało żądania**:
  - **Wymagane**:
    - `generated_image_id` (string, uuid): Identyfikator obrazu wygenerowanego przez AI.
    - `category_id` (string, uuid): Identyfikator kategorii mebla.
    - `material_id` (string, uuid): Identyfikator materiału.
  - **Opcjonalne**:
    - `dimensions` (string, max 100 znaków): Wymiary mebla.
    - `budget_range` (string, max 50 znaków): Szacowany przedział budżetowy.

## 3. Wykorzystywane typy

### `src/lib/schemas.ts`
```typescript
// ... existing code
export const CreateProjectSchema = z.object({
  generated_image_id: z.string().uuid({ message: 'Invalid UUID for generated image' }),
  category_id: z.string().uuid({ message: 'Invalid UUID for category' }),
  material_id: z.string().uuid({ message: 'Invalid UUID for material' }),
  dimensions: z.string().max(100).optional(),
  budget_range: z.string().max(50).optional(),
});

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;
```

### `src/types.ts`
```typescript
// ... existing code
export interface Project {
  id: string;
  client_id: string;
  generated_image_id: string;
  category_id: string;
  material_id: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  dimensions: string | null;
  budget_range: string | null;
  accepted_proposal_id: string | null;
  accepted_price: number | null;
  created_at: string;
  updated_at: string;
}
```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (201 Created)**:
  - Zwraca nowo utworzony obiekt projektu, zgodny z typem `Project`.
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Błędy walidacji danych wejściowych.
  - `401 Unauthorized`: Brak lub nieważny token JWT.
  - `403 Forbidden`: Użytkownik nie ma uprawnień (np. nie jest klientem, nie jest właścicielem obrazu).
  - `404 Not Found`: Nie znaleziono powiązanego zasobu (obrazu, kategorii, materiału).
  - `409 Conflict`: Obraz jest już użyty w innym projekcie.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Żądanie `POST` trafia do punktu końcowego `/src/pages/api/projects/index.astro`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje token JWT, pobiera dane użytkownika i umieszcza je w `context.locals`. Sprawdza, czy użytkownik ma rolę `client`.
3.  Handler `POST` w pliku Astro odczytuje i waliduje ciało żądania za pomocą `CreateProjectSchema` z `zod`.
4.  Handler wywołuje metodę `createProject` z nowo utworzonego serwisu `ProjectService` (`src/lib/services/project.service.ts`), przekazując zwalidowane dane (DTO) oraz ID klienta z `context.locals`.
5.  `ProjectService` wykonuje logikę biznesową:
    a. Rozpoczyna transakcję bazodanową.
    b. Sprawdza, czy `generated_image` o podanym ID istnieje, należy do klienta i nie jest już użyty (`is_used = false`).
    c. Sprawdza istnienie `category` i `material` o podanych ID.
    d. Jeśli walidacja biznesowa przejdzie pomyślnie, tworzy nowy rekord w tabeli `projects` ze statusem `open`.
    e. Aktualizuje flagę `is_used` na `true` dla powiązanego rekordu w `generated_images`.
    f. Zatwierdza transakcję.
6.  `ProjectService` zwraca nowo utworzony obiekt projektu do handlera Astro.
7.  Handler Astro zwraca odpowiedź `201 Created` z danymi projektu w formacie JSON.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wszystkie żądania muszą zawierać ważny token JWT w nagłówku `Authorization`. Middleware jest odpowiedzialne za jego weryfikację.
- **Autoryzacja**:
  - Dostęp do punktu końcowego jest ograniczony do użytkowników z rolą `client`.
  - Logika serwisu musi zweryfikować, czy `generated_image_id` należy do uwierzytelnionego klienta, aby zapobiec atakom IDOR.
- **Walidacja danych**: Wszystkie dane wejściowe są rygorystycznie walidowane za pomocą `zod` w celu ochrony przed atakami typu injection i zapewnienia integralności danych.
- **Ochrona przed Race Condition**: Użycie transakcji bazodanowej oraz atomowej operacji sprawdzania i aktualizacji flagi `is_used` na obrazie zapobiegnie podwójnemu wykorzystaniu tego samego obrazu.

## 7. Obsługa błędów
Błędy będą obsługiwane centralnie za pomocą funkcji pomocniczych z `src/lib/api-utils.ts`.
- **Błędy walidacji (400)**: Zwracane, gdy `CreateProjectSchema` zwróci błąd.
- **Błędy autoryzacji (401, 403)**: Zwracane przez middleware lub logikę serwisu.
- **Błędy zasobów (404, 409)**: Zwracane przez `ProjectService`, gdy zasoby zależne nie istnieją lub naruszają ograniczenia biznesowe.
- **Błędy serwera (500)**: Każdy nieprzewidziany wyjątek zostanie przechwycony i zwrócony jako ogólny błąd serwera, a szczegóły zostaną zalogowane.

## 8. Rozważania dotyczące wydajności
- Operacje na bazie danych powinny być zoptymalizowane i wykonywane w ramach jednej transakcji, aby zapewnić spójność i zminimalizować czas blokady zasobów.
- Należy upewnić się, że kolumny używane do wyszukiwania (`generated_image_id`, `category_id`, `material_id`, `client_id`) są odpowiednio zindeksowane w bazie danych.

## 9. Etapy wdrożenia
1.  **Aktualizacja typów i schematów**:
    - Dodać typ `Project` do `src/types.ts`.
    - Dodać `CreateProjectSchema` i typ `CreateProjectDto` do `src/lib/schemas.ts`.
2.  **Utworzenie serwisu `ProjectService`**:
    - Stworzyć plik `src/lib/services/project.service.ts`.
    - Zaimplementować w nim metodę `createProject(dto: CreateProjectDto, clientId: string)`, zawierającą całą logikę biznesową i interakcje z bazą danych Supabase.
3.  **Implementacja punktu końcowego API**:
    - Stworzyć plik `src/pages/api/projects/index.astro`.
    - Zaimplementować handler `POST`, który będzie zarządzał całym cyklem życia żądania: walidacją, wywołaniem serwisu i zwróceniem odpowiedzi.
4.  **Aktualizacja Middleware**:
    - Upewnić się, że middleware w `src/middleware/index.ts` poprawnie obsługuje ścieżkę `/api/projects` i wymusza rolę `client`.
5.  **Testy**:
    - Napisać testy jednostkowe dla `ProjectService`, mockując Supabase client.
    - Napisać testy integracyjne dla punktu końcowego `POST /api/projects`, aby zweryfikować cały przepływ, włączając w to middleware i walidację.
6.  **Dokumentacja**:
    - Zaktualizować dokumentację API (np. w Postmanie lub Swaggerze), jeśli istnieje.
