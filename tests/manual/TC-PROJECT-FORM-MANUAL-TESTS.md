# Plan testów manualnych - Formularz tworzenia projektu

## Przygotowanie środowiska testowego

### Wymagania wstępne:

1. Serwer deweloperski uruchomiony (`npm run dev`)
2. Baza danych Supabase z danymi testowymi (kategorie, materiały)
3. Użytkownik testowy z rolą "client" zalogowany w systemie
4. Co najmniej jeden wygenerowany obraz dostępny w galerii

### Dane testowe:

- **Kategorie**: Krzesła, Stoły, Szafy, Komody
- **Materiały**: Drewno, Metal, Plastik, Tkanina

---

## Scenariusze testowe

### TC-01: Pozytywny scenariusz - Pomyślne utworzenie projektu

**Cel**: Zweryfikować, że użytkownik może pomyślnie utworzyć projekt z wszystkimi danymi

**Kroki**:

1. Zaloguj się jako klient
2. Przejdź do galerii wygenerowanych obrazów
3. Wybierz obraz i kliknij "Utwórz projekt" (lub przejdź bezpośrednio pod `/projects/new/{imageId}`)
4. Sprawdź, czy obraz jest wyświetlany
5. Wybierz kategorię z listy (np. "Krzesła")
6. Wybierz materiał z listy (np. "Drewno")
7. Wpisz wymiary: "120cm x 80cm x 75cm"
8. Wpisz zakres budżetu: "2000-3000 PLN"
9. Kliknij "Utwórz projekt"

**Oczekiwany rezultat**:

- Formularz jest poprawnie załadowany z danymi obrazu
- Wszystkie pola są dostępne i responsywne
- Po kliknięciu przycisku wyświetla się wskaźnik ładowania
- Po sukcesie następuje przekierowanie na stronę projektu
- Projekt jest widoczny w systemie z wszystkimi wprowadzonymi danymi

---

### TC-02: Walidacja pól wymaganych - Kategoria

**Cel**: Zweryfikować walidację pola kategorii

**Kroki**:

1. Otwórz formularz tworzenia projektu
2. Pozostaw pole "Kategoria" puste
3. Wybierz materiał
4. Kliknij na następne pole (trigger blur)
5. Spróbuj wysłać formularz

**Oczekiwany rezultat**:

- Pod polem kategorii pojawia się komunikat: "Kategoria jest wymagana"
- Przycisk "Utwórz projekt" jest aktywny, ale wysyłanie jest blokowane
- Komunikat o błędzie znika po wybraniu kategorii

---

### TC-03: Walidacja pól wymaganych - Materiał

**Cel**: Zweryfikować walidację pola materiału

**Kroki**:

1. Otwórz formularz tworzenia projektu
2. Wybierz kategorię
3. Pozostaw pole "Materiał" puste
4. Kliknij na następne pole (trigger blur)
5. Spróbuj wysłać formularz

**Oczekiwany rezultat**:

- Pod polem materiału pojawia się komunikat: "Materiał jest wymagany"
- Wysyłanie formularza jest zablokowane
- Komunikat o błędzie znika po wyborze materiału

---

### TC-04: Walidacja pola wymiary - Minimalna długość

**Cel**: Zweryfikować walidację minimalnej długości dla pola wymiary

**Kroki**:

1. Otwórz formularz tworzenia projektu
2. Wybierz kategorię i materiał
3. Wpisz wymiary: "123" (mniej niż 5 znaków)
4. Kliknij poza pole (trigger blur)

**Oczekiwany rezultat**:

- Pojawia się komunikat: "Wymiary muszą mieć co najmniej 5 znaków"
- Wysyłanie formularza jest zablokowane
- Po wpisaniu poprawnych wymiarów (≥5 znaków) błąd znika

---

### TC-05: Pola opcjonalne - Brak wymiarów i budżetu

**Cel**: Zweryfikować, że pola opcjonalne mogą być puste

**Kroki**:

1. Otwórz formularz tworzenia projektu
2. Wybierz kategorię: "Stoły"
3. Wybierz materiał: "Metal"
4. Pozostaw pola "Wymiary" i "Zakres budżetu" puste
5. Kliknij "Utwórz projekt"

**Oczekiwany rezultat**:

- Formularz zostaje pomyślnie wysłany
- Projekt jest utworzony bez wymiarów i budżetu
- Następuje przekierowanie na stronę projektu

---

### TC-06: Anulowanie formularza

**Cel**: Zweryfikować działanie przycisku anuluj

**Kroki**:

1. Otwórz formularz tworzenia projektu
2. Częściowo wypełnij formularz (np. wybierz kategorię)
3. Kliknij przycisk "Anuluj"

**Oczekiwany rezultat**:

- Użytkownik jest przekierowany do poprzedniej strony (galeria)
- Dane formularza nie są zapisane

---

### TC-07: Konflikt - Obraz już użyty (409)

**Cel**: Zweryfikować obsługę błędu, gdy obraz został już wykorzystany

**Przygotowanie**:

1. Utwórz projekt z dowolnym obrazem
2. Zapisz URL tego formularza (`/projects/new/{imageId}`)
3. Przejdź ponownie pod ten URL

**Kroki**:

1. Spróbuj wypełnić formularz dla już wykorzystanego obrazu
2. Wybierz kategorię i materiał
3. Kliknij "Utwórz projekt"

**Oczekiwany rezultat**:

- Wyświetla się komunikat błędu: "Ten obraz został już wykorzystany w innym projekcie."
- Użytkownik pozostaje na stronie formularza
- Może anulować i wrócić do galerii

**Alternatywne zachowanie** (jeśli zaimplementowano):

- Użytkownik jest automatycznie przekierowany do galerii, jeśli obraz ma `is_used = true`

---

### TC-08: Błąd autoryzacji - Nieautoryzowany dostęp (401)

**Cel**: Zweryfikować przekierowanie dla niezalogowanego użytkownika

**Kroki**:

1. Wyloguj się z systemu
2. Przejdź bezpośrednio pod URL: `/projects/new/{dowolny-uuid}`

**Oczekiwany rezultat**:

- Użytkownik jest automatycznie przekierowany na stronę logowania (`/login`)

---

### TC-09: Błąd serwera (500)

**Cel**: Zweryfikować obsługę błędów serwera

**Symulacja**:

- Wyłącz połączenie z bazą danych lub użyj niepoprawnego URL API

**Kroki**:

1. Otwórz formularz tworzenia projektu
2. Wypełnij wszystkie wymagane pola
3. Kliknij "Utwórz projekt"

**Oczekiwany rezultat**:

- Wyświetla się komunikat błędu: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później."
- Użytkownik może spróbować ponownie

---

### TC-10: Błąd sieci - Brak połączenia internetowego

**Cel**: Zweryfikować obsługę utraty połączenia

**Symulacja**:

- Wyłącz połączenie internetowe przed wysłaniem formularza

**Kroki**:

1. Otwórz formularz tworzenia projektu
2. Wypełnij wszystkie wymagane pola
3. Wyłącz połączenie internetowe
4. Kliknij "Utwórz projekt"

**Oczekiwany rezultat**:

- Wyświetla się komunikat: "Wystąpił błąd połączenia. Sprawdź połączenie internetowe i spróbuj ponownie."
- Po przywróceniu połączenia użytkownik może ponownie wysłać formularz

---

### TC-11: Responsywność - Widok mobilny

**Cel**: Zweryfikować poprawne wyświetlanie na urządzeniach mobilnych

**Kroki**:

1. Otwórz formularz na urządzeniu mobilnym lub użyj DevTools (Responsive Mode)
2. Przetestuj widoki: 320px, 375px, 768px, 1024px
3. Sprawdź czytelność wszystkich elementów
4. Wypełnij i wyślij formularz

**Oczekiwany rezultat**:

- Formularz jest responsywny i czytelny na wszystkich rozdzielczościach
- Przyciski są ułożone w kolumnie na małych ekranach
- Wszystkie interakcje działają poprawnie
- Obraz zachowuje proporcje (aspect-ratio: 16:9)

---

### TC-12: Dostępność (Accessibility)

**Cel**: Zweryfikować dostępność formularza dla czytników ekranu

**Kroki**:

1. Użyj czytnika ekranu (np. VoiceOver, NVDA)
2. Nawiguj po formularzu używając klawiatury (Tab, Shift+Tab)
3. Wypełnij formularz tylko za pomocą klawiatury
4. Wywołaj błędy walidacji i sprawdź, czy są odczytywane

**Oczekiwany rezultat**:

- Wszystkie pola mają odpowiednie etykiety (labels)
- Błędy walidacji są ogłaszane przez aria-live
- Wskaźnik wymaganych pól (\*) ma aria-label="wymagane"
- Można nawigować i wypełnić formularz tylko klawiaturą
- Focus jest widoczny na wszystkich elementach interaktywnych

---

### TC-13: Stan ładowania - Blokada UI podczas wysyłania

**Cel**: Zweryfikować, że UI jest zablokowany podczas wysyłania

**Kroki**:

1. Otwórz formularz tworzenia projektu
2. Wypełnij wszystkie wymagane pola
3. Kliknij "Utwórz projekt"
4. Podczas ładowania spróbuj:
   - Kliknąć ponownie "Utwórz projekt"
   - Kliknąć "Anuluj"
   - Edytować pola formularza

**Oczekiwany rezultat**:

- Przycisk "Utwórz projekt" pokazuje spinner i tekst "Tworzenie..."
- Przycisk "Anuluj" jest nieaktywny
- Pola formularza pozostają aktywne (użytkownik może je widzieć)
- Nie można wysłać formularza wielokrotnie

---

### TC-14: Walidacja po stronie serwera - Niepoprawne UUID

**Cel**: Zweryfikować obsługę błędów walidacji z backendu

**Symulacja**:

- Użyj DevTools do modyfikacji payloadu lub zmień wartość category_id na niepoprawne UUID

**Kroki**:

1. Otwórz DevTools → Network
2. Wypełnij formularz
3. Przed wysłaniem ustaw breakpoint lub użyj narzędzia do przechwytywania żądań
4. Zmień `category_id` na niepoprawną wartość (np. "invalid-uuid")
5. Wyślij formularz

**Oczekiwany rezultat**:

- Wyświetla się komunikat błędu z backendu
- Błąd jest przypisany do odpowiedniego pola (jeśli backend zwraca szczegóły)
- Użytkownik może poprawić dane i wysłać ponownie

---

## Checklista finalna

Po wykonaniu wszystkich testów, sprawdź:

- [ ] Wszystkie pola wymagane są poprawnie walidowane
- [ ] Pola opcjonalne działają bez błędów
- [ ] Komunikaty o błędach są czytelne i pomocne
- [ ] Formularz jest responsywny (mobile, tablet, desktop)
- [ ] Dostępność (keyboard navigation, screen readers)
- [ ] Obsługa wszystkich statusów HTTP (200, 400, 401, 403, 409, 500)
- [ ] Stan ładowania blokuje wielokrotne wysyłanie
- [ ] Przekierowania działają poprawnie
- [ ] Obrazy są prawidłowo wyświetlane
- [ ] Integracja z API jest pełna i stabilna

---

## Raporty błędów

### Szablon zgłoszenia błędu:

**Tytuł**: [Krótki opis problemu]

**Test Case**: TC-XX

**Kroki do reprodukcji**:

1. ...
2. ...

**Oczekiwany rezultat**: ...

**Faktyczny rezultat**: ...

**Zrzuty ekranu**: [jeśli dotyczy]

**Środowisko**:

- Przeglądarka: ...
- Rozdzielczość: ...
- System: ...

**Priorytet**: Krytyczny / Wysoki / Średni / Niski
