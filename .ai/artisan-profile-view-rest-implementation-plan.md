# API Endpoint Implementation Plan: GET /api/artisans/me

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia zalogowanemu użytkownikowi z rolą 'artisan' pobranie własnego, pełnego profilu zawodowego. W przeciwieństwie do publicznego endpointu, ten zwraca wszystkie dane profilowe, włączając te oznaczone jako niepubliczne, co jest kluczowe dla zarządzania własnym profilem.

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/artisans/me`
- **Parametry:**
  - **Wymagane:** Brak.
  - **Opcjonalne:** Brak.
- **Nagłówki:**
  - `Authorization: Bearer {access_token}` (Wymagany) - Token sesji uzyskany podczas logowania.
- **Request Body:** Brak.

## 3. Wykorzystywane typy

- **DTO odpowiedzi:** `ArtisanProfileDTO` z `src/types.ts`.
- **DTO błędu:** `ApiErrorDTO` z `src/types.ts`.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):**
  ```json
  {
    "user_id": "uuid",
    "company_name": "Master Woodworks",
    "nip": "1234567890",
    "is_public": false,
    "specializations": [{ "id": "uuid", "name": "Tables" }],
    "portfolio_images": [
      {
        "id": "uuid",
        "image_url": "https://storage.supabase.co/...",
        "created_at": "2025-10-12T10:00:00Z"
      }
    ],
    "average_rating": 4.5,
    "total_reviews": 12,
    "updated_at": "2025-10-12T10:00:00Z"
  }
  ```
- **Odpowiedzi błędów:**
  - `401 Unauthorized`: Nieprawidłowy lub wygasły token.
  - `403 Forbidden`: Użytkownik nie ma roli 'artisan'.
  - `404 Not Found`: Profil rzemieślnika nie został jeszcze utworzony.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera (np. problem z bazą danych).

## 5. Przepływ danych

1.  Żądanie `GET` trafia do endpointu `/api/artisans/me`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje token JWT, pobiera sesję i dane użytkownika, a następnie umieszcza je w `context.locals`.
3.  Handler endpointu (`src/pages/api/artisans/me.ts`) sprawdza, czy `context.locals.user` istnieje i czy jego rola to 'artisan'.
4.  Jeśli walidacja przejdzie pomyślnie, handler wywołuje funkcję `getArtisanProfile(userId)` z serwisu `ArtisanProfileService`.
5.  `ArtisanProfileService` wykonuje zapytanie do bazy danych Supabase, aby pobrać dane z tabel `artisan_profiles`, `artisan_specializations`, `portfolio_images` oraz zagregowane dane z `reviews` dla danego `userId`.
6.  Serwis konstruuje i zwraca obiekt `ArtisanProfileDTO`.
7.  Handler serializuje DTO do formatu JSON i wysyła odpowiedź `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Dostęp jest chroniony przez mechanizm Supabase Auth. Każde żądanie musi zawierać ważny `access_token`.
- **Autoryzacja:** Kluczowym elementem jest weryfikacja roli użytkownika. Handler musi bezwzględnie odrzucić żądania od użytkowników, którzy nie mają roli 'artisan', zwracając status `403 Forbidden`.
- **Kontrola dostępu do danych:** Zapytanie do bazy danych musi być ściśle powiązane z `id` zalogowanego użytkownika (`WHERE user_id = :current_user_id`), aby zapobiec jakiemukolwiek ryzyku wycieku danych innych rzemieślników.

## 7. Obsługa błędów

- Błędy będą obsługiwane zgodnie z wytycznymi `copilot-instructions.md` (early returns, guard clauses).
- Każda ścieżka błędu (np. brak sesji, zła rola, brak profilu) będzie kończyć się wywołaniem `return new Response(...)` z odpowiednim kodem statusu i ciałem w formacie `ApiErrorDTO`.
- Błędy krytyczne (np. błąd połączenia z bazą danych) będą logowane na serwerze i zwracały ogólny błąd `500 Internal Server Error`, aby nie ujawniać szczegółów implementacji.

## 8. Rozważania dotyczące wydajności

- Zapytanie do bazy danych powinno być zoptymalizowane, aby pobrać wszystkie wymagane informacje w jednym lub minimalnej liczbie zapytań. Należy użyć `JOIN` do połączenia tabel `artisan_profiles`, `artisan_specializations` i `specializations`.
- Dane z `portfolio_images` i zagregowane oceny z `reviews` mogą być pobierane w osobnych, ale równoległych zapytaniach, jeśli upraszcza to logikę i nie wpływa negatywnie na wydajność.
- Należy rozważyć indeksowanie kolumny `user_id` w tabeli `artisan_profiles` oraz kluczy obcych w tabelach powiązanych, aby przyspieszyć wyszukiwanie.

## 9. Etapy wdrożenia

1.  **Utworzenie pliku endpointu:** Stwórz plik `src/pages/api/artisans/me.ts`.
2.  **Implementacja handlera `GET`:**
    - Dodaj `export const prerender = false;`.
    - Zaimplementuj handler `GET({ locals }: APIContext)`.
    - Przeprowadź walidację sesji i roli użytkownika z `locals.user`. W przypadku niepowodzenia zwróć `401` lub `403`.
3.  **Utworzenie serwisu:** Stwórz plik `src/lib/services/artisan-profile.service.ts`.
4.  **Implementacja logiki pobierania profilu:**
    - W `artisan-profile.service.ts` stwórz funkcję `getArtisanProfile(userId: string, supabase: SupabaseClient)`.
    - Zaimplementuj w niej zapytanie do Supabase, które pobierze wszystkie dane potrzebne do `ArtisanProfileDTO`. Użyj `select` z `JOIN`ami.
    - Obsłuż przypadek, gdy profil dla danego `userId` nie istnieje (powinno zwrócić `null` lub rzucić dedykowany błąd).
5.  **Integracja handlera z serwisem:**
    - W handlerze `GET` wywołaj nowo utworzoną funkcję serwisową.
    - Jeśli serwis zwróci `null` (profil nie znaleziony), zwróć odpowiedź `404 Not Found`.
    - Jeśli serwis zwróci dane, zwróć odpowiedź `200 OK` z danymi w formacie JSON.
6.  **Obsługa błędów:** Dodaj bloki `try...catch` do obsługi nieoczekiwanych błędów z serwisu lub bazy danych i zwróć `500 Internal Server Error`.
7.  **Testy:** Zaktualizuj lub stwórz testy integracyjne w `tests/integration/api/` weryfikujące:
    - Poprawne pobieranie danych dla autoryzowanego rzemieślnika.
    - Zwracanie błędu `403` dla użytkownika z rolą 'client'.
    - Zwracanie błędu `401` dla niezalogowanego użytkownika.
    - Zwracanie błędu `404` dla rzemieślnika bez utworzonego profilu.
