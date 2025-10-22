# Plan implementacji widoku Marketplace

## 1. Przegląd

Widok Marketplace (Rynek Projektów) to dedykowana sekcja dla zalogowanych użytkowników z rolą "Rzemieślnik". Umożliwia im przeglądanie, wyszukiwanie i filtrowanie listy otwartych projektów (zleceń) dodanych przez klientów. Celem jest ułatwienie rzemieślnikom znalezienia zleceń odpowiadających ich specjalizacji i możliwościom.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

- `/market`

Dostęp do tej ścieżki powinien być ograniczony tylko dla uwierzytelnionych użytkowników z rolą `artisan`. Użytkownicy niespełniający tych warunków powinni zostać przekierowani na stronę logowania lub stronę główną.

## 3. Struktura komponentów

Hierarchia komponentów dla widoku Marketplace będzie zorganizowana w następujący sposób, wykorzystując podejście "wysp Reacta" w Astro:

```
/src/pages/market.astro       (Strona Astro, renderowana serwerowo, zarządza dostępem)
└── /src/components/market/
    └── MarketplaceView.tsx   (Główny komponent React, kontener widoku)
        ├── ProjectFilters.tsx (Komponent z polami filtrów)
        │   ├── Input (Shadcn)
        │   ├── Select (Shadcn)
        │   └── Button (Shadcn)
        ├── ProjectList.tsx    (Komponent renderujący siatkę/listę projektów)
        │   └── ProjectCard.tsx  (Komponent pojedynczej karty projektu)
        │       └── Card (Shadcn)
        └── PaginationControls.tsx (Komponent do obsługi paginacji)
            └── Button (Shadcn)
```

## 4. Szczegóły komponentów

### `MarketplaceView.tsx`

- **Opis komponentu:** Główny kontener, który integruje wszystkie podkomponenty widoku. Jest odpowiedzialny za zarządzanie stanem (za pomocą customowego hooka `useMarketplace`), pobieranie danych z API i przekazywanie ich do komponentów podrzędnych.
- **Główne elementy:** `div` jako kontener, w którym umieszczone są `ProjectFilters`, `ProjectList` i `PaginationControls`.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji, deleguje obsługę zdarzeń do hooka.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `PaginatedResponseDTO<ProjectDTO>`, `MarketplaceFilters`.
- **Propsy:** Brak.

### `ProjectFilters.tsx`

- **Opis komponentu:** Formularz zawierający wszystkie opcje filtrowania: wyszukiwanie tekstowe, wybór kategorii i materiału. Na urządzeniach mobilnych jego zawartość będzie renderowana wewnątrz modalu (`Dialog` z Shadcn/ui).
- **Główne elementy:** `form`, `Input` (wyszukiwanie), `Select` (kategoria), `Select` (materiał), `Button` (resetowanie filtrów).
- **Obsługiwane interakcje:** `onChange` na polach input, `onValueChange` na selectach.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `MarketplaceFilters`, `CategoryDTO[]`, `MaterialDTO[]`.
- **Propsy:**
  - `filters: MarketplaceFilters`
  - `categories: CategoryDTO[]`
  - `materials: MaterialDTO[]`
  - `onFilterChange: (newFilters: Partial<MarketplaceFilters>) => void`
  - `isLoading: boolean`

### `ProjectList.tsx`

- **Opis komponentu:** Wyświetla listę projektów w formie responsywnej siatki (desktop) lub listy (mobile). Mapuje dane projektów na komponenty `ProjectCard`.
- **Główne elementy:** `div` z klasami `grid` Tailwinda.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `ProjectCardViewModel[]`.
- **Propsy:**
  - `projects: ProjectCardViewModel[]`

### `ProjectCard.tsx`

- **Opis komponentu:** Reprezentuje pojedynczy projekt na liście. Wyświetla kluczowe informacje, takie jak obraz, kategoria, materiał i budżet. Jest klikalny i prowadzi do strony szczegółów projektu.
- **Główne elementy:** Komponent `Card` z Shadcn/ui, `img` dla obrazu, `p` i `span` dla danych tekstowych. Całość owinięta w tag `a` dla nawigacji.
- **Obsługiwane interakcje:** `onClick` (nawigacja).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `ProjectCardViewModel`.
- **Propsy:**
  - `project: ProjectCardViewModel`

### `PaginationControls.tsx`

- **Opis komponentu:** Zestaw przycisków umożliwiający nawigację między stronami wyników.
- **Główne elementy:** `nav`, `Button` (poprzednia/następna strona), wskaźnik bieżącej strony.
- **Obsługiwane interakcje:** `onClick` na przyciskach.
- **Obsługiwana walidacja:** Przyciski "poprzednia" i "następna" są wyłączane (`disabled`), gdy użytkownik jest odpowiednio na pierwszej lub ostatniej stronie.
- **Typy:** `PaginationMetaDTO`.
- **Propsy:**
  - `pagination: PaginationMetaDTO`
  - `onPageChange: (page: number) => void`
  - `isLoading: boolean`

## 5. Typy

Do implementacji widoku wymagane będą istniejące typy DTO oraz nowe typy ViewModel.

- **DTO (z `src/types.ts`):**
  - `ProjectDTO`: Pełny obiekt projektu zwracany przez API.
  - `CategoryDTO`, `MaterialDTO`: Obiekty słownikowe dla filtrów.
  - `PaginatedResponseDTO<T>`: Generyczny typ dla paginowanych odpowiedzi API.
  - `PaginationMetaDTO`: Obiekt z metadanymi paginacji.

- **Nowe typy (do zdefiniowania w `MarketplaceView.tsx` lub osobnym pliku):**
  - **`ProjectCardViewModel`**: Spłaszczony model danych na potrzeby komponentu `ProjectCard`.
    - `id: string`
    - `imageUrl: string`
    - `categoryName: string`
    - `materialName: string`
    - `budgetRange: string | null`
    - `dimensions: string | null`
    - `createdAt: string`
  - **`MarketplaceFilters`**: Obiekt stanu dla formularza filtrów.
    - `search?: string`
    - `categoryId?: string`
    - `materialId?: string`

## 6. Zarządzanie stanem

Cała logika związana ze stanem, pobieraniem danych i interakcjami zostanie zamknięta w customowym hooku `useMarketplace`.

- **`useMarketplace()`**:
  - **Cel:** Centralizacja zarządzania stanem widoku Marketplace.
  - **Zarządzany stan:**
    - `projects: ProjectDTO[]`
    - `pagination: PaginationMetaDTO | null`
    - `filters: MarketplaceFilters`
    - `page: number`
    - `isLoading: boolean`
    - `error: ApiErrorDTO | null`
    - `categories: CategoryDTO[]`
    - `materials: MaterialDTO[]`
  - **Logika:**
    - Przy pierwszym renderowaniu pobiera dane dla kategorii i materiałów (`/api/categories`, `/api/materials`).
    - Używa `useEffect` do śledzenia zmian w `filters` i `page`. Każda zmiana (z debouncingiem dla pola `search`) wywołuje zapytanie do `GET /api/projects` z odpowiednimi parametrami.
    - Synchronizuje stan `filters` i `page` z parametrami w URL (`URLSearchParams`) dla zachowania stanu po odświeżeniu strony.
  - **Zwracane wartości:** Obiekt zawierający wszystkie stany oraz funkcje do ich modyfikacji (`setFilters`, `setPage`).

## 7. Integracja API

Integracja będzie opierać się na trzech endpointach:

1.  **`GET /api/projects`**
    - **Żądanie:** Wykonywane z parametrami zapytania zmapowanymi ze stanu `filters` i `page`.
      - `status`: "open" (hardcoded)
      - `category_id`: `filters.categoryId`
      - `material_id`: `filters.materialId`
      - `page`: `page`
      - `limit`: 20 (stała wartość)
    - **Odpowiedź:** `PaginatedResponseDTO<ProjectDTO>`
2.  **`GET /api/categories`**
    - **Żądanie:** Wykonywane bez parametrów.
    - **Odpowiedź:** `CategoryDTO[]`
3.  **`GET /api/materials`**
    - **Żądanie:** Wykonywane bez parametrów.
    - **Odpowiedź:** `MaterialDTO[]`

Wszystkie zapytania będą wysyłane z nagłówkiem `Authorization: Bearer {token}`.

## 8. Interakcje użytkownika

- **Filtrowanie:** Użytkownik wchodzi w interakcję z komponentem `ProjectFilters`. Zmiana wartości w polach wywołuje funkcję `setFilters` z hooka `useMarketplace`, co prowadzi do aktualizacji stanu i ponownego zapytania do API.
- **Wyszukiwanie:** Wpisywanie tekstu w pole `Input` będzie miało zaimplementowany debouncing (np. 300ms), aby zapytania do API nie były wysyłane po każdej zmianie znaku.
- **Paginacja:** Kliknięcie przycisków w `PaginationControls` wywołuje funkcję `setPage`, co aktualizuje stronę i pobiera nową partię danych.
- **Nawigacja:** Kliknięcie `ProjectCard` przenosi użytkownika na stronę `/projects/{project.id}`.

## 9. Warunki i walidacja

- **Dostęp do widoku:** W pliku `/src/pages/market.astro` zostanie umieszczona logika po stronie serwera, która sprawdzi sesję użytkownika. Jeśli użytkownik nie jest zalogowany lub jego rola jest inna niż `artisan`, zostanie wykonane przekierowanie (`Astro.redirect`).
- **Stan ładowania:** Komponenty `ProjectFilters` i `PaginationControls` będą miały wyłączone interaktywne elementy (`disabled`), gdy `isLoading` jest `true`. Komponent `ProjectList` może wyświetlać szkielety (skeletons) interfejsu podczas ładowania.
- **Puste dane:** Jeśli API zwróci pustą tablicę projektów, `ProjectList` wyświetli komunikat "Nie znaleziono projektów spełniających podane kryteria".

## 10. Obsługa błędów

- **Błędy API (np. 500):** Hook `useMarketplace` przechwyci błąd i ustawi stan `error`. `MarketplaceView` wyświetli centralny komunikat o błędzie zamiast listy projektów.
- **Błędy autoryzacji (401, 403):** Jeśli sesja wygaśnie w trakcie użytkowania, hook przechwyci błąd i może wywołać globalną funkcję wylogowującą lub przekierować na stronę logowania.
- **Błąd ładowania słowników (kategorie/materiały):** Jeśli pobieranie danych do filtrów nie powiedzie się, odpowiednie pola `Select` zostaną wyłączone, a użytkownik zobaczy komunikat o błędzie.

## 11. Kroki implementacji

1.  **Utworzenie struktury plików:** Stworzenie strony `/src/pages/market.astro` oraz katalogu `/src/components/market/` z pustymi plikami dla wszystkich komponentów React.
2.  **Zabezpieczenie strony:** Implementacja logiki sprawdzającej rolę użytkownika w `market.astro` i konfiguracja przekierowania.
3.  **Implementacja `useMarketplace`:** Stworzenie customowego hooka z całą logiką zarządzania stanem, bez integracji z API (dane mockowe).
4.  **Budowa komponentów UI:** Implementacja komponentów `MarketplaceView`, `ProjectFilters`, `ProjectList`, `ProjectCard` i `PaginationControls` z użyciem Shadcn/ui i Tailwind CSS, podłączając je do mockowych danych z hooka.
5.  **Integracja API w `useMarketplace`:** Zastąpienie danych mockowych rzeczywistymi wywołaniami do endpointów `/api/projects`, `/api/categories` i `/api/materials`.
6.  **Implementacja obsługi stanu ładowania i błędów:** Dodanie do UI obsługi stanów `isLoading` i `error` (szkielety, komunikaty o błędach).
7.  **Synchronizacja z URL:** Dodanie do `useMarketplace` logiki do odczytu i zapisu parametrów filtrów i paginacji w URL.
8.  **Debouncing wyszukiwania:** Implementacja opóźnienia dla pola wyszukiwania tekstowego.
9.  **Responsywność i stylizacja:** Dopracowanie wyglądu na różnych rozmiarach ekranu, w tym implementacja modalu dla filtrów na mobile.
10. **Testowanie i poprawki:** Ręczne przetestowanie wszystkich interakcji, filtrów, paginacji i obsługi przypadków brzegowych.
