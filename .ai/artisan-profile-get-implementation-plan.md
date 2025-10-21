# Plan Implementacji: GET /api/artisans/{artisanId}

## Cel
Endpoint publiczny do pobierania profilu rzemieślnika wraz z portfolio, specjalizacjami i statystykami opinii.

## Krok 1: Zdefiniuj schemat walidacji
**Plik:** `/src/lib/schemas.ts`

Dodaj schemat walidacji dla artisanId (UUID):
```typescript
export const ArtisanIdSchema = z.string().uuid({ message: "Nieprawidłowy format ID rzemieślnika" });
```

## Krok 2: Utwórz serwis
**Plik:** `/src/lib/services/artisan-profile.service.ts`

Stwórz klasę `ArtisanProfileService` z metodą `getPublicProfile()`:

**Logika biznesowa:**
1. Sprawdź czy profil rzemieślnika istnieje
2. Pobierz dane profilu (artisan_profiles)
3. Pobierz portfolio (portfolio_images z URLs z Storage)
4. Pobierz specjalizacje (artisan_specializations + specializations join)
5. Pobierz statystyki opinii:
   - Średnia ocena
   - Liczba opinii
6. Zwróć ArtisanProfileDTO

**Obsługa błędów:**
- 404: Profil nie istnieje
- 403: Profil nie jest opublikowany (is_published = false)

## Krok 3: Utwórz endpoint API
**Plik:** `/src/pages/api/artisans/[artisanId].ts`

Endpoint GET:
1. Waliduj artisanId z parametru ścieżki
2. Wywołaj ArtisanProfileService.getPublicProfile()
3. Zwróć 200 z danymi profilu
4. Obsłuż błędy (404, 403, 500)

**Autentykacja:** NIEWYMAGANA (endpoint publiczny)

## Krok 4: Testy jednostkowe
**Plik:** `/tests/unit/services/artisan-profile.service.test.ts`

Testy dla ArtisanProfileService:
- Powinien rzucić błąd gdy profil nie istnieje
- Powinien rzucić błąd gdy profil nie jest opublikowany
- Powinien zwrócić pełny profil z portfolio i specjalizacjami

## Krok 5: Testy integracyjne
**Plik:** `/tests/integration/api/get-artisan-profile.integration.test.ts`

Testy dla endpointa:
- GET 200: Powinien zwrócić publiczny profil
- GET 404: Nieprawidłowy artisanId
- GET 404: Profil nie istnieje
- GET 403: Profil nie jest opublikowany

## Krok 6: Dokumentacja API
**Plik:** `/.ai/api-artisan-profile-get-documentation.md`

Dokumentacja zawierająca:
- Opis endpointa
- Request/Response examples
- Struktura ArtisanProfileDTO
- Kody błędów
- Przykłady użycia

## Typy DTO (już w types.ts lub do dodania)

```typescript
export interface ArtisanProfileDTO {
  user_id: string;
  company_name: string;
  phone: string;
  city: string;
  description: string | null;
  is_published: boolean;
  portfolio: PortfolioImageDTO[];
  specializations: SpecializationDTO[];
  stats: {
    average_rating: number | null;
    review_count: number;
  };
}

export interface PortfolioImageDTO {
  id: string;
  image_url: string;
  description: string | null;
  created_at: string;
}

export interface SpecializationDTO {
  id: string;
  name: string;
}
```

## Kolejność realizacji (3 kroki):
1. Schema + Service + Endpoint (backend logic)
2. Unit Tests + Integration Tests
3. Documentation
