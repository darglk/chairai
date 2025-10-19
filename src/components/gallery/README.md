# Gallery Components

Komponenty React do wyświetlania galerii wygenerowanych obrazów AI dla użytkowników z rolą "Klient".

## Struktura komponentów

```
ImageGalleryContainer (główny kontener)
├── ImageCard (karta pojedynczego obrazu)
│   └── Button (Shadcn/ui)
└── PaginationControls (kontrolki paginacji)
    └── Button (Shadcn/ui)
```

## Komponenty

### ImageGalleryContainer

**Ścieżka:** `src/components/gallery/ImageGalleryContainer.tsx`

Główny komponent kontenera zarządzający całą logiką galerii.

**Odpowiedzialności:**
- Zarządzanie stanem galerii przez hook `useImageGallery`
- Renderowanie siatki obrazów z filtrem
- Wyświetlanie stanów: loading, error, empty, success
- Zarządzanie paginacją i filtrowaniem

**Propsy:** Brak (komponent jest standalone)

**Funkcjonalności:**
- **Filtr:** Przycisk "Tylko nieużyte obrazy" z licznikiem znalezionych obrazów
- **Interakcje:** Toggle filtra, zmiana strony

**Stany UI:**
- **Loading:** Spinner z komunikatem "Ładowanie obrazów..."
- **Error:** Komunikat błędu z przyciskiem "Spróbuj ponownie"
- **Empty:** Komunikat "Brak wygenerowanych obrazów" z linkiem do generatora
- **Success:** Panel filtrowania + siatka obrazów + paginacja (jeśli > 1 strona)

---

### ImageCard

**Ścieżka:** `src/components/gallery/ImageCard.tsx`

Komponent karty wyświetlający pojedynczy wygenerowany obraz.

**Propsy:**
```typescript
interface ImageCardProps {
  image: GeneratedImageDTO;
}
```

**Elementy:**
- Obraz w formacie aspect-square
- Badge "✓ Użyto w projekcie" (jeśli `is_used === true`)
- Hover overlay z przyciskiem "Stwórz projekt" (jeśli `is_used === false`)
- Footer z promptem (2 linie max) i datą utworzenia

**Interakcje:**
- Hover: Scale image (105%) + pokazuje overlay
- Click na "Stwórz projekt": Przekierowanie do `/projects/create?imageId={id}`

---

### PaginationControls

**Ścieżka:** `src/components/gallery/PaginationControls.tsx`

Komponent kontrolek nawigacji między stronami.

**Propsy:**
```typescript
interface PaginationControlsProps {
  pagination: PaginationMetaDTO;
  onPageChange: (newPage: number) => void;
}
```

**Elementy:**
- Przycisk "← Poprzednia" (disabled na pierwszej stronie)
- Wskaźnik "Strona X z Y" + "Łącznie obrazów: Z"
- Przycisk "Następna →" (disabled na ostatniej stronie)

**Funkcjonalność:**
- Zmiana strony przez `onPageChange(newPage)`
- Auto-scroll do góry po zmianie strony
- Responsive layout (kolumna na mobile, wiersz na desktop)

---

## Custom Hook: useImageGallery

**Ścieżka:** `src/components/hooks/useImageGallery.ts`

Hook zarządzający stanem galerii i komunikacją z API.

**Zwracane wartości:**
```typescript
{
  images: GeneratedImageDTO[];
  pagination: PaginationMetaDTO | null;
  isLoading: boolean;
  error: ApiErrorDTO | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  showOnlyUnused: boolean;
  toggleUnusedFilter: () => void;
}
```

**Logika:**
- Używa `useState` do zarządzania stanem (images, pagination, loading, error, page, filter)
- Używa `useEffect` do fetchowania danych przy zmianie strony lub filtra
- Wywołuje `GET /api/images/generated?page={page}&limit=20&unused_only={bool}`
- Obsługuje błędy HTTP i sieciowe
- Auto-loading przy zmianie `currentPage` lub `showOnlyUnused`
- Reset do pierwszej strony przy zmianie filtra

---

## Integracja API

### Endpoint: `GET /api/images/generated`

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `unused_only`: boolean (default: false) - nie używany w UI, ale dostępny

**Response:** `GeneratedImagesListResponseDTO`
```typescript
{
  data: GeneratedImageDTO[];
  pagination: PaginationMetaDTO;
  remaining_generations: number;
}
```

**Status Codes:**
- 200: Sukces
- 401: Nie zalogowany
- 403: Brak uprawnień (nie jest klientem)
- 422: Błędne parametry
- 500: Błąd serwera

---

## Typy

Wszystkie typy zdefiniowane w `src/types.ts`:

### GeneratedImageDTO
```typescript
{
  id: string;
  user_id: string;
  prompt: string | null;
  image_url: string;
  created_at: string;
  is_used: boolean;
}
```

### PaginationMetaDTO
```typescript
{
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
```

---

## Stylowanie

### Wykorzystane klasy Tailwind:

**Grid Layout:**
- `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`
- Responsive: 1 kolumna (mobile) → 4 kolumny (desktop)

**ImageCard:**
- `aspect-square` - kwadratowy format obrazu
- `group-hover:scale-105` - zoom efekt przy hover
- `line-clamp-2` - ograniczenie promptu do 2 linii

**Colors:**
- `bg-card` - tło karty
- `text-muted-foreground` - wtórny tekst
- `bg-primary` / `text-primary-foreground` - badge

**Transitions:**
- `transition-shadow duration-200` - płynna zmiana cienia
- `transition-transform duration-300` - płynny zoom obrazu
- `transition-opacity duration-200` - płynne pojawianie overlay

---

## Accessibility

- Wszystkie obrazy mają atrybut `alt`
- Przyciski mają `aria-label`
- Loading spinner wizualny + tekstowy komunikat
- Disabled state na przyciskach paginacji
- Keyboard navigation działa natywnie (przyciski są focusable)

---

## Obsługa błędów

### Poziom API (useImageGallery):
- Błędy HTTP (400-500): Parse JSON error response
- Błędy sieciowe: Generic "Nie udało się pobrać obrazów"
- Timeout: Obsługiwany przez przeglądarkę

### Poziom UI (ImageGalleryContainer):
- Error state: Wyświetla `error.error.message` + przycisk reload
- Empty state: Link do generatora
- Authorization errors: Powinny być obsłużone przez middleware (redirect do /login)

---

## Performance

### Optymalizacje:
- `loading="lazy"` na obrazach - lazy loading
- `useCallback` w hooku - unikanie re-createów funkcji
- Warunkowe renderowanie paginacji (tylko jeśli > 1 strona)
- Scroll to top po zmianie strony (smooth behavior)

### Potencjalne usprawnienia:
- Image optimization (WebP, srcset)
- Infinite scroll zamiast paginacji
- Skeleton loading zamiast spinnera
- Prefetch następnej strony
- Cache API responses

---

## Testowanie

### Manualne testy do wykonania:
1. ✅ Wyświetlanie obrazów z paginacją
2. ✅ Przycisk "Stwórz projekt" tylko dla nieużytych obrazów
3. ✅ Badge "Użyto w projekcie" dla użytych obrazów
4. ✅ Nawigacja paginacji (disabled states)
5. ✅ Loading state przy ładowaniu
6. ✅ Error state przy błędzie
7. ✅ Empty state gdy brak obrazów
8. ✅ Hover effects na kartach
9. ✅ Responsive layout
10. ✅ Scroll to top po zmianie strony

### Testy automatyczne (TODO):
- Unit testy: `useImageGallery` hook
- Component testy: ImageCard, PaginationControls
- Integration testy: ImageGalleryContainer
- E2E testy: Cały flow galerii

---

## Zobacz także

- [Plan implementacji galerii](../../../.ai/gallery-view-implementation-plan.md)
- [Generated Images API](../../pages/api/images/generated/index.ts)
- [GeneratedImagesService](../../lib/services/generated-images.service.ts)
- [Typy aplikacji](../../types.ts)
