# Przewodnik Testowania Modułu Logowania

## 🚀 Uruchomienie Projektu

```bash
# Zainstaluj zależności (jeśli jeszcze nie zainstalowane)
npm install

# Upewnij się, że masz skonfigurowane zmienne środowiskowe
# Potrzebne: SUPABASE_URL, SUPABASE_KEY

# Uruchom Supabase lokalnie (jeśli używasz lokalnej instancji)
npx supabase start

# Uruchom serwer deweloperski
npm run dev
```

## ✅ Checklist Testów

### 1. Test Podstawowej Walidacji (Client-Side)

**Kroki:**
1. Otwórz `http://localhost:3000/login`
2. Kliknij "Zaloguj się" bez wypełniania pól
3. **Oczekiwany wynik:** Komunikaty "To pole jest wymagane" pod polami email i hasło

### 2. Test Walidacji Email (Client-Side)

**Kroki:**
1. Wpisz nieprawidłowy email (np. "test")
2. Wpisz dowolne hasło
3. Kliknij "Zaloguj się"
4. **Oczekiwany wynik:** Komunikat błędu walidacji pod polem email

### 3. Test Walidacji Backend (Server-Side)

**Terminal:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":""}'
```

**Oczekiwany wynik:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Błąd walidacji danych",
    "details": {
      "email": "Nieprawidłowy format adresu e-mail",
      "password": "Hasło jest wymagane"
    }
  }
}
```

### 4. Test Nieprawidłowych Danych Logowania

**Kroki:**
1. Wpisz email: `test@example.com`
2. Wpisz hasło: `wrongpassword`
3. Kliknij "Zaloguj się"
4. **Oczekiwany wynik:** Komunikat "Nieprawidłowy e-mail lub hasło"

### 5. Test Pomyślnego Logowania

**Wymagania:**
- Musisz mieć utworzone konto w Supabase z poprawnymi danymi

**Kroki:**
1. Wpisz poprawny email
2. Wpisz poprawne hasło
3. Kliknij "Zaloguj się"
4. **Oczekiwany wynik:** 
   - Przekierowanie na stronę główną `/`
   - Widoczny komunikat "Jesteś zalogowany jako: [email]"
   - Przycisk "Wyloguj się"

### 6. Test Cookies Sesji

**Po zalogowaniu:**
1. Otwórz DevTools → Application → Cookies
2. **Oczekiwany wynik:** 
   - Cookie `sb-access-token` (HttpOnly, Secure w prod, SameSite=Lax)
   - Cookie `sb-refresh-token` (HttpOnly, Secure w prod, SameSite=Lax)

### 7. Test Middleware - Przekierowanie Zalogowanych

**Kroki:**
1. Będąc zalogowanym, wejdź na `http://localhost:3000/login`
2. **Oczekiwany wynik:** Automatyczne przekierowanie na `/`

**Również testuj:**
- `/register` → przekierowanie na `/`
- `/password-recovery` → przekierowanie na `/`

### 8. Test Middleware - Ochrona Tras

**Kroki:**
1. Wyloguj się
2. Spróbuj wejść na `http://localhost:3000/dashboard`
3. **Oczekiwany wynik:** Przekierowanie na `/login`

### 9. Test Wylogowania

**Kroki:**
1. Będąc zalogowanym na stronie głównej
2. Kliknij przycisk "Wyloguj się"
3. **Oczekiwany wynik:**
   - Przekierowanie na `/`
   - Brak komunikatu o zalogowaniu
   - Cookies `sb-access-token` i `sb-refresh-token` usunięte

### 10. Test Persystencji Sesji

**Kroki:**
1. Zaloguj się
2. Zamknij przeglądarkę
3. Otwórz ponownie `http://localhost:3000`
4. **Oczekiwany wynik:** Nadal jesteś zalogowany (cookies się utrzymują)

### 11. Test Odświeżania Sesji (Zaawansowany)

**Kroki:**
1. Zaloguj się
2. W DevTools → Application → Cookies, usuń `sb-access-token` (zostaw `sb-refresh-token`)
3. Odśwież stronę
4. **Oczekiwany wynik:** 
   - Middleware automatycznie odświeży sesję
   - Nowy `sb-access-token` zostanie utworzony
   - Nadal jesteś zalogowany

### 12. Test Stanu Loading

**Kroki:**
1. Wpisz poprawne dane
2. Kliknij "Zaloguj się"
3. **Obserwuj:** 
   - Przycisk zmienia tekst na "Logowanie..."
   - Przycisk jest zablokowany (disabled)
   - Pola formularza są zablokowane

## 🐛 Debugowanie

### Problem: Nie mogę się zalogować z poprawnymi danymi

**Sprawdź:**
1. Czy Supabase jest uruchomiony
2. Czy zmienne środowiskowe są poprawne (`SUPABASE_URL`, `SUPABASE_KEY`)
3. DevTools → Network → sprawdź response z `/api/auth/login`
4. DevTools → Console → sprawdź czy nie ma błędów

### Problem: Cookies nie są ustawiane

**Sprawdź:**
1. DevTools → Application → Cookies
2. Czy używasz HTTP (w dev) lub HTTPS (w prod)
3. Czy SameSite policy nie blokuje cookies
4. Network → Response Headers dla `/api/auth/login`

### Problem: Przekierowania nie działają

**Sprawdź:**
1. DevTools → Network → Preserve log (zachowaj logi)
2. Sprawdź response code (powinien być 302)
3. Sprawdź Location header w response
4. Console → czy nie ma błędów JavaScript

### Problem: Walidacja nie działa

**Sprawdź:**
1. Network → Request Payload - co wysyłasz do API
2. Network → Response - co zwraca API
3. Console → czy Zod zwraca błędy
4. Upewnij się że `src/lib/schemas.ts` został poprawnie zaimportowany

## 📊 Test API z curl

### Login - Sukces
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"correctpassword"}' \
  -v
```

### Login - Błąd walidacji
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":""}' \
  -v
```

### Login - Nieprawidłowe dane
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}' \
  -v
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH" \
  -v
```

## ✨ Kryteria Akceptacji (Definition of Done)

- [ ] Wszystkie 12 testów przechodzą pomyślnie
- [ ] Brak błędów w konsoli przeglądarki
- [ ] Brak błędów TypeScript (`npx tsc --noEmit`)
- [ ] Brak błędów ESLint (`npx eslint src/`)
- [ ] Cookies są poprawnie ustawiane i usuwane
- [ ] Middleware poprawnie chroni trasy
- [ ] Komunikaty błędów są przyjazne użytkownikowi
- [ ] Loading states działają poprawnie
- [ ] Sesja persystuje po zamknięciu przeglądarki
