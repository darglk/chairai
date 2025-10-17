# Architektura UI dla ChairAI

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla ChairAI została zaprojektowana w oparciu o podejście hybrydowe, wykorzystujące **Astro** do renderowania statycznych stron i layoutów oraz **React** do tworzenia dynamicznych, interaktywnych komponentów ("wysp"). Taka struktura zapewnia wysoką wydajność początkowego ładowania strony oraz bogate doświadczenie użytkownika w obszarach wymagających interakcji.

Kluczowym założeniem jest **architektura oparta na rolach**, która dynamicznie dostosowuje nawigację, dostępne widoki i funkcjonalności w zależności od typu zalogowanego użytkownika: **Klienta** lub **Rzemieślnika**. Zarządzanie stanem globalnym (np. sesja użytkownika) będzie realizowane przez React Context, a komunikacja z API i synchronizacja danych (buforowanie, mutacje) przez bibliotekę typu React Query/SWR.

Spójność wizualna zostanie osiągnięta dzięki wykorzystaniu biblioteki **Shadcn/ui**, z której komponenty będą opakowywane we własne, reużywalne komponenty aplikacyjne, zapewniając jednolity wygląd i ułatwiając przyszłe modyfikacje. Projektowanie odbywa się w podejściu **mobile-first**, gwarantując pełną responsywność i dostępność na różnych urządzeniach.

## 2. Lista widoków

### Widoki Publiczne (Dla Gości)

- **Nazwa widoku:** Strona Główna
- **Ścieżka widoku:** `/`
- **Główny cel:** Przedstawienie propozycji wartości ChairAI i zachęcenie do rejestracji.
- **Kluczowe informacje do wyświetlenia:** Krótki opis platformy, korzyści dla Klientów i Rzemieślników, przyciski "Zarejestruj się" i "Zaloguj".
- **Kluczowe komponenty widoku:** Nagłówek z nawigacją, sekcja "Hero", sekcje informacyjne, stopka.

- **Nazwa widoku:** Rejestracja
- **Ścieżka widoku:** `/register`
- **Główny cel:** Umożliwienie nowym użytkownikom założenia konta jako Klient lub Rzemieślnik.
- **Kluczowe informacje do wyświetlenia:** Formularz z polami: e-mail, hasło, powtórz hasło, przełącznik roli (Klient/Rzemieślnik).
- **Kluczowe komponenty widoku:** Komponent `RegisterForm` (React), pola `Input`, `Button`, `Label` (opakowane Shadcn/ui).
- **UX, dostępność i względy bezpieczeństwa:** Walidacja formularza w czasie rzeczywistym. Komunikaty o błędach powiązane z polami. Komunikacja z `POST /api/auth/register`.

- **Nazwa widoku:** Logowanie
- **Ścieżka widoku:** `/login`
- **Główny cel:** Umożliwienie zarejestrowanym użytkownikom dostępu do platformy.
- **Kluczowe informacje do wyświetlenia:** Formularz z polami: e-mail, hasło.
- **Kluczowe komponenty widoku:** Komponent `LoginForm` (React), pola `Input`, `Button`.
- **UX, dostępność i względy bezpieczeństwa:** Obsługa błędów logowania. Przekierowanie do odpowiedniego pulpitu po sukcesie. Komunikacja z `POST /api/auth/login`.

- **Nazwa widoku:** Publiczny Profil Rzemieślnika
- **Ścieżka widoku:** `/artisans/{artisanId}`
- **Główny cel:** Prezentacja umiejętności, portfolio i wiarygodności rzemieślnika potencjalnym klientom.
- **Kluczowe informacje do wyświetlenia:** Nazwa firmy, specjalizacje, galeria portfolio, średnia ocen, lista recenzji.
- **Kluczowe komponenty widoku:** Galeria obrazów, komponenty `Card` dla recenzji, komponent `Badge` dla specjalizacji.
- **UX, dostępność i względy bezpieczeństwa:** Strona renderowana po stronie serwera (SSR) dla SEO. Dane pobierane z `GET /api/artisans/{artisanId}` i `GET /api/artisans/{artisanId}/reviews`.

### Widoki dla Klienta

- **Nazwa widoku:** Pulpit Klienta
- **Ścieżka widoku:** `/dashboard/client`
- **Główny cel:** Centralny punkt nawigacyjny dla klienta, zapewniający szybki dostęp do kluczowych akcji i informacji.
- **Kluczowe informacje do wyświetlenia:** Sekcja "Szybkie Akcje" (np. "Stwórz nowy projekt"), lista aktywnych projektów z ich statusem.
- **Kluczowe komponenty widoku:** Komponent `ProjectList` (React), przyciski akcji.
- **UX, dostępność i względy bezpieczeństwa:** Widok chroniony, dostępny tylko dla zalogowanych Klientów. Dane pobierane z `GET /api/projects/me`.

- **Nazwa widoku:** Generator Obrazów AI
- **Ścieżka widoku:** `/generate`
- **Główny cel:** Umożliwienie klientowi wizualizacji pomysłu na mebel za pomocą AI.
- **Kluczowe informacje do wyświetlenia:** Pole tekstowe na prompt, przycisk "Generuj", licznik pozostałych generacji, wygenerowany obraz.
- **Kluczowe komponenty widoku:** Komponent `ImageGenerator` (React), `Textarea`, `Button`, `Progress`.
- **UX, dostępność i względy bezpieczeństwa:** Obsługa stanu ładowania podczas generacji. Blokada funkcji po wyczerpaniu limitu. Komunikacja z `POST /api/images/generate`.

- **Nazwa widoku:** Galeria Wygenerowanych Obrazów
- **Ścieżka widoku:** `/gallery`
- **Główny cel:** Przeglądanie, zarządzanie i wykorzystywanie wygenerowanych obrazów do tworzenia projektów.
- **Kluczowe informacje do wyświetlenia:** Siatka obrazów z informacją, czy obraz został już użyty.
- **Kluczowe komponenty widoku:** Komponent `ImageGallery` (React), przycisk "Stwórz projekt" na każdej nieużywanej karcie obrazu.
- **UX, dostępność i względy bezpieczeństwa:** Obsługa paginacji. Komunikacja z `GET /api/images/generated`.

- **Nazwa widoku:** Formularz Tworzenia Projektu
- **Ścieżka widoku:** `/projects/new`
- **Główny cel:** Przekształcenie wizualizacji w konkretne zapytanie ofertowe (ogłoszenie).
- **Kluczowe informacje do wyświetlenia:** Wybrany obraz, formularz z polami: kategoria, materiał, wymiary, budżet.
- **Kluczowe komponenty widoku:** Komponent `ProjectForm` (React), `Select`, `Input`.
- **UX, dostępność i względy bezpieczeństwa:** Dane do pól wyboru (kategorie, materiały) pobierane z `GET /api/categories` i `GET /api/materials`. Komunikacja z `POST /api/projects`.

### Widoki dla Rzemieślnika

- **Nazwa widoku:** Pulpit Rzemieślnika
- **Ścieżka widoku:** `/dashboard/artisan`
- **Główny cel:** Zapewnienie rzemieślnikowi przeglądu jego aktywności i szybki dostęp do zleceń.
- **Kluczowe informacje do wyświetlenia:** Podsumowanie profilu, lista projektów oczekujących na ofertę, lista projektów w realizacji.
- **Kluczowe komponenty widoku:** Komponenty list projektów, statystyki profilu.
- **UX, dostępność i względy bezpieczeństwa:** Widok chroniony, dostępny tylko dla zalogowanych Rzemieślników.

- **Nazwa widoku:** Edycja Profilu Rzemieślnika
- **Ścieżka widoku:** `/profile/edit`
- **Główny cel:** Umożliwienie rzemieślnikowi uzupełnienia i aktualizacji swojego publicznego profilu.
- **Kluczowe informacje do wyświetlenia:** Wieloetapowy formularz: dane firmy, specjalizacje, zarządzanie portfolio.
- **Kluczowe komponenty widoku:** Komponent `ArtisanProfileForm` (React), komponent do przesyłania plików.
- **UX, dostępność i względy bezpieczeństwa:** Wymuszenie uzupełnienia profilu po pierwszej rejestracji. Komunikacja z `PUT /api/artisans/me` i endpointami portfolio/specjalizacji.

- **Nazwa widoku:** Marketplace (Rynek Projektów)
- **Ścieżka widoku:** `/market`
- **Główny cel:** Umożliwienie rzemieślnikom wyszukiwania i przeglądania otwartych zleceń.
- **Kluczowe informacje do wyświetlenia:** Lista/siatka projektów z kluczowymi danymi (obraz, kategoria, budżet).
- **Kluczowe komponenty widoku:** Komponent `ProjectList` z filtrami (kategoria, materiał, wyszukiwanie tekstowe) i paginacją.
- **UX, dostępność i względy bezpieczeństwa:** Responsywny układ (siatka na desktopie, lista na mobile). Filtry w modalu na mobile. Komunikacja z `GET /api/projects`.

### Widoki Wspólne (Klient i Rzemieślnik)

- **Nazwa widoku:** Strona Szczegółów Projektu
- **Ścieżka widoku:** `/projects/{projectId}`
- **Główny cel:** Centralny punkt interakcji z projektem, dynamicznie zmieniający się w zależności od statusu i roli użytkownika.
- **Kluczowe informacje do wyświetlenia:**
    - **Dla Klienta (status 'open'):** Szczegóły projektu, lista złożonych ofert.
    - **Dla Rzemieślnika (status 'open'):** Szczegóły projektu, formularz składania oferty.
    - **Dla obu (status 'in_progress'):** Szczegóły projektu, zaakceptowana oferta, okno czatu.
    - **Dla obu (status 'completed'):** Podsumowanie projektu, formularz oceny.
- **Kluczowe komponenty widoku:** `ProjectDetails`, `ProposalList`, `ProposalForm`, `ChatWidget`, `ReviewForm`.
- **UX, dostępność i względy bezpieczeństwa:** Widok chroniony. Renderowanie warunkowe komponentów na podstawie danych z `GET /projects/{projectId}` i `GET /users/me`.

## 3. Mapa podróży użytkownika

### Główny przypadek użycia: Od pomysłu Klienta do realizacji przez Rzemieślnika

1.  **Rejestracja/Logowanie:**
    - Nowy **Klient** i **Rzemieślnik** rejestrują się przez widok `Rejestracja` (`/register`).
    - **Rzemieślnik** jest przekierowywany do `Edycja Profilu Rzemieślnika` (`/profile/edit`), aby uzupełnić wymagane dane (NIP, portfolio, specjalizacje). Jego profil pozostaje niepubliczny do czasu spełnienia wymogów.
    - Zarejestrowani użytkownicy logują się przez widok `Logowanie` (`/login`).

2.  **Generowanie Pomysłu (Klient):**
    - **Klient** przechodzi do `Generatora Obrazów AI` (`/generate`).
    - Wpisuje prompt, generuje obraz i zapisuje go w `Galerii Wygenerowanych Obrazów` (`/gallery`).

3.  **Tworzenie Projektu (Klient):**
    - Z poziomu `Galerii`, **Klient** wybiera obraz i klika "Stwórz projekt".
    - Jest przekierowywany do `Formularza Tworzenia Projektu` (`/projects/new`).
    - Wypełnia szczegóły (kategoria, materiał, budżet) i publikuje projekt.

4.  **Składanie Oferty (Rzemieślnik):**
    - **Rzemieślnik** przegląda nowe zlecenia na `Marketplace` (`/market`).
    - Znajduje interesujący projekt i przechodzi do `Strony Szczegółów Projektu` (`/projects/{projectId}`).
    - Wypełnia formularz oferty (cena, załącznik) i ją wysyła.

5.  **Akceptacja i Realizacja:**
    - **Klient** otrzymuje powiadomienie i na `Stronie Szczegółów Projektu` widzi listę ofert.
    - Przegląda oferty i `Publiczne Profile Rzemieślników`, którzy je złożyli.
    - Akceptuje wybraną ofertę. Status projektu zmienia się na "W realizacji".
    - Na `Stronie Szczegółów Projektu` dla obu stron pojawia się widżet czatu do dalszej komunikacji.

6.  **Zakończenie i Ocena:**
    - Po wykonaniu mebla, obie strony oznaczają projekt jako zakończony na `Stronie Szczegółów Projektu`.
    - Po obustronnym potwierdzeniu, na tej samej stronie pojawia się formularz do wystawienia wzajemnej oceny.
    - Oceny stają się widoczne na profilu rzemieślnika i w historii klienta.

## 4. Układ i struktura nawigacji

Nawigacja będzie dynamicznie dostosowywana do stanu uwierzytelnienia i roli użytkownika.

- **Nagłówek dla Gościa:**
  - Logo (link do `/`)
  - Linki: "Jak to działa?", "Dla Rzemieślników"
  - Przyciski: "Zaloguj się", "Zarejestruj się"

- **Nagłówek dla Klienta:**
  - Logo (link do `/dashboard/client`)
  - Linki: "Stwórz Projekt" (`/generate`), "Moje Projekty" (`/dashboard/client`), "Galeria" (`/gallery`)
  - Menu użytkownika: Ikona profilu -> "Ustawienia", "Wyloguj" (`LogoutButton`)

- **Nagłówek dla Rzemieślnika:**
  - Logo (link do `/dashboard/artisan`)
  - Linki: "Marketplace" (`/market`), "Moje Oferty" (`/proposals/me`)
  - Menu użytkownika: Ikona profilu -> "Mój Profil" (`/profile/edit`), "Ustawienia", "Wyloguj" (`LogoutButton`)

- **Stopka (wspólna dla wszystkich):**
  - Linki do stron informacyjnych (Regulamin, Polityka Prywatności), media społecznościowe.

## 5. Kluczowe komponenty

Poniższe komponenty (React) będą reużywalne i stanowić będą podstawę budowy interfejsu.

- **`AuthProvider` (Context):** Globalny dostawca przechowujący stan sesji i dane użytkownika, udostępniane przez hook `useAuth`.
- **`QueryProvider` (Context):** Konfiguracja i dostawca dla biblioteki React Query/SWR.
- **`RoleBasedGuard`:** Komponent wyższego rzędu lub hook, który chroni komponenty/strony w oparciu o rolę użytkownika.
- **`ProjectCard`:** Karta wyświetlająca podsumowanie projektu na listach (Marketplace, Pulpit).
- **`ProjectList`:** Komponent do wyświetlania listy `ProjectCard` z wbudowaną obsługą paginacji, filtrów, stanu ładowania (szkielety) i pustego stanu.
- **`FileUpload`:** Reużywalny komponent do przesyłania plików (portfolio, załączniki do ofert) z obsługą paska postępu i walidacji.
- **`NotificationBell`:** Ikona dzwonka w nawigacji, wyświetlająca listę ostatnich powiadomień.
- **`ReviewForm`:** Formularz do wystawiania ocen (komponent gwiazdek + pole tekstowe).
- **`ChatWidget`:** Komponent osadzający i obsługujący zewnętrzną usługę czatu.
- **Komponenty-wrappery (np. `AppButton`, `AppInput`):** Własne komponenty opakowujące elementy z Shadcn/ui w celu narzucenia spójnego stylu i zachowania w całej aplikacji.
