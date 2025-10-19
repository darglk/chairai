# Plan Realizacji Projektu ChairAI (MVP)

Plan ten dzieli pracę na trzy kluczowe fazy, które razem tworzą pełną ścieżkę użytkownika (od pomysłu do oferty).

## Faza 1: Umożliwienie tworzenia projektów i profili rzemieślników

**Cel:** Umożliwienie klientowi przekształcenia wygenerowanego obrazu w publiczne ogłoszenie oraz przygotowanie rzemieślnika do pracy na platformie.

W tej fazie skupiamy się na dwóch równoległych ścieżkach: klient tworzy projekt, a rzemieślnik buduje swój profil. Są to warunki konieczne do zaistnienia interakcji między nimi.

### User Stories do realizacji:
*   **US-005: Tworzenie projektu na podstawie obrazu** - Kluczowy następny krok dla klienta.
*   **US-009: Rejestracja i uzupełnienie profilu rzemieślnika** - Niezbędne, aby rzemieślnik mógł w przyszłości składać wiarygodne oferty.

### Plan implementacji:

#### 1.1. API Endpoints (Backend)
Priorytetem jest stworzenie endpointów, które obsłużą tworzenie projektów i zarządzanie profilami.

| Priorytet | Endpoint | Metoda | Ścieżka | Opis |
| :--- | :--- | :--- | :--- | :--- |
| **1 (Bloker)** | List Dictionaries | `GET` | `/api/categories`, `/api/materials`, `/api/specializations` | Niezbędne do formularzy tworzenia projektu i profilu rzemieślnika. |
| **2** | List My Generated Images | `GET` | `/api/images/generated` | Klient musi mieć skąd wybrać obraz do stworzenia projektu. |
| **3** | Create Project | `POST` | `/api/projects` | Główny cel tej fazy dla ścieżki klienta. |
| **4** | Create/Update Artisan Profile | `PUT` | `/api/artisans/me` | Podstawowa obsługa profilu rzemieślnika (dane firmy). |
| **5** | Portfolio & Specializations | `POST`, `DELETE` | `/api/artisans/me/portfolio`, `/api/artisans/me/specializations` | Umożliwia rzemieślnikowi uzupełnienie profilu, co jest warunkiem jego publikacji. |
| **6** | Get My Artisan Profile | `GET` | `/api/artisans/me` | Umożliwia rzemieślnikowi podgląd swojego profilu podczas edycji. |

#### 1.2. UI (Frontend)
Tworzymy widoki, które pozwolą użytkownikom skorzystać z nowo utworzonych endpointów.

| Priorytet | Widok / Komponent | Ścieżka | Opis |
| :--- | :--- | :--- | :--- |
| **1** | Galeria Wygenerowanych Obrazów | `/gallery` | Widok, z którego klient rozpocznie tworzenie projektu. |
| **2** | Formularz Tworzenia Projektu | `/projects/new` | Formularz, w którym klient uzupełni dane projektu (kategoria, materiał itp.). |
| **3** | Edycja Profilu Rzemieślnika | `/profile/edit` | Wieloetapowy formularz dla rzemieślnika do uzupełnienia danych, portfolio i specjalizacji. |
| **4** | Komponent `FileUpload` | - | Reużywalny komponent do wgrywania zdjęć do portfolio. |

---

## Faza 2: Stworzenie Rynku Projektów (Marketplace)

**Cel:** Umożliwienie rzemieślnikom przeglądania opublikowanych projektów i składania ofert.

Po tej fazie mamy już działający rynek. Rzemieślnicy mogą znaleźć zlecenia, a klienci zaczynają otrzymywać pierwsze oferty.

### User Stories do realizacji:
*   **US-010: Przeglądanie rynku projektów** - Rzemieślnik może znaleźć interesujące go zlecenia.
*   **US-011: Składanie propozycji do projektu** - Rzemieślnik może aktywnie odpowiadać na projekty.

### Plan implementacji:

#### 2.1. API Endpoints (Backend)

| Priorytet | Endpoint | Metoda | Ścieżka | Opis |
| :--- | :--- | :--- | :--- | :--- |
| **1** | List Projects (Marketplace) | `GET` | `/api/projects` | Podstawa dla widoku Marketplace. |
| **2** | Get Project Details | `GET` | `/api/projects/{projectId}` | Niezbędne, aby rzemieślnik mógł zobaczyć szczegóły przed złożeniem oferty. |
| **3** | Create Proposal | `POST` | `/api/projects/{projectId}/proposals` | Kluczowa akcja dla rzemieślnika w tej fazie. |
| **4** | Get Artisan Profile | `GET` | `/api/artisans/{artisanId}` | Umożliwia wyświetlenie publicznego profilu rzemieślnika. |

#### 2.2. UI (Frontend)

| Priorytet | Widok / Komponent | Ścieżka | Opis |
| :--- | :--- | :--- | :--- |
| **1** | Marketplace (Rynek Projektów) | `/market` | Lista projektów dla rzemieślników z filtrowaniem. |
| **2** | Strona Szczegółów Projektu | `/projects/{projectId}` | Widok z perspektywy rzemieślnika, zawierający formularz składania oferty (`ProposalForm`). |
| **3** | Publiczny Profil Rzemieślnika | `/artisans/{artisanId}` | Strona, którą klient będzie mógł odwiedzić w kolejnej fazie. Warto ją stworzyć już teraz. |
| **4** | Komponent `ProjectList` | - | Reużywalny komponent do wyświetlania listy projektów z filtrami i paginacją. |

---

## Faza 3: Finalizacja Pętli - Akceptacja Oferty i Ocena

**Cel:** Umożliwienie klientowi przeglądania ofert, wyboru rzemieślnika i finalizacji projektu.

Ta faza zamyka główną pętlę biznesową platformy. Po jej zakończeniu mamy w pełni funkcjonalny produkt MVP.

### User Stories do realizacji:
*   **US-006: Przeglądanie i akceptacja propozycji** - Klient wybiera najlepszą dla siebie ofertę.
*   **US-007: Komunikacja z rzemieślnikiem** - (W MVP integracja z zewnętrznym czatem, więc głównie UI).
*   **US-008: Zakończenie i ocena projektu** - Budowanie zaufania na platformie poprzez system ocen.
*   **US-012 & US-013**: (Po stronie rzemieślnika) Oczekiwanie na akceptację i otrzymanie oceny.

### Plan implementacji:

#### 3.1. API Endpoints (Backend)

| Priorytet | Endpoint | Metoda | Ścieżka | Opis |
| :--- | :--- | :--- | :--- | :--- |
| **1** | List Project Proposals | `GET` | `/api/projects/{projectId}/proposals` | Klient musi widzieć oferty złożone do jego projektu. |
| **2** | Accept Proposal | `POST` | `/api/projects/{projectId}/accept-proposal` | Kluczowa akcja klienta, zmieniająca status projektu. |
| **3** | Update Project Status | `PATCH` | `/api/projects/{projectId}/status` | Do oznaczenia projektu jako zakończony. |
| **4** | Create Review | `POST` | `/api/projects/{projectId}/reviews` | Umożliwia dodanie oceny po zakończeniu projektu. |
| **5** | Get Artisan Reviews | `GET` | `/api/artisans/{artisanId}/reviews` | Wyświetlanie ocen na profilu publicznym rzemieślnika. |

#### 3.2. UI (Frontend)

| Priorytet | Widok / Komponent | Ścieżka | Opis |
| :--- | :--- | :--- | :--- |
| **1** | Strona Szczegółów Projektu (aktualizacja) | `/projects/{projectId}` | Rozbudowa widoku dla klienta o listę ofert (`ProposalList`) i przycisk akceptacji. |
| **2** | Strona Szczegółów Projektu (aktualizacja) | `/projects/{projectId}` | Dodanie widżetu czatu (`ChatWidget`) i formularza oceny (`ReviewForm`), które pojawiają się warunkowo w zależności od statusu projektu. |
| **3** | Pulpit Klienta | `/dashboard/client` | Stworzenie prostego pulpitu z listą własnych projektów i ich statusami. |
| **4** | Pulpit Rzemieślnika | `/dashboard/artisan` | Stworzenie pulpitu z listą złożonych ofert i projektów w realizacji. |
