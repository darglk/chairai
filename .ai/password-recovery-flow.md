# Diagram Przepływu - Odzyskiwanie Hasła

## Szczegółowy Flow Procesu

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SCENARIUSZ: Resetowanie Hasła                     │
└──────────────────────────────────────────────────────────────────────┘

FAZA 1: Inicjacja Resetowania
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User                    Frontend                  API                  Supabase
  │                        │                       │                       │
  ├─> Wchodzi na           │                       │                       │
  │   /password-recovery   │                       │                       │
  │                        │                       │                       │
  ├─> Wpisuje email        │                       │                       │
  │   "user@example.com"   │                       │                       │
  │                        │                       │                       │
  ├─> Klika               │                       │                       │
  │   "Wyślij link"        │                       │                       │
  │                        │                       │                       │
  │                        ├─> POST                │                       │
  │                        │   /api/auth/          │                       │
  │                        │   password-recovery   │                       │
  │                        │   {email: "..."}      │                       │
  │                        │                       │                       │
  │                        │                       ├─> Validate Zod       │
  │                        │                       │   PasswordRecovery    │
  │                        │                       │   Schema ✓           │
  │                        │                       │                       │
  │                        │                       ├─> resetPassword       │
  │                        │                       │   ForEmail()          │
  │                        │                       │   ─────────────────> │
  │                        │                       │                       │
  │                        │                       │                  ┌────┴────┐
  │                        │                       │                  │ Sprawdza│
  │                        │                       │                  │ czy user│
  │                        │                       │                  │ istnieje│
  │                        │                       │                  └────┬────┘
  │                        │                       │                       │
  │                        │                       │                       ├─> Jeśli TAK:
  │                        │                       │                       │   Wysyła email
  │                        │                       │                       │   z linkiem
  │                        │                       │                       │
  │                        │                       │   <─────────────────  │
  │                        │                       │   { success }         │
  │                        │                       │                       │
  │                        │   <─ 200 OK           │                       │
  │                        │   { success: true,    │                       │
  │                        │     message: "..." }  │                       │
  │                        │                       │                       │
  │  <─ Komunikat sukcesu  │                       │                       │
  │  (zawsze ten sam!)     │                       │                       │
  │                        │                       │                       │


FAZA 2: Email i Callback
━━━━━━━━━━━━━━━━━━━━━━━━━

User                    Email                    Callback API          Supabase
  │                        │                       │                       │
  │  <─────────────────────┤                       │                       │
  │   📧 Email od Supabase │                       │                       │
  │   "Kliknij aby        │                       │                       │
  │    zresetować hasło"   │                       │                       │
  │                        │                       │                       │
  │   Link zawiera:        │                       │                       │
  │   /api/auth/callback   │                       │                       │
  │   ?code=ABC123XYZ      │                       │                       │
  │   &type=recovery       │                       │                       │
  │                        │                       │                       │
  ├─> Klika link          │                       │                       │
  │                        │                       │                       │
  │                        │         GET /api/auth/callback                │
  │                        │         ?code=ABC123&type=recovery            │
  │                        │         ──────────────>                       │
  │                        │                       │                       │
  │                        │                       ├─> Pobiera code       │
  │                        │                       │   z URL params       │
  │                        │                       │                       │
  │                        │                       ├─> exchangeCode        │
  │                        │                       │   ForSession(code)    │
  │                        │                       │   ─────────────────> │
  │                        │                       │                       │
  │                        │                       │                  ┌────┴────┐
  │                        │                       │                  │Weryfikuje│
  │                        │                       │                  │   code   │
  │                        │                       │                  │ Tworzy   │
  │                        │                       │                  │  sesję   │
  │                        │                       │                  └────┬────┘
  │                        │                       │                       │
  │                        │                       │   <─────────────────  │
  │                        │                       │   {                   │
  │                        │                       │     session: {        │
  │                        │                       │       access_token,   │
  │                        │                       │       refresh_token   │
  │                        │                       │     },                │
  │                        │                       │     user: {...}       │
  │                        │                       │   }                   │
  │                        │                       │                       │
  │                        │                       ├─> Set Cookies:       │
  │                        │                       │   sb-access-token    │
  │                        │                       │   sb-refresh-token   │
  │                        │                       │                       │
  │                        │                       ├─> Redirect 302       │
  │                        │                       │   Location:          │
  │  <──────────────────────────────────────────── │   /password-reset    │
  │   Przekierowanie                               │                       │
  │   + cookies ustawione                          │                       │
  │                        │                       │                       │


FAZA 3: Ustawianie Nowego Hasła
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User                    Frontend                  API                  Supabase
  │                        │                       │                       │
  ├─> Wchodzi na           │                       │                       │
  │   /password-reset      │                       │                       │
  │   (ma cookies z        │                       │                       │
  │    kroku 2)            │                       │                       │
  │                        │                       │                       │
  ├─> Wpisuje:             │                       │                       │
  │   password:            │                       │                       │
  │   "NewPass123"         │                       │                       │
  │   confirmPassword:     │                       │                       │
  │   "NewPass123"         │                       │                       │
  │                        │                       │                       │
  ├─> Klika               │                       │                       │
  │   "Zresetuj hasło"     │                       │                       │
  │                        │                       │                       │
  │                        ├─> Client-side         │                       │
  │                        │   validation:         │                       │
  │                        │   • min 8 chars ✓    │                       │
  │                        │   • passwords match ✓│                       │
  │                        │                       │                       │
  │                        ├─> POST                │                       │
  │                        │   /api/auth/          │                       │
  │                        │   password-reset      │                       │
  │                        │   { password,         │                       │
  │                        │     confirmPassword } │                       │
  │                        │   + Cookies           │                       │
  │                        │                       │                       │
  │                        │                       ├─> Validate Zod       │
  │                        │                       │   PasswordReset      │
  │                        │                       │   Schema ✓           │
  │                        │                       │                       │
  │                        │                       ├─> updateUser({        │
  │                        │                       │     password         │
  │                        │                       │   })                  │
  │                        │                       │   + session cookies   │
  │                        │                       │   ─────────────────> │
  │                        │                       │                       │
  │                        │                       │                  ┌────┴────┐
  │                        │                       │                  │Sprawdza  │
  │                        │                       │                  │sesję z   │
  │                        │                       │                  │cookies   │
  │                        │                       │                  │          │
  │                        │                       │                  │Hashuje   │
  │                        │                       │                  │nowe hasło│
  │                        │                       │                  │          │
  │                        │                       │                  │Zapisuje  │
  │                        │                       │                  │do bazy   │
  │                        │                       │                  └────┬────┘
  │                        │                       │                       │
  │                        │                       │   <─────────────────  │
  │                        │                       │   {                   │
  │                        │                       │     user: {...}       │
  │                        │                       │   }                   │
  │                        │                       │                       │
  │                        │                       ├─> getSession()       │
  │                        │                       │   ─────────────────> │
  │                        │                       │   <─────────────────  │
  │                        │                       │   { session }         │
  │                        │                       │                       │
  │                        │                       ├─> Update cookies     │
  │                        │                       │   (nowa sesja)       │
  │                        │                       │                       │
  │                        │   <─ 200 OK           │                       │
  │                        │   { success: true,    │                       │
  │                        │     message: "...",   │                       │
  │                        │     user: {...} }     │                       │
  │                        │                       │                       │
  │  <─ Komunikat sukcesu  │                       │                       │
  │  "Hasło zmienione"     │                       │                       │
  │                        │                       │                       │
  │  <─ Przekierowanie     │                       │                       │
  │  po 2s → /login        │                       │                       │
  │                        │                       │                       │
  │                        │                       │                       │
  ├─> Może zalogować       │                       │                       │
  │   się nowym hasłem     │                       │                       │
  │                        │                       │                       │
```

## Scenariusze Błędów

### Błąd 1: Wygasły Link Resetujący

```
User klika stary link (>1h)
        │
        ▼
GET /api/auth/callback?code=OLD_CODE
        │
        ├─> exchangeCodeForSession(OLD_CODE)
        │
        ├─> Error: "Token expired"
        │
        ▼
Redirect → /login?error=Link+resetujący+wygasł
        │
        ▼
Komunikat błędu wyświetlony na /login
```

### Błąd 2: Reset Bez Sesji

```
User wchodzi bezpośrednio na /password-reset
(bez przejścia przez callback)
        │
        ▼
Wypełnia formularz
        │
        ▼
POST /api/auth/password-reset
+ Brak cookies lub nieprawidłowe
        │
        ├─> updateUser({ password })
        │
        ├─> Error: "No session"
        │
        ▼
Response 400:
{
  error: {
    code: "SESSION_ERROR",
    message: "Link resetujący wygasł..."
  }
}
        │
        ▼
Komunikat błędu wyświetlony w formularzu
```

### Błąd 3: Walidacja Hasła

```
User wpisuje hasło: "abc"
        │
        ▼
Client-side validation
        │
        ├─> length < 8
        │
        ▼
Error: "Hasło musi mieć co najmniej 8 znaków"
(nie wysyła do API)

────────────────────────────────

User wpisuje:
- password: "Password123"
- confirmPassword: "Password456"
        │
        ▼
Client-side validation
        │
        ├─> passwords !== confirmPasswords
        │
        ▼
Error: "Hasła nie są zgodne"
(nie wysyła do API)

────────────────────────────────

User obejdzie client-side i wyśle:
{ password: "abc" }
        │
        ▼
POST /api/auth/password-reset
        │
        ├─> Zod validation
        │
        ├─> Error: min 8 chars
        │
        ▼
Response 422:
{
  error: {
    code: "VALIDATION_ERROR",
    details: {
      password: "Hasło musi mieć co najmniej 8 znaków"
    }
  }
}
```

## Cookies i Sesja

```
┌─────────────────────────────────────────────────────┐
│  Lifecycle Cookies w Procesie Resetowania           │
└─────────────────────────────────────────────────────┘

PRZED resetem:
  Browser: (brak cookies)

PO callback (krok 2):
  Browser:
    ├─ sb-access-token: "eyJ..." (7 dni, HttpOnly)
    └─ sb-refresh-token: "v1..." (30 dni, HttpOnly)

  Typ sesji: TYMCZASOWA (do resetu hasła)

PO reset hasła (krok 3):
  Browser:
    ├─ sb-access-token: "eyJ..." (NOWY token, 7 dni)
    └─ sb-refresh-token: "v1..." (NOWY token, 30 dni)

  Typ sesji: PEŁNA (normalnie zalogowany user)

OPCJA A: Auto-login po resecie
  → User ma pełną sesję
  → Może od razu korzystać z app
  → Cookies już ustawione

OPCJA B: Manual login po resecie
  → Cookies czyszczone po resecie
  → User przekierowany do /login
  → Musi zalogować się nowym hasłem

  (Obecna implementacja: OPCJA A)
```
