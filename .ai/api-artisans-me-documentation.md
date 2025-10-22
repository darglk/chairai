# API Endpoint: PUT /api/artisans/me

## Przegląd

Endpoint umożliwiający uwierzytelnionym rzemieślnikom utworzenie lub aktualizację ich profilu zawodowego.

## Szczegóły żądania

### Metoda HTTP

`PUT`

### URL

```
/api/artisans/me
```

### Autoryzacja

- **Wymagana**: Tak
- **Typ**: Bearer Token (Supabase Auth)
- **Rola**: `artisan` (tylko rzemieślnicy mogą zarządzać profilem)

### Nagłówki

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Body

```json
{
  "company_name": "Master Woodworks",
  "nip": "1234567890"
}
```

#### Parametry

| Pole           | Typ    | Wymagane | Opis                           | Walidacja                       |
| -------------- | ------ | -------- | ------------------------------ | ------------------------------- |
| `company_name` | string | Tak      | Nazwa firmy rzemieślnika       | Min. 1 znak, nie może być pusta |
| `nip`          | string | Tak      | Numer identyfikacji podatkowej | Dokładnie 10 cyfr               |

## Odpowiedzi

### Sukces (200 OK)

Zwraca utworzony lub zaktualizowany profil rzemieślnika.

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "company_name": "Master Woodworks",
  "nip": "1234567890",
  "is_public": false,
  "specializations": [],
  "portfolio_images": [],
  "average_rating": null,
  "total_reviews": 0,
  "updated_at": "2025-10-19T12:30:45Z"
}
```

### Błędy

#### 401 Unauthorized

Użytkownik nie jest zalogowany lub token jest nieprawidłowy.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Musisz być zalogowany, aby zarządzać profilem"
  }
}
```

#### 403 Forbidden

Użytkownik nie ma roli `artisan`.

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Tylko rzemieślnicy mogą zarządzać profilem zawodowym"
  }
}
```

#### 404 Not Found

Użytkownik nie został znaleziony w bazie danych.

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Nie znaleziono użytkownika"
  }
}
```

#### 409 Conflict

Podany NIP jest już używany przez innego rzemieślnika.

```json
{
  "error": {
    "code": "NIP_CONFLICT",
    "message": "Podany NIP jest już używany przez innego rzemieślnika"
  }
}
```

#### 422 Unprocessable Entity

Błąd walidacji danych wejściowych.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Nieprawidłowe dane wejściowe",
    "details": {
      "company_name": "Nazwa firmy nie może być pusta",
      "nip": "NIP musi składać się z dokładnie 10 cyfr"
    }
  }
}
```

#### 500 Internal Server Error

Nieoczekiwany błąd serwera lub błąd bazy danych.

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Wystąpił nieoczekiwany błąd serwera"
  }
}
```

lub

```json
{
  "error": {
    "code": "NIP_CHECK_ERROR",
    "message": "Błąd podczas sprawdzania unikalności NIP"
  }
}
```

```json
{
  "error": {
    "code": "UPSERT_ERROR",
    "message": "Błąd podczas tworzenia/aktualizacji profilu rzemieślnika"
  }
}
```

## Przykłady użycia

### cURL

#### Utworzenie nowego profilu

```bash
curl -X PUT https://example.com/api/artisans/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Master Woodworks",
    "nip": "1234567890"
  }'
```

#### Aktualizacja istniejącego profilu

```bash
curl -X PUT https://example.com/api/artisans/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Updated Woodworks",
    "nip": "1234567890"
  }'
```

### JavaScript (fetch)

```javascript
const updateProfile = async () => {
  const response = await fetch("/api/artisans/me", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      company_name: "Master Woodworks",
      nip: "1234567890",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  const profile = await response.json();
  return profile;
};
```

### TypeScript (z Supabase)

```typescript
import type { CreateUpdateArtisanProfileCommand, ArtisanProfileDTO } from "@/types";

const updateArtisanProfile = async (data: CreateUpdateArtisanProfileCommand): Promise<ArtisanProfileDTO> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Nie jesteś zalogowany");
  }

  const response = await fetch("/api/artisans/me", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
};

// Użycie
try {
  const profile = await updateArtisanProfile({
    company_name: "Master Woodworks",
    nip: "1234567890",
  });
  console.log("Profil zaktualizowany:", profile);
} catch (error) {
  console.error("Błąd:", error.message);
}
```

## Logika biznesowa

### Reguły walidacji

1. **Unikalność NIP**: NIP musi być unikalny w całym systemie. Jeśli podany NIP jest już używany przez innego rzemieślnika, operacja zakończy się błędem 409 Conflict.

2. **Format NIP**: NIP musi składać się z dokładnie 10 cyfr (bez kresek, spacji czy innych znaków).

3. **Nazwa firmy**: Nie może być pusta.

### Operacja Upsert

Endpoint wykorzystuje operację **upsert** (update + insert), co oznacza:

- Jeśli profil rzemieślnika nie istnieje, zostanie utworzony
- Jeśli profil już istnieje, zostanie zaktualizowany
- Wielokrotne wywołania z tymi samymi danymi są idempotentne

### Wartości domyślne

Przy pierwszym utworzeniu profilu:

- `is_public`: `false` (profil jest domyślnie niewidoczny publicznie)
- `specializations`: `[]` (pusta lista, wypełniana osobnym endpointem)
- `portfolio_images`: `[]` (puste portfolio, wypełniane osobno)
- `average_rating`: `null` (brak ocen)
- `total_reviews`: `0` (brak recenzji)

## Testy

### Testy jednostkowe

Lokalizacja: `tests/unit/lib/artisan-profile.service.test.ts` i `tests/unit/api/artisans/me.test.ts`

Uruchomienie:

```bash
npm run test:run -- tests/unit/lib/artisan-profile.service.test.ts tests/unit/api/artisans/me.test.ts
```

Pokrycie testowe:

- ✅ Pomyślne utworzenie profilu
- ✅ Pomyślna aktualizacja profilu
- ✅ Walidacja unikalności NIP
- ✅ Konflikt NIP (409)
- ✅ Błędy autoryzacji (401, 403, 404)
- ✅ Błędy walidacji (422)
- ✅ Błędy bazy danych (500)
- ✅ Zmiana nazwy firmy bez zmiany NIP
- ✅ Zmiana NIP na nowy, nieużywany

## Zależności

### Serwisy

- `ArtisanProfileService` (`src/lib/services/artisan-profile.service.ts`)

### Schematy walidacji

- `CreateUpdateArtisanProfileSchema` (`src/lib/schemas.ts`)

### Typy

- `CreateUpdateArtisanProfileCommand` (`src/types.ts`)
- `ArtisanProfileDTO` (`src/types.ts`)

### Narzędzia

- `createErrorResponse` (`src/lib/api-utils.ts`)
- `createSuccessResponse` (`src/lib/api-utils.ts`)

## Bezpieczeństwo

1. **Uwierzytelnianie**: Endpoint jest chroniony przez middleware Astro, które weryfikuje token JWT z Supabase Auth.

2. **Autoryzacja**: Dostęp mają wyłącznie użytkownicy z rolą `artisan`.

3. **Row-Level Security (RLS)**: Zalecane jest skonfigurowanie polityk RLS w Supabase dla tabeli `artisan_profiles`.

4. **Walidacja danych**: Wszystkie dane wejściowe są walidowane przy użyciu Zod przed przetworzeniem.

5. **Parametryzowane zapytania**: Klient Supabase automatycznie parametryzuje zapytania, eliminując ryzyko SQL Injection.

## Powiązane endpointy

- `POST /api/artisans/me/specializations` - Dodawanie specjalizacji do profilu (TODO)
- `GET /api/artisans/me` - Pobieranie własnego profilu (TODO)
- `GET /api/artisans/{id}` - Pobieranie publicznego profilu rzemieślnika (TODO)

## Historia zmian

### 2025-10-19

- ✅ Implementacja endpointu PUT /api/artisans/me
- ✅ Utworzenie serwisu ArtisanProfileService
- ✅ Dodanie walidacji Zod
- ✅ Utworzenie testów jednostkowych (21 testów)
- ✅ Dokumentacja API
