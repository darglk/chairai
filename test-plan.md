# Plan Testów Aplikacji ChairAI

**Wersja:** 1.0
**Data:** 17.10.2025
**Autor:** GitHub Copilot (jako Inżynier QA)

## 1. Wprowadzenie

Celem niniejszego dokumentu jest zdefiniowanie strategii, zakresu, zasobów i harmonogramu działań związanych z testowaniem aplikacji ChairAI w wersji MVP. Plan ma na celu zapewnienie, że aplikacja spełnia wszystkie wymagania funkcjonalne i niefunkcjonalne określone w Dokumencie Wymagań Produktu (PRD), a także gwarantuje wysoką jakość i stabilność działania przed wdrożeniem produkcyjnym.

## 2. Zakres Testów

### 2.1. Funkcjonalności do przetestowania (In-Scope)

Testom poddane zostaną wszystkie funkcjonalności zdefiniowane dla wersji MVP, w tym:

- **Moduł Uwierzytelniania i Profili Użytkowników:**
  - Rejestracja kont "Klient" i "Rzemieślnik".
  - Logowanie i wylogowywanie.
  - Odzyskiwanie hasła.
  - Zarządzanie profilami (edycja danych, portfolio dla rzemieślnika).
- **Generator Obrazów AI:**
  - Generowanie obrazów na podstawie promptów tekstowych.
  - Limit 10 generacji na konto klienta.
  - Zapisywanie obrazów w galerii użytkownika.
- **Moduł Tworzenia i Zarządzania Projektami:**
  - Tworzenie nowego projektu (ogłoszenia) na podstawie zapisanego obrazu.
  - Walidacja formularza projektu.
  - Zarządzanie statusami projektu.
- **Marketplace i System Ofert:**
  - Przeglądanie i filtrowanie otwartych projektów przez rzemieślników.
  - Składanie propozycji (ofert) do projektów.
  - Akceptacja propozycji przez klienta.
- **Komunikacja i System Ocen:**
  - Uruchomienie czatu po akceptacji oferty (weryfikacja integracji z zewnętrznym API).
  - Dwustronny system ocen i recenzji po zakończeniu projektu.

### 2.2. Funkcjonalności wykluczone (Out-of-Scope)

Następujące funkcjonalności są wykluczone z testów dla wersji MVP, zgodnie z PRD:

- Zintegrowany system płatności i obsługa transakcji.
- Funkcje monetyzacyjne (prowizje, subskrypcje, płatne generacje AI).
- Zaawansowane narzędzia do edycji obrazów AI.
- Natywny, wbudowany komunikator (czat).
- Aplikacje mobilne.
- Automatyczne powiadomienia systemowe (inne niż podstawowe notyfikacje o ofertach).

## 3. Strategia Testowania

### 3.1. Poziomy testów

- **Testy Jednostkowe (Unit Tests):**
  - **Cel:** Weryfikacja poprawności działania pojedynczych funkcji, komponentów i logiki biznesowej w izolacji.
  - **Zakres:** Funkcje pomocnicze (`src/lib/utils.ts`), schematy walidacji Zod (`src/lib/schemas.ts`), logika wewnątrz komponentów React (`src/components/**/*.tsx`).
  - **Narzędzia:** **Vitest**.

- **Testy Integracyjne (Integration Tests):**
  - **Cel:** Sprawdzenie poprawności współpracy między różnymi częściami systemu.
  - **Zakres:** Interakcja komponentów React z usługami, komunikacja frontend-backend (np. formularz logowania wysyłający dane do API endpointu w `src/pages/api/auth/login.ts`), integracja z Supabase.
  - **Narzędzia:** **Vitest**, **React Testing Library**.

- **Testy End-to-End (E2E):**
  - **Cel:** Symulacja rzeczywistych scenariuszy użytkowania z perspektywy użytkownika końcowego w przeglądarce.
  - **Zakres:** Pełne ścieżki użytkownika opisane w historyjkach (np. od rejestracji, przez wygenerowanie obrazu, stworzenie projektu, aż po akceptację oferty).
  - **Narzędzia:** **Playwright**.

### 3.2. Typy testów

- **Testy Funkcjonalne:** Weryfikacja, czy aplikacja działa zgodnie z wymaganiami z PRD. Będą realizowane na wszystkich poziomach testów.
- **Testy UI/UX:** Sprawdzenie poprawności wyświetlania interfejsu na różnych rozdzielczościach (responsive design), spójności wizualnej, intuicyjności nawigacji i ogólnego doświadczenia użytkownika. Do testowania izolowanych komponentów UI zostanie wykorzystany **Storybook**.
- **Testy Wydajności (podstawowe):** Pomiar kluczowych wskaźników Web Vitals (LCP, FID, CLS) dla głównych stron. Analiza czasu ładowania stron i odpowiedzi API pod standardowym obciążeniem. Narzędzia: **Playwright**, **Google Lighthouse**.
- **Testy Bezpieczeństwa (podstawowe):** Weryfikacja podstawowych mechanizmów bezpieczeństwa, takich jak:
  - Ochrona endpointów API (dostęp tylko dla autoryzowanych użytkowników).
  - Walidacja danych wejściowych po stronie serwera (Zod).
  - Bezpieczne zarządzanie sesją (Supabase Auth).
  - Ochrona przed podstawowymi atakami (np. XSS przez sanitację danych).

## 4. Środowisko Testowe i Narzędzia

- **Framework do testów E2E:** **Playwright** - ze względu na szybkość, niezawodność i zaawansowane funkcje (auto-waiting, tracing).
- **Runner do testów jednostkowych i integracyjnych:** **Vitest** - ze względu na kompatybilność z Vite i szybkość działania.
- **Biblioteka do testowania komponentów:** **React Testing Library** - do testowania komponentów React w sposób zbliżony do interakcji użytkownika.
- **Testowanie komponentów UI:** **Storybook** - do tworzenia i wizualnego testowania komponentów UI w izolacji.
- **Środowisko testowe:** Dedykowana instancja deweloperska/stagingowa aplikacji z własną, odizolowaną bazą danych Supabase, zasilaną danymi testowymi.
- **CI/CD:** **GitHub Actions** - do automatycznego uruchamiania testów po każdym pushu do repozytorium.

## 5. Kryteria Wejścia i Wyjścia

### 5.1. Kryteria Wejścia (Rozpoczęcie Testów)

- Ukończenie implementacji funkcjonalności przewidzianych w danym sprincie/kamieniu milowym.
- Dostępność stabilnej, wdrożonej wersji aplikacji na środowisku testowym.
- Przygotowane i dostępne dane testowe (np. konta użytkowników, profile rzemieślników).
- Ukończone i zrecenzowane scenariusze testowe.

### 5.2. Kryteria Wyjścia (Zakończenie Testów)

- Wykonanie wszystkich zaplanowanych scenariuszy testowych.
- Wszystkie krytyczne i poważne błędy zostały naprawione i retestowane pomyślnie.
- Poziom pokrycia kodu testami jednostkowymi i integracyjnymi osiągnął zdefiniowany próg (np. 70%).
- Brak znanych regresji w kluczowych funkcjonalnościach.
- Akceptacja zespołu produktowego.

## 6. Scenariusze Testowe (Test Cases E2E)

Poniżej znajdują się przykładowe scenariusze E2E dla każdej historyjki użytkownika.

### Rola: Klient

---

**ID:** TC-US-001
**Historyjka:** US-001 - Rejestracja konta klienta
**Tytuł:** Pomyślna rejestracja nowego klienta
**Kroki:**
1. Przejdź na stronę `/register`.
2. Wypełnij pole "E-mail" poprawnym adresem email (np. `test.klient@example.com`).
3. Wypełnij pole "Hasło" i "Powtórz hasło" tym samym, silnym hasłem.
4. Zaznacz, że typ konta to "Klient".
5. Kliknij przycisk "Zarejestruj się".
**Oczekiwany rezultat:**
- Użytkownik zostaje przekierowany na stronę z prośbą o potwierdzenie adresu e-mail. Po potwierdzeniu i zalogowaniu, jest przekierowany na stronę główną (`/`) i widzi interfejs zalogowanego użytkownika.

---

**ID:** TC-US-002
**Historyjka:** US-002 - Logowanie użytkownika
**Tytuł:** Logowanie na istniejące konto klienta
**Kroki:**
1. Przejdź na stronę `/login`.
2. Wprowadź e-mail i hasło istniejącego użytkownika.
3. Kliknij przycisk "Zaloguj".
**Oczekiwany rezultat:**
- Użytkownik zostaje zalogowany i przekierowany na stronę główną. W nagłówku widoczna jest ikona profilu lub menu użytkownika.

---

**ID:** TC-US-003
**Historyjka:** US-003 - Wylogowywanie użytkownika
**Tytuł:** Pomyślne wylogowanie z systemu
**Kroki:**
1. Zaloguj się na konto użytkownika.
2. Otwórz menu profilowe.
3. Kliknij przycisk "Wyloguj".
**Oczekiwany rezultat:**
- Sesja użytkownika zostaje zakończona. Użytkownik jest przekierowany na stronę główną i widzi opcje "Zaloguj" i "Zarejestruj". Dostęp do stron chronionych jest niemożliwy.

---

**ID:** TC-US-004
**Historyjka:** US-004 - Generowanie obrazu mebla
**Tytuł:** Wygenerowanie i zapisanie obrazu przez klienta
**Kroki:**
1. Zaloguj się jako Klient.
2. Na stronie głównej znajdź pole do wprowadzania promptu AI.
3. Wpisz opis mebla, np. "Nowoczesne dębowe krzesło w stylu skandynawskim".
4. Kliknij "Generuj".
5. Po pojawieniu się obrazu, kliknij przycisk "Zapisz w galerii".
**Oczekiwany rezultat:**
- Obraz zostaje wygenerowany i wyświetlony. Po zapisaniu, jest widoczny w prywatnej galerii użytkownika. Licznik generacji zmniejsza się o 1.

---

**ID:** TC-US-005
**Historyjka:** US-005 - Tworzenie projektu na podstawie obrazu
**Tytuł:** Pomyślne utworzenie nowego projektu
**Kroki:**
1. Zaloguj się jako Klient i przejdź do swojej galerii.
2. Wybierz jeden z zapisanych obrazów i kliknij "Stwórz projekt".
3. Wypełnij formularz: wybierz kategorię, materiał, rozmiar i budżet.
4. Kliknij "Opublikuj projekt".
**Oczekiwany rezultat:**
- Projekt zostaje utworzony i otrzymuje status "Otwarty". Jest widoczny na liście projektów w marketplace dla rzemieślników.

---

**ID:** TC-US-006
**Historyjka:** US-006 - Przeglądanie i akceptacja propozycji
**Tytuł:** Akceptacja oferty rzemieślnika
**Kroki:**
1. Zaloguj się jako Klient, który ma otwarty projekt z co najmniej jedną ofertą.
2. Przejdź do strony szczegółów projektu.
3. Przejrzyj listę otrzymanych propozycji.
4. Kliknij "Akceptuj Propozycję" przy wybranej ofercie.
**Oczekiwany rezultat:**
- Status projektu zmienia się na "W realizacji". Pozostałe oferty stają się nieaktywne. Na stronie projektu pojawia się dostęp do czatu z wybranym rzemieślnikiem.

---

**ID:** TC-US-007
**Historyjka:** US-007 - Komunikacja z rzemieślnikiem
**Tytuł:** Wysłanie wiadomości na czacie
**Kroki:**
1. Zaloguj się jako Klient, który zaakceptował ofertę.
2. Przejdź do strony projektu "W realizacji".
3. Wpisz wiadomość w oknie czatu i kliknij "Wyślij".
**Oczekiwany rezultat:**
- Wiadomość pojawia się w historii czatu. Rzemieślnik może ją odczytać.

---

**ID:** TC-US-008
**Historyjka:** US-008 - Zakończenie i ocena projektu
**Tytuł:** Oznaczenie projektu jako zakończony i wystawienie oceny
**Kroki:**
1. Zaloguj się jako Klient. Projekt jest w statusie "W realizacji" i został również oznaczony jako zakończony przez rzemieślnika.
2. Na stronie projektu kliknij "Oznacz jako zakończony".
3. Wypełnij formularz oceny: wybierz liczbę gwiazdek (1-5) i dodaj komentarz.
4. Kliknij "Wystaw ocenę".
**Oczekiwany rezultat:**
- Status projektu zmienia się na "Zakończony". Ocena jest widoczna na publicznym profilu rzemieślnika.

### Rola: Rzemieślnik

---

**ID:** TC-US-009
**Historyjka:** US-009 - Rejestracja i uzupełnienie profilu rzemieślnika
**Tytuł:** Pomyślna rejestracja i aktywacja profilu rzemieślnika
**Kroki:**
1. Zarejestruj konto typu "Rzemieślnik", podając m.in. NIP.
2. Po zalogowaniu, przejdź do edycji profilu.
3. Dodaj specjalizacje.
4. Wgraj co najmniej 5 zdjęć do portfolio.
5. Zapisz zmiany.
**Oczekiwany rezultat:**
- Wszystkie dane zostają zapisane. Profil rzemieślnika staje się publiczny i widoczny dla klientów.

---

**ID:** TC-US-010
**Historyjka:** US-010 - Przeglądanie rynku projektów
**Tytuł:** Filtrowanie projektów na marketplace
**Kroki:**
1. Zaloguj się jako Rzemieślnik.
2. Przejdź do strony "Marketplace".
3. Użyj filtra "Kategoria" i wybierz np. "Stoły".
**Oczekiwany rezultat:**
- Lista projektów zostaje przefiltrowana i wyświetla tylko te, które pasują do wybranego kryterium.

---

**ID:** TC-US-011
**Historyjka:** US-011 - Składanie propozycji do projektu
**Tytuł:** Pomyślne złożenie oferty do projektu
**Kroki:**
1. Zaloguj się jako Rzemieślnik i wybierz otwarty projekt z marketplace.
2. Kliknij "Złóż propozycję".
3. Wpisz kwotę wyceny.
4. Załącz wymagany plik (np. PDF ze szkicem).
5. Kliknij "Wyślij propozycję".
**Oczekiwany rezultat:**
- Propozycja zostaje wysłana i jest widoczna dla klienta na stronie projektu. Klient otrzymuje powiadomienie.

---

**ID:** TC-US-012
**Historyjka:** US-012 - Oczekiwanie na akceptację i realizacja
**Tytuł:** Otrzymanie powiadomienia o akceptacji oferty
**Kroki:**
1. Zaloguj się jako Rzemieślnik, który złożył ofertę.
2. Sprawdź powiadomienia (lub poczekaj na e-mail) po tym, jak klient zaakceptuje ofertę.
3. Przejdź do strony zaakceptowanego projektu.
**Oczekiwany rezultat:**
- Rzemieślnik widzi, że jego oferta została zaakceptowana. Na stronie projektu dostępny jest czat do komunikacji z klientem.

---

**ID:** TC-US-013
**Historyjka:** US-013 - Otrzymanie oceny
**Tytuł:** Sprawdzenie otrzymanej oceny po zakończonym projekcie
**Kroki:**
1. Zaloguj się jako Rzemieślnik. Projekt został obustronnie zakończony i oceniony przez klienta.
2. Przejdź do swojego publicznego profilu.
**Oczekiwany rezultat:**
- Nowa ocena i komentarz od klienta są widoczne na profilu. Średnia ocen jest poprawnie zaktualizowana.
