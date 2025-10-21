# Plan implementacji widoku: Edycja Profilu Rzemieślnika

## 1. Przegląd
Widok "Edycja Profilu Rzemieślnika" to kluczowy element platformy, umożliwiający rzemieślnikom tworzenie i zarządzanie ich publicznym profilem. Celem jest zapewnienie intuicyjnego, wieloetapowego formularza, który prowadzi użytkownika przez proces uzupełniania danych firmowych, wyboru specjalizacji oraz budowania portfolio. Widok ten jest niezbędny do aktywacji profilu rzemieślnika na platformie i budowania zaufania potencjalnych klientów.

## 2. Routing widoku
Widok powinien być dostępny pod chronioną ścieżką, dostępną tylko dla zalogowanych użytkowników z rolą "Rzemieślnik".

- **Ścieżka:** `/profile/edit`
- **Plik strony:** `src/pages/profile/edit.astro`

Strona ta będzie renderować główny komponent React odpowiedzialny za logikę formularza.

## 3. Struktura komponentów
Hierarchia komponentów została zaprojektowana w celu modularności i reużywalności.

```
- ArtisanProfileEditView (React, Komponent-Kontener)
  - StepperNavigation (React, UI)
  - CompanyDataForm (React, Krok 1)
    - Input (Shadcn/ui)
    - Button (Shadcn/ui)
    - ErrorMessage (własny)
  - SpecializationsForm (React, Krok 2)
    - MultiSelect (React, własny lub biblioteka)
    - Button (Shadcn/ui)
  - PortfolioManager (React, Krok 3)
    - FileUploader (React, własny)
    - ImageGrid (React, UI)
      - ImageCard (React, UI)
        - Button (Shadcn/ui, do usuwania)
    - Button (Shadcn/ui)
```

## 4. Szczegóły komponentów

### `ArtisanProfileEditView`
- **Opis komponentu:** Główny kontener zarządzający stanem całego wieloetapowego formularza. Odpowiada za nawigację między krokami, agregację danych i komunikację z API.
- **Główne elementy:** Komponent `StepperNavigation` do wizualizacji postępu, oraz dynamicznie renderowany komponent dla aktywnego kroku (`CompanyDataForm`, `SpecializationsForm`, `PortfolioManager`).
- **Obsługiwane interakcje:** Przechodzenie do następnego/poprzedniego kroku.
- **Typy:** `ArtisanProfileViewModel`, `ApiErrorDTO`.
- **Propsy:** Brak (pobiera dane z API przy montowaniu).

### `CompanyDataForm` (Krok 1)
- **Opis komponentu:** Formularz do wprowadzania podstawowych danych firmy.
- **Główne elementy:** Dwa pola `Input` dla nazwy firmy i numeru NIP, przyciski nawigacyjne.
- **Obsługiwane interakcje:** Wprowadzanie tekstu, walidacja `onBlur`, przesyłanie danych kroku.
- **Obsługiwana walidacja:**
  - `company_name`: Wymagane, minimum 2 znaki.
  - `nip`: Wymagane, musi składać się z dokładnie 10 cyfr.
- **Typy:** `CompanyDataViewModel`.
- **Propsy:**
  - `initialData: CompanyDataViewModel`
  - `onNext: (data: CompanyDataViewModel) => void`
  - `isSubmitting: boolean`

### `SpecializationsForm` (Krok 2)
- **Opis komponentu:** Formularz do wyboru specjalizacji z predefiniowanej listy.
- **Główne elementy:** Komponent `MultiSelect` pozwalający na wybór wielu opcji, przyciski nawigacyjne.
- **Obsługiwane interakcje:** Wybór/usunięcie specjalizacji z listy.
- **Obsługiwana walidacja:** Wybór co najmniej jednej specjalizacji.
- **Typy:** `SpecializationDTO`.
- **Propsy:**
  - `availableSpecializations: SpecializationDTO[]`
  - `selectedIds: string[]`
  - `onBack: () => void`
  - `onNext: (selectedIds: string[]) => void`
  - `isSubmitting: boolean`

### `PortfolioManager` (Krok 3)
- **Opis komponentu:** Zarządzanie portfolio – przesyłanie nowych zdjęć i usuwanie istniejących.
- **Główne elementy:** Komponent `FileUploader` z funkcją "przeciągnij i upuść", siatka (`ImageGrid`) z miniaturami wgranych zdjęć (`ImageCard`).
- **Obsługiwane interakcje:** Wybór plików z dysku, przeciąganie plików, usuwanie pojedynczego zdjęcia.
- **Obsługiwana walidacja:**
  - Wymagane minimum 5 zdjęć w portfolio.
  - Walidacja formatu pliku (np. `image/jpeg`, `image/png`).
  - Walidacja rozmiaru pliku (np. do 5MB).
- **Typy:** `PortfolioImageDTO`.
- **Propsy:**
  - `portfolioImages: PortfolioImageDTO[]`
  - `onBack: () => void`
  - `onUpload: (files: File[]) => Promise<void>`
  - `onDelete: (imageId: string) => Promise<void>`
  - `onFinish: () => void`
  - `isSubmitting: boolean`

## 5. Typy

### `ArtisanProfileViewModel`
Agreguje dane ze wszystkich kroków formularza, stanowiąc frontendowy model całego profilu.
```typescript
interface ArtisanProfileViewModel {
  company_name: string;
  nip: string;
  specialization_ids: string[];
  portfolio_images: PortfolioImageDTO[];
  is_public: boolean;
}
```

### `CompanyDataViewModel`
Model widoku dla pierwszego kroku formularza.
```typescript
interface CompanyDataViewModel {
  company_name: string;
  nip: string;
}
```

## 6. Zarządzanie stanem
Zalecane jest stworzenie customowego hooka `useArtisanProfileForm`, który będzie zarządzał stanem całego procesu.

### `useArtisanProfileForm`
- **Cel:** Hermetyzacja logiki formularza wieloetapowego.
- **Zarządzany stan:**
  - `currentStep: number`: Aktualnie wyświetlany krok (np. 1, 2, 3).
  - `profileData: ArtisanProfileViewModel`: Stan całego profilu, aktualizowany po każdym kroku.
  - `isLoading: boolean`: Status ładowania danych początkowych.
  - `isSubmitting: boolean`: Status przesyłania danych do API.
  - `error: ApiErrorDTO | null`: Przechowywanie błędów z API.
- **Funkcje udostępniane przez hook:**
  - `handleCompanyDataNext(data: CompanyDataViewModel)`: Zapisuje dane firmy i przechodzi do kroku 2.
  - `handleSpecializationsNext(selectedIds: string[])`: Zapisuje specjalizacje i przechodzi do kroku 3.
  - `handlePortfolioUpload(files: File[])`: Obsługuje upload plików i aktualizuje stan `profileData`.
  - `handlePortfolioDelete(imageId: string)`: Obsługuje usuwanie zdjęcia i aktualizuje stan.
  - `handleFinish()`: Finalizuje proces, wysyła wszystkie dane do API.
  - `goToNextStep()`, `goToPrevStep()`: Funkcje nawigacyjne.

## 7. Integracja API
Komponent `ArtisanProfileEditView` (poprzez hook `useArtisanProfileForm`) będzie komunikował się z następującymi endpointami:

1.  **Pobranie danych profilu:**
    - **Endpoint:** `GET /api/artisans/me`
    - **Akcja:** Wywoływane przy montowaniu komponentu w celu wypełnienia formularza istniejącymi danymi.
    - **Typ odpowiedzi:** `ArtisanProfileDTO`

2.  **Aktualizacja danych firmy:**
    - **Endpoint:** `PUT /api/artisans/me`
    - **Akcja:** Wywoływane w `handleFinish` lub po każdym kroku (do dyskusji).
    - **Typ żądania:** `CreateUpdateArtisanProfileCommand`

3.  **Aktualizacja specjalizacji:**
    - **Endpoint:** `POST /api/artisans/me/specializations`
    - **Akcja:** Wywoływane w `handleFinish` lub po kroku 2.
    - **Typ żądania:** `AddArtisanSpecializationsCommand`

4.  **Dodawanie zdjęć do portfolio:**
    - **Endpoint:** `POST /api/artisans/me/portfolio`
    - **Akcja:** Wywoływane w `handlePortfolioUpload`.
    - **Typ żądania:** `FormData` z plikami.

5.  **Usuwanie zdjęcia z portfolio:**
    - **Endpoint:** `DELETE /api/artisans/me/portfolio/{imageId}`
    - **Akcja:** Wywoływane w `handlePortfolioDelete`.

## 8. Interakcje użytkownika
- **Wypełnianie pól:** Użytkownik wpisuje dane, które są walidowane na bieżąco lub przy utracie fokusu.
- **Nawigacja:** Użytkownik klika "Dalej" / "Wstecz", co zmienia `currentStep` i renderuje odpowiedni komponent kroku. Przycisk "Dalej" jest nieaktywny, dopóki dane w kroku nie są poprawne.
- **Wybór specjalizacji:** Użytkownik klika na opcje w `MultiSelect`, co aktualizuje listę `specialization_ids`.
- **Upload zdjęć:** Użytkownik przeciąga pliki na `FileUploader` lub klika, aby otworzyć okno wyboru plików. Postęp uploadu jest wizualizowany.
- **Usuwanie zdjęcia:** Użytkownik klika ikonę usuwania na `ImageCard`, co wywołuje `handlePortfolioDelete`.
- **Zakończenie:** Użytkownik klika "Zakończ" w ostatnim kroku, co uruchamia finalną wysyłkę danych.

## 9. Warunki i walidacja
- **Nazwa firmy:** Pole wymagane, co najmniej 2 znaki. Komponent `CompanyDataForm`. Stan przycisku "Dalej" zależy od tej walidacji.
- **NIP:** Pole wymagane, dokładnie 10 cyfr. Komponent `CompanyDataForm`. Stan przycisku "Dalej" zależy od tej walidacji.
- **Specjalizacje:** Wymagany wybór co najmniej jednej. Komponent `SpecializationsForm`. Stan przycisku "Dalej" zależy od tej walidacji.
- **Portfolio:** Wymagane co najmniej 5 zdjęć. Komponent `PortfolioManager`. Stan przycisku "Zakończ" zależy od tej walidacji.
- **Typ i rozmiar pliku:** Walidacja po stronie klienta przed wysłaniem na serwer. Komponent `FileUploader`.

## 10. Obsługa błędów
- **Błędy walidacji formularza:** Komunikaty o błędach wyświetlane są pod odpowiednimi polami (np. "NIP musi mieć 10 cyfr").
- **Błędy API (4xx, 5xx):**
  - Błędy przechwytywane są w bloku `catch` wywołań API.
  - Informacje o błędzie (`ApiErrorDTO`) są zapisywane w stanie `error` hooka `useArtisanProfileForm`.
  - Na poziomie UI wyświetlany jest globalny komponent `Alert` (np. z Shadcn/ui) z komunikatem błędu (np. "NIP już istnieje w systemie" dla błędu 409).
- **Błędy sieciowe:** Ogólny komunikat o błędzie połączenia.
- **Stan ładowania/wysyłania:** Przyciski akcji są dezaktywowane, a na ekranie może pojawić się wskaźnik ładowania (spinner), aby zapobiec wielokrotnemu przesyłaniu.

## 11. Kroki implementacji
1.  **Stworzenie pliku strony:** Utwórz plik `src/pages/profile/edit.astro` i osadź w nim główny komponent React `ArtisanProfileEditView`. Zabezpiecz trasę middlewarem sprawdzającym rolę użytkownika.
2.  **Implementacja `useArtisanProfileForm`:** Stwórz hook do zarządzania stanem, nawigacją i logiką formularza. Na początku może zawierać atrapy danych.
3.  **Implementacja `ArtisanProfileEditView`:** Zbuduj główny kontener, który używa hooka `useArtisanProfileForm` i renderuje komponenty kroków warunkowo na podstawie `currentStep`.
4.  **Implementacja `CompanyDataForm`:** Stwórz komponent dla pierwszego kroku, podłącz walidację (np. za pomocą `zod` i `react-hook-form`).
5.  **Implementacja `SpecializationsForm`:** Stwórz komponent dla drugiego kroku. Zintegruj lub stwórz komponent `MultiSelect`.
6.  **Implementacja `PortfolioManager`:** Stwórz komponent dla trzeciego kroku, w tym `FileUploader` i `ImageGrid`.
7.  **Integracja z API:** Zaimplementuj w hooku `useArtisanProfileForm` rzeczywiste wywołania do API w miejsce atrap, włączając obsługę błędów i stanów ładowania.
8.  **Styling i Dostępność:** Dopracuj wygląd komponentów za pomocą Tailwind CSS zgodnie z systemem projektowym i zadbaj o atrybuty ARIA.
9.  **Testowanie:** Przeprowadź testy manualne i jednostkowe dla logiki walidacji i interakcji z API.
