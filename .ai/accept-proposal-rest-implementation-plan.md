# API Endpoint Implementation Plan: Accept Proposal

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia klientowi (właścicielowi projektu) zaakceptowanie propozycji złożonej przez rzemieślnika. Akceptacja propozycji powoduje zmianę statusu projektu na `in_progress` i zapisuje szczegóły zaakceptowanej oferty, takie jak jej ID i cena, w rekordzie projektu. Operacja jest transakcyjna, aby zapewnić spójność danych.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/projects/{projectId}/accept-proposal`
- **Parametry**:
  - **Wymagane**:
    - `projectId` (w ścieżce URL): Identyfikator projektu (UUID).
    - `proposal_id` (w ciele żądania): Identyfikator propozycji do akceptacji (UUID).
  - **Opcjonalne**: Brak.
- **Nagłówki**:
  - `Authorization: Bearer {access_token}` (wymagany)
- **Request Body**:
  ```json
  {
    "proposal_id": "uuid"
  }
  ```

## 3. Wykorzystywane typy

- **Command Model**: `AcceptProposalCommand` (`src/types.ts`)
  ```typescript
  export interface AcceptProposalCommand {
    proposal_id: string;
  }
  ```
- **DTO (odpowiedź)**: Częściowy `ProjectDTO` (`src/types.ts`)
  ```typescript
  {
    "id": "uuid",
    "status": "in_progress",
    "accepted_proposal_id": "uuid",
    "accepted_price": 2500.00,
    "updated_at": "2025-10-12T10:00:00Z"
  }
  ```

## 4. Przepływ danych

1.  Klient wysyła żądanie `POST` na adres `/api/projects/{projectId}/accept-proposal` z `proposal_id` w ciele.
2.  Middleware Astro weryfikuje token JWT i udostępnia dane użytkownika w `context.locals`.
3.  Handler API w `src/pages/api/projects/[projectId]/accept-proposal.ts` jest wywoływany.
4.  Handler waliduje `projectId` z URL oraz `proposal_id` z ciała żądania przy użyciu Zod.
5.  Handler wywołuje funkcję `acceptProjectProposal(supabase, projectId, proposalId, userId)` z serwisu `project.service.ts`.
6.  Serwis wykonuje transakcję bazodanową w Supabase:
    a. Pobiera projekt o zadanym `projectId` oraz propozycję o zadanym `proposalId`.
    b. Sprawdza, czy projekt i propozycja istnieją. Jeśli nie, zwraca błąd `404 Not Found`.
    c. Weryfikuje, czy zalogowany użytkownik (`userId`) jest właścicielem projektu (`project.client_id`). Jeśli nie, zwraca błąd `403 Forbidden`.
    d. Sprawdza, czy status projektu to `open`. Jeśli nie, zwraca błąd `400 Bad Request`.
    e. Sprawdza, czy propozycja należy do projektu (`proposal.project_id === projectId`). Jeśli nie, zwraca błąd `400 Bad Request`.
    f. Aktualizuje rekord projektu w tabeli `projects`, ustawiając:
    - `status` na `'in_progress'`.
    - `accepted_proposal_id` na `proposalId`.
    - `accepted_price` na `proposal.price`.
    - `updated_at` na bieżący czas.
7.  Jeśli transakcja się powiedzie, serwis zwraca zaktualizowane dane projektu.
8.  Handler API formatuje odpowiedź i wysyła ją do klienta z kodem `200 OK`.

## 5. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego jest chroniony i wymaga prawidłowego tokenu JWT, który jest weryfikowany przez middleware.
- **Autoryzacja**: Logika biznesowa musi rygorystycznie sprawdzać, czy identyfikator uwierzytelnionego użytkownika (`context.locals.user.id`) jest zgodny z `client_id` projektu. Jest to kluczowy warunek, aby uniemożliwić użytkownikom modyfikowanie nie swoich projektów.
- **Walidacja danych wejściowych**: `projectId` i `proposal_id` będą walidowane jako stringi w formacie UUID przy użyciu Zod, co zapobiega błędom i potencjalnym atakom.
- **Polityki RLS**: Jako dodatkowa warstwa zabezpieczeń, na tabeli `projects` w Supabase powinna istnieć polityka RLS, która zezwala na aktualizację (`UPDATE`) rekordu tylko użytkownikowi, którego `id` pasuje do `client_id`.

## 6. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy:
  - Dane wejściowe (`projectId`, `proposal_id`) są nieprawidłowe (walidacja Zod).
  - Status projektu jest inny niż `open`.
  - Propozycja nie jest powiązana z danym projektem.
- **`401 Unauthorized`**: Zwracany przez middleware, gdy token jest nieprawidłowy, wygasł lub go brakuje.
- **`403 Forbidden`**: Zwracany, gdy użytkownik próbujący wykonać akcję nie jest właścicielem projektu.
- **`404 Not Found`**: Zwracany, gdy projekt lub propozycja o podanych identyfikatorach nie istnieją w bazie danych.
- **`500 Internal Server Error`**: Zwracany w przypadku niepowodzenia transakcji bazodanowej lub innego nieoczekiwanego błędu serwera. Wszystkie błędy 500 powinny być logowane.

## 7. Rozważania dotyczące wydajności

- Operacja obejmuje kilka zapytań do bazy danych (odczyt projektu, odczyt propozycji, aktualizacja projektu). Zamknięcie ich w jednej transakcji (`rpc` w Supabase) jest kluczowe dla spójności danych.
- Zapytania powinny wykorzystywać indeksy na kluczach głównych (`id`) i obcych (`project_id`, `client_id`), co jest standardem i zapewnia wysoką wydajność.
- Obciążenie tego punktu końcowego nie powinno być wysokie, więc nie przewiduje się znaczących problemów z wydajnością.

## 8. Etapy wdrożenia

1.  **Utworzenie pliku handlera**: Stworzyć plik `src/pages/api/projects/[projectId]/accept-proposal.ts`.
2.  **Definicja schematu Zod**: W pliku handlera zdefiniować schemat Zod do walidacji `proposal_id` z ciała żądania.
3.  **Implementacja logiki serwisu**:
    - W pliku `src/lib/services/project.service.ts` (lub nowym, jeśli nie istnieje) dodać funkcję asynchroniczną `acceptProjectProposal`.
    - Funkcja powinna przyjmować jako argumenty klienta Supabase, `projectId`, `proposalId` i `userId`.
    - Zaimplementować logikę transakcyjną, najlepiej jako funkcję PostgreSQL (`rpc`), aby zapewnić atomowość operacji. Funkcja SQL powinna zawierać wszystkie kroki walidacji i aktualizacji opisane w sekcji "Przepływ danych".
4.  **Implementacja handlera API**:
    - W pliku handlera dodać `export const prerender = false;`.
    - Zaimplementować handler `POST`, który pobiera `Astro.locals`, `Astro.params` i `Astro.request`.
    - Sprawdzić, czy użytkownik jest zalogowany.
    - Zwalidować `projectId` i ciało żądania.
    - Wywołać funkcję `acceptProjectProposal` z serwisu.
    - Obsłużyć potencjalne błędy (np. `ProjectNotFoundError`, `AuthorizationError`) rzucane przez serwis i zwrócić odpowiednie kody stanu HTTP.
    - W przypadku sukcesu, zwrócić odpowiedź JSON z kodem `200 OK`.
5.  **Testy**:
    - Dodać testy integracyjne dla nowego punktu końcowego, obejmujące:
      - Scenariusz pomyślny.
      - Próbę akceptacji przez nie-właściciela (oczekiwany błąd 403).
      - Próbę akceptacji dla projektu o statusie innym niż `open` (oczekiwany błąd 400).
      - Próbę akceptacji nieistniejącej propozycji (oczekiwany błąd 404).
      - Próbę z nieprawidłowymi danymi wejściowymi (oczekiwany błąd 400).
