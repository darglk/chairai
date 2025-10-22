# API Endpoint Implementation Plan: Generate Image

## 1. Przegląd punktu końcowego

Endpoint `POST /api/images/generate` umożliwia użytkownikom z rolą "client" wygenerowanie obrazu mebla za pomocą sztucznej inteligencji (OpenRouter API). Endpoint przyjmuje tekstowy prompt opisujący pożądany mebl, kieruje go do modelu AI, zapisuje wynikowy obraz w Supabase Storage oraz metadane w bazie danych. Endpoint zwraca szczegóły utworzonego zasobu oraz informację o pozostałych dostępnych generacjach dla użytkownika.

## 2. Szczegóły żądania

**Metoda HTTP**: `POST`

**Struktura URL**: `/api/images/generate`

**Parametry**:

- **Wymagane**:
  - `prompt` (string) - tekstowy opis mebla do wygenerowania
    - Min. 10 znaków
    - Max. 500 znaków
    - Nie może być pusty ani zawierać tylko białych znaków
- **Opcjonalne**: Brak

**Headers**:

- `Authorization: Bearer {access_token}` (WYMAGANY) - JWT token z sesji użytkownika
- `Content-Type: application/json` (WYMAGANY)

**Request Body**:

```json
{
  "prompt": "A modern oak dining table with metal legs, minimalist design"
}
```

## 3. Wykorzystywane typy

**DTOs i Command Modele**:

- `GenerateImageCommand` - model zawierający `prompt: string`
- `GeneratedImageDTO` - podstawowe dane wygenerowanego obrazu
- `GenerateImageResponseDTO` - rozszerzony DTO z polem `remaining_generations: number`
- `ApiErrorDTO` - standardowa struktura błędu API

**Typy pomocnicze**:

- `UserDTO` - dane autentykowanego użytkownika
- `UserRole` - enum z wartościami "client" lub "artisan"

## 4. Szczegóły odpowiedzi

**Sukces (201 Created)**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "12345678-1234-1234-1234-123456789000",
  "prompt": "A modern oak dining table with metal legs, minimalist design",
  "image_url": "https://storage.supabase.co/chairai/generated_images/550e8400-e29b-41d4-a716-446655440000.jpg",
  "created_at": "2025-10-18T12:30:45Z",
  "remaining_generations": 9
}
```

**Błędy**:

| Status | Scenariusz                                          | Odpowiedź                                                                                                                                                                        |
| ------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400    | Prompt jest pusty, null, lub poniżej minimum znaków | `{ "error": { "code": "INVALID_PROMPT", "message": "Prompt must be between 10 and 500 characters", "details": { "min_length": 10, "max_length": 500, "provided_length": 5 } } }` |
| 400    | Prompt przekracza maksymalną długość                | `{ "error": { "code": "PROMPT_TOO_LONG", "message": "Prompt must be between 10 and 500 characters" } }`                                                                          |
| 401    | Brak tokenu, token invalid lub wygasły              | `{ "error": { "code": "UNAUTHORIZED", "message": "Invalid or expired access token" } }`                                                                                          |
| 403    | Użytkownik nie ma roli "client"                     | `{ "error": { "code": "FORBIDDEN_ROLE", "message": "Only client users can generate images" } }`                                                                                  |
| 403    | Użytkownik przekroczył limit generacji              | `{ "error": { "code": "GENERATION_LIMIT_EXCEEDED", "message": "You have reached your monthly generation limit. Remaining: 0" } }`                                                |
| 503    | Usługa AI (OpenRouter) niedostępna                  | `{ "error": { "code": "AI_SERVICE_UNAVAILABLE", "message": "AI service is temporarily unavailable. Please try again later" } }`                                                  |

## 5. Przepływ danych

```
┌─────────────┐
│   Request   │
│ POST /api/  │
│   images/   │
│  generate   │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ 1. Extract & Validate│
│ - Extract token      │
│ - Parse body JSON    │
│ - Validate prompt    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 2. Authentication    │
│ - Verify JWT token   │
│ - Get user from DB   │
│ - Check token expiry │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 3. Authorization     │
│ - Check user role    │
│ - Verify "client"    │
│ - Check generation   │
│   limit remaining    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 4. Generate Image    │
│ - Call OpenRouter API│
│ - Send prompt        │
│ - Receive image data │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 5. Store Image       │
│ - Upload to Storage  │
│ - Get image URL      │
│ - Generate image ID  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 6. Save Metadata     │
│ - Insert to DB       │
│ - Record prompt      │
│ - Record image URL   │
│ - Record user_id     │
│ - Record timestamp   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 7. Return Response   │
│ - 201 Created status │
│ - Image data + URL   │
│ - Remaining quota    │
└──────────────────────┘
```

## 6. Względy bezpieczeństwa

### Autentykacja

- **JWT Validation**: Token musi być poprawnie podpisany i nie wygasły
- **Token Extraction**: Wygąg token z headera `Authorization: Bearer {token}`
- **User Verification**: Potwierdzenie, że użytkownik istnieje w bazie danych

### Autoryzacja

- **Role-based access**: Tylko użytkownicy z rolą "client" mogą generować obrazy
- **Resource ownership**: Obrazy powiązane z konkretnym user_id
- **Rate limiting**: Limit generacji chronionego przez system sesji

### Walidacja danych

- **Prompt validation**:
  - Długość: 10-500 znaków
  - Nie może być null, undefined, lub pustym stringiem
  - Trimowanie białych znaków
- **Type checking**: Weryfikacja, że prompt jest typem string
- **Sanitization**: Brak bezpośredniego wstrzykiwania - prompt wysyłany do API jako string

### Bezpieczeństwo API

- **Supabase RLS**: Wiersze mogą być widoczne tylko dla właściciela
- **Storage permissions**: Bucket dostępny tylko dla autentykowanych użytkowników
- **Environment variables**: Klucze API OpenRouter przechowywane w `.env`

### Zarządzanie limitami

- **Generation quota**: Limit przechowywany w sesji lub wyliczany na locie z bazy
- **Abuse prevention**: Sprawdzenie limitu przed wysłaniem do AI service

## 7. Obsługa błędów

### Walidacja żądania (400 Bad Request)

```typescript
// Prompt validation
- Pusty lub null prompt
- Prompt zawiera tylko białe znaki
- Prompt poniżej 10 znaków
- Prompt powyżej 500 znaków
- Invalid JSON body
```

### Błędy autentykacji (401 Unauthorized)

```typescript
- Brak Authorization header
- Token w niepoprawnym formacie (nie "Bearer {token}")
- Token invalid lub podpis nie zgadza się
- Token wygasł
- User ID z tokenu nie istnieje w bazie
```

### Błędy autoryzacji (403 Forbidden)

```typescript
- Użytkownik ma rolę "artisan" zamiast "client"
- Użytkownik nie ma profilu (nie zalogowany poprawnie)
- Limit generacji wyczerpany
- Generacja zablokowana dla tego użytkownika
```

### Błędy serwera (500 Internal Server Error)

```typescript
- Błąd przy zapisie do Supabase Database
- Błąd przy wysyłaniu do Supabase Storage
- Nieoczekiwany błąd w logice serwera
```

### Błędy usługi AI (503 Service Unavailable)

```typescript
- OpenRouter API niedostępne
- Timeout przy komunikacji z AI
- API zwraca błąd 5xx
- Brak dostępu do modelu AI
```

### Strategia obsługi błędów

1. **Early validation**: Sprawdzenie parametrów na początku
2. **Guard clauses**: Zwracanie błędu przy warunkach uniemożliwiających dalsze wykonanie
3. **Descriptive errors**: Komunikaty zawierające szczegóły co poszło nie tak
4. **Proper logging**: Rejestrowanie błędów krytycznych dla debugowania
5. **User-friendly messages**: Komunikaty zrozumiałe dla klienta API

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

- **AI Service Latency**: OpenRouter API może mieć opóźnienie 5-30 sekund
- **Image Upload**: Wgranie dużego pliku do Supabase Storage może być wolne
- **Database Write**: Zapis metadanych do PostgreSQL
- **Concurrent requests**: Wiele jednoczesnych żądań może przyciążyć AI service

### Strategie optymalizacji

| Optymizacja            | Opis                                                                        |
| ---------------------- | --------------------------------------------------------------------------- |
| **Async operations**   | Użycie async/await dla operacji I/O (API, Storage, DB)                      |
| **Request timeout**    | Ustawienie timeout dla OpenRouter API (np. 60s)                             |
| **Connection pooling** | Reużywanie połączeń do bazy danych                                          |
| **Caching**            | Ewentualne cachowanie promptów (ale mało efektywne - każdy prompt unikalny) |
| **Rate limiting**      | Limit generacji chronić zasoby                                              |
| **Queue system**       | Opcjonalnie - kolejka żądań dla bardzo dużego ruchu                         |
| **Compression**        | Kompresja obrazów przed wysyłką                                             |
| **CDN**                | Supabase Storage ma wbudowany CDN                                           |

### Monitoring

- Śledzenie czasu odpowiedzi endpointu
- Monitoring statusu OpenRouter API
- Alerty na wysokie czasy opóźnień
- Logging błędów i wyjątków

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie i walidacja

1. **Zapoznanie się z istniejącym kodem**
   - Przeanalizować `src/lib/services/ai-image.service.ts`
   - Przeanalizować `src/lib/services/openrouter.service.ts`
   - Przeanalizować `src/db/supabase.client.ts`
   - Sprawdzić istniejące schemat walidacji w `src/lib/schemas.ts`

2. **Aktualizacja schematów walidacji (Zod)**
   - Dodać/zaktualizować `GenerateImageCommandSchema` w `src/lib/schemas.ts`
   - Zdefiniować walidację prompt (min 10, max 500 znaków)
   - Eksportować dla użytku w endpoincie

3. **Weryfikacja typów DTO**
   - Upewnić się, że `GenerateImageCommand` i `GenerateImageResponseDTO` są dostępne
   - Sprawdzić dostępność typów w `src/types.ts`

### Faza 2: Implementacja logiki usługi

1. **Rozbudowa/Aktualizacja `ai-image.service.ts`**
   - Funkcja `generateImage(prompt: string, userId: string)`
   - Logika walidacji promptu (jeśli nie w walidacjach)
   - Integracja z OpenRouter (`openrouter.service.ts`)
   - Wgranie obrazu do Supabase Storage
   - Zapis metadanych do bazy danych (`generated_images` tabela)
   - Obliczenie/pobranie `remaining_generations`
   - Obsługa błędów i logowanie

2. **Aktualizacja `openrouter.service.ts` (jeśli potrzeba)**
   - Upewnić się, że obsługuje generowanie obrazów
   - Obsługa limitów OpenRouter API

### Faza 3: Implementacja endpointu API

1. **Tworzenie/Aktualizacja `src/pages/api/images/generate.ts`**
   - Funkcja `POST` handler
   - Ekstrakcja i parsowanie request body
   - Ekstrakcja Authorization header
   - Inicjalizacja Supabase client z `context.locals`
   - Walidacja tokenu i autentykacja użytkownika
   - Sprawdzenie roli (musi być "client")
   - Walidacja schematu (prompt)
   - Wywołanie `generateImage` z service
   - Obsługa wszystkich możliwych błędów
   - Zwrócenie 201 Created z danymi obrazu

### Faza 4: Implementacja bezpieczeństwa

1. **Middleware (istniejące)**
   - Upewnić się, że middleware w `src/middleware/index.ts` waliduje tokeny

2. **Rate limiting (opcjonalnie)**
   - Weryfikacja limitu generacji na użytkownika
   - Możliwość integracji z `src/lib/rate-limit.ts`

3. **Error handling**
   - Niestandardowe typy błędów dla spójności
   - Proper HTTP status codes
   - Descriptive error messages
   - Error logging na serwerze

### Faza 5: Testy

1. **Testy jednostkowe (`tests/unit/api`)**
   - Walidacja promptu (valid, empty, too short, too long)
   - Autentykacja (valid token, invalid token, no token, expired token)
   - Autoryzacja (client role, artisan role)
   - Limit generacji (within limit, exceeded limit)

2. **Testy integracyjne (`tests/integration`)**
   - Pełny przepływ z bazą danych
   - Weryfikacja zapisu do Supabase Storage
   - Weryfikacja zapisu metadanych w bazie

3. **Testy e2e (opcjonalnie)**
   - Pełny przepływ z UI (jeśli dostępne)

### Faza 6: Deployment i monitoring

1. **Code review**
   - Przegląd kodu pod kątem bezpieczeństwa
   - Sprawdzenie zgodności z style guide
   - Weryfikacja obsługi błędów

2. **Testing w staging**
   - Uruchomienie całej aplikacji
   - Testy ręczne verschiednych scenariuszy
   - Load testing (opcjonalnie)

3. **Deployment do produkcji**
   - Merge do main branch
   - Deploy na produkcję
   - Monitoring błędów i wydajności

### Faza 7: Dokumentacja

1. **API documentation**
   - Aktualizacja API spec (już zawarta w `api-plan.md`)
   - Dodanie endpoint do postman collection (jeśli istnieje)

2. **Dokumentacja wewnętrzna**
   - Komentarze w kodzie
   - README dla service layer
   - Instrukcje troubleshootingu

### Checklist implementacyjny

- [ ] Schematy walidacji (Zod)
- [ ] Funkcja `generateImage` w service
- [ ] Endpoint POST handler
- [ ] Ekstrakcja i walidacja tokenu
- [ ] Autoryzacja (role check)
- [ ] Walidacja promptu
- [ ] Integracja z OpenRouter
- [ ] Zapis do Supabase Storage
- [ ] Zapis metadanych do DB
- [ ] Obliczenie remaining_generations
- [ ] Obsługa wszystkich błędów (400, 401, 403, 503)
- [ ] Logging i monitoring
- [ ] Testy jednostkowe
- [ ] Testy integracyjne
- [ ] Code review
- [ ] Documentation
- [ ] Deployment

---

**Notatki dla zespołu**:

- Ensure TypeScript strict mode is enabled
- Follow existing code style and patterns in project
- Use early returns for error handling
- Implement proper error logging
- Test all error scenarios
- Consider performance implications of AI service latency
- Keep security requirements in mind (authentication, authorization, rate limiting)
