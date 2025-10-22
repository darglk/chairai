# Plan testowania widoku Galerii

## Status implementacji: ✅ GOTOWE

Data implementacji: 19 października 2025

---

## 1. Testy manualne - Checklist

### 1.1 Autoryzacja i dostęp

- [ ] **Test 1.1.1:** Próba dostępu do `/gallery` bez logowania
  - **Oczekiwany wynik:** Przekierowanie do `/login`
- [ ] **Test 1.1.2:** Próba dostępu do `/gallery` z rolą "artisan"
  - **Oczekiwany wynik:** Przekierowanie do `/`
- [ ] **Test 1.1.3:** Dostęp do `/gallery` z rolą "client"
  - **Oczekiwany wynik:** Wyświetlenie galerii

- [ ] **Test 1.1.4:** Link "Galeria" w nawigacji widoczny tylko dla klientów
  - **Oczekiwany wynik:** Link widoczny dla klientów, niewidoczny dla artisans i niezalogowanych

---

### 1.2 Wyświetlanie danych

- [ ] **Test 1.2.1:** Wyświetlanie listy obrazów z danymi z API
  - **Oczekiwany wynik:** Wszystkie obrazy renderowane w siatce 1-4 kolumn (responsive)
- [ ] **Test 1.2.2:** Wyświetlanie promptu pod obrazem
  - **Oczekiwany wynik:** Prompt ograniczony do 2 linii (line-clamp-2), pełny tekst w title
- [ ] **Test 1.2.3:** Wyświetlanie daty utworzenia
  - **Oczekiwany wynik:** Data w polskim formacie (np. "19 października 2025")
- [ ] **Test 1.2.4:** Badge "✓ Użyto w projekcie" dla użytych obrazów
  - **Oczekiwany wynik:** Badge widoczny tylko gdy `is_used === true`

---

### 1.3 Interakcje użytkownika

- [ ] **Test 1.3.1:** Hover na karcie obrazu
  - **Oczekiwany wynik:**
    - Zoom obrazu (scale 105%)
    - Cień karty się powiększa
    - Overlay z przyciskiem pojawia się (tylko dla nieużytych)
- [ ] **Test 1.3.2:** Kliknięcie "Stwórz projekt" na nieużytym obrazie
  - **Oczekiwany wynik:** Przekierowanie do `/projects/create?imageId={id}`
- [ ] **Test 1.3.3:** Brak przycisku "Stwórz projekt" dla użytych obrazów
  - **Oczekiwany wynik:** Overlay nie pojawia się przy hover na używanych obrazach

---

### 1.4 Paginacja

- [ ] **Test 1.4.1:** Wyświetlanie paginacji gdy > 1 strona
  - **Oczekiwany wynik:** Kontrolki paginacji widoczne
- [ ] **Test 1.4.2:** Brak paginacji gdy <= 1 strona
  - **Oczekiwany wynik:** Kontrolki paginacji niewidoczne
- [ ] **Test 1.4.3:** Przycisk "Poprzednia" disabled na pierwszej stronie
  - **Oczekiwany wynik:** Przycisk wyszarzony i nieklikalny
- [ ] **Test 1.4.4:** Przycisk "Następna" disabled na ostatniej stronie
  - **Oczekiwany wynik:** Przycisk wyszarzony i nieklikalny
- [ ] **Test 1.4.5:** Zmiana strony przez "Następna"
  - **Oczekiwany wynik:**
    - Loading state
    - Nowe obrazy załadowane
    - Scroll do góry strony (smooth)
- [ ] **Test 1.4.6:** Zmiana strony przez "Poprzednia"
  - **Oczekiwany wynik:** Jak w 1.4.5
- [ ] **Test 1.4.7:** Wskaźnik "Strona X z Y"
  - **Oczekiwany wynik:** Poprawne wartości dla każdej strony
- [ ] **Test 1.4.8:** Licznik "Łącznie obrazów: Z"
  - **Oczekiwany wynik:** Poprawna całkowita liczba obrazów

---

### 1.5 Filtrowanie

- [ ] **Test 1.5.1:** Przycisk filtra "Tylko nieużyte obrazy" domyślnie nieaktywny
  - **Oczekiwany wynik:** Przycisk w stanie outline, brak checkmarku
- [ ] **Test 1.5.2:** Aktywacja filtra "Tylko nieużyte obrazy"
  - **Oczekiwany wynik:**
    - Przycisk zmienia się na default variant
    - Pojawia się checkmark "✓"
    - Lista obrazów pokazuje tylko nieużyte
    - Paginacja aktualizuje się
    - Reset do strony 1
- [ ] **Test 1.5.3:** Deaktywacja filtra
  - **Oczekiwany wynik:** Powrót do wszystkich obrazów, reset do strony 1
- [ ] **Test 1.5.4:** Licznik znalezionych obrazów
  - **Oczekiwany wynik:**
    - Wyświetla "Znaleziono: X obraz/obrazów"
    - Aktualizuje się przy zmianie filtra

---

### 1.6 Stany UI

- [ ] **Test 1.6.1:** Loading state przy pierwszym załadowaniu
  - **Oczekiwany wynik:**
    - Spinner animowany
    - Tekst "Ładowanie obrazów..."
- [ ] **Test 1.6.2:** Loading state przy zmianie strony
  - **Oczekiwany wynik:** Jak w 1.6.1
- [ ] **Test 1.6.3:** Empty state gdy brak obrazów
  - **Oczekiwany wynik:**
    - Ikona 🖼️
    - Nagłówek "Brak wygenerowanych obrazów"
    - Opis z zachętą
    - Przycisk "Przejdź do generatora" → `/generate`
- [ ] **Test 1.6.4:** Error state przy błędzie API
  - **Oczekiwany wynik:**
    - Ikona ⚠️
    - Nagłówek "Wystąpił błąd"
    - Komunikat błędu z API
    - Przycisk "Spróbuj ponownie" (reload strony)

---

### 1.7 Responsywność

- [ ] **Test 1.7.1:** Mobile (< 640px)
  - **Oczekiwany wynik:** Siatka 1 kolumna, paginacja w kolumnie
- [ ] **Test 1.7.2:** Tablet (640px - 768px)
  - **Oczekiwany wynik:** Siatka 2 kolumny
- [ ] **Test 1.7.3:** Desktop mały (768px - 1024px)
  - **Oczekiwany wynik:** Siatka 3 kolumny
- [ ] **Test 1.7.4:** Desktop duży (> 1024px)
  - **Oczekiwany wynik:** Siatka 4 kolumny, paginacja w wierszu

---

### 1.8 Nawigacja

- [ ] **Test 1.8.1:** Link "Galeria" w Header aktywny na `/gallery`
  - **Oczekiwany wynik:**
    - Link ma klasę `bg-accent text-accent-foreground`
    - Wyróżniony wizualnie
- [ ] **Test 1.8.2:** Link "Galeria" nieaktywny na innych stronach
  - **Oczekiwany wynik:** Standardowy styl hover

---

### 1.9 Performance

- [ ] **Test 1.9.1:** Lazy loading obrazów
  - **Oczekiwany wynik:** Obrazy ładują się gdy wchodzą w viewport
- [ ] **Test 1.9.2:** Smooth scroll do góry po zmianie strony
  - **Oczekiwany wynik:** Płynna animacja scrollowania
- [ ] **Test 1.9.3:** Brak niepotrzebnych re-renderów
  - **Oczekiwany wynik:** useCallback optymalizuje funkcje

---

### 1.10 Accessibility

- [ ] **Test 1.10.1:** Wszystkie obrazy mają alt text
  - **Oczekiwany wynik:** Alt = prompt lub "Wygenerowany obraz mebla"
- [ ] **Test 1.10.2:** Przyciski mają aria-label
  - **Oczekiwany wynik:** "Poprzednia strona", "Następna strona"
- [ ] **Test 1.10.3:** Keyboard navigation
  - **Oczekiwany wynik:** Tab przez wszystkie interaktywne elementy
- [ ] **Test 1.10.4:** Focus visible
  - **Oczekiwany wynik:** Wyraźny focus ring na przyciskach

---

## 2. Testy integracyjne (do zaimplementowania)

### 2.1 API Integration Tests

```typescript
describe("Gallery API Integration", () => {
  it("should fetch paginated images", async () => {
    // Test GET /api/images/generated?page=1&limit=20
  });

  it("should filter unused images", async () => {
    // Test GET /api/images/generated?unused_only=true
  });

  it("should handle 401 unauthorized", async () => {
    // Test bez tokena
  });

  it("should handle 403 forbidden for non-clients", async () => {
    // Test z rolą artisan
  });
});
```

---

### 2.2 Component Integration Tests

```typescript
describe("ImageGalleryContainer", () => {
  it("should render images from API", async () => {
    // Mock API response
    // Verify images rendered
  });

  it("should handle pagination", async () => {
    // Click next
    // Verify new page loaded
  });

  it("should filter unused images", async () => {
    // Toggle filter
    // Verify filtered results
  });

  it("should handle errors gracefully", async () => {
    // Mock API error
    // Verify error state
  });
});
```

---

## 3. Testy E2E (do zaimplementowania)

### 3.1 Full User Flow

```typescript
test("User can browse gallery and create project", async ({ page }) => {
  // 1. Login as client
  // 2. Navigate to /gallery
  // 3. Browse images with pagination
  // 4. Apply filter
  // 5. Click "Stwórz projekt" on unused image
  // 6. Verify redirect to /projects/create?imageId=...
});
```

---

## 4. Scenariusze testowe edge cases

### 4.1 Edge Cases

- [ ] **Test 4.1.1:** Galeria z dokładnie 20 obrazami (1 strona)
  - **Oczekiwany wynik:** Brak paginacji
- [ ] **Test 4.1.2:** Galeria z 21 obrazami (2 strony)
  - **Oczekiwany wynik:** Paginacja widoczna
- [ ] **Test 4.1.3:** Wszystkie obrazy użyte + filtr aktywny
  - **Oczekiwany wynik:** Empty state
- [ ] **Test 4.1.4:** Bardzo długi prompt (> 200 znaków)
  - **Oczekiwany wynik:** Tekst przycięty do 2 linii, pełny w title
- [ ] **Test 4.1.5:** Obraz bez promptu (null)
  - **Oczekiwany wynik:** Brak sekcji promptu lub placeholder
- [ ] **Test 4.1.6:** Błąd 500 z API
  - **Oczekiwany wynik:** Error state z komunikatem
- [ ] **Test 4.1.7:** Timeout API
  - **Oczekiwany wynik:** Error state po timeout
- [ ] **Test 4.1.8:** Zmiana filtra w trakcie ładowania
  - **Oczekiwany wynik:** Poprzednie żądanie anulowane, nowe wykonane

---

## 5. Performance Benchmarks

### Metryki do zmierzenia:

- **Time to Interactive:** < 3s
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **API Response Time:** < 500ms

---

## 6. Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 7. Notatki z testowania

### Znalezione bugi:

_Brak na moment implementacji_

### Usprawnienia UX:

1. ✅ Dodano filtr "Tylko nieużyte obrazy"
2. ✅ Dodano licznik znalezionych obrazów
3. ✅ Active state dla linku w nawigacji
4. Potencjalne: Infinite scroll zamiast paginacji
5. Potencjalne: Skeleton loading zamiast spinnera
6. Potencjalne: Thumbnails + modal z pełnym obrazem

---

## 8. Sign-off

### Developer:

- **Implementacja:** ✅ Zakończona
- **Self-review:** ⏳ Do wykonania
- **Data:** 19.10.2025

### QA:

- **Manual testing:** ⏳ Do wykonania
- **Automation:** ⏳ Do zaplanowania

### Product Owner:

- **Acceptance:** ⏳ Do wykonania

---

## Kolejne kroki

1. ✅ Implementacja core funkcjonalności
2. ✅ Dodanie filtrowania
3. ✅ Dokumentacja
4. ⏳ Manualne testowanie (ta checklist)
5. ⏳ Testy automatyczne
6. ⏳ E2E testy
7. ⏳ Performance optimization
8. ⏳ Production deployment
