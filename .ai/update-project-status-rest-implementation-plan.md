# API Endpoint Implementation Plan: Update Project Status

## 1. Przegląd punktu końcowego

Ten dokument opisuje plan wdrożenia punktu końcowego `PATCH /api/projects/{projectId}/status`. Jego celem jest umożliwienie klientowi aktualizacji statusu swojego projektu. Implementacja musi być zgodna z zasadami bezpieczeństwa, walidacji i logiki biznesowej zdefiniowanymi w dokumentacji projektu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/projects/{projectId}/status`
- **Parametry**:
  - **Ścieżki (wymagane)**:
    - `projectId` (string, UUID): Unikalny identyfikator projektu.
- **Nagłówki**:
  - `Authorization: Bearer {access_token}`: Token JWT uzyskany z Supabase.
- **Ciało żądania**:
  ```json
  {
    "status": "open" | "in_progress" | "completed" | "closed"
  }
  ```

## 3. Wykorzystywane typy

- **Command Model**: `UpdateProjectStatusCommand`
  ```typescript
  // src/types.ts
  export interface UpdateProjectStatusCommand {
    status: ProjectStatus;
  }
  ```
- **DTO odpowiedzi**: `UpdateProjectStatusResponseDTO` (do dodania w `src/types.ts`)
  ```typescript
  // src/types.ts
  /**
   * Update Project Status Response DTO
   * Used in: PATCH /api/projects/{id}/status (response)
   */
  export interface UpdateProjectStatusResponseDTO {
    id: string;
    status: ProjectStatus;
    updated_at: string;
  }
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "id": "uuid",
    "status": "completed",
    "updated_at": "2025-10-12T10:00:00Z"
  }
  ```
- **Odpowiedzi błędów**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1.  **Żądanie przychodzące**: Użytkownik wysyła żądanie `PATCH` do `/api/projects/{projectId}/status` z tokenem i ciałem żądania.
2.  **Middleware (Astro)**: Przechwytuje żądanie, weryfikuje token JWT i pobiera dane użytkownika z `Astro.locals.supabase`. Jeśli użytkownik nie jest uwierzytelniony, zwraca `401 Unauthorized`.
3.  **Endpoint API (`/src/pages/api/projects/[projectId]/status.ts`)**:
    - Parsuje `projectId` z adresu URL.
    - Waliduje ciało żądania za pomocą `zod` w celu sprawdzenia poprawności pola `status`.
    - Wywołuje metodę `projectService.updateProjectStatus()` przekazując `projectId`, nowy `status` oraz `userId` zalogowanego użytkownika.
4.  **Serwis (`project.service.ts`)**:
    - Pobiera projekt z bazy danych Supabase na podstawie `projectId`.
    - Sprawdza, czy projekt istnieje. Jeśli nie, rzuca błąd `NotFoundError`.
    - Weryfikuje, czy zalogowany użytkownik jest właścicielem projektu (`project.client_id === userId`). Jeśli nie, rzuca błąd `ForbiddenError`.
    - Implementuje logikę biznesową walidacji przejścia statusu. Jeśli przejście jest niedozwolone, rzuca błąd `BadRequestError`.
    - Aktualizuje status projektu w tabeli `projects` w bazie danych.
    - Zwraca zaktualizowane dane (`id`, `status`, `updated_at`).
5.  **Odpowiedź API**: Endpoint API przechwytuje dane zwrócone przez serwis i wysyła odpowiedź `200 OK` do klienta. W przypadku błędu, globalny handler błędów formatuje odpowiedź z odpowiednim kodem statusu.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione za pomocą ważnego tokenu JWT. Middleware jest odpowiedzialne za weryfikację sesji.
- **Autoryzacja**: Logika w serwisie musi bezwzględnie sprawdzać, czy użytkownik dokonujący zmiany jest właścicielem projektu. Zapobiega to modyfikacji danych przez nieuprawnione osoby.
- **Walidacja danych wejściowych**: Zarówno `projectId`, jak i `status` muszą być walidowane, aby zapobiec atakom (np. SQL Injection, chociaż Supabase ORM w dużej mierze to ogranicza) i błędom aplikacji.

## 7. Obsługa błędów

- **400 Bad Request**:
  - Nieprawidłowe lub brakujące pole `status` w ciele żądania.
  - Nieprawidłowy format `projectId`.
  - Niedozwolone przejście statusu (np. próba zamknięcia projektu, który nie został zakończony).
- **401 Unauthorized**:
  - Brak tokenu uwierzytelniającego lub token jest nieważny.
- **403 Forbidden**:
  - Użytkownik próbuje zaktualizować projekt, którego nie jest właścicielem.
- **404 Not Found**:
  - Projekt o podanym `projectId` nie został znaleziony w bazie danych.
- **500 Internal Server Error**:
  - Wystąpił nieoczekiwany błąd po stronie serwera, np. podczas komunikacji z bazą danych. Błąd powinien być szczegółowo zalogowany.

## 8. Rozważania dotyczące wydajności

- Operacja polega na pojedynczym zapytaniu `SELECT` i `UPDATE` do bazy danych, co jest wysoce wydajne.
- Należy upewnić się, że kolumny `id` i `client_id` w tabeli `projects` są zindeksowane w celu szybkiego wyszukiwania.
- Nie przewiduje się wąskich gardeł wydajnościowych dla tego punktu końcowego.

## 9. Etapy wdrożenia

1.  **Aktualizacja typów**: Dodać definicję `UpdateProjectStatusResponseDTO` do pliku `src/types.ts`.
2.  **Utworzenie schematu walidacji**: W pliku `src/lib/schemas.ts` dodać schemat `zod` dla `UpdateProjectStatusCommand`.
3.  **Implementacja logiki w serwisie**:
    - W `src/lib/services/project.service.ts` (lub utworzyć plik, jeśli nie istnieje) zaimplementować metodę `updateProjectStatus(projectId, newStatus, userId)`.
    - Zaimplementować pobieranie danych, weryfikację uprawnień i logikę biznesową przejść między statusami.
4.  **Utworzenie pliku endpointu**:
    - Utworzyć plik `/src/pages/api/projects/[projectId]/status.ts`.
    - Zaimplementować handler `PATCH`, który będzie zarządzał żądaniem i odpowiedzią.
    - Dodać `export const prerender = false;`
5.  **Integracja z serwisem**: W handlerze `PATCH` wywołać zaimplementowaną metodę z serwisu `projectService`.
6.  **Obsługa błędów**: Zintegrować endpoint z globalnym mechanizmem obsługi błędów, aby zapewnić spójne odpowiedzi.
7.  **Testy**:
    - Napisać testy jednostkowe dla logiki w serwisie `project.service.ts`, obejmujące wszystkie ścieżki (sukces, błędy uprawnień, błędy walidacji).
    - Napisać testy integracyjne dla punktu końcowego API, symulując rzeczywiste żądania HTTP i sprawdzając odpowiedzi oraz zmiany w bazie danych.
8.  **Dokumentacja**: Zaktualizować dokumentację API (np. w Postmanie lub Swaggerze), jeśli jest używana.
