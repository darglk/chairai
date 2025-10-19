# Plan implementacji widoku: Formularz Tworzenia Projektu

## 1. Przegląd
Widok "Formularz Tworzenia Projektu" umożliwia klientom przekształcenie wygenerowanego przez AI obrazu mebla w konkretne ogłoszenie (projekt) na platformie. Użytkownik, na podstawie wybranego obrazu, wypełnia formularz zawierający kluczowe informacje o projekcie, takie jak kategoria, materiał, wymiary i budżet. Po pomyślnym przesłaniu formularza, projekt staje się publicznie dostępny dla rzemieślników.

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką, która zawiera identyfikator obrazu jako parametr.

- **Ścieżka:** `/projects/new/[imageId]`
- **Przykład:** `/projects/new/a1b2c3d4-e5f6-7890-1234-567890abcdef`

Taka struktura zapewnia, że formularz jest zawsze powiązany z konkretnym obrazem. Strona będzie renderowana po stronie serwera (SSR), aby wstępnie pobrać dane obrazu i słowniki.

## 3. Struktura komponentów
Hierarchia komponentów dla tego widoku będzie zorganizowana w sposób modułowy, aby oddzielić logikę od prezentacji.

```
- ProjectNewPage.astro (Strona Astro, SSR)
  - ProjectFormContainer.tsx (Kontener React, zarządza stanem i logiką)
    - SelectedImageView.tsx (Wyświetla wybrany obraz)
    - FormField.tsx (Komponent ogólnego przeznaczenia dla pól formularza)
      - Label (z `shadcn/ui`)
      - Select (z `shadcn/ui`, dla kategorii i materiału)
      - Input (z `shadcn/ui`, dla wymiarów i budżetu)
      - ErrorMessage.tsx (Wyświetla błędy walidacji)
    - Button (z `shadcn/ui`, przycisk do wysłania formularza)
```

## 4. Szczegóły komponentów

### `ProjectNewPage.astro`
- **Opis:** Główny plik strony Astro, odpowiedzialny za renderowanie po stronie serwera (SSR), pobieranie początkowych danych (obraz, kategorie, materiały) i przekazywanie ich do komponentu React.
- **Główne elementy:** Komponent `Layout.astro`, kontener `ProjectFormContainer.tsx`.
- **Propsy (przekazywane do `ProjectFormContainer`):**
  - `imageId: string`
  - `imageUrl: string`
  - `categories: CategoryDTO[]`
  - `materials: MaterialDTO[]`

### `ProjectFormContainer.tsx`
- **Opis:** Główny komponent React, który zarządza stanem całego formularza, obsługuje interakcje użytkownika, walidację danych oraz komunikację z API.
- **Główne elementy:** `SelectedImageView`, `FormField`, `Button`.
- **Obsługiwane interakcje:**
  - Zmiana wartości w polach formularza.
  - Kliknięcie przycisku "Utwórz projekt".
- **Typy:** `ProjectFormViewModel`, `CreateProjectCommand`.
- **Propsy:**
  - `imageId: string`
  - `imageUrl: string`
  - `categories: CategoryDTO[]`
  - `materials: MaterialDTO[]`

### `SelectedImageView.tsx`
- **Opis:** Prosty komponent prezentacyjny, który wyświetla obraz wybrany przez użytkownika jako podstawa projektu.
- **Główne elementy:** Znacznik `<img>` opakowany w kontener.
- **Propsy:**
  - `imageUrl: string`
  - `prompt: string | null` (opcjonalnie, do wyświetlenia jako `alt` lub `title`)

### `FormField.tsx`
- **Opis:** Generyczny komponent do renderowania pola formularza z etykietą, kontrolką (input, select) i komunikatem o błędzie.
- **Główne elementy:** `Label`, `Input`/`Select`, `ErrorMessage`.
- **Obsługiwane interakcje:** Przekazuje zdarzenia `onChange` i `onBlur` do komponentu rodzica.
- **Propsy:**
  - `label: string`
  - `name: string`
  - `value: string`
  - `error?: string`
  - `onChange: (e: React.ChangeEvent<...>) => void`
  - `onBlur: (e: React.FocusEvent<...>) => void`
  - `type: 'text' | 'select'`
  - `options?: { id: string; name: string }[]` (dla `type='select'`)

## 5. Typy
Do implementacji widoku wymagane są następujące struktury danych:

- **`CategoryDTO`**: ` { id: string; name: string; } `
  - Typ danych dla kategorii, pobierany z `GET /api/categories`.

- **`MaterialDTO`**: ` { id: string; name: string; } `
  - Typ danych dla materiałów, pobierany z `GET /api/materials`.

- **`ProjectFormViewModel`**:
  ```typescript
  interface ProjectFormViewModel {
    category_id: string;
    material_id: string;
    dimensions: string;
    budget_range: string;
  }
  ```
  - Model widoku reprezentujący stan formularza po stronie klienta. Wszystkie pola są typu `string`, aby bezpośrednio powiązać je z wartościami kontrolek formularza.

- **`CreateProjectCommand`**:
  ```typescript
  interface CreateProjectCommand {
    generated_image_id: string;
    category_id: string;
    material_id: string;
    dimensions?: string;
    budget_range?: string;
  }
  ```
  - Obiekt transferu danych (DTO) wysyłany w ciele żądania `POST /api/projects`. Pola opcjonalne są zgodne ze schematem Zod na backendzie.

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie zrealizowane wewnątrz komponentu `ProjectFormContainer.tsx` przy użyciu standardowych hooków React. Nie ma potrzeby tworzenia globalnego stanu ani złożonych bibliotek.

- **`useState`**: Do przechowywania danych formularza (`ProjectFormViewModel`), błędów walidacji, stanu ładowania i błędów API.
  - `formData`: Przechowuje aktualne wartości pól formularza.
  - `errors`: Przechowuje komunikaty o błędach dla poszczególnych pól.
  - `isLoading`: Wskazuje, czy trwa proces wysyłania danych do API.
  - `apiError`: Przechowuje ogólny komunikat o błędzie zwróconym przez API.

- **Niestandardowy hook (`useProjectForm`)**: Można rozważyć stworzenie hooka `useProjectForm`, który hermetyzuje całą logikę formularza (obsługa zmian, walidacja, wysyłanie danych), aby utrzymać komponent `ProjectFormContainer` w czystości.

## 7. Integracja API
Integracja z API będzie obejmować trzy endpointy, z czego dwa będą wywoływane po stronie serwera, a jeden po stronie klienta.

- **Pobieranie danych (SSR w `ProjectNewPage.astro`):**
  - `GET /api/categories`: Pobranie listy dostępnych kategorii mebli.
  - `GET /api/materials`: Pobranie listy dostępnych materiałów.
  - `GET /api/images/generated/{imageId}`: Pobranie danych o obrazie (URL, prompt).

- **Tworzenie projektu (Client-side w `ProjectFormContainer.tsx`):**
  - **Endpoint:** `POST /api/projects`
  - **Akcja:** Wywoływane po kliknięciu przycisku "Utwórz projekt" i pomyślnej walidacji front-endowej.
  - **Typ żądania:** `CreateProjectCommand`
  - **Typ odpowiedzi (sukces):** `ProjectDTO`
  - **Obsługa sukcesu:** Przekierowanie użytkownika na stronę nowo utworzonego projektu (np. `/projects/{projectId}`).

## 8. Interakcje użytkownika
- **Wypełnianie formularza:** Użytkownik wprowadza dane w polach tekstowych (`dimensions`, `budget_range`) i wybiera opcje z list rozwijanych (`category_id`, `material_id`). Każda zmiana aktualizuje stan `formData`.
- **Walidacja "on blur":** Po opuszczeniu pola (zdarzenie `onBlur`), uruchamiana jest walidacja dla tego konkretnego pola, a ewentualny błąd jest natychmiast wyświetlany.
- **Wysyłanie formularza:** Użytkownik klika przycisk "Utwórz projekt".
  - Przycisk jest nieaktywny (`disabled`), jeśli formularz jest w stanie ładowania (`isLoading`).
  - Po kliknięciu uruchamiana jest pełna walidacja formularza.
  - Jeśli walidacja przejdzie pomyślnie, wysyłane jest żądanie do API.
  - W trakcie wysyłania, na przycisku wyświetlany jest wskaźnik ładowania (np. spinner).

## 9. Warunki i walidacja
Walidacja po stronie klienta jest kluczowa dla dobrego UX i odzwierciedla wymagania API.

- **`category_id`**:
  - **Warunek:** Pole wymagane.
  - **Komponent:** `FormField` z `Select`.
  - **Stan interfejsu:** Wyświetlenie komunikatu "Kategoria jest wymagana", jeśli pole jest puste po próbie wysłania.
- **`material_id`**:
  - **Warunek:** Pole wymagane.
  - **Komponent:** `FormField` z `Select`.
  - **Stan interfejsu:** Wyświetlenie komunikatu "Materiał jest wymagany".
- **`dimensions`**:
  - **Warunek:** Pole opcjonalne. Może mieć walidację formatu (np. min. 5 znaków), jeśli jest wypełnione.
  - **Komponent:** `FormField` z `Input`.
- **`budget_range`**:
  - **Warunek:** Pole opcjonalne. Może mieć walidację formatu, jeśli jest wypełnione.
  - **Komponent:** `FormField` z `Input`.

## 10. Obsługa błędów
- **Błędy walidacji:** Wyświetlane indywidualnie pod każdym polem formularza, którego dotyczą.
- **Błędy API (4xx):**
  - `400 (Validation Error)`: Błędy walidacji z backendu są mapowane na odpowiednie pola formularza i wyświetlane.
  - `401 (Unauthorized)` / `403 (Forbidden)`: Przekierowanie na stronę logowania.
  - `409 (Conflict)`: Wyświetlenie globalnego komunikatu o błędzie, np. "Ten obraz został już wykorzystany w innym projekcie."
- **Błędy serwera (5xx):** Wyświetlenie ogólnego komunikatu o błędzie, np. "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później."
- **Błędy sieciowe:** Obsługa błędów związanych z brakiem połączenia internetowego, np. poprzez wyświetlenie globalnego komunikatu.

## 11. Kroki implementacji
1.  **Utworzenie pliku strony:** Stworzyć plik `src/pages/projects/new/[imageId].astro`.
2.  **Implementacja SSR:** W pliku Astro dodać logikę `Astro.props` do pobrania `imageId` i wywołania API w celu uzyskania danych obrazu, kategorii i materiałów.
3.  **Struktura komponentu kontenera:** Stworzyć komponent `ProjectFormContainer.tsx` i przekazać do niego dane pobrane w Astro jako propsy.
4.  **Zarządzanie stanem:** W `ProjectFormContainer` zaimplementować zarządzanie stanem formularza (`formData`), błędów i stanu ładowania przy użyciu hooka `useState`.
5.  **Budowa formularza:** Zbudować interfejs formularza, wykorzystując komponenty `FormField`, `SelectedImageView` oraz komponenty UI z `shadcn/ui` (`Input`, `Select`, `Button`).
6.  **Implementacja walidacji:** Dodać logikę walidacji po stronie klienta, która będzie uruchamiana przy zdarzeniach `onBlur` oraz przed wysłaniem formularza.
7.  **Integracja z API:** Zaimplementować funkcję `handleSubmit`, która po pomyślnej walidacji wysyła żądanie `POST /api/projects` z odpowiednimi danymi.
8.  **Obsługa odpowiedzi API:** Dodać logikę obsługi odpowiedzi z API – przekierowanie w przypadku sukcesu oraz wyświetlanie odpowiednich komunikatów o błędach.
9.  **Stylowanie i UX:** Dopracować wygląd formularza, stany przycisku (aktywny, nieaktywny, ładowanie) oraz animacje przejść.
10. **Testowanie manualne:** Przetestować całą ścieżkę użytkownika, włączając przypadki brzegowe i scenariusze błędów.
