# Dokument wymagań produktu (PRD) - ChairAI

Data: 11 października 2025
Wersja: 1.0 (MVP)

## 1. Przegląd produktu

ChairAI to innowacyjna platforma webowa, która łączy świat kreatywnych pomysłów na meble z rzemieślniczym wykonaniem. Naszym celem jest rozwiązanie dwóch kluczowych problemów: trudności w wizualizacji unikalnych koncepcji mebli oraz bariery w znalezieniu wykwalifikowanego rzemieślnika do ich realizacji.

Platforma skierowana jest do dwóch głównych grup użytkowników:

- Klientów indywidualnych, którzy chcą zamówić mebel na wymiar, ale potrzebują narzędzia do zwizualizowania swojego pomysłu.
- Rzemieślników i stolarzy, którzy poszukują nowych zleceń i chcą otrzymywać precyzyjnie zdefiniowane zapytania.

Za pomocą generatora obrazów AI (tekst → obraz), użytkownicy mogą tworzyć wizualizacje swoich wymarzonych mebli. Następnie, na bazie wygenerowanego obrazu, tworzą ogłoszenie na platformie-marketplace, gdzie zweryfikowani rzemieślnicy mogą składać swoje oferty. ChairAI ma na celu uproszczenie i ustrukturyzowanie procesu od idei do finalizacji projektu, budując zaufanie i transparentność między stronami.

## 2. Problem użytkownika

### Dla Klienta:

- Użytkownicy mają pomysł na mebel, ale nie potrafią go precyzyjnie opisać ani zwizualizować, co utrudnia komunikację z wykonawcą.
- Proces poszukiwania i weryfikacji godnego zaufania rzemieślnika jest czasochłonny i niepewny.
- Brak narzędzi do łatwego przekształcenia abstrakcyjnej koncepcji w konkretne zapytanie ofertowe.

### Dla Rzemieślnika:

- Otrzymywanie niejasnych, ogólnikowych zapytań od klientów, co prowadzi do frustracji i straty czasu na doprecyzowanie wymagań.
- Trudność w dotarciu do klientów poszukujących unikalnych, spersonalizowanych projektów.
- Brak ustandaryzowanego formatu zapytań, który zawierałby minimalne, niezbędne informacje do przygotowania wstępnej wyceny.

## 3. Wymagania funkcjonalne

### 3.1. Moduł Uwierzytelniania i Profili Użytkowników

- Rejestracja i logowanie dla dwóch typów kont: "Klient" i "Rzemieślnik".
- Profil Klienta: zawiera historię generowanych obrazów, stworzonych projektów i otrzymanych ocen.
- Profil Rzemieślnika: wymaga podania danych firmy (weryfikacja NIP w MVP), listy specjalizacji oraz portfolio (minimum 5 zdjęć zrealizowanych prac). Profil jest publiczny.

### 3.2. Generator Obrazów AI

- Interfejs do wprowadzania promptów tekstowych w celu generowania obrazów mebli.
- Limit 10 darmowych generacji na konto klienta.
- Galeria, w której klient może zapisać wygenerowane obrazy.
- Historia wprowadzonych promptów i wygenerowanych obrazów powiązana z kontem klienta.

### 3.3. Moduł Tworzenia i Zarządzania Projektami

- Formularz tworzenia nowego projektu (ogłoszenia) na podstawie zapisanego obrazu AI.
- Obowiązkowe pola do uzupełnienia: Kategoria mebla, Materiał, Orientacyjny rozmiar, Oczekiwany budżet (predefiniowane zakresy).
- Każdy projekt ma unikalny identyfikator i status (np. Otwarty, W realizacji, Zakończony).

### 3.4. Marketplace i System Ofert

- Rzemieślnicy mogą przeglądać i filtrować listę otwartych projektów.
- Formularz składania propozycji przez rzemieślnika musi zawierać: wycenę (w PLN) oraz obowiązkowy załącznik (np. wstępny szkic techniczny, opis specyfikacji).
- Klient otrzymuje powiadomienia o nowych propozycjach i może je przeglądać na stronie projektu.
- Klient może zaakceptować jedną propozycję, co zmienia status projektu na "W realizacji" ("Projekt Rozpoczęty").
- Zaakceptowana kwota wyceny jest zapisywana w bazie danych.

### 3.5. Komunikacja i System Ocen

- Po akceptacji oferty, między klientem a rzemieślnikiem uruchamiany jest czat oparty na zewnętrznym API.
- Po obustronnym oznaczeniu projektu jako "Zakończony Sukcesem", aktywowany jest system dwustronnych ocen i recenzji (skala 1-5 gwiazdek + komentarz).
- Oceny są widoczne w publicznym profilu rzemieślnika oraz w historii klienta.

## 4. Granice produktu

### Funkcjonalności zawarte w wersji MVP:

- Pełna ścieżka użytkownika od generacji obrazu AI do akceptacji oferty rzemieślnika.
- Rejestracja i profile dla obu typów użytkowników z wymaganymi polami (portfolio, NIP).
- Ograniczenie do 10 generacji AI na klienta.
- Rynek polski, waluta PLN.
- Komunikacja za pośrednictwem zewnętrznego API czatu.
- Dwustronny system ocen po zakończeniu projektu.
- Zapisywanie historii promptów, obrazów i zaakceptowanych wycen.
- Podstawowa weryfikacja rzemieślników (NIP).

### Funkcjonalności wykluczone z wersji MVP:

- Zintegrowany system płatności i obsługa transakcji finansowych.
- Monetyzacja (prowizje od transakcji, płatne generacje AI, subskrypcje dla rzemieślników).
- Zaawansowane narzędzia do edycji obrazów lub optymalizacji promptów AI.
- Wbudowany, natywny komunikator (czat).
- Zaawansowana weryfikacja autentyczności portfolio rzemieślników.
- Aplikacje mobilne (projekt realizowany jako platforma webowa).
- Automatyczne powiadomienia i zachęty do oznaczania projektu jako "Zakończony Sukcesem".

## 5. Historyjki użytkowników

### Klient

- ID: US-001
- Tytuł: Rejestracja konta klienta
- Opis: Jako nowy użytkownik, chcę móc zarejestrować konto typu "Klient" używając mojego adresu e-mail i hasła, aby uzyskać dostęp do platformy.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola: e-mail, hasło, powtórz hasło.
  - System waliduje poprawność adresu e-mail.
  - System wymaga, aby hasła w obu polach były identyczne.
  - Po pomyślnej rejestracji jestem zalogowany i przekierowany na stronę główną.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik (Klient lub Rzemieślnik), chcę móc zalogować się na swoje konto, używając adresu e-mail i hasła, aby uzyskać dostęp do spersonalizowanych funkcji platformy.
- Kryteria akceptacji:
  - Strona logowania zawiera pola "E-mail" i "Hasło" oraz przycisk "Zaloguj".
  - Po wprowadzeniu poprawnych danych uwierzytelniających, użytkownik zostaje zalogowany i przekierowany do swojego panelu.
  - W przypadku wprowadzenia nieprawidłowych danych, pod formularzem wyświetlany jest komunikat o błędzie "Nieprawidłowy e-mail lub hasło".
  - Sesja użytkownika jest utrzymywana po zamknięciu i ponownym otwarciu przeglądarki.

- ID: US-003
- Tytuł: Wylogowywanie użytkownika
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość bezpiecznego wylogowania się z mojego konta, aby chronić swoją prywatność.
- Kryteria akceptacji:
  - W interfejsie użytkownika (np. w menu profilowym) znajduje się przycisk "Wyloguj".
  - Po kliknięciu przycisku "Wyloguj", sesja użytkownika zostaje zakończona.
  - Użytkownik zostaje przekierowany na stronę główną lub stronę logowania.
  - Po wylogowaniu, dostęp do chronionych stron (np. panelu użytkownika) jest niemożliwy bez ponownego zalogowania.

- ID: US-004
- Tytuł: Generowanie obrazu mebla
- Opis: Jako klient, chcę móc wpisać tekstowy opis mebla i wygenerować obraz AI, aby zwizualizować mój pomysł.
- Kryteria akceptacji:
  - Na moim pulpicie widzę pole do wpisania promptu.
  - Po kliknięciu "Generuj" obraz pojawia się na ekranie.
  - System śledzi liczbę dokonanych generacji i nie pozwala przekroczyć 10.
  - Mogę zapisać wygenerowany obraz w mojej prywatnej galerii.

- ID: US-005
- Tytuł: Tworzenie projektu na podstawie obrazu
- Opis: Jako klient, chcę móc wybrać obraz z mojej galerii i na jego podstawie stworzyć nowy projekt (ogłoszenie), wypełniając proste pola, aby rzemieślnicy mogli złożyć oferty.
- Kryteria akceptacji:
  - Mogę wybrać obraz z listy zapisanych obrazów.
  - Formularz tworzenia projektu zawiera obowiązkowe pola wyboru: Materiał, Rozmiar, Budżet.
  - Po opublikowaniu, projekt staje się widoczny dla rzemieślników na marketplace.

- ID: US-006
- Tytuł: Przeglądanie i akceptacja propozycji
- Opis: Jako klient, chcę móc przeglądać propozycje złożone przez rzemieślników do mojego projektu, porównać je i zaakceptować najlepszą.
- Kryteria akceptacji:
  - Otrzymuję powiadomienie o nowej propozycji.
  - Na stronie projektu widzę listę propozycji, każda z wyceną, nazwą rzemieślnika i załącznikiem.
  - Mogę kliknąć na profil rzemieślnika, aby zobaczyć jego portfolio i oceny.
  - Po kliknięciu "Akceptuj Propozycję", inne propozycje stają się nieaktywne, a status projektu zmienia się na "W realizacji".

- ID: US-007
- Tytuł: Komunikacja z rzemieślnikiem
- Opis: Jako klient, po zaakceptowaniu propozycji, chcę mieć możliwość komunikacji z rzemieślnikiem poprzez czat, aby omówić szczegóły.
- Kryteria akceptacji:
  - Na stronie projektu z zaakceptowaną ofertą pojawia się okno czatu.
  - Mogę wysyłać i odbierać wiadomości tekstowe od rzemieślnika.
  - Czat jest dostępny tylko dla zaakceptowanej pary klient-rzemieślnik.

- ID: US-008
- Tytuł: Zakończenie i ocena projektu
- Opis: Jako klient, po zakończeniu realizacji mebla, chcę móc oznaczyć projekt jako zakończony i wystawić ocenę rzemieślnikowi.
- Kryteria akceptacji:
  - Na stronie projektu w realizacji mam przycisk "Oznacz jako zakończony".
  - Po obustronnym potwierdzeniu zakończenia, pojawia się formularz do wystawienia oceny (1-5 gwiazdek) i komentarza.
  - Wystawiona ocena jest widoczna na profilu rzemieślnika.

### Rzemieślnik

- ID: US-009
- Tytuł: Rejestracja i uzupełnienie profilu rzemieślnika
- Opis: Jako rzemieślnik, chcę móc zarejestrować konto i uzupełnić swój profil o dane firmy, specjalizacje i portfolio, aby zbudować zaufanie klientów.
- Kryteria akceptacji:
  - Formularz rejestracji wymaga podania danych firmy (w tym NIP).
  - W panelu profilu mogę dodać listę moich specjalizacji (np. stoły, szafy, kuchnie).
  - Mogę wgrać minimum 5 zdjęć moich poprzednich prac do portfolio.
  - Profil nie będzie publiczny, dopóki nie uzupełnię wszystkich wymaganych pól.

- ID: US-010
- Tytuł: Przeglądanie rynku projektów
- Opis: Jako rzemieślnik, chcę móc przeglądać listę dostępnych projektów, aby znaleźć zlecenia pasujące do moich umiejętności.
- Kryteria akceptacji:
  - Mam dostęp do strony "Marketplace" z listą wszystkich otwartych projektów.
  - Widzę kluczowe informacje o projekcie: obraz, materiał, rozmiar, budżet.
  - Mogę filtrować projekty po kategorii lub materiale.

- ID: US-011
- Tytuł: Składanie propozycji do projektu
- Opis: Jako rzemieślnik, chcę móc złożyć szczegółową propozycję do wybranego projektu, zawierającą wycenę i wstępną specyfikację.
- Kryteria akceptacji:
  - Na stronie projektu mogę otworzyć formularz składania propozycji.
  - Formularz wymaga podania kwoty wyceny w PLN.
  - Formularz wymaga załączenia pliku (np. PDF, JPG) ze szkicem lub specyfikacją.
  - Po wysłaniu propozycji, klient otrzymuje powiadomienie.

- ID: US-012
- Tytuł: Oczekiwanie na akceptację i realizacja
- Opis: Jako rzemieślnik, po złożeniu propozycji, chcę otrzymać powiadomienie, gdy klient ją zaakceptuje, a następnie móc się z nim komunikować w celu realizacji.
- Kryteria akceptacji:
  - Otrzymuję powiadomienie e-mail/w aplikacji o akceptacji mojej propozycji.
  - Na stronie projektu aktywuje się czat do komunikacji z klientem.
  - Po wykonaniu mebla, mogę oznaczyć projekt jako "Zakończony".

- ID: US-013
- Tytuł: Otrzymanie oceny
- Opis: Jako rzemieślnik, po zakończonym projekcie, chcę móc wystawić ocenę klientowi i zobaczyć ocenę, którą on mi wystawił.
- Kryteria akceptacji:
  - Po obustronnym potwierdzeniu zakończenia, pojawia się formularz oceny klienta.
  - Moja średnia ocen jest aktualizowana i widoczna na moim publicznym profilu.

## 6. Metryki sukcesu

| Kryterium                          | Definicja                                                                          | Sposób Mierzenia                                                                                              | Cel dla MVP (pierwsze 3 miesiące)                           |
| :--------------------------------- | :--------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------- |
| Główny KPI: Finalizacja Transakcji | Liczba projektów, dla których klient zaakceptował propozycję rzemieślnika.         | Zliczanie liczby projektów, których status zmienił się na "W realizacji" ("Projekt Rozpoczęty").              | 20+ sfinalizowanych transakcji miesięcznie.                 |
| Jakość Projektów                   | Procent opublikowanych projektów, które przyciągają zainteresowanie rzemieślników. | Stosunek liczby projektów z co najmniej jedną propozycją w ciągu 7 dni do całkowitej liczby nowych projektów. | 60% projektów otrzymuje co najmniej jedną ofertę.           |
| Wartość Biznesowa                  | Potencjał monetyzacyjny platformy.                                                 | Suma wartości (PLN) wszystkich zaakceptowanych wycen w danym okresie.                                         | Śledzenie metryki w celu przygotowania modelu prowizyjnego. |
| Zaangażowanie w AI                 | Skuteczność narzędzia AI jako punktu wyjścia do tworzenia projektów.               | Procent zapisanych obrazów AI, które zostały wykorzystane do stworzenia ogłoszenia.                           | 25% zapisanych obrazów przekształconych w projekty.         |
| Aktywność Rzemieślników            | Zaangażowanie bazy rzemieślników na platformie.                                    | Średnia liczba propozycji składanych przez aktywnego rzemieślnika miesięcznie.                                | Średnio 3+ propozycji na aktywnego rzemieślnika.            |
