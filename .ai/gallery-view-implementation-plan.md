# Plan implementacji widoku: Galeria Wygenerowanych Obrazów

## 1. Przegląd

Widok "Galeria Wygenerowanych Obrazów" to dedykowana sekcja dla zalogowanych użytkowników z rolą "Klient". Umożliwia im przeglądanie wszystkich obrazów mebli, które stworzyli za pomocą generatora AI. Kluczową funkcją widoku jest możliwość zainicjowania nowego "Projektu" (ogłoszenia na marketplace) na podstawie wybranego, nieużywanego jeszcze obrazu. Widok obsługuje paginację, aby zapewnić wydajne przeglądanie dużej liczby grafik.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

- **Ścieżka:** `/gallery`

Strona ta powinna być chroniona i dostępna wyłącznie dla zalogowanych użytkowników z rolą "Klient".

## 3. Struktura komponentów

Hierarchia komponentów dla tego widoku będzie następująca:

```
/src/pages/gallery.astro
└── /src/components/gallery/ImageGalleryContainer.tsx (React, "use client")
    ├── /src/components/gallery/ImageCard.tsx (React)
    │   └── /src/components/ui/button.tsx (Shadcn/ui)
    └── /src/components/gallery/PaginationControls.tsx (React)
        └── /src/components/ui/button.tsx (Shadcn/ui)
```

- `gallery.astro`: Strona Astro, która renderuje kontener React i zarządza logiką po stronie serwera (np. ochrona trasy).
- `ImageGalleryContainer.tsx`: Główny komponent React, który zarządza stanem, pobiera dane z API i renderuje siatkę obrazów oraz paginację.
- `ImageCard.tsx`: Komponent prezentacyjny, który wyświetla pojedynczy obraz, jego status (użyty/nieużyty) oraz przycisk do tworzenia projektu.
- `PaginationControls.tsx`: Komponent do nawigacji między stronami galerii.

## 4. Szczegóły komponentów

### `ImageGalleryContainer.tsx`

- **Opis komponentu:** Główny kontener widoku. Odpowiada za pobieranie danych o wygenerowanych obrazach z API, zarządzanie stanem (lista obrazów, paginacja, status ładowania, błędy) i renderowanie siatki obrazów oraz kontrolek paginacji.
- **Główne elementy:**
  - Kontener `div` z siatką (np. CSS Grid) do wyświetlania komponentów `ImageCard`.
  - Komponent `PaginationControls` do nawigacji.
  - Warunkowe renderowanie komunikatów o ładowaniu, błędach lub braku obrazów.
- **Obsługiwane interakcje:**
  - Zmiana strony poprzez `PaginationControls`.
- **Warunki walidacji:** Brak bezpośredniej walidacji; komponent reaguje na dane z API.
- **Typy:** `GeneratedImageDTO`, `PaginationMetaDTO`, `ApiErrorDTO`.
- **Propsy:** Brak.

### `ImageCard.tsx`

- **Opis komponentu:** Karta wyświetlająca pojedynczy wygenerowany obraz. Pokazuje wizualizację, informację o tym, czy obraz został już użyty w projekcie, oraz przycisk akcji.
- **Główne elementy:**
  - Element `img` do wyświetlania obrazu.
  - Znacznik (np. `span` lub `div` z odpowiednim stylem) informujący "Użyto w projekcie", jeśli `is_used` jest `true`.
  - Komponent `Button` z etykietą "Stwórz projekt", widoczny tylko jeśli `is_used` jest `false`.
- **Obsługiwane interakcje:**
  - Kliknięcie przycisku "Stwórz projekt", które powinno przekierować użytkownika do formularza tworzenia projektu, przekazując ID obrazu (np. `/projects/create?imageId={id}`).
- **Warunki walidacji:** Brak.
- **Typy:** `GeneratedImageDTO`.
- **Propsy:**
  ```typescript
  interface ImageCardProps {
    image: GeneratedImageDTO;
  }
  ```

### `PaginationControls.tsx`

- **Opis komponentu:** Zestaw przycisków do nawigacji stronami wyników. Powinien być dynamiczny i dostosowywać się do całkowitej liczby stron.
- **Główne elementy:**
  - Przyciski "Poprzednia" i "Następna".
  - Opcjonalnie: wskaźnik bieżącej strony (np. "Strona 2 z 5").
- **Obsługiwane interakcje:**
  - Kliknięcie przycisku "Poprzednia" lub "Następna", które wywołuje funkcję zwrotną przekazaną w propsach.
- **Warunki walidacji:** Przyciski powinny być wyłączone (`disabled`), gdy nawigacja w danym kierunku jest niemożliwa (np. "Poprzednia" na pierwszej stronie).
- **Typy:** `PaginationMetaDTO`.
- **Propsy:**
  ```typescript
  interface PaginationControlsProps {
    pagination: PaginationMetaDTO;
    onPageChange: (newPage: number) => void;
  }
  ```

## 5. Typy

Do implementacji widoku wykorzystane zostaną istniejące typy DTO zdefiniowane w `src/types.ts`. Nie ma potrzeby tworzenia nowych typów.

- **`GeneratedImageDTO`**: Reprezentuje pojedynczy obraz.
  ```typescript
  export interface GeneratedImageDTO {
    id: string;
    user_id: string;
    prompt: string | null;
    image_url: string;
    created_at: string;
    is_used: boolean;
  }
  ```
- **`PaginationMetaDTO`**: Zawiera metadane paginacji.
  ```typescript
  export interface PaginationMetaDTO {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  }
  ```
- **`GeneratedImagesListResponseDTO`**: Struktura odpowiedzi z API.
  ```typescript
  export interface GeneratedImagesListResponseDTO {
    data: GeneratedImageDTO[];
    pagination: PaginationMetaDTO;
    remaining_generations: number;
  }
  ```

## 6. Zarządzanie stanem

Zarządzanie stanem zostanie zaimplementowane w komponencie `ImageGalleryContainer.tsx` przy użyciu hooków React (`useState`, `useEffect`). W celu hermetyzacji logiki związanej z pobieraniem danych, paginacją i obsługą stanu, zostanie stworzony dedykowany custom hook `useImageGallery`.

**Custom Hook: `useImageGallery`**

- **Cel:** Abstrakcja logiki pobierania i zarządzania galerią obrazów.
- **Zwracane wartości:**
  ```typescript
  {
    images: GeneratedImageDTO[];
    pagination: PaginationMetaDTO | null;
    isLoading: boolean;
    error: ApiErrorDTO | null;
    currentPage: number;
    setCurrentPage: (page: number) => void;
  }
  ```
- **Logika wewnętrzna:**
  - Używa `useState` do przechowywania `images`, `pagination`, `isLoading`, `error` i `currentPage`.
  - Używa `useEffect` do wywoływania API `GET /api/images/generated` za każdym razem, gdy `currentPage` ulegnie zmianie.
  - Obsługuje stany ładowania i błędów.

## 7. Integracja API

Integracja z API będzie realizowana wewnątrz hooka `useImageGallery` poprzez wywołania do endpointu `GET /api/images/generated`.

- **Endpoint:** `GET /api/images/generated`
- **Typy żądania (Query Parameters):**
  - `page`: `number` (zarządzane przez stan `currentPage` w `useImageGallery`)
  - `limit`: `number` (może być stałą wartością, np. 20)
- **Typy odpowiedzi:**
  - **Sukces (200):** `GeneratedImagesListResponseDTO`
  - **Błąd:** `ApiErrorDTO`

Wywołanie API będzie realizowane za pomocą standardowej funkcji `fetch` lub biblioteki takiej jak `axios`, z odpowiednim nagłówkiem `Authorization: Bearer {token}`.

## 8. Interakcje użytkownika

- **Przeglądanie obrazów:** Użytkownik przewija stronę, aby zobaczyć załadowaną listę obrazów.
- **Zmiana strony:** Użytkownik klika przycisk "Następna" lub "Poprzednia" w komponencie `PaginationControls`. Powoduje to aktualizację stanu `currentPage` w `useImageGallery`, co z kolei uruchamia ponowne pobranie danych dla nowej strony.
- **Tworzenie projektu:** Użytkownik klika przycisk "Stwórz projekt" na karcie nieużywanego obrazu. Aplikacja przekierowuje go na stronę `/projects/create`, dołączając ID obrazu jako parametr zapytania (np. `?imageId=...`), aby formularz tworzenia projektu mógł pobrać dane obrazu.

## 9. Warunki i walidacja

- **Dostęp do widoku:** Logika w `gallery.astro` sprawdzi, czy użytkownik jest zalogowany i ma rolę "Klient". W przeciwnym razie przekieruje go na stronę logowania lub stronę główną.
- **Przycisk "Stwórz projekt":** Będzie renderowany warunkowo w `ImageCard.tsx` tylko wtedy, gdy `image.is_used` ma wartość `false`.
- **Przyciski paginacji:** Komponent `PaginationControls` wyłączy przycisk "Poprzednia" na pierwszej stronie (`pagination.page === 1`) i przycisk "Następna" na ostatniej stronie (`pagination.page === pagination.total_pages`).

## 10. Obsługa błędów

- **Błąd ładowania danych (np. błąd sieci, błąd serwera 500):** `ImageGalleryContainer` wyświetli ogólny komunikat o błędzie, np. "Nie udało się załadować obrazów. Spróbuj ponownie później."
- **Błąd autoryzacji (401, 403):** Logika po stronie serwera w `gallery.astro` powinna przechwycić te przypadki i przekierować użytkownika na stronę logowania. Jeśli błąd wystąpi po stronie klienta (np. wygaśnięcie tokena), `useImageGallery` powinien obsłużyć błąd i potencjalnie wylogować użytkownika.
- **Brak obrazów:** Jeśli API zwróci pustą tablicę `data`, `ImageGalleryContainer` wyświetli stosowny komunikat, np. "Nie wygenerowałeś jeszcze żadnych obrazów. Przejdź do generatora, aby zacząć tworzyć!".

## 11. Kroki implementacji

1.  **Utworzenie strony Astro:** Stworzyć plik `src/pages/gallery.astro`. Dodać w nim logikę ochrony trasy, sprawdzającą sesję i rolę użytkownika. Wewnątrz renderować główny layout i komponent `ImageGalleryContainer.tsx` z dyrektywą `client:load`.
2.  **Stworzenie struktury folderów:** Utworzyć folder `src/components/gallery`.
3.  **Implementacja `ImageCard.tsx`:** Stworzyć komponent `ImageCard`, który przyjmuje `image` jako prop i renderuje jego `image_url`, status `is_used` oraz warunkowo przycisk "Stwórz projekt".
4.  **Implementacja `PaginationControls.tsx`:** Stworzyć komponent `PaginationControls`, który przyjmuje `pagination` i `onPageChange` jako propsy, renderuje przyciski i zarządza ich stanem `disabled`.
5.  **Implementacja hooka `useImageGallery`:** Stworzyć plik `src/components/hooks/useImageGallery.ts`. Zaimplementować w nim logikę zarządzania stanem i komunikacji z API `GET /api/images/generated`.
6.  **Implementacja `ImageGalleryContainer.tsx`:** Stworzyć komponent, który używa hooka `useImageGallery`. Na podstawie zwracanych z niego danych (`images`, `isLoading`, `error`) renderuje odpowiedni stan UI: siatkę komponentów `ImageCard`, komunikat o ładowaniu, komunikat o błędzie lub informację o braku obrazów. Przekazuje również dane i funkcje do `PaginationControls`.
7.  **Styling:** Dodać style dla siatki obrazów, kart i kontrolek paginacji, zgodnie z systemem designu opartym na Tailwind CSS i Shadcn/ui.
8.  **Testowanie:** Przeprowadzić manualne testy w celu weryfikacji:
    - Poprawnego renderowania obrazów.
    - Działania paginacji.
    - Warunkowego wyświetlania przycisku "Stwórz projekt".
    - Poprawnego przekierowania po kliknięciu przycisku.
    - Obsługi stanów ładowania, błędu i braku danych.
    - Ochrony trasy dla niezalogowanych użytkowników i użytkowników o innej roli.
