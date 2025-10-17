# 🏗️ Architektura Modułu Logowania

## Diagram Przepływu Danych

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Browser)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │               /login (login.astro)                           │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │         LoginForm.tsx (React)                        │   │  │
│  │  │                                                      │   │  │
│  │  │  [email] [password] [Zaloguj się]                   │   │  │
│  │  │                                                      │   │  │
│  │  │  1. Client-side validation                          │   │  │
│  │  │  2. POST /api/auth/login                            │   │  │
│  │  │  3. Handle response                                 │   │  │
│  │  │     - 200: redirect to /                            │   │  │
│  │  │     - 422: show field errors                        │   │  │
│  │  │     - 401: show auth error                          │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP POST
                                    │ { email, password }
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MIDDLEWARE (index.ts)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🔍 On Every Request:                                               │
│  ├─ 1. Get cookies (sb-access-token, sb-refresh-token)             │
│  ├─ 2. Validate access token                                       │
│  ├─ 3. If expired: refresh using refresh token                     │
│  ├─ 4. Set context.locals.user                                     │
│  ├─ 5. Check route protection:                                     │
│  │    • /dashboard → requires auth → redirect to /login if not     │
│  │    • /login, /register → redirect to / if authenticated         │
│  └─ 6. Continue to route handler                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  API ENDPOINT (/api/auth/login.ts)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Parse request body                                              │
│     └─> JSON.parse(request.body)                                   │
│                                                                     │
│  2. Validate with Zod (LoginSchema)                                │
│     ├─> email: string, email format                                │
│     ├─> password: string, min 1 char                               │
│     └─> On error: return 422 with field details                    │
│                                                                     │
│  3. Call Supabase Auth ──────────────────────────┐                 │
│     └─> supabase.auth.signInWithPassword()       │                 │
│         ├─> Success: get session                 │                 │
│         └─> Error: return 401 or 400             │                 │
│                                                   │                 │
│  4. Set session cookies                          │                 │
│     ├─> sb-access-token (7 days)                 │                 │
│     └─> sb-refresh-token (30 days)               │                 │
│                                                   │                 │
│  5. Return success response                      │                 │
│     └─> { success: true, user: { id, email } }   │                 │
│                                                   │                 │
└───────────────────────────────────────────────────┼─────────────────┘
                                                    │
                                                    │ Auth Request
                                                    ▼
                              ┌─────────────────────────────────┐
                              │     SUPABASE AUTH               │
                              ├─────────────────────────────────┤
                              │                                 │
                              │  • Validate credentials         │
                              │  • Check user in database       │
                              │  • Generate JWT tokens          │
                              │  • Return session               │
                              │                                 │
                              └─────────────────────────────────┘
```

## Struktura Plików i Odpowiedzialności

```
src/
├── components/
│   └── auth/
│       └── LoginForm.tsx
│           ├─ Zarządza stanem formularza
│           ├─ Walidacja client-side
│           ├─ Wysyła POST do /api/auth/login
│           ├─ Obsługuje błędy (field + global)
│           └─ Przekierowuje po sukcesie
│
├── pages/
│   ├── login.astro
│   │   ├─ Renderuje layout
│   │   ├─ Importuje LoginForm
│   │   └─ Server-side: sprawdza Astro.locals.user
│   │
│   ├── index.astro
│   │   ├─ Wyświetla status zalogowania
│   │   └─ Formularz wylogowania
│   │
│   └── api/
│       └── auth/
│           ├── login.ts
│           │   ├─ POST handler
│           │   ├─ Walidacja Zod
│           │   ├─ Supabase Auth
│           │   ├─ Ustawia cookies
│           │   └─ Zwraca JSON response
│           │
│           └── logout.ts
│               ├─ POST handler
│               ├─ Wylogowanie Supabase
│               ├─ Usuwa cookies
│               └─ Przekierowuje na /
│
├── middleware/
│   └── index.ts
│       ├─ Uruchamia się na każde żądanie
│       ├─ Inicjalizuje Supabase client
│       ├─ Waliduje i odświeża sesję
│       ├─ Populuje context.locals.user
│       ├─ Chroni trasy (/dashboard)
│       └─ Przekierowuje auth routes
│
├── lib/
│   ├── schemas.ts
│   │   ├─ LoginSchema (Zod)
│   │   ├─ RegisterSchema
│   │   ├─ PasswordRecoverySchema
│   │   └─ PasswordResetSchema
│   │
│   └── api-utils.ts
│       ├─ createErrorResponse()
│       ├─ createSuccessResponse()
│       ├─ setSessionCookies()
│       └─ clearSessionCookies()
│
├── db/
│   └── supabase.client.ts
│       └─ Eksportuje klienta Supabase
│
└── env.d.ts
    └─ TypeScript definitions
        ├─ App.Locals.supabase
        └─ App.Locals.user
```

## Flow Wylogowania

```
┌────────────────────┐
│  User clicks       │
│  "Wyloguj się"     │
└─────────┬──────────┘
          │
          │ POST /api/auth/logout
          ▼
┌─────────────────────────────────┐
│  Middleware                     │
│  ├─ Validates cookies           │
│  └─ Passes to endpoint          │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  /api/auth/logout               │
│  ├─ supabase.auth.signOut()     │
│  ├─ clearSessionCookies()       │
│  └─ redirect("/", 302)          │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  Supabase                       │
│  └─ Invalidates session         │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  Browser                        │
│  ├─ Cookies cleared             │
│  ├─ Redirected to /             │
│  └─ User logged out             │
└─────────────────────────────────┘
```

## Flow Odświeżania Sesji

```
Request to any page
        │
        ▼
┌──────────────────────────────────┐
│  Middleware                      │
│  ├─ Get access_token from cookie │
│  └─ supabase.auth.getUser()      │
└─────────┬────────────────────────┘
          │
          ├─── Valid? ───> Set locals.user ───> Continue
          │                                           │
          └─── Expired? ──┐                          │
                          │                          │
                          ▼                          │
          ┌──────────────────────────────┐           │
          │  Get refresh_token           │           │
          │  supabase.auth.refresh()     │           │
          └─────────┬────────────────────┘           │
                    │                                │
                    ├─ Success ──┐                   │
                    │            │                   │
                    │            ▼                   │
                    │  ┌──────────────────────┐     │
                    │  │ Update cookies       │     │
                    │  │ Set locals.user      │     │
                    │  └─────┬────────────────┘     │
                    │        │                      │
                    │        └──> Continue ─────────┘
                    │
                    └─ Fail ──┐
                              │
                              ▼
                    ┌──────────────────┐
                    │ Clear cookies    │
                    │ locals.user=null │
                    └─────┬────────────┘
                          │
                          └──> Continue (as guest)
```

## Security Layers

```
Layer 1: Client-Side Validation (LoginForm.tsx)
  └─ Quick feedback, UX improvement
     ├─ Required fields check
     └─ Email format check

Layer 2: Server-Side Validation (API Endpoint)
  └─ Zod schema validation
     ├─ Type checking
     ├─ Format validation
     └─ Custom rules

Layer 3: Authentication (Supabase)
  └─ Credential verification
     ├─ Password hashing (bcrypt)
     ├─ Rate limiting
     └─ User existence check

Layer 4: Session Management (Middleware)
  └─ Token validation
     ├─ JWT signature verification
     ├─ Expiration check
     └─ Auto-refresh mechanism

Layer 5: Route Protection (Middleware)
  └─ Authorization
     ├─ Protected routes check
     └─ Role-based access (future)
```

## Data Flow - Success Case

```
1. LoginForm.tsx
   { email: "user@example.com", password: "password123" }
                    │
                    ▼
2. POST /api/auth/login
   Zod Validation ✓
                    │
                    ▼
3. Supabase Auth
   signInWithPassword() ✓
                    │
                    ▼
4. Session Created
   {
     access_token: "eyJhbGc...",
     refresh_token: "v1.MQ...",
     user: { id: "uuid", email: "..." }
   }
                    │
                    ▼
5. Set Cookies
   sb-access-token: "eyJhbGc..." (7 days, HttpOnly, Secure)
   sb-refresh-token: "v1.MQ..." (30 days, HttpOnly, Secure)
                    │
                    ▼
6. Response to Client
   { success: true, user: { id, email } }
                    │
                    ▼
7. LoginForm Redirect
   window.location.href = "/"
                    │
                    ▼
8. Middleware on /
   ├─ Reads cookies
   ├─ Validates tokens
   ├─ Sets locals.user
   └─ Continues to page
                    │
                    ▼
9. index.astro
   Displays: "Jesteś zalogowany jako: user@example.com"
```

## Error Handling Flow

```
POST /api/auth/login with invalid data
                    │
                    ▼
        ┌───────────┴───────────┐
        │                       │
   Validation Error        Auth Error
   (Zod Schema)           (Supabase)
        │                       │
        ▼                       ▼
    Status 422              Status 401/400
    {                       {
      error: {                error: {
        code: "VALIDATION",     code: "AUTH_ERROR",
        details: {              message: "..."
          email: "...",       }
          password: "..."     }
        }
      }
    }
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
          LoginForm.tsx
          ├─ setFieldErrors() (422)
          └─ setError() (401/400/500)
                    │
                    ▼
          Display to User
          "Nieprawidłowy e-mail lub hasło"
```

## Cookie Strategy

```
Access Token (sb-access-token)
├─ Contains: User ID, email, role, exp
├─ Lifetime: 7 days
├─ Used for: Authentication on each request
└─ Flags: HttpOnly, Secure (prod), SameSite=Lax

Refresh Token (sb-refresh-token)
├─ Contains: Refresh token string
├─ Lifetime: 30 days
├─ Used for: Renewing expired access tokens
└─ Flags: HttpOnly, Secure (prod), SameSite=Lax

Why two tokens?
├─ Short-lived access token = better security
├─ Long-lived refresh token = better UX
└─ Middleware auto-refreshes = seamless experience
```
