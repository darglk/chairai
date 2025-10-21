# Przepływ użytkownika: Edycja profilu rzemieślnika

## Diagram przepływu

```
┌─────────────────────────────────────────────────────────────┐
│ START: Użytkownik otwiera /profile/edit                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Middleware sprawdza:                                        │
│ ✓ Czy użytkownik jest zalogowany?                         │
│ ✓ Czy ma rolę "artisan"?                                   │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
             ▼ NIE                   ▼ TAK
    ┌────────────────┐      ┌───────────────────────┐
    │ Redirect na    │      │ Renderuje stronę      │
    │ /login         │      │ profile/edit.astro    │
    └────────────────┘      └──────────┬────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │ ArtisanProfileEditView ładuje dane:  │
                    │ GET /api/artisans/me                 │
                    └─────────┬────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼ 404 (brak profilu)       ▼ 200 (profil istnieje)
    ┌────────────────────────┐     ┌────────────────────────┐
    │ Pusty formularz        │     │ Formularz z danymi     │
    └───────────┬────────────┘     └──────────┬─────────────┘
                │                             │
                └──────────────┬──────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────────┐
        │                                                  │
        │  KROK 1: Dane firmy (CompanyDataForm)          │
        │  ┌──────────────────────────────────────────┐  │
        │  │ • Nazwa firmy (min 2 znaki)             │  │
        │  │ • NIP (dokładnie 10 cyfr)               │  │
        │  │                                          │  │
        │  │ [Walidacja onBlur]                      │  │
        │  └──────────────────────────────────────────┘  │
        │                                                  │
        │  Przycisk "Dalej" aktywny gdy:                 │
        │  ✓ Nazwa firmy poprawna                        │
        │  ✓ NIP poprawny                                │
        │                                                  │
        └────────────────────┬─────────────────────────────┘
                            │ Klik "Dalej"
                            ▼
        ┌──────────────────────────────────────────────────┐
        │                                                  │
        │  KROK 2: Specjalizacje (SpecializationsForm)   │
        │  ┌──────────────────────────────────────────┐  │
        │  │ GET /api/specializations                 │  │
        │  │                                          │  │
        │  │ □ Stolarka                               │  │
        │  │ ☑ Tapicerstwo                            │  │
        │  │ ☑ Renowacja mebli                        │  │
        │  │ □ Meble na wymiar                        │  │
        │  │                                          │  │
        │  │ Wybrano: 2                               │  │
        │  └──────────────────────────────────────────┘  │
        │                                                  │
        │  Przycisk "Dalej" aktywny gdy:                 │
        │  ✓ Wybrano min 1 specjalizację                 │
        │                                                  │
        │  [Wstecz] [Dalej]                              │
        └────────────┬───────────────────────┬─────────────┘
                    │                       │
                    ▼ "Wstecz"             ▼ "Dalej"
            ┌──────────────┐        ┌────────────────┐
            │ Powrót do    │        │ Przejście do   │
            │ Kroku 1      │        │ Kroku 3        │
            └──────────────┘        └────────┬───────┘
                                             │
                                             ▼
        ┌──────────────────────────────────────────────────┐
        │                                                  │
        │  KROK 3: Portfolio (PortfolioManager)          │
        │  ┌──────────────────────────────────────────┐  │
        │  │ [Obszar drag & drop lub kliknięcie]     │  │
        │  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│  │
        │  │ │img1 │ │img2 │ │img3 │ │img4 │ │img5 ││  │
        │  │ │ [X] │ │ [X] │ │ [X] │ │ [X] │ │ [X] ││  │
        │  │ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘│  │
        │  │                                          │  │
        │  │ Walidacja:                               │  │
        │  │ • Typ: JPG, PNG, WEBP                   │  │
        │  │ • Rozmiar: max 5MB                      │  │
        │  └──────────────────────────────────────────┘  │
        │                                                  │
        │  Dodane zdjęcia: 5 / 5 ✓                       │
        │                                                  │
        │  Każdy upload → POST /api/artisans/me/portfolio│
        │  Każde usunięcie → DELETE /api/.../portfolio/id│
        │                                                  │
        │  Przycisk "Zakończ" aktywny gdy:               │
        │  ✓ Min 5 zdjęć w portfolio                     │
        │                                                  │
        │  [Wstecz] [Zakończ]                            │
        └────────────┬───────────────────────┬─────────────┘
                    │                       │
                    ▼ "Wstecz"             ▼ "Zakończ"
            ┌──────────────┐        ┌────────────────┐
            │ Powrót do    │        │ Zapisywanie... │
            │ Kroku 2      │        └────────┬───────┘
            └──────────────┘                 │
                                             ▼
                    ┌──────────────────────────────────────┐
                    │ Finalizacja (handleFinish):          │
                    │ 1. PUT /api/artisans/me              │
                    │    (dane firmy)                      │
                    │ 2. POST /api/artisans/me/specializ.. │
                    │    (specjalizacje)                   │
                    │ 3. Portfolio już zapisane            │
                    └─────────────┬────────────────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
                    ▼ Sukces                    ▼ Błąd
        ┌───────────────────────┐    ┌─────────────────────┐
        │ Redirect na:          │    │ Alert z błędem:     │
        │ /profile              │    │ "Nie udało się      │
        │                       │    │  zapisać profilu"   │
        │ [TODO: Strona profilu]│    │                     │
        └───────────────────────┘    │ Pozostaje na        │
                                     │ formularzu          │
                                     └─────────────────────┘
```

## Stany komponentów

### 1. Loading State
- **Kiedy:** Pobieranie danych z GET /api/artisans/me
- **UI:** Spinner z tekstem "Ładowanie danych profilu..."
- **Czas trwania:** Do momentu otrzymania odpowiedzi

### 2. Error State
- **Kiedy:** Błąd API lub sieciowy
- **UI:** Alert (czerwony) z ikoną i komunikatem
- **Przykłady:**
  - "Nie udało się połączyć z serwerem"
  - "NIP już istnieje w systemie"
  - "Nie udało się przesłać zdjęć"

### 3. Submitting State
- **Kiedy:** Podczas wysyłania danych (upload, delete, finalizacja)
- **UI:** 
  - Przyciski dezaktywowane
  - Tekst zmienia się na "Przetwarzanie..." / "Zapisywanie..."
  - Opcjonalnie: spinner na przycisku

### 4. Validation State
- **Kiedy:** Po blur pola lub submit formularza
- **UI:** Czerwony tekst błędu pod polem
- **Przykłady:**
  - "Nazwa firmy musi mieć co najmniej 2 znaki"
  - "NIP musi składać się z dokładnie 10 cyfr"
  - "Musisz wybrać co najmniej jedną specjalizację"
  - "Dodaj jeszcze 3 zdjęć"

## Interakcje użytkownika

### Nawigacja między krokami
```
Krok 1 → Krok 2 → Krok 3
  ↑        ↓  ↑      ↓
  └────────┘  └──────┘
```

### Klawisze dostępności
- **Tab** - Nawigacja między polami
- **Enter** - Submit formularza (gdy aktywny)
- **Space** - Toggle checkbox / kliknięcie przycisku
- **Enter/Space** - Otwarcie file picker w PortfolioManager

### Wskaźniki postępu
```
Step 1    Step 2    Step 3
───●──────○────────○───  (Aktywny: Krok 1)
───✓──────●────────○───  (Aktywny: Krok 2)
───✓──────✓────────●───  (Aktywny: Krok 3)
```

## Responsywność

### Desktop (≥1024px)
- Obrazy portfolio: 4 kolumny
- Szerokość formularza: max 1024px (centered)

### Tablet (768-1023px)
- Obrazy portfolio: 3 kolumny
- Pełna szerokość z marginesami

### Mobile (<768px)
- Obrazy portfolio: 2 kolumny
- Stepper: pionowy lub kompaktowy
- Full-width inputs i przyciski
