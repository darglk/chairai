# Konfiguracja Supabase dla Odzyskiwania Hasła

## 🔧 Wymagana Konfiguracja

### 1. Email Templates

Przejdź do: **Authentication → Email Templates → Reset Password**

#### Domyślny Template

Supabase ma wbudowany template, ale możesz go dostosować:

```html
<h2>Resetowanie hasła</h2>

<p>Witaj,</p>

<p>Otrzymaliśmy prośbę o zresetowanie hasła dla Twojego konta w ChairAI.</p>

<p>Kliknij poniższy link, aby ustawić nowe hasło:</p>

<p>
  <a
    href="{{ .ConfirmationURL }}"
    style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;"
  >
    Zresetuj hasło
  </a>
</p>

<p style="color: #6B7280; font-size: 14px;">
  Lub skopiuj i wklej ten link w przeglądarce:<br />
  {{ .ConfirmationURL }}
</p>

<p style="color: #EF4444; font-weight: 600;">⚠️ Link wygasa za 1 godzinę.</p>

<p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
  Jeśli nie prosiłeś o reset hasła, możesz zignorować tę wiadomość. Twoje hasło nie zostanie zmienione.
</p>

<hr style="margin: 24px 0; border: none; border-top: 1px solid #E5E7EB;" />

<p style="color: #9CA3AF; font-size: 12px;">
  ChairAI - Platforma łącząca kreatywne pomysły z rzemieślniczym wykonaniem
</p>
```

#### Zmienne Dostępne

- `{{ .ConfirmationURL }}` - Link z kodem resetującym
- `{{ .Token }}` - Sam token (nie używaj bezpośrednio)
- `{{ .TokenHash }}` - Hash tokenu
- `{{ .SiteURL }}` - URL Twojej aplikacji
- `{{ .Email }}` - Email użytkownika

### 2. URL Configuration

Przejdź do: **Authentication → URL Configuration**

#### Site URL

**Development:**

```
http://localhost:3000
```

**Production:**

```
https://chairai.com
```

#### Redirect URLs (Whitelist)

Dodaj następujące URLe:

**Development:**

```
http://localhost:3000/api/auth/callback
http://localhost:3000/*
```

**Production:**

```
https://chairai.com/api/auth/callback
https://chairai.com/*
```

> ⚠️ **Ważne:** Bez whitelistingu callbacku, Supabase odrzuci przekierowanie!

### 3. Email Provider

Przejdź do: **Project Settings → Auth → SMTP Settings**

#### Opcja A: Domyślny Provider Supabase (Recommended for Dev)

Supabase używa własnego providera do 4 emaili/godzinę (limit dev).

**Nie wymaga konfiguracji.**

#### Opcja B: Własny SMTP (Recommended for Production)

Przykład z Gmail:

```
Enable Custom SMTP: ✓
Host: smtp.gmail.com
Port: 587
Sender Email: noreply@chairai.com
Sender Name: ChairAI
Username: your-email@gmail.com
Password: [App Password - nie zwykłe hasło!]
```

#### Opcja C: SendGrid, Mailgun, etc.

Najlepsze dla produkcji:

**SendGrid:**

```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Your SendGrid API Key]
```

**Mailgun:**

```
Host: smtp.mailgun.org
Port: 587
Username: postmaster@mg.chairai.com
Password: [Your Mailgun Password]
```

### 4. Password Requirements

Przejdź do: **Authentication → Policies**

**Minimum Password Length:**

```
8 characters
```

**Additional Requirements (opcjonalne):**

- ✓ Require uppercase and lowercase letters
- ✓ Require numbers
- ✗ Require special characters (opcjonalne)

> 💡 **Uwaga:** Nasze Zod schema już wymusza te same zasady, więc to jest dodatkowa warstwa bezpieczeństwa.

### 5. Token Expiration

Przejdź do: **Authentication → Settings**

**Password Reset Token Expiry:**

```
1 hour (3600 seconds) - Default
```

Można zmienić na:

- 30 minut (bezpieczniejsze)
- 2 godziny (wygodniejsze)
- 24 godziny (nie zalecane)

### 6. Rate Limiting

Przejdź do: **Authentication → Rate Limits**

**Password Reset Rate Limit:**

```
10 requests per hour per IP
```

Zapobiega to spamowaniu emailami resetującymi.

## 🧪 Testowanie Konfiguracji

### Test 1: Wysyłanie Emaila

```bash
# W terminalu lub przez Postman
curl -X POST http://localhost:3000/api/auth/password-recovery \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

**Sprawdź:**

1. Log w konsoli Supabase (Auth → Logs)
2. Skrzynka odbiorczą
3. Czy link zawiera `code` i `type=recovery`

### Test 2: Callback URL

Kliknij link z emaila i sprawdź:

1. DevTools → Network → sprawdź request do `/api/auth/callback`
2. Response powinien być `302 Redirect` do `/password-reset`
3. DevTools → Application → Cookies → sprawdź `sb-access-token`

### Test 3: Pełny Flow

1. Żądaj reset hasła
2. Kliknij link w emailu
3. Ustaw nowe hasło
4. Spróbuj zalogować się starym hasłem (❌ powinno się nie udać)
5. Zaloguj się nowym hasłem (✅ powinno zadziałać)

## 🔍 Debugowanie

### Problem: Email nie przychodzi

**Sprawdź:**

1. **Supabase Logs:**
   - Authentication → Logs
   - Szukaj błędów SMTP

2. **Email w bazie:**

   ```sql
   SELECT * FROM auth.users WHERE email = 'test@example.com';
   ```

3. **Spam folder:**
   - Sprawdź folder spam w skrzynce

4. **SMTP Config:**
   - Project Settings → Auth → SMTP
   - Test connection

5. **Rate Limit:**
   - Czy nie wysłałeś za dużo requestów?

### Problem: Link nie działa

**Sprawdź:**

1. **URL w emailu:**

   ```
   http://localhost:3000/api/auth/callback?code=XXX&type=recovery
   ```

   - Czy zawiera `code`?
   - Czy zawiera `type=recovery`?
   - Czy domena się zgadza?

2. **Redirect URL Whitelist:**
   - Auth → URL Configuration
   - Czy `/api/auth/callback` jest na liście?

3. **Token Expiry:**
   - Czy link nie wygasł (default 1h)?

4. **Browser Console:**
   - Sprawdź czy nie ma błędów CORS

### Problem: "Link wygasł" natychmiast po kliknięciu

**Możliwe przyczyny:**

1. **Nieprawidłowa konfiguracja Site URL:**

   ```
   Site URL: http://localhost:3000 ✓
   NIE: http://localhost:3000/ ✗ (trailing slash)
   ```

2. **Redirect URL nie na whiteliście:**
   - Dodaj exact match dla callbacku

3. **Code użyty dwukrotnie:**
   - Link jest jednorazowy
   - Nie można użyć tego samego kodu dwa razy

## 📧 Przykładowy Email (Rendering)

Po skonfigurowaniu, user otrzyma email podobny do:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Od: ChairAI <noreply@chairai.com>
Do: user@example.com
Temat: Zresetuj swoje hasło
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resetowanie hasła

Witaj,

Otrzymaliśmy prośbę o zresetowanie hasła dla Twojego konta w ChairAI.

Kliknij poniższy link, aby ustawić nowe hasło:

  [Zresetuj hasło]  ← przycisk

Lub skopiuj i wklej ten link w przeglądarce:
http://localhost:3000/api/auth/callback?code=eyJhbGci...&type=recovery

⚠️ Link wygasa za 1 godzinę.

Jeśli nie prosiłeś o reset hasła, możesz zignorować tę wiadomość.
Twoje hasło nie zostanie zmienione.

─────────────────────────────────────────────────────
ChairAI - Platforma łącząca kreatywne pomysły
z rzemieślniczym wykonaniem
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## ✅ Checklist Konfiguracji

Przed wdrożeniem na produkcję, upewnij się że:

- [ ] Email template jest dostosowany (branding, content)
- [ ] Site URL jest poprawnie ustawiony dla środowiska
- [ ] Redirect URLs zawierają `/api/auth/callback`
- [ ] SMTP provider jest skonfigurowany (dla produkcji)
- [ ] Password requirements są zgodne z polityką
- [ ] Token expiration jest odpowiedni (1h recommended)
- [ ] Rate limiting jest włączony
- [ ] Testowanie pełnego flow działa
- [ ] Email przychodzi w rozsądnym czasie (<1 min)
- [ ] Link w emailu przekierowuje poprawnie
- [ ] Folder spam został sprawdzony
- [ ] Logi Supabase nie pokazują błędów

## 🚀 Go Live Checklist

Dodatkowe kroki przed produkcją:

- [ ] Zmień Site URL na produkcyjną domenę
- [ ] Dodaj produkcyjne Redirect URLs
- [ ] Skonfiguruj własny SMTP (nie używaj Supabase default)
- [ ] Skonfiguruj własną domenę dla emaili (noreply@yourapp.com)
- [ ] Ustaw SPF, DKIM, DMARC dla domeny email
- [ ] Test email deliverability (mail-tester.com)
- [ ] Monitor rate limits i dostosuj jeśli potrzeba
- [ ] Ustaw alerting dla failed email deliveries

## 📚 Dodatkowe Zasoby

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
