# Plan implementacji widoku Strona Szczegółów Projektu

## 1. Przegląd
Widok "Strona Szczegółów Projektu" jest centralnym miejscem interakcji użytkownika z projektem. Jego zawartość dynamicznie dostosowuje się do statusu projektu (`open`, `in_progress`, `completed`) oraz roli zalogowanego użytkownika (Klient lub Rzemieślnik). Umożliwia klientom przeglądanie i akceptowanie ofert, rzemieślnikom składanie propozycji, a obu stronom komunikację i wzajemne ocenianie po zakończeniu współpracy.

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką:
- **Ścieżka:** `/projects/[projectId]`
- **Plik:** `src/pages/projects/[projectId].astro`

## 3. Struktura komponentów
Hierarchia komponentów będzie zorganizowana wokół głównego kontenera klienckiego, który zarządza stanem i logiką warunkowego renderowania.

```
/src/pages/projects/[projectId].astro
└── ProjectDetailsContainer.tsx (client:load)
    ├── ProjectDetails.tsx
    ├── (status === 'open')
    │   ├── (dla Klienta) -> ProposalList.tsx
    │   └── (dla Rzemieślnika, który nie złożył oferty) -> ProposalForm.tsx
    ├── (status === 'in_progress')
    │   ├── AcceptedProposal.tsx
    │   └── ChatWidget.tsx
    └── (status === 'completed')
        └── ReviewForm.tsx
```

## 4. Szczegóły komponentów

### `ProjectDetailsContainer.tsx`
- **Opis komponentu:** Główny komponent-kontener renderowany po stronie klienta. Odpowiada za pobieranie danych projektu, zarządzanie stanem (ładowanie, błędy), obsługę wszystkich akcji użytkownika oraz warunkowe renderowanie komponentów podrzędnych.
- **Główne elementy:** Wykorzystuje customowy hook `useProjectDetails` do zarządzania logiką. Renderuje komponenty `ProjectDetails`, `ProposalList`, `ProposalForm`, `AcceptedProposal`, `ChatWidget`, `ReviewForm` w zależności od stanu.
- **Obsługiwane interakcje:** Akceptacja propozycji, złożenie propozycji, oznaczenie projektu jako zakończony, wystawienie oceny.
- **Obsługiwana walidacja:** Brak - deleguje walidację do formularzy podrzędnych.
- **Typy:** `ProjectDetailsViewModel`, `UserDTO`.
- **Propsy:** `projectId: string`.

### `ProjectDetails.tsx`
- **Opis komponentu:** Komponent czysto prezentacyjny, wyświetlający podstawowe, niezmienne informacje o projekcie.
- **Główne elementy:** `<img>` dla obrazu projektu, elementy tekstowe (`<p>`, `<h2>`) dla kategorii, materiału, wymiarów, budżetu i opisu z promptu. Wykorzystuje komponenty `Card` z `shadcn/ui`.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `ProjectDetailsViewModel`.
- **Propsy:** `project: ProjectDetailsViewModel`.

### `ProposalList.tsx`
- **Opis komponentu:** Wyświetla listę propozycji złożonych do projektu. Dla klienta (właściciela projektu) każda propozycja zawiera przycisk "Akceptuj".
- **Główne elementy:** Lista elementów, gdzie każdy reprezentuje jedną propozycję. Wykorzystuje `Card` i `Button` z `shadcn/ui`. Zawiera link do profilu rzemieślnika.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Akceptuj Propozycję".
- **Obsługiwana walidacja:** Przycisk "Akceptuj" jest widoczny i aktywny tylko dla właściciela projektu, gdy status projektu to `open`.
- **Typy:** `ProposalViewModel[]`.
- **Propsy:** `proposals: ProposalViewModel[]`, `isOwner: boolean`, `projectStatus: ProjectStatus`, `onAccept: (proposalId: string) => void`.

### `ProposalForm.tsx`
- **Opis komponentu:** Formularz dla rzemieślnika do składania nowej propozycji.
- **Główne elementy:** Formularz z polami `Input` (dla ceny) i `Input type="file"` (dla załącznika) oraz przyciskiem `Button type="submit"`. Wykorzystuje `react-hook-form` do zarządzania stanem i walidacji.
- **Obsługiwane interakcje:** Wysłanie formularza.
- **Obsługiwana walidacja:**
  - `price`: Wymagane, musi być liczbą dodatnią.
  - `attachment`: Wymagany, walidacja typu i rozmiaru pliku.
- **Typy:** `CreateProposalCommand`.
- **Propsy:** `onSubmit: (data: FormData) => void`, `isLoading: boolean`.

### `AcceptedProposal.tsx`
- **Opis komponentu:** Wyświetla informacje o zaakceptowanej propozycji w projektach o statusie `in_progress`.
- **Główne elementy:** Komponent `Card` z informacjami o rzemieślniku, zaakceptowaną ceną i linkiem do załącznika.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `ProposalViewModel`.
- **Propsy:** `proposal: ProposalViewModel`.

### `ChatWidget.tsx`
- **Opis komponentu:** Uproszczony interfejs czatu do komunikacji.
- **Główne elementy:** Kontener na wiadomości, pole `Textarea` do wpisywania nowej wiadomości i przycisk `Button` do wysyłania.
- **Obsługiwane interakcje:** Wysłanie wiadomości.
- **Obsługiwana walidacja:** Wiadomość nie może być pusta.
- **Typy:** `ChatMessage[]`.
- **Propsy:** `messages: ChatMessage[]`, `onSendMessage: (message: string) => void`.

### `ReviewForm.tsx`
- **Opis komponentu:** Formularz do wystawiania oceny i komentarza po zakończeniu projektu.
- **Główne elementy:** Komponent do wyboru oceny (np. 5 gwiazdek), pole `Textarea` na komentarz i przycisk `Button` do wysłania.
- **Obsługiwane interakcje:** Wysłanie oceny.
- **Obsługiwana walidacja:** Ocena (rating) jest wymagana i musi być w zakresie 1-5.
- **Typy:** `CreateReviewCommand`.
- **Propsy:** `onSubmit: (data: CreateReviewCommand) => void`, `isLoading: boolean`.

## 5. Typy
Do implementacji widoku, oprócz istniejących DTO, potrzebne będą nowe typy ViewModel, które dostosują dane z API do potrzeb UI.

- **`ProjectDetailsViewModel`**
  - **Cel:** Agregacja i transformacja danych z `ProjectDTO`, `UserDTO` i `ProposalDTO[]` w jeden obiekt zoptymalizowany dla widoku.
  - **Pola:**
    - `id: string` - ID projektu.
    - `status: ProjectStatus` - Aktualny status projektu.
    - `imageUrl: string` - URL obrazu z projektu.
    - `prompt: string | null` - Prompt użyty do wygenerowania obrazu.
    - `category: string` - Nazwa kategorii.
    - `material: string` - Nazwa materiału.
    - `dimensions: string | null` - Wymiary.
    - `budgetRange: string | null` - Zakres budżetowy.
    - `isOwner: boolean` - Flaga wskazująca, czy zalogowany użytkownik jest twórcą projektu.
    - `hasProposed: boolean` - Flaga wskazująca, czy zalogowany rzemieślnik złożył już ofertę.
    - `proposals: ProposalViewModel[]` - Lista przetworzonych propozycji.
    - `acceptedProposal: ProposalViewModel | null` - Zaakceptowana propozycja, jeśli istnieje.

- **`ProposalViewModel`**
  - **Cel:** Uproszczenie i sformatowanie danych z `ProposalDTO` na potrzeby listy propozycji.
  - **Pola:**
    - `id: string` - ID propozycji.
    - `artisanId: string` - ID użytkownika rzemieślnika.
    - `artisanName: string` - Nazwa firmy rzemieślnika.
    - `artisanRating: number | null` - Średnia ocena rzemieślnika.
    - `artisanReviewsCount: number` - Liczba opinii o rzemieślniku.
    - `price: number` - Oferowana cena.
    - `attachmentUrl: string` - URL do załącznika.
    - `createdAt: string` - Sformatowana data złożenia propozycji (np. "2 dni temu").

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie scentralizowane w customowym hooku `useProjectDetails`.

- **Hook: `useProjectDetails(projectId: string)`**
  - **Przeznaczenie:** Hermetyzacja całej logiki związanej z danymi projektu: pobieranie, obsługa stanu ładowania i błędów, a także udostępnianie funkcji do wykonywania akcji (mutacji).
  - **Zwracane wartości:**
    - `project: ProjectDetailsViewModel | null` - Obiekt z danymi projektu.
    - `isLoading: boolean` - Flaga informująca o stanie ładowania danych.
    - `error: ApiErrorDTO | null` - Obiekt błędu, jeśli wystąpił.
    - `acceptProposal: (proposalId: string) => Promise<void>` - Funkcja do akceptowania propozycji.
    - `submitProposal: (data: FormData) => Promise<void>` - Funkcja do składania nowej propozycji.
    - `completeProject: () => Promise<void>` - Funkcja do oznaczania projektu jako zakończony.
    - `submitReview: (data: CreateReviewCommand) => Promise<void>` - Funkcja do wysyłania oceny.
    - `refresh: () => void` - Funkcja do manualnego odświeżenia danych projektu.

## 7. Integracja API
Integracja z API będzie realizowana wewnątrz hooka `useProjectDetails` przy użyciu `fetch` lub biblioteki typu `axios`.

- **Pobieranie danych (GET):**
  - `GET /api/projects/{projectId}`: Wywoływane przy inicjalizacji hooka. Odpowiedź typu `ProjectDTO` (z zagnieżdżonymi propozycjami) zostanie zmapowana na `ProjectDetailsViewModel`.
- **Mutacje (POST/PATCH):**
  - `POST /api/projects/{projectId}/proposals`:
    - **Żądanie:** `FormData` zawierające `price` i `attachment`.
    - **Odpowiedź:** `ProposalDTO`.
  - `POST /api/projects/{projectId}/accept-proposal`:
    - **Żądanie:** `AcceptProposalCommand` (`{ proposal_id: string }`).
    - **Odpowiedź:** `UpdateProjectStatusResponseDTO`.
  - `PATCH /api/projects/{projectId}/status`:
    - **Żądanie:** `UpdateProjectStatusCommand` (`{ status: 'completed' }`).
    - **Odpowiedź:** `UpdateProjectStatusResponseDTO`.
  - `POST /api/projects/{projectId}/reviews`:
    - **Żądanie:** `CreateReviewCommand` (`{ rating: number, comment?: string }`).
    - **Odpowiedź:** `ReviewDTO`.

Po każdej udanej mutacji, hook automatycznie wywoła funkcję `refresh()`, aby pobrać najnowszy stan projektu.

## 8. Interakcje użytkownika
- **Klient akceptuje propozycję:**
  1. Kliknięcie przycisku "Akceptuj" na elemencie listy w `ProposalList`.
  2. Wywołanie `onAccept(proposalId)`.
  3. `ProjectDetailsContainer` wywołuje `acceptProposal(proposalId)` z hooka.
  4. Przycisk przechodzi w stan `loading`.
  5. Po sukcesie dane są odświeżane, a widok renderuje się ponownie, pokazując `AcceptedProposal` i `ChatWidget`.
- **Rzemieślnik składa propozycję:**
  1. Wypełnienie i wysłanie formularza w `ProposalForm`.
  2. Wywołanie `onSubmit(formData)`.
  3. `ProjectDetailsContainer` wywołuje `submitProposal(formData)` z hooka.
  4. Formularz przechodzi w stan `loading`.
  5. Po sukcesie dane są odświeżane, a formularz jest ukrywany.

## 9. Warunki i walidacja
- **Walidacja po stronie klienta:** Formularze `ProposalForm` i `ReviewForm` będą wykorzystywać `react-hook-form` i `zod` do walidacji pól przed wysłaniem, wyświetlając komunikaty o błędach w czasie rzeczywistym.
- **Logika warunkowa w UI:**
  - `ProposalList` jest renderowany, gdy `project.isOwner && project.status === 'open'`.
  - `ProposalForm` jest renderowany, gdy `!project.isOwner && !project.hasProposed && project.status === 'open'`.
  - `AcceptedProposal` i `ChatWidget` są renderowane, gdy `project.status === 'in_progress'`.
  - `ReviewForm` jest renderowany, gdy `project.status === 'completed'`.

## 10. Obsługa błędów
- **Błąd ładowania projektu:** Jeśli `useProjectDetails` zwróci błąd, `ProjectDetailsContainer` wyświetli komunikat błędu na całą stronę z opcją ponowienia próby (przycisk wywołujący `refresh`).
- **Błędy mutacji (API):** Każda funkcja mutująca w hooku (np. `acceptProposal`) będzie opakowana w `try...catch`. W przypadku błędu, zostanie wyświetlone powiadomienie typu "toast" (np. przy użyciu `sonner`) z komunikatem błędu z API. Stan `loading` zostanie zwolniony, aby umożliwić użytkownikowi ponowną próbę.
- **Błędy walidacji:** Obsługiwane lokalnie w formularzach, uniemożliwiając wysłanie danych do API, dopóki nie zostaną poprawione.

## 11. Kroki implementacji
1.  **Struktura plików:** Utworzenie pliku strony `src/pages/projects/[projectId].astro` oraz plików dla wszystkich komponentów React w `src/components/projects/details/`.
2.  **Hook `useProjectDetails`:** Implementacja hooka z logiką pobierania danych (`GET /api/projects/{projectId}`), mapowania na `ProjectDetailsViewModel` oraz obsługą stanu `loading` i `error`.
3.  **Komponent `ProjectDetailsContainer`:** Stworzenie kontenera, który używa hooka `useProjectDetails` i przekazuje dane do komponentów prezentacyjnych.
4.  **Komponent `ProjectDetails`:** Implementacja statycznego komponentu wyświetlającego dane projektu.
5.  **Komponent `ProposalForm`:** Stworzenie formularza do składania propozycji wraz z walidacją (`react-hook-form`, `zod`).
6.  **Komponent `ProposalList`:** Implementacja listy propozycji.
7.  **Integracja mutacji:** Dodanie do hooka `useProjectDetails` funkcji `submitProposal` i `acceptProposal` wraz z logiką odświeżania danych. Podpięcie ich do odpowiednich komponentów.
8.  **Implementacja stanu `in_progress`:** Stworzenie komponentów `AcceptedProposal` i `ChatWidget`. Dodanie logiki renderowania warunkowego w kontenerze.
9.  **Implementacja stanu `completed`:** Stworzenie komponentu `ReviewForm`. Dodanie logiki do oznaczania projektu jako zakończony (`completeProject`) i wysyłania oceny (`submitReview`).
10. **Styling i UX:** Dopracowanie wyglądu wszystkich komponentów przy użyciu Tailwind CSS i `shadcn/ui`, dodanie stanów `hover`/`focus`, obsługa responsywności.
11. **Testowanie:** Przetestowanie wszystkich ścieżek użytkownika: składanie oferty, akceptacja, komunikacja, ocenianie, a także obsługa błędów.
