# Plan implementacji widoku Strona Główna

## 1. Przegląd

Widok Strony Głównej (`/`) jest wizytówką aplikacji ChairAI. Jego głównym celem jest przedstawienie propozycji wartości platformy nowym użytkownikom, wyjaśnienie korzyści dla Klientów i Rzemieślników oraz zachęcenie ich do podjęcia akcji – rejestracji lub logowania. Jako strona w dużej mierze statyczna, zostanie zaimplementowana przy użyciu komponentów Astro w celu zapewnienia maksymalnej wydajności.

## 2. Routing widoku

- **Ścieżka:** `/`
- **Plik:** `src/pages/index.astro`

## 3. Struktura komponentów

Widok zostanie zbudowany w oparciu o główny `Layout.astro`, który zapewni spójną strukturę z nagłówkiem i stopką na całej stronie.

```
- src/layouts/Layout.astro
  - src/components/layout/Header.astro
  - <slot /> (zawartość strony)
  - src/components/layout/Footer.astro

- src/pages/index.astro
  - src/components/landing/HeroSection.astro
  - src/components/landing/BenefitsSection.astro
  - src/components/landing/HowItWorksSection.astro
  - src/components/landing/CallToActionSection.astro
```

## 4. Szczegóły komponentów

### `Header.astro`

- **Opis komponentu:** Globalny nagłówek aplikacji, wyświetlany na wszystkich stronach. Zawiera logo oraz przyciski nawigacyjne.
- **Główne elementy:**
  - Logo aplikacji (link do `/`).
  - Komponent `Button` (z `shadcn/ui`) z linkiem do `/login` ("Zaloguj się").
  - Komponent `Button` (z `shadcn/ui`, wariant podstawowy) z linkiem do `/register` ("Zarejestruj się").
- **Obsługiwane interakcje:** Kliknięcie w logo, przycisk logowania, przycisk rejestracji.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

### `HeroSection.astro`

- **Opis komponentu:** Pierwsza, najbardziej widoczna sekcja strony. Ma za zadanie przyciągnąć uwagę użytkownika i w zwięzły sposób przedstawić główną ideę ChairAI.
- **Główne elementy:**
  - Nagłówek `h1` z głównym hasłem (np. "Przekształć swoje pomysły w realne meble").
  - Paragraf z krótkim opisem platformy.
  - Główny przycisk `Button` CTA (np. "Zacznij tworzyć"), kierujący do strony rejestracji.
  - Tło lub grafika związana z tematyką mebli i AI.
- **Obsługiwane interakcje:** Kliknięcie w główny przycisk CTA.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

### `BenefitsSection.astro`

- **Opis komponentu:** Sekcja prezentująca korzyści płynące z używania platformy, podzielona na dwie części: dla Klientów i dla Rzemieślników.
- **Główne elementy:**
  - Dwa kontenery (np. w układzie `flex` lub `grid`).
  - Każdy kontener zawiera: nagłówek (`h3`) określający grupę docelową ("Dla Klientów", "Dla Rzemieślników"), listę korzyści (ikona + tekst).
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

### `HowItWorksSection.astro`

- **Opis komponentu:** Sekcja wizualnie wyjaśniająca proces działania platformy w prostych krokach.
- **Główne elementy:**
  - Nagłówek `h2` (np. "Jak to działa?").
  - Układ (np. `grid` z 3 kolumnami) prezentujący 3 kroki:
    1.  **Generuj:** Ikona/grafika, nagłówek "Opisz i wygeneruj", krótki opis.
    2.  **Publikuj:** Ikona/grafika, nagłówek "Opublikuj projekt", krótki opis.
    3.  **Wybierz:** Ikona/grafika, nagłówek "Otrzymuj oferty i wybierz najlepszą", krótki opis.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

### `CallToActionSection.astro`

- **Opis komponentu:** Końcowa sekcja strony, której celem jest ponowne, mocne wezwanie do działania.
- **Główne elementy:**
  - Nagłówek `h2` (np. "Gotowy, by zacząć?").
  - Przycisk `Button` kierujący do strony rejestracji (`/register`).
- **Obsługiwane interakcje:** Kliknięcie przycisku rejestracji.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

### `Footer.astro`

- **Opis komponentu:** Globalna stopka aplikacji.
- **Główne elementy:**
  - Informacja o prawach autorskich.
  - Linki do podstron informacyjnych (np. "Regulamin", "Polityka Prywatności").
  - Linki do profili w mediach społecznościowych.
- **Obsługiwane interakcje:** Kliknięcie w linki.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

## 5. Typy

Dla tego widoku nie są wymagane żadne nowe typy danych (DTO, ViewModel), ponieważ jest on w pełni statyczny.

## 6. Zarządzanie stanem

Brak potrzeby zarządzania stanem. Widok nie zawiera interaktywnych elementów wymagających stanu po stronie klienta.

## 7. Integracja API

Brak integracji z API. Strona ma charakter informacyjny i nie pobiera ani nie wysyła żadnych danych.

## 8. Interakcje użytkownika

- **Kliknięcie "Zarejestruj się" / "Zacznij tworzyć":** Użytkownik jest przekierowywany na stronę `/register`.
- **Kliknięcie "Zaloguj się":** Użytkownik jest przekierowywany na stronę `/login`.
- **Kliknięcie logo:** Użytkownik jest przekierowywany na stronę główną (`/`).
- **Kliknięcie linków w stopce:** Użytkownik jest przekierowywany do odpowiednich stron informacyjnych.

## 9. Warunki i walidacja

Brak logiki walidacyjnej na tym widoku.

## 10. Obsługa błędów

Ponieważ strona jest statyczna i nie wykonuje operacji we/wy (API, formularze), nie przewiduje się scenariuszy błędów, które wymagałyby specjalnej obsługi.

## 11. Kroki implementacji

1.  **Utworzenie struktury plików:** Stworzenie nowych plików dla komponentów w katalogu `src/components/landing/` (`HeroSection.astro`, `BenefitsSection.astro`, `HowItWorksSection.astro`, `CallToActionSection.astro`) oraz `src/components/layout/` (`Header.astro`, `Footer.astro`), jeśli jeszcze nie istnieją.
2.  **Implementacja `Header.astro` i `Footer.astro`:** Zakodowanie globalnych komponentów nagłówka i stopki z użyciem komponentów `Button` z biblioteki `shadcn/ui` dla przycisków akcji.
3.  **Integracja w `Layout.astro`:** Umieszczenie komponentów `Header` i `Footer` w głównym layoucie, aby zapewnić ich widoczność na wszystkich stronach.
4.  **Implementacja `HeroSection.astro`:** Stworzenie sekcji z głównym hasłem, opisem i przyciskiem CTA. Dodanie stylów za pomocą Tailwind CSS, w tym responsywności.
5.  **Implementacja `BenefitsSection.astro`:** Stworzenie sekcji z korzyściami, dbając o czytelny podział na dwie grupy docelowe i responsywny układ.
6.  **Implementacja `HowItWorksSection.astro`:** Zaprojektowanie i zakodowanie sekcji kroków, używając ikon i krótkich opisów.
7.  **Implementacja `CallToActionSection.astro`:** Stworzenie prostej, końcowej sekcji z wezwaniem do działania.
8.  **Złożenie widoku w `index.astro`:** Zaimportowanie i umieszczenie wszystkich stworzonych sekcji (`HeroSection`, `BenefitsSection` itd.) w pliku `src/pages/index.astro` w odpowiedniej kolejności.
9.  **Stylowanie i responsywność:** Przegląd całej strony i dopracowanie stylów Tailwind CSS, ze szczególnym uwzględnieniem poprawnego wyświetlania na urządzeniach mobilnych, tabletach i desktopach.
10. **Testowanie manualne:** Sprawdzenie poprawności działania wszystkich linków i responsywności układu w różnych przeglądarkach i na różnych szerokościach ekranu.
