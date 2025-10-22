# Plan implementacji widoku Generator Obrazów AI

## 1. Przegląd

Widok **Generator Obrazów AI** jest kluczowym interfejsem dla klientów platformy ChairAI, umożliwiającym wizualizację pomysłów na meble za pomocą sztucznej inteligencji. Widok stanowi punkt wejścia do procesu tworzenia projektów - wygenerowane obrazy są następnie wykorzystywane jako wizualne reprezentacje dla ogłoszeń dostępnych dla rzemieślników.

Głównym celem widoku jest:

- Umożliwienie klientom wprowadzenia tekstowego opisu mebla (promptu)
- Wygenerowanie obrazu AI na podstawie promptu
- Wyświetlenie wygenerowanego obrazu
- Śledzenie pozostałej liczby darmowych generacji (limit: 10 na konto)
- Zapisanie wygenerowanego obrazu w prywatnej galerii klienta

## 2. Routing widoku

- **Ścieżka widoku:** `/generate`
- **Typ strony:** Astro page (`src/pages/generate.astro`)
- **Wymagania dostępu:** Zalogowany użytkownik z rolą "client"
- **Middleware:** Checks - weryfikacja autentykacji i roli użytkownika
- **Layout:** Standard layout aplikacji z Header i Footer

## 3. Struktura komponentów

```
generate.astro (Astro page - statyczny layout)
├── ImageGeneratorContainer.tsx (React komponent - wrapper, zarządzanie stanem)
│   ├── PromptInput.tsx (Textarea z walidacją i podpowiedzią)
│   ├── GenerateButton.tsx (Przycisk z ładowaniem i stanem disabled)
│   ├── QuotaDisplay.tsx (Licznik pozostałych generacji)
│   ├── GeneratedImageDisplay.tsx (Wyświetlenie obrazu z przyciskiem zapisu)
│   └── ErrorMessage.tsx (Wyświetlanie błędów)
```

## 4. Szczegóły komponentów

### generate.astro

- **Opis:** Strona Astro - statyczny layout dla widoku generatora
- **Przeznaczenie:** Zapewnienie struktury HTML strony, middleware checks, pobieranie danych
- **Główne elementy:**
  - Nagłówek strony
  - Container do umieszczenia komponentu React `ImageGeneratorContainer`
  - Footer
- **Obsługiwane interakcje:** Brak - to strona statyczna
- **Walidacja:** Middleware checks dla autentykacji
- **Typy:** `AstroProps` z `locals.supabase` context
- **Propsy:** Brak - komponenty React będą się renderować wewnątrz

**Pseudo-kod:**

```astro
---
// Middleware checks
if (!Astro.locals.user) redirect("/login");

// Pobranie danych użytkownika dla ImageGeneratorContainer
const user = Astro.locals.user;
const supabase = Astro.locals.supabase;
---

<Layout>
  <section class="container">
    <h1>Generator Obrazów AI</h1>
    <ImageGeneratorContainer client:load user={user} />
  </section>
</Layout>
```

### ImageGeneratorContainer.tsx

- **Opis:** Główny komponent React zarządzający stanem widoku generatora
- **Przeznaczenie:** Koordynacja między komponentami, zarządzanie stanem aplikacji, komunikacja z API
- **Główne elementy:**
  - State management dla: promptu, wygenerowanego obrazu, licznika generacji, stanu ładowania, błędów
  - Obsługa submit formularza
  - Fetch API do `/api/images/generate`
  - Obsługa sukcesu i błędów
- **Obsługiwane interakcje:**
  - Zmiana tekstu w polu promptu
  - Kliknięcie "Generuj"
  - Zapisanie obrazu do galerii
  - Obsługa błędów
- **Walidacja:**
  - Prompt nie może być pusty
  - Prompt musi mieć 10-500 znaków (walidacja po stronie API)
  - Nie można generować jeśli `remaining_generations === 0`
  - Nie można generować podczas ładowania
- **Typy:** `GenerateImageCommand`, `GenerateImageResponseDTO`, `GeneratorViewState`
- **Propsy:**
  - `user: UserDTO` - dane zalogowanego użytkownika

**Pseudo-kod:**

```typescript
interface GeneratorViewState {
  prompt: string
  isLoading: boolean
  error: ErrorMessage | null
  generatedImage: GeneratedImageDTO | null
  remainingGenerations: number
}

export const ImageGeneratorContainer: React.FC<{user: UserDTO}> = ({user}) => {
  const [state, setState] = useState<GeneratorViewState>({
    prompt: "",
    isLoading: false,
    error: null,
    generatedImage: null,
    remainingGenerations: 10
  })

  const handleGenerateImage = async () => {
    // Walidacja
    // Fetch API
    // Obsługa wyniku
    // Aktualizacja stanu
  }

  const handleSaveImage = async () => {
    // Logika zapisania obrazu (peut być tylko lokalna markerka lub zapis w DB)
  }

  return (
    <>
      <PromptInput value={state.prompt} onChange={...} disabled={...} />
      <GenerateButton onClick={handleGenerateImage} isLoading={state.isLoading} disabled={...} />
      <QuotaDisplay remaining={state.remainingGenerations} />
      {state.generatedImage && <GeneratedImageDisplay image={state.generatedImage} onSave={handleSaveImage} />}
      {state.error && <ErrorMessage error={state.error} onClose={...} />}
    </>
  )
}
```

### PromptInput.tsx

- **Opis:** Komponent pola tekstowego do wprowadzenia promptu
- **Przeznaczenie:** Edycja promptu z podpowiedziami i wskazówkami
- **Główne elementy:**
  - `Textarea` z Shadcn/ui
  - Label z opisem
  - Licznik znaków (0-500)
  - Tekst pomocniczy
- **Obsługiwane interakcje:**
  - Zmiana wartości w polu
  - Focus/Blur na polu
- **Walidacja:**
  - Weryfikacja długości tekstu (podpowiedź dla użytkownika)
  - Visual feedback przy zbliżeniu się do limitu
- **Typy:** Podstawowe - string, onChange callback
- **Propsy:**
  - `value: string` - bieżąca wartość promptu
  - `onChange: (value: string) => void` - callback na zmianę
  - `disabled: boolean` - czy pole powinno być disabled
  - `placeholder?: string` - placeholder tekst
  - `maxLength?: number` - maksymalna długość (domyślnie 500)

### GenerateButton.tsx

- **Opis:** Przycisk do wysłania żądania generacji obrazu
- **Przeznaczenie:** Trigger dla procesu generacji
- **Główne elementy:**
  - `Button` z Shadcn/ui
  - Loader spinner podczas ładowania
  - Tekst przycisku zmieniający się w zależności od stanu
- **Obsługiwane interakcje:**
  - Kliknięcie przycisku
- **Walidacja:**
  - Disable przycisku gdy: prompt jest pusty, jest ładowanie, pozostało 0 generacji
- **Typy:** Brak specjalnych typów
- **Propsy:**
  - `onClick: () => void` - handler kliknięcia
  - `isLoading: boolean` - czy trwa ładowanie
  - `disabled: boolean` - czy przycisk powinien być disabled
  - `remainingGenerations: number` - do wyświetlenia w tooltipie

### QuotaDisplay.tsx

- **Opis:** Komponent wyświetlający pozostałą liczbę darmowych generacji
- **Przeznaczenie:** Informowanie użytkownika o limicie generacji
- **Główne elementy:**
  - `Progress` z Shadcn/ui - wizualna reprezentacja
  - Tekst: "X/10 generacji wykorzystane"
  - Ostrzeżenie gdy `remaining === 0`
- **Obsługiwane interakcje:** Brak
- **Walidacja:** Brak
- **Typy:** Brak specjalnych typów
- **Propsy:**
  - `remaining: number` - liczba pozostałych generacji
  - `total?: number` - całkowita liczba generacji (domyślnie 10)

### GeneratedImageDisplay.tsx

- **Opis:** Komponent wyświetlający wygenerowany obraz
- **Przeznaczenie:** Prezentacja wygenrowanego obrazu i umożliwienie jego zapisu
- **Główne elementy:**
  - Tag `<img>` do wyświetlenia obrazu
  - `Button` "Zapisz" do galerii
  - `Button` "Użyj w projekcie" (link do tworzenia projektu)
  - Tekst dengan promptem użytym do generacji
- **Obsługiwane interakcje:**
  - Kliknięcie "Zapisz"
  - Kliknięcie "Użyj w projekcie"
- **Walidacja:** Brak
- **Typy:** `GeneratedImageDTO`
- **Propsy:**
  - `image: GeneratedImageDTO` - dane wygenerowanego obrazu
  - `onSave: () => void` - handler zapisania
  - `onUseInProject: () => void` - handler użycia w projekcie

### ErrorMessage.tsx

- **Opis:** Komponent wyświetlający komunikat o błędzie
- **Przeznaczenie:** Informowanie użytkownika o błędach
- **Główne elementy:**
  - Alert box z Shadcn/ui
  - Ikona błędu
  - Tytuł błędu
  - Opis błędu
  - Przycisk zamknięcia
- **Obsługiwane interakcje:**
  - Kliknięcie przycisku zamknięcia
- **Walidacja:** Brak
- **Typy:** `ErrorMessage`
- **Propsy:**
  - `error: ErrorMessage` - dane błędu
  - `onClose: () => void` - handler zamknięcia

## 5. Typy

### ErrorMessage (ViewModel)

```typescript
interface ErrorMessage {
  code: string; // "UNAUTHORIZED", "VALIDATION_ERROR", "GENERATION_LIMIT_REACHED", etc.
  message: string; // Komunikat do wyświetlenia użytkownikowi
  details?: Record<string, string>; // Szczegóły błędu (np. validation errors)
  retryable?: boolean; // Czy błąd można spróbować naprawić
}
```

### GeneratorViewState (ViewModel)

```typescript
interface GeneratorViewState {
  prompt: string; // Bieżący tekst promtu
  isLoading: boolean; // Czy trwa żądanie do API
  error: ErrorMessage | null; // Ostatni błąd (null jeśli brak)
  generatedImage: GeneratedImageDTO | null; // Ostatnio wygenerowany obraz
  remainingGenerations: number; // Liczba pozostałych darmowych generacji
}
```

### Wykorzystywane DTO z `types.ts`

```typescript
// Request
GenerateImageCommand {
  prompt: string
}

// Response
GenerateImageResponseDTO {
  id: string
  user_id: string
  prompt: string | null
  image_url: string
  created_at: string
  is_used: boolean
  remaining_generations: number
}

// Podstawowy typ
GeneratedImageDTO {
  id: string
  user_id: string
  prompt: string | null
  image_url: string
  created_at: string
  is_used: boolean
}
```

## 6. Zarządzanie stanem

### State Management Approach

Zarządzanie stanem będzie zlokalizowane w komponencie `ImageGeneratorContainer` przy użyciu React hooków `useState` i `useEffect`.

### Wymagane hooki

#### useImageGenerator (Custom Hook)

Jeśli wymagana jest reużywalność logiki, stworzenie custom hooka do obsługi generacji obrazów:

```typescript
interface UseImageGeneratorReturn {
  state: GeneratorViewState
  generateImage: (prompt: string) => Promise<void>
  saveImage: (imageId: string) => Promise<void>
  clearError: () => void
  reset: () => void
}

// Umieszczenie: src/components/hooks/useImageGenerator.ts
export const useImageGenerator = (): UseImageGeneratorReturn => {
  const [state, setState] = useState<GeneratorViewState>({...})

  const generateImage = async (prompt: string) => {
    // Logika generacji
  }

  // ... inne funkcje
}
```

### Stan lokalny w komponencie

- `prompt` - bieżący tekst
- `isLoading` - status ładowania
- `error` - ostatni błąd
- `generatedImage` - wygenerowany obraz
- `remainingGenerations` - pozostałe generacje

### Źródła stanu

- **Lokalne (React state):** UI state, ładowanie, błędy, prompt
- **URL (opcjonalne):** Jeśli chcemy umożliwić shearing - `?prompt=xxx`
- **LocalStorage (opcjonalne):** Drafts promptów

## 7. Integracja API

### Endpoint główny

```
POST /api/images/generate
```

### Request

```typescript
// Type: GenerateImageCommand
{
  prompt: string; // 10-500 znaków
}
```

### Response Success (201 Created)

```typescript
// Type: GenerateImageResponseDTO
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  user_id: "user-123",
  prompt: "A modern oak dining table with metal legs",
  image_url: "https://storage.supabase.co/...",
  created_at: "2025-10-18T12:30:45Z",
  is_used: false,
  remaining_generations: 9
}
```

### Error Responses

- **400 Bad Request**: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {...} } }`
- **401 Unauthorized**: `{ "error": { "code": "UNAUTHORIZED", "message": "..." } }`
- **403 Forbidden**: `{ "error": { "code": "FORBIDDEN", "message": "..." } }`
- **429 Too Many Requests**: `{ "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "..." } }`
- **503 Service Unavailable**: `{ "error": { "code": "AI_GENERATION_FAILED", "message": "..." } }`

### Logika integracji

```typescript
const handleGenerateImage = async (prompt: string) => {
  // 1. Walidacja promptu (frontend)
  if (!prompt.trim() || prompt.length < 10 || prompt.length > 500) {
    setError({...})
    return
  }

  // 2. Ustawienie stanu ładowania
  setState(prev => ({ ...prev, isLoading: true, error: null }))

  try {
    // 3. Fetch API
    const response = await fetch("/api/images/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    })

    // 4. Obsługa błędów HTTP
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error.message)
    }

    // 5. Przetworzenie odpowiedzi
    const data: GenerateImageResponseDTO = await response.json()

    // 6. Aktualizacja stanu
    setState(prev => ({
      ...prev,
      isLoading: false,
      generatedImage: data,
      remainingGenerations: data.remaining_generations,
      prompt: ""
    }))
  } catch (error) {
    // 7. Obsługa błędów
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: parseError(error)
    }))
  }
}
```

## 8. Interakcje użytkownika

### Interakcja 1: Wprowadzenie promptu

- **Akcja:** Użytkownik wpisuje tekst w pole `PromptInput`
- **Oczekiwany rezultat:**
  - Tekst pojawia się w polu
  - Licznik znaków się aktualizuje
  - Po osiągnięciu 10 znaków przycisk "Generuj" staje się aktywny
  - Przy zbliżeniu do limitu 500 znaków pojawia się ostrzeżenie

### Interakcja 2: Generacja obrazu

- **Akcja:** Użytkownik kliknie przycisk "Generuj"
- **Oczekiwany rezultat:**
  - Przycisk wyłącza się i pokazuje loader
  - UI wyświetla "Generowanie obrazu..."
  - Po otrzymaniu odpowiedzi (30-60 sekund) wyświetla się wygenerowany obraz
  - Licznik generacji się zaktualizuje

### Interakcja 3: Obsługa błędu

- **Akcja:** API zwraca błąd (np. 429, 503)
- **Oczekiwany rezultat:**
  - Spinner znika
  - Wyświetla się komunikat o błędzie z sugestią co robić
  - Przycisk ponownie staje się aktywny jeśli błąd jest powtarzalny

### Interakcja 4: Zapisanie obrazu

- **Akcja:** Użytkownik klika "Zapisz" na wygenerowanym obrazie
- **Oczekiwany rezultat:**
  - Obraz jest oznaczony jako "zapisany"
  - Obraz pojawia się w galerii użytkownika
  - Wyświetla się komunikat potwierdzający

### Interakcja 5: Użycie w projekcie

- **Akcja:** Użytkownik klika "Użyj w projekcie"
- **Oczekiwany rezultat:**
  - Przekierowanie do strony tworzenia projektu
  - Wygenerowany obraz jest preselektowany w formularzu

### Interakcja 6: Wyczerpanie limitu

- **Akcja:** Użytkownik wyczerpie limit 10 generacji
- **Oczekiwany rezultat:**
  - Przycisk "Generuj" wyłącza się permanentnie
  - Wyświetla się komunikat "Osiągnięto limit darmowych generacji"
  - Pole promptu wyłącza się
  - Opcja upsellingu (premium)?

## 9. Warunki i walidacja

### Walidacja Promptu (Frontend)

- **Warunek:** Prompt musi mieć co najmniej 10 znaków
- **Komponenty:** `PromptInput`, `GenerateButton`
- **Wpływ na UI:** Przycisk "Generuj" jest disabled gdy prompt < 10 znaków
- **Komunikat:** "Opis musi zawierać co najmniej 10 znaków"

- **Warunek:** Prompt nie może być pusty
- **Komponenty:** `PromptInput`
- **Wpływ na UI:** Pole wyświetla placeholder z podpowiedzią
- **Komunikat:** Automatyczne

### Walidacja Długości Promptu (Frontend + Backend)

- **Warunek:** Prompt nie może przekroczyć 500 znaków
- **Komponenty:** `PromptInput`
- **Wpływ na UI:**
  - Licznik znaków przychyla kolor na czerwony blisko limitu
  - Textarea nie pozwala wpisać więcej znaków
- **Komunikat:** "Maksymalnie 500 znaków"

### Walidacja Limitu Generacji (Frontend + Backend)

- **Warunek:** `remaining_generations > 0`
- **Komponenty:** `GenerateButton`, `QuotaDisplay`
- **Wpływ na UI:**
  - Przycisk "Generuj" jest disabled gdy `remaining_generations === 0`
  - `QuotaDisplay` wyświetla ostrzeżenie
  - Pole promptu wyłącza się
- **Komunikat:** "Osiągnięto limit 10 darmowych generacji"

### Walidacja Autentykacji (Backend)

- **Warunek:** Użytkownik musi być zalogowany
- **Komponenty:** `generate.astro` (middleware)
- **Wpływ na UI:** Przekierowanie na `/login`
- **Komunikat:** "Musisz być zalogowany"

### Walidacja Roli Użytkownika (Backend)

- **Warunek:** Użytkownik musi mieć rolę "client"
- **Komponenty:** Middleware
- **Wpływ na UI:** Strona `/generate` niedostępna dla rzemieślników
- **Komunikat:** "Tylko klienci mogą generować obrazy"

### Walidacja Rate Limitingu (Backend)

- **Warunek:** Maksymalnie N żądań na IP/user w danym przedziale
- **Komponenty:** Backend middleware
- **Wpływ na UI:** Jeśli został wyzwolony, wyświetl komunikat o błędzie
- **Komunikat:** "Zbyt wiele żądań. Spróbuj ponownie za X sekund"

## 10. Obsługa błędów

### Scenariusz: Błąd walidacji (400)

- **Kiedy się zdarza:** Prompt pusta lub nieprawidłowy format
- **Jak się obsługuje:**
  - Wychwycić `ZodError`
  - Wyświetlić komunikat do użytkownika
  - Pole promptu zostaje aktywne do ponownej próby
  - Przycisk "Generuj" ponownie staje się aktywny
- **Komunikat dla użytkownika:** "Opis mebla musi zawierać 10-500 znaków"

### Scenariusz: Błąd autentykacji (401)

- **Kiedy się zdarza:** Token wygasł lub jest nieprawidłowy
- **Jak się obsługuje:**
  - Wyświetlić komunikat
  - Zaproponować ponowne zalogowanie
  - Przycisk "Zaloguj ponownie"
- **Komunikat dla użytkownika:** "Sesja wygasła. Zaloguj się ponownie"

### Scenariusz: Limit generacji osiągnięty (429)

- **Kiedy się zdarza:** Użytkownik wyczerpał limit generacji lub rate limit IP
- **Jak się obsługuje:**
  - Wyłączyć pole promptu i przycisk "Generuj"
  - Wyświetlić komunikat o wyczerpaniu limitu
  - Zaproponować upgrade (opcjonalnie w MVP)
- **Komunikat dla użytkownika:** "Osiągnięto limit 10 darmowych generacji. Aby wygenerować więcej, uaktualnij konto."

### Scenariusz: Błąd usługi AI (503)

- **Kiedy się zdarza:** OpenRouter API jest niedostępne
- **Jak się obsługuje:**
  - Wyświetlić komunikat o tymczasowym problemie
  - Przycisk "Spróbuj ponownie"
  - Powtórna próba w innym momencie
- **Komunikat dla użytkownika:** "Usługa generowania obrazów jest tymczasowo niedostępna. Spróbuj ponownie za chwilę."

### Scenariusz: Network timeout

- **Kiedy się zdarza:** Żądanie trwa zbyt długo lub zrywa się połączenie
- **Jak się obsługuje:**
  - Ustawić timeout 90 sekund
  - Wyświetlić komunikat
  - Przycisk "Spróbuj ponownie"
  - Prompt pozostaje w polu
- **Komunikat dla użytkownika:** "Połączenie zostało przerwane. Spróbuj ponownie."

### Scenariusz: Nieoczekiwany błąd (500)

- **Kiedy się zdarza:** Błąd bazy danych, błąd serwera
- **Jak się obsługuje:**
  - Zalogować błąd na backendzie
  - Wyświetlić genericzny komunikat
  - Przycisk "Spróbuj ponownie"
  - Prompt zostaje w polu
- **Komunikat dla użytkownika:** "Wystąpił błąd serwera. Spróbuj ponownie później lub skontaktuj się z supportem."

### Logika obsługi błędów

```typescript
const mapErrorToUserMessage = (error: any): ErrorMessage => {
  if (error.code === "VALIDATION_ERROR") {
    return {
      code: "VALIDATION_ERROR",
      message: "Opis mebla musi zawierać 10-500 znaków",
      retryable: true,
    };
  }

  if (error.code === "RATE_LIMIT_EXCEEDED" || error.status === 429) {
    return {
      code: "RATE_LIMITED",
      message: "Zbyt wiele żądań. Spróbuj ponownie za chwilę",
      retryable: true,
    };
  }

  if (error.code === "GENERATION_LIMIT_REACHED") {
    return {
      code: "QUOTA_EXCEEDED",
      message: "Osiągnięto limit 10 darmowych generacji",
      retryable: false,
    };
  }

  // ... inne mapowania

  return {
    code: "UNKNOWN_ERROR",
    message: "Coś poszło nie tak. Spróbuj ponownie.",
    retryable: true,
  };
};
```

## 11. Kroki implementacji

### Faza 1: Przygotowanie

1. Stworzenie pliku `src/pages/generate.astro` z podstawowym layoutem
2. Stworzenie pliku `src/components/ImageGeneratorContainer.tsx` z zarysem komponentu
3. Stworzenie pliku `src/components/hooks/useImageGenerator.ts` (custom hook)
4. Aktualizacja typów w `src/types.ts` o `GeneratorViewState` i `ErrorMessage`

### Faza 2: Komponenty UI

5. Implementacja komponentu `src/components/PromptInput.tsx`
   - Textarea z Shadcn/ui
   - Licznik znaków
   - Walidacja długości
   - Placeholder i help text
6. Implementacja komponentu `src/components/GenerateButton.tsx`
   - Button z Shadcn/ui
   - Spinner podczas ładowania
   - Disabled state
   - Tooltip z pozostałymi generacjami
7. Implementacja komponentu `src/components/QuotaDisplay.tsx`
   - Progress bar z Shadcn/ui
   - Tekst informacyjny
   - Ostrzeżenie przy 0 generacji
8. Implementacja komponentu `src/components/GeneratedImageDisplay.tsx`
   - Wyświetlenie obrazu
   - Przycisk "Zapisz"
   - Przycisk "Użyj w projekcie"
   - Wyświetlenie promptu
9. Implementacja komponentu `src/components/ErrorMessage.tsx`
   - Alert z Shadcn/ui
   - Ikona i tytuł
   - Przycisk zamknięcia

### Faza 3: Logika i Stan

10. Implementacja custom hooka `useImageGenerator`:
    - State management
    - Funkcja `generateImage(prompt: string)`
    - Funkcja `saveImage(imageId: string)`
    - Obsługa błędów
    - Fetch API
11. Implementacja głównego komponentu `ImageGeneratorContainer.tsx`:
    - Integracja sub-komponentów
    - Przekazywanie propów
    - Obsługa callbacków
    - Zarządzanie ładowaniem

### Faza 4: Integracja API

12. Stworzenie utility function do fetch API `/api/images/generate`
    - Error mapping
    - Type safety
    - Timeout handling
13. Testy integracji API:
    - Testowanie sukcesu (201)
    - Testowanie błędów (400, 401, 403, 429, 503)
    - Testowanie timeout'ów

### Faza 5: Styling i UX

14. Styling komponentów używając Tailwind 4:
    - Responsywny layout
    - Dark mode support (jeśli wymagany)
    - Animacje loadera
    - Hover states na przyciskach
15. Dostępność (A11y):
    - Proper ARIA labels
    - Keyboard navigation
    - Screen reader support
    - Color contrast

### Faza 6: Middleware i Routing

16. Stworzenie/aktualizacja middleware `src/middleware/index.ts`:
    - Weryfikacja autentykacji
    - Weryfikacja roli użytkownika
    - Redirect na `/login` jeśli nie zalogowany
17. Aktualizacja routingu:
    - Dodanie linku do `/generate` w Header
    - Dodanie linku do `/generate` w landing page

### Faza 7: Testowanie

18. Unit testy:
    - Testy komponentów (`PromptInput`, `GenerateButton`, etc.)
    - Testy custom hooka `useImageGenerator`
    - Testy utility functions
19. Integracyjne testy:
    - E2E testy całego flow'u generacji
    - Testy obsługi błędów
20. Testy manualne:
    - UX testing
    - Browser compatibility
    - Mobile responsiveness

### Faza 8: Finalizacja

21. Code review i optymalizacja
22. Performance checks (bundle size, rendering time)
23. Dokumentacja kodu
24. Merge do develop/main

### Szacunkowy Czas Implementacji

- **Faza 1-2:** 4-6 godzin (komponenty)
- **Faza 3:** 3-4 godzin (logika)
- **Faza 4:** 2-3 godzin (API)
- **Faza 5:** 3-4 godzin (styling)
- **Faza 6:** 1-2 godzin (middleware)
- **Faza 7-8:** 4-6 godzin (testy i finalizacja)
- **RAZEM:** ~21-29 godzin pracy
