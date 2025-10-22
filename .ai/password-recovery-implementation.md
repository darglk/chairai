# Implementacja Odzyskiwania Hasła - ChairAI

## 📋 Podsumowanie

Został zaimplementowany pełny proces odzyskiwania i resetowania hasła z wykorzystaniem Supabase Auth. Proces składa się z trzech głównych kroków:

1. **Password Recovery** - użytkownik podaje email i otrzymuje link resetujący
2. **Callback** - obsługa linku z emaila i weryfikacja tokenu
3. **Password Reset** - ustawienie nowego hasła

## 🔄 Przepływ Procesu

```
┌─────────────────────────────────────────────────────────────┐
│  KROK 1: Żądanie Resetowania Hasła                          │
└─────────────────────────────────────────────────────────────┘
                           │
   User wchodzi na /password-recovery
   Wypełnia formularz z emailem
                           │
                           ▼
        POST /api/auth/password-recovery
        { email: "user@example.com" }
                           │
                           ▼
         Supabase Auth → resetPasswordForEmail()
                           │
                           ▼
        Email wysłany z linkiem resetującym
        (zawiera code + type=recovery)
                           │
                           ▼
   Użytkownik otrzymuje:
   https://yourapp.com/api/auth/callback?code=XXX&type=recovery

┌─────────────────────────────────────────────────────────────┐
│  KROK 2: Kliknięcie Linku z Emaila                          │
└─────────────────────────────────────────────────────────────┘
                           │
   User klika link w emailu
                           │
                           ▼
        GET /api/auth/callback?code=XXX&type=recovery
                           │
                           ▼
        Supabase → exchangeCodeForSession(code)
        (tworzy tymczasową sesję)
                           │
                           ▼
        Ustawia session cookies
                           │
                           ▼
        Redirect → /password-reset

┌─────────────────────────────────────────────────────────────┐
│  KROK 3: Ustawienie Nowego Hasła                            │
└─────────────────────────────────────────────────────────────┘
                           │
   User wchodzi na /password-reset
   (ma już tymczasową sesję z cookies)
                           │
                           ▼
   Wypełnia formularz: nowe hasło + potwierdzenie
                           │
                           ▼
        POST /api/auth/password-reset
        { password: "newpass", confirmPassword: "newpass" }
                           │
                           ▼
        Supabase → updateUser({ password })
        (wymaga aktywnej sesji)
                           │
                           ▼
        Hasło zaktualizowane + nowa sesja utworzona
                           │
                           ▼
        Ustawia nowe session cookies (auto-login)
                           │
                           ▼
        Redirect → /login (lub automatyczne zalogowanie)
```

## 🏗️ Struktura Implementacji

### 1. API Endpoints

#### `POST /api/auth/password-recovery`

**Plik:** `src/pages/api/auth/password-recovery.ts`

**Odpowiedzialności:**

- Walidacja adresu email (Zod)
- Wywołanie `supabase.auth.resetPasswordForEmail()`
- Zawsze zwraca sukces (zapobiega enumeracji emaili)

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (zawsze 200):**

```json
{
  "success": true,
  "message": "Jeśli konto istnieje, link do resetowania hasła został wysłany..."
}
```

**Bezpieczeństwo:**

- Zawsze zwraca sukces, nawet jeśli email nie istnieje
- Zapobiega to atakom enumeracyjnym (sprawdzaniu, czy email istnieje w bazie)

#### `POST /api/auth/password-reset`

**Plik:** `src/pages/api/auth/password-reset.ts`

**Odpowiedzialności:**

- Walidacja nowego hasła (Zod - min. 8 znaków, regex)
- Wywołanie `supabase.auth.updateUser({ password })`
- Automatyczne zalogowanie użytkownika (ustawienie cookies)

**Request:**

```json
{
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Hasło zostało pomyślnie zaktualizowane.",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Możliwe błędy:**

- `400` - Link wygasł lub sesja nieważna
- `422` - Błąd walidacji (hasła się nie zgadzają, za krótkie, etc.)
- `500` - Błąd serwera

#### `GET /api/auth/callback`

**Plik:** `src/pages/api/auth/callback.ts`

**Odpowiedzialności:**

- Obsługa callbacków z Supabase (email verification, password reset, OAuth)
- Wymiana kodu autoryzacyjnego na sesję
- Ustawienie session cookies
- Przekierowanie na odpowiednią stronę

**URL Parameters:**

- `code` - kod autoryzacyjny z Supabase (required)
- `type` - typ callbacku (recovery, signup, etc.)
- `error` - opcjonalny błąd z Supabase
- `error_description` - opis błędu

**Logika przekierowań:**

```typescript
if (type === "recovery") {
  // Password reset flow
  redirect("/password-reset");
} else {
  // Email verification, OAuth, etc.
  redirect("/");
}
```

### 2. Frontend Components

#### `PasswordRecoveryForm.tsx`

**Plik:** `src/components/auth/PasswordRecoveryForm.tsx`

**Funkcjonalność:**

- Formularz z jednym polem: email
- Walidacja client-side (format email)
- Wywołanie API: `POST /api/auth/password-recovery`
- Wyświetlenie komunikatu sukcesu (zawsze, dla bezpieczeństwa)
- Obsługa błędów walidacji z serwera (422)

**Stany:**

```typescript
{
  email: string,
  loading: boolean,
  success: boolean,
  error: string | null,
  fieldErrors: { email?: string }
}
```

#### `PasswordResetForm.tsx`

**Plik:** `src/components/auth/PasswordResetForm.tsx`

**Funkcjonalność:**

- Formularz z dwoma polami: password, confirmPassword
- Walidacja client-side:
  - Hasło min. 8 znaków
  - Hasła muszą się zgadzać
- Wywołanie API: `POST /api/auth/password-reset`
- Automatyczne przekierowanie do `/login` po sukcesie (2s)
- Obsługa szczegółowych błędów walidacji z serwera

**Stany:**

```typescript
{
  password: string,
  confirmPassword: string,
  loading: boolean,
  success: boolean,
  error: string | null,
  fieldErrors: {
    password?: string,
    confirmPassword?: string
  }
}
```

### 3. Strony Astro

#### `/password-recovery`

**Plik:** `src/pages/password-recovery.astro`

- Renderuje `PasswordRecoveryForm`
- Link powrotny do `/login`
- Obsługa przekierowania zalogowanych przez middleware

#### `/password-reset`

**Plik:** `src/pages/password-reset.astro`

- Renderuje `PasswordResetForm`
- Wyświetla błędy z URL (jeśli callback się nie powiódł)
- Wymaga aktywnej sesji z callbacku

#### `/login` (zaktualizowana)

**Plik:** `src/pages/login.astro`

- Dodano wyświetlanie błędów z URL
- Obsługa przekierowań z `/api/auth/callback`

## 🔐 Bezpieczeństwo

### 1. Zapobieganie Enumeracji Emaili

**Problem:** Atakujący może sprawdzać, czy dany email istnieje w bazie.

**Rozwiązanie:**

```typescript
// ❌ ZŁE - ujawnia czy email istnieje
if (userNotFound) {
  return { error: "Email nie istnieje" };
}
return { success: "Email wysłany" };

// ✅ DOBRE - zawsze zwraca sukces
return {
  success: "Jeśli konto istnieje, email został wysłany",
};
```

### 2. Walidacja Sesji

**Endpoint `/api/auth/password-reset` wymaga:**

- Aktywnej sesji z cookies (ustawionej przez callback)
- Sesja musi być świeża (z linku emailowego)
- Automatyczna walidacja przez Supabase

### 3. Link Resetujący

**Bezpieczeństwo linku:**

- Jednorazowy kod (code) w URL
- Wygasa po określonym czasie (domyślnie 1h w Supabase)
- Nie można użyć dwukrotnie tego samego kodu
- HTTPS wymagane w produkcji

### 4. Walidacja Hasła

**Wymagania (Zod Schema):**

```typescript
password: z.string()
  .min(8, "Hasło musi mieć co najmniej 8 znaków")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Hasło musi zawierać małą literę, wielką literę i cyfrę");
```

## 🧪 Testowanie

### Test 1: Żądanie Resetowania (Istniejący Email)

**Kroki:**

1. Otwórz `/password-recovery`
2. Wpisz poprawny email z Supabase
3. Kliknij "Wyślij link resetujący"
4. **Oczekiwany wynik:**
   - Komunikat: "Jeśli konto istnieje, link został wysłany..."
   - Email otrzymany w skrzynce
   - Link zawiera `code` i `type=recovery`

### Test 2: Żądanie Resetowania (Nieistniejący Email)

**Kroki:**

1. Otwórz `/password-recovery`
2. Wpisz email, który NIE istnieje
3. Kliknij "Wyślij link resetujący"
4. **Oczekiwany wynik:**
   - Ten sam komunikat sukcesu (zapobiega enumeracji)
   - Brak emaila (oczywiście)

### Test 3: Walidacja Email (Client-Side)

**Kroki:**

1. Wpisz nieprawidłowy email: "test"
2. **Oczekiwany wynik:** "Nieprawidłowy format adresu e-mail"

### Test 4: Callback - Poprawny Link

**Kroki:**

1. Kliknij link z emaila
2. **Oczekiwany wynik:**
   - Przekierowanie na `/password-reset`
   - Cookies `sb-access-token` i `sb-refresh-token` ustawione
   - Brak błędów

### Test 5: Callback - Wygasły Link

**Kroki:**

1. Użyj linku starszego niż 1h
2. **Oczekiwany wynik:**
   - Przekierowanie na `/login?error=...`
   - Komunikat o błędzie wyświetlony

### Test 6: Reset Hasła - Walidacja

**Kroki:**

1. Wpisz hasło: "abc" (za krótkie)
2. **Oczekiwany wynik:** "Hasło musi mieć co najmniej 8 znaków"
3. Wpisz hasło: "password123", potwierdzenie: "password456"
4. **Oczekiwany wynik:** "Hasła nie są zgodne"

### Test 7: Reset Hasła - Sukces

**Kroki:**

1. Po kliknięciu linku z emaila, wejdź na `/password-reset`
2. Wpisz nowe hasło: "NewPassword123"
3. Potwierdź hasło: "NewPassword123"
4. Kliknij "Zresetuj hasło"
5. **Oczekiwany wynik:**
   - Komunikat sukcesu
   - Automatyczne przekierowanie na `/login` po 2s
   - Możliwość zalogowania z nowym hasłem

### Test 8: Reset Hasła - Bez Sesji

**Kroki:**

1. Wejdź bezpośrednio na `/password-reset` (bez callbacku)
2. Spróbuj zresetować hasło
3. **Oczekiwany wynik:**
   - Błąd: "Link resetujący wygasł lub jest nieprawidłowy"

### Test cURL

#### 1. Password Recovery

```bash
curl -X POST http://localhost:3000/api/auth/password-recovery \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

#### 2. Password Reset (wymaga session cookies)

```bash
curl -X POST http://localhost:3000/api/auth/password-reset \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{"password":"NewPassword123","confirmPassword":"NewPassword123"}'
```

## ⚙️ Konfiguracja Supabase

### Email Templates

W panelu Supabase → Authentication → Email Templates skonfiguruj:

**Reset Password Template:**

```html
<h2>Resetowanie hasła</h2>
<p>Otrzymaliśmy prośbę o zresetowanie hasła dla Twojego konta.</p>
<p>Kliknij poniższy link, aby ustawić nowe hasło:</p>
<p><a href="{{ .ConfirmationURL }}">Zresetuj hasło</a></p>
<p>Link wygasa za 1 godzinę.</p>
<p>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>
```

### Redirect URLs

W panelu Supabase → Authentication → URL Configuration:

**Site URL:** `http://localhost:3000` (dev) / `https://yourapp.com` (prod)

**Redirect URLs (whitelist):**

- `http://localhost:3000/api/auth/callback`
- `https://yourapp.com/api/auth/callback`

## 📊 Zgodność z Wymaganiami

Implementacja spełnia wymagania ze specyfikacji technicznej (`auth-spec.md`):

✅ **Password Recovery Endpoint** - `POST /api/auth/password-recovery`
✅ **Password Reset Endpoint** - `POST /api/auth/password-reset`
✅ **Callback Endpoint** - `GET /api/auth/callback`
✅ **Walidacja Zod** - `PasswordRecoverySchema`, `PasswordResetSchema`
✅ **Secure Cookies** - HttpOnly, Secure, SameSite
✅ **Zapobieganie Enumeracji** - zawsze ten sam komunikat
✅ **Automatyczne Logowanie** - po resecie hasła
✅ **Obsługa Błędów** - szczegółowe komunikaty walidacji

## 🚀 Następne Kroki

Moduł odzyskiwania hasła jest kompletny. Pozostałe funkcje do zaimplementowania:

1. **Rejestracja** - `RegisterForm.tsx` + `/api/auth/register`
2. **Weryfikacja Email** - rozszerzenie callbacku
3. **Profile Użytkowników** - rozszerzenie o role (client/artisan)

## 📚 Powiązane Pliki

- `.ai/login-implementation.md` - implementacja logowania
- `.ai/auth-spec.md` - specyfikacja techniczna
- `.ai/prd.md` - wymagania produktowe
- `src/lib/schemas.ts` - schematy walidacji
- `src/lib/api-utils.ts` - pomocnicze funkcje
