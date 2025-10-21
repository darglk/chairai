# API Endpoint Implementation Plan: Create Proposal

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom z rolą `artisan` składanie propozycji cenowych do istniejących, otwartych projektów. Proces obejmuje walidację danych wejściowych, weryfikację uprawnień, przesłanie załącznika do bezpiecznego magazynu plików oraz zapisanie propozycji w bazie danych.

## 2. Szczegóły żądania

-   **Metoda HTTP**: `POST`
-   **Struktura URL**: `/api/projects/{projectId}/proposals`
-   **Parametry**:
    -   **Wymagane**:
        -   `projectId` (w ścieżce URL): Identyfikator UUID projektu.
-   **Request Body**: `multipart/form-data`
    -   `price` (number): Wymagana, proponowana cena za wykonanie projektu.
    -   `attachment` (file): Wymagany plik (PDF, PNG, JPG) ze specyfikacją lub dodatkowymi informacjami.

## 3. Wykorzystywane typy

-   **Command Model (Walidacja Zod)**:
    ```typescript
    import { z } from 'zod';

    export const CreateProposalSchema = z.object({
      price: z.number().positive({ message: "Price must be a positive number." }),
      attachment: z.instanceof(File).refine(
        (file) => file.size > 0, "Attachment is required."
      ).refine(
        (file) => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB."
      ).refine(
        (file) => ["application/pdf", "image/jpeg", "image/png"].includes(file.type), "Invalid file type. Only PDF, JPG, and PNG are allowed."
      )
    });
    ```
-   **DTO (Odpowiedź)**:
    -   `ProposalDTO` (z `src/types.ts`): Używany do strukturyzacji danych w pomyślnej odpowiedzi.

## 4. Przepływ danych

1.  Żądanie `POST` trafia do endpointu Astro w `src/pages/api/projects/[projectId]/proposals.ts`.
2.  Middleware Astro weryfikuje token JWT i dołącza sesję użytkownika do `context.locals`.
3.  Endpoint odczytuje `projectId` z parametrów URL oraz dane `price` i `attachment` z `FormData`.
4.  Dane wejściowe są walidowane przy użyciu schematu `CreateProposalSchema` (Zod).
5.  Wywoływana jest metoda `createProposal` z `ProposalService`, przekazując `projectId`, dane propozycji oraz ID uwierzytelnionego użytkownika.
6.  **`ProposalService`**:
    a.  Pobiera z bazy danych profil użytkownika, aby potwierdzić rolę `artisan`.
    b.  Pobiera projekt o zadanym `projectId`, aby sprawdzić, czy istnieje i czy jego status to `open`.
    c.  Sprawdza, czy rzemieślnik nie złożył już propozycji do tego projektu, aby uniknąć duplikatów.
    d.  Przesyła plik `attachment` do dedykowanego bucketa w Supabase Storage (np. `proposal-attachments`). Nazwa pliku jest sanitowana i unikalizowana.
    e.  Zapisuje nową propozycję w tabeli `proposals`, zawierającą `projectId`, `artisan_id`, `price` oraz URL do przesłanego załącznika.
    f.  Zwraca pełne dane nowo utworzonej propozycji.
7.  Endpoint API serializuje zwrócone dane do formatu `ProposalDTO` i wysyła odpowiedź `201 Created` z obiektem JSON.

## 5. Względy bezpieczeństwa

-   **Uwierzytelnianie**: Endpoint jest chroniony przez middleware, który weryfikuje ważność tokenu JWT (`access_token`) i istnienie sesji użytkownika.
-   **Autoryzacja**:
    -   Sprawdzane jest, czy rola zalogowanego użytkownika to `artisan`. W przeciwnym razie zwracany jest błąd `403 Forbidden`.
    -   Sprawdzany jest status projektu. Propozycje można składać tylko do projektów o statusie `open`.
-   **Walidacja danych wejściowych**: Wszystkie dane wejściowe (`projectId`, `price`, `attachment`) są rygorystycznie walidowane, aby zapobiec błędom i atakom (np. SQL Injection, chociaż Supabase ORM w dużej mierze przed tym chroni).
-   **Bezpieczeństwo plików**:
    -   Typ i rozmiar przesyłanego pliku są weryfikowane.
    -   Nazwa pliku jest sanitowana, aby zapobiec atakom Path Traversal.
    -   Dostęp do bucketa `proposal-attachments` w Supabase Storage będzie ograniczony za pomocą polityk RLS. Dostęp do pliku będą mieli tylko: autor propozycji, klient (właściciel projektu) oraz administratorzy systemu.

## 6. Obsługa błędów

Endpoint będzie zwracał następujące kody błędów w odpowiednich scenariuszach:

-   `400 Bad Request`:
    -   Nieprawidłowy format `projectId`.
    -   Brakujące lub nieprawidłowe pole `price`.
    -   Brak pliku `attachment`, nieprawidłowy typ pliku lub przekroczony rozmiar.
-   `401 Unauthorized`:
    -   Brak lub nieważny token `Authorization`.
-   `403 Forbidden`:
    -   Użytkownik nie ma roli `artisan`.
    -   Projekt, do którego składana jest propozycja, nie ma statusu `open`.
-   `404 Not Found`:
    -   Projekt o podanym `projectId` nie został znaleziony.
-   `409 Conflict`:
    -   Użytkownik (rzemieślnik) już złożył propozycję do tego projektu.
-   `500 Internal Server Error`:
    -   Wystąpił nieoczekiwany błąd po stronie serwera, np. błąd połączenia z bazą danych lub błąd podczas przesyłania pliku.

## 7. Rozważania dotyczące wydajności

-   **Rozmiar pliku**: Ograniczenie rozmiaru przesyłanego pliku do 5MB zapobiega długim czasom przesyłania i nadmiernemu zużyciu zasobów serwera.
-   **Zapytania do bazy danych**: Logika w serwisie zostanie zoptymalizowana, aby zminimalizować liczbę zapytań do bazy danych. Sprawdzenie uprawnień, statusu projektu i istnienia poprzedniej propozycji można potencjalnie połączyć w jedno lub dwa zapytania.
-   **Przesyłanie strumieniowe**: Dla bardzo dużych plików w przyszłości można by rozważyć przesyłanie strumieniowe bezpośrednio do Supabase Storage z klienta, aby odciążyć serwer API, ale przy obecnym limicie 5MB nie jest to konieczne.

## 8. Etapy wdrożenia

1.  **Struktura plików**: Utworzyć plik `src/pages/api/projects/[projectId]/proposals.ts`.
2.  **Walidacja**: Zaimplementować schemat walidacji `CreateProposalSchema` przy użyciu Zod w pliku `src/lib/schemas.ts` lub bezpośrednio w pliku endpointu.
3.  **Serwis**:
    -   Utworzyć plik `src/lib/services/proposal.service.ts`.
    -   Zaimplementować w nim metodę `createProposal(data: { projectId: string; price: number; attachment: File; userId: string })`.
    -   W metodzie zawrzeć logikę weryfikacji uprawnień, statusu projektu, unikalności propozycji, przesyłania pliku do Supabase Storage i zapisu w bazie danych.
4.  **Endpoint API**:
    -   W pliku `proposals.ts` zaimplementować handler `POST`.
    -   Dodać obsługę `multipart/form-data`.
    -   Zintegrować walidację Zod.
    -   Wywołać metodę z `ProposalService`.
    -   Zaimplementować obsługę błędów i zwracanie odpowiednich kodów statusu.
    -   Zwrócić odpowiedź `201 Created` z danymi `ProposalDTO` w przypadku sukcesu.
5.  **Testy**:
    -   Napisać testy jednostkowe dla `ProposalService`, mockując interakcje z bazą danych i Supabase Storage.
    -   Napisać testy integracyjne dla endpointu API, które symulują rzeczywiste żądania HTTP i sprawdzają odpowiedzi oraz stan bazy danych.
6.  **Dokumentacja**: Zaktualizować dokumentację API (jeśli istnieje poza kodem), aby odzwierciedlić finalną implementację.
