# Specyfikacja Techniczna: Moduł Uwierzytelniania ChairAI

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i implementację modułu uwierzytelniania (rejestracja, logowanie, wylogowywanie, odzyskiwanie hasła) dla platformy ChairAI. Specyfikacja jest zgodna z wymaganiami zawartymi w `prd.md` (US-001, US-002, US-003) oraz opiera się na stacku technologicznym zdefiniowanym w `tech-stack.md` (Astro, React, Supabase, TypeScript).

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Struktura Plików i Komponentów

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx         # (Nowy) Formularz logowania w React
│   │   ├── RegisterForm.tsx      # (Nowy) Formularz rejestracji w React
│   │   ├── PasswordRecoveryForm.tsx # (Nowy) Formularz odzyskiwania hasła
│   │   └── PasswordResetForm.tsx   # (Nowy) Formularz resetowania hasła
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       └── label.tsx
├── layouts/
│   └── Layout.astro              # (Aktualizacja) Główny layout aplikacji
├── pages/
│   ├── login.astro               # (Nowa) Strona logowania
│   ├── register.astro            # (Nowa) Strona rejestracji
│   ├── password-recovery.astro   # (Nowa) Strona do inicjowania odzyskiwania hasła
│   ├── password-reset.astro      # (Nowa) Strona do ustawiania nowego hasła
│   └── api/
│       └── auth/
│           ├── login.ts          # (Nowy) Endpoint API do logowania
│           ├── register.ts       # (Nowy) Endpoint API do rejestracji
│           ├── logout.ts         # (Nowy) Endpoint API do wylogowywania
│           ├── password-recovery.ts # (Nowy) Endpoint API do odzyskiwania hasła
│           └── callback.ts       # (Nowy) Endpoint API dla Supabase Auth callback
└── middleware/
    └── index.ts                  # (Aktualizacja) Middleware do obsługi sesji
```

### 2.2. Strony i Layouty (Astro)

#### `src/layouts/Layout.astro` (Aktualizacja)

- **Cel:** Dostosowanie interfejsu w zależności od stanu zalogowania użytkownika.
- **Logika:**
  - Sprawdza obecność danych użytkownika w `Astro.locals.user`.
  - **Stan niezalogowany (non-auth):** Wyświetla w nawigacji przyciski "Zaloguj się" i "Zarejestruj się", kierujące odpowiednio do `/login` i `/register`.
  - **Stan zalogowany (auth):** Ukrywa przyciski logowania/rejestracji. Wyświetla awatar użytkownika lub menu profilowe z opcją "Wyloguj". Przycisk "Wyloguj" będzie formularzem POST kierującym do endpointu `/api/auth/logout`.

#### `src/pages/register.astro` (Nowa)

- **Cel:** Strona z formularzem rejestracji.
- **Struktura:**
  - Używa `Layout.astro`.
  - Renderuje komponent React `<RegisterForm client:load />`.
  - Zawiera nagłówek "Stwórz konto" i link do strony logowania "Masz już konto? Zaloguj się".

#### `src/pages/login.astro` (Nowa)

- **Cel:** Strona z formularzem logowania.
- **Struktura:**
  - Używa `Layout.astro`.
  - Renderuje komponent React `<LoginForm client:load />`.
  - Zawiera nagłówek "Zaloguj się", link do strony rejestracji oraz link "Nie pamiętasz hasła?" kierujący do `/password-recovery`.

#### `src/pages/password-recovery.astro` (Nowa)

- **Cel:** Strona umożliwiająca zainicjowanie procesu resetowania hasła.
- **Struktura:**
  - Renderuje komponent React `<PasswordRecoveryForm client:load />`.

#### `src/pages/password-reset.astro` (Nowa)

- **Cel:** Strona, na którą użytkownik trafia z linku w mailu, aby ustawić nowe hasło.
- **Struktura:**
  - Renderuje komponent React `<PasswordResetForm client:load />`.

### 2.3. Komponenty Interaktywne (React)

Wszystkie formularze będą komponentami React, aby zarządzać stanem, walidacją po stronie klienta i obsługą asynchronicznych zapytań do API.

#### `src/components/auth/RegisterForm.tsx`

- **Odpowiedzialność:** Rejestracja użytkownika.
- **Pola:** `email`, `password`, `confirmPassword`, `accountType` (pole wyboru: "Klient" lub "Rzemieślnik").
- **Walidacja (client-side):**
  - Sprawdzenie, czy wszystkie pola są wypełnione.
  - Walidacja formatu adresu e-mail.
  - Wymaganie minimalnej długości hasła (np. 8 znaków).
  - Sprawdzenie, czy hasła w obu polach są identyczne.
- **Logika:**
  - Po submicie formularza, wysyła zapytanie `POST` do `/api/auth/register` z danymi (`email`, `password`, `accountType`).
  - Obsługuje stany `loading` (blokując przycisk) i `error` (wyświetlając komunikat błędu z API, np. "Użytkownik o tym adresie e-mail już istnieje").
  - Po pomyślnej rejestracji, użytkownik jest automatycznie logowany i przekierowywany na stronę główną (`/`), zgodnie z `US-001`.

#### `src/components/auth/LoginForm.tsx`

- **Odpowiedzialność:** Logowanie użytkownika.
  // ...existing code...
- **Walidacja formularzy:** Komunikaty będą wyświetlane pod odpowiednimi polami (np. "To pole jest wymagane", "Hasła nie są zgodne").
- **Błędy API:** Generyczne komunikaty o błędach będą wyświetlane pod formularzem (np. "Wystąpił błąd serwera. Spróbuj ponownie później.").
  // ...existing code...

### 3.1. Modele Danych (Zod Schemas)

W pliku `src/lib/schemas.ts` (nowy) zdefiniujemy schematy Zod do walidacji danych wejściowych dla każdego endpointu.

- `RegisterSchema`: `email`, `password`, `accountType` (enum: 'client', 'artisan').
- `LoginSchema`: `email`, `password`.
- `PasswordRecoverySchema`: `email`.

### 3.2. Endpointy API

#### `POST /api/auth/register`

- **Logika:**
  1. Parsuje i waliduje ciało zapytania przy użyciu `RegisterSchema`.
  2. Wywołuje funkcję `supabase.auth.signUp()` z `email` i `password`. W opcjach (`data`) przekazuje `accountType`, aby zapisać rolę w metadanych użytkownika.
  3. W przypadku błędu z Supabase (np. użytkownik już istnieje), zwraca status `400` z odpowiednim komunikatem.
  4. Jeśli rejestracja się powiedzie, Supabase automatycznie wyśle e-mail weryfikacyjny (konfiguracja w panelu Supabase).
  5. Loguje użytkownika, ustawiając ciasteczka sesyjne.
  6. Zwraca status `200 OK`.

#### `POST /api/auth/login`

- **Logika:**
  // ...existing code... 3. Jeśli sesja jest ważna, dane użytkownika są dołączane do `Astro.locals.user`. 4. Jeśli sesja wygasła, ale istnieje token odświeżający, middleware próbuje odświeżyć sesję za pomocą `supabase.auth.refreshSession()` i aktualizuje ciasteczka. 5. Jeśli użytkownik próbuje uzyskać dostęp do chronionej strony (np. `/dashboard`) bez ważnej sesji, jest przekierowywany na `/login`. 6. Jeśli zalogowany użytkownik próbuje wejść na `/login` lub `/register`, jest przekierowywany do swojego panelu (np. `/dashboard`).

### 4.3. Renderowanie Server-Side

Dzięki `output: "server"` i adapterowi Node.js, cała logika w middleware i endpointach API będzie wykonywana po stronie serwera, co jest kluczowe dla bezpieczeństwa operacji na sesji i komunikacji z Supabase. Dostęp do `Astro.locals.user` w dowolnym komponencie `.astro` pozwoli na dynamiczne renderowanie treści w zależności od stanu zalogowania.

#### `src/components/auth/LoginForm.tsx`

- **Odpowiedzialność:** Logowanie użytkownika.
- **Pola:** `email`, `password`.
- **Logika:**
  - Po submicie, wysyła zapytanie `POST` do `/api/auth/login`.
  - W przypadku błędu (np. nieprawidłowe dane), wyświetla komunikat "Nieprawidłowy e-mail lub hasło".
  - Po pomyślnym zalogowaniu, strona jest odświeżana lub użytkownik jest przekierowywany do panelu (`/dashboard`).

### 2.4. Scenariusze i Komunikaty Błędów

- **Walidacja formularzy:** Komunikaty będą wyświetlane pod odpowiednimi polami (np. "To pole jest wymagane", "Hasła nie są zgodne").
- **Błędy API:** Generyczne komunikaty o błędach będą wyświetlane pod formularzem (np. "Wystąpił błąd serwera. Spróbuj ponownie później.").
- **Pomyślne akcje:** Po pomyślnym wysłaniu linku do resetowania hasła, zostanie wyświetlony komunikat "Jeśli konto istnieje, link do resetowania hasła został wysłany na Twój adres e-mail."

## 3. Logika Backendowa (Astro API Endpoints)

Endpointy API w Astro będą działać jako warstwa pośrednicząca między frontendem a Supabase Auth. Zapewni to, że klucze `service_role` Supabase nie będą eksponowane po stronie klienta.

### 3.1. Modele Danych (Zod Schemas)

W pliku `src/lib/schemas.ts` (nowy) zdefiniujemy schematy Zod do walidacji danych wejściowych dla każdego endpointu.

- `RegisterSchema`: `email`, `password`.
- `LoginSchema`: `email`, `password`.
- `PasswordRecoverySchema`: `email`.

### 3.2. Endpointy API

#### `POST /api/auth/register`

- **Logika:**
  1. Parsuje i waliduje ciało zapytania przy użyciu `RegisterSchema`.
  2. Wywołuje funkcję `supabase.auth.signUp()` z `email` i `password`.
  3. W przypadku błędu z Supabase (np. użytkownik już istnieje), zwraca status `400` z odpowiednim komunikatem.
  4. Jeśli rejestracja się powiedzie, Supabase automatycznie wyśle e-mail weryfikacyjny (konfiguracja w panelu Supabase).
  5. Zwraca status `200 OK`.

#### `POST /api/auth/login`

- **Logika:**
  1. Parsuje i waliduje ciało zapytania przy użyciu `LoginSchema`.
  2. Wywołuje `supabase.auth.signInWithPassword()` z `email` i `password`.
  3. W przypadku błędu (nieprawidłowe dane), zwraca status `401 Unauthorized`.
  4. Jeśli logowanie się powiedzie, pobiera sesję i ustawia ciasteczka sesyjne za pomocą `Astro.cookies.set()`.
  5. Zwraca status `200 OK`.

#### `POST /api/auth/logout`

- **Logika:**
  1. Wywołuje `supabase.auth.signOut()`.
  2. Usuwa ciasteczka sesyjne za pomocą `Astro.cookies.delete()`.
  3. Przekierowuje użytkownika na stronę główną (`/`).

#### `POST /api/auth/password-recovery`

- **Logika:**
  1. Parsuje i waliduje ciało zapytania przy użyciu `PasswordRecoverySchema`.
  2. Wywołuje `supabase.auth.resetPasswordForEmail()` z podanym adresem e-mail.
  3. Zawsze zwraca status `200 OK`, aby uniemożliwić enumerację użytkowników.

#### `GET /api/auth/callback`

- **Cel:** Obsługa callbacku od Supabase po udanej autoryzacji (np. z linku weryfikacyjnego).
- **Logika:**
  1. Wymienia kod autoryzacyjny na sesję za pomocą `supabase.auth.exchangeCodeForSession()`.
  2. Ustawia ciasteczka sesyjne.
  3. Przekierowuje użytkownika na stronę główną lub do jego panelu.

## 4. System Autentykacji (Integracja z Supabase)

### 4.1. Konfiguracja Supabase

- W pliku `src/db/supabase.client.ts` zostanie skonfigurowany klient Supabase. Będziemy potrzebować dwóch klientów:
  - **Klient publiczny (anon):** Używany po stronie klienta (w komponentach React) do wywoływania API Astro.
  - **Klient administracyjny (service_role):** Używany po stronie serwera (w endpointach API i middleware) do bezpiecznego zarządzania użytkownikami.
- Zmienne środowiskowe `SUPABASE_URL` i `SUPABASE_ANON_KEY` będą używane po stronie klienta, a `SUPABASE_SERVICE_ROLE_KEY` tylko po stronie serwera.

### 4.2. Middleware (`src/middleware/index.ts`)

- **Cel:** Ochrona tras i zarządzanie sesją na poziomie serwera.
- **Logika:**
  1. Na każde żądanie, middleware pobiera token dostępowy i odświeżający z ciasteczek (`Astro.cookies`).
  2. Jeśli tokeny istnieją, wywołuje `supabase.auth.getUser(accessToken)` w celu weryfikacji sesji.
  3. Jeśli sesja jest ważna, dane użytkownika są dołączane do `Astro.locals.user`.
  4. Jeśli sesja wygasła, ale istnieje token odświeżający, middleware próbuje odświeżyć sesję za pomocą `supabase.auth.refreshSession()` i aktualizuje ciasteczka.
  5. Jeśli użytkownik próbuje uzyskać dostęp do chronionej strony (np. `/dashboard`) bez ważnej sesji, jest przekierowywany na `/logowanie`.
  6. Jeśli zalogowany użytkownik próbuje wejść na `/logowanie` lub `/rejestracja`, jest przekierowywany do panelu.

### 4.3. Renderowanie Server-Side

Dzięki `output: "server"` i adapterowi Node.js, cała logika w middleware i endpointach API będzie wykonywana po stronie serwera, co jest kluczowe dla bezpieczeństwa operacji na sesji i komunikacji z Supabase. Dostęp do `Astro.locals.user` w dowolnym komponencie `.astro` pozwoli na dynamiczne renderowanie treści w zależności od stanu zalogowania.
