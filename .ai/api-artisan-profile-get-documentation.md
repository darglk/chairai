# API Documentation: GET /api/artisans/{artisanId}

## Overview
Public endpoint to retrieve detailed artisan profile information including portfolio, specializations, and review statistics. This endpoint does NOT require authentication and is accessible to anyone viewing published artisan profiles.

## Endpoint Details
- **Method:** `GET`
- **Path:** `/api/artisans/{artisanId}`
- **Authentication:** Not required (public endpoint)

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `artisanId` | string (UUID) | Yes | Unique identifier of the artisan |

## Response

### Success Response (200 OK)

Returns complete public artisan profile with all related data.

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "company_name": "Amazing Furniture Co.",
  "nip": "1234567890",
  "is_public": true,
  "specializations": [
    {
      "id": "spec-uuid-1",
      "name": "Stoły"
    },
    {
      "id": "spec-uuid-2",
      "name": "Krzesła"
    }
  ],
  "portfolio_images": [
    {
      "id": "img-uuid-1",
      "image_url": "https://storage.example.com/portfolio-images/artisan-uuid/image1.jpg",
      "created_at": "2025-10-20T10:00:00Z"
    },
    {
      "id": "img-uuid-2",
      "image_url": "https://storage.example.com/portfolio-images/artisan-uuid/image2.jpg",
      "created_at": "2025-10-19T14:30:00Z"
    }
  ],
  "average_rating": 4.67,
  "total_reviews": 15,
  "updated_at": "2025-10-21T12:00:00Z"
}
```

### Error Responses

#### 400 Bad Request - Invalid UUID Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Nieprawidłowy format ID rzemieślnika"
  }
}
```

**Причина:** artisanId is not a valid UUID format

#### 404 Not Found - Profile Does Not Exist
```json
{
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "Nie znaleziono profilu rzemieślnika"
  }
}
```

**Причина:** No artisan profile exists for the given artisanId

#### 403 Forbidden - Profile Not Published
```json
{
  "error": {
    "code": "PROFILE_NOT_PUBLISHED",
    "message": "Profil rzemieślnika nie jest opublikowany"
  }
}
```

**Причина:** Artisan profile exists but `is_public` is set to `false`. The artisan has not yet published their profile.

#### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Wystąpił nieoczekiwany błąd"
  }
}
```

**Причина:** Unexpected server error (database connection issues, etc.)

## Response Schema

### ArtisanProfileDTO

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `user_id` | string (UUID) | No | Unique identifier of the artisan user |
| `company_name` | string | No | Name of the artisan's company |
| `nip` | string | No | Polish tax identification number (NIP) |
| `is_public` | boolean | No | Whether the profile is publicly visible (always `true` in successful responses) |
| `specializations` | SpecializationDTO[] | No | Array of artisan's specializations |
| `portfolio_images` | PortfolioImageDTO[] | No | Array of portfolio images (sorted by creation date, newest first) |
| `average_rating` | number \| null | Yes | Average rating from reviews (1-5 scale, rounded to 2 decimal places). Null if no reviews. |
| `total_reviews` | number | No | Total number of reviews received |
| `updated_at` | string (ISO 8601) | No | Timestamp of last profile update |

### SpecializationDTO

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier of the specialization |
| `name` | string | Name of the specialization (e.g., "Stoły", "Krzesła") |

### PortfolioImageDTO

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier of the portfolio image |
| `image_url` | string | Public URL to the image in Supabase Storage |
| `created_at` | string (ISO 8601) | Timestamp when the image was uploaded |

## Business Logic

### Profile Visibility Rules
1. **Profile must exist** - artisanId must correspond to an existing artisan_profiles record
2. **Profile must be published** - `is_public` must be `true`
3. **No authentication required** - Anyone can view published profiles

### Review Statistics Calculation
- **average_rating**: Calculated from all reviews for this artisan. Formula: `SUM(rating) / COUNT(reviews)`, rounded to 2 decimal places
- **total_reviews**: Count of all reviews where `reviewee_id = artisanId`
- If no reviews exist, `average_rating` is `null` and `total_reviews` is `0`

### Portfolio Images Order
Images are returned in **descending order by creation date** (newest first).

## Usage Examples

### Frontend - Viewing Artisan Profile
```typescript
async function loadArtisanProfile(artisanId: string) {
  try {
    const response = await fetch(`/api/artisans/${artisanId}`);
    
    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 404) {
        // Profile doesn't exist
        showError("Nie znaleziono profilu rzemieślnika");
      } else if (response.status === 403) {
        // Profile not published
        showError("Ten profil nie jest jeszcze dostępny publicznie");
      }
      return;
    }
    
    const profile = await response.json();
    
    // Display profile data
    displayProfile(profile);
  } catch (error) {
    showError("Wystąpił błąd podczas ładowania profilu");
  }
}
```

### cURL Example
```bash
curl -X GET https://your-domain.com/api/artisans/123e4567-e89b-12d3-a456-426614174000
```

## Related Endpoints
- `PUT /api/artisans/me` - Update own artisan profile (authenticated)
- `GET /api/artisans/me` - Get own artisan profile (authenticated)
- `POST /api/artisans/me/portfolio` - Upload portfolio image (authenticated)
- `POST /api/artisans/me/specializations` - Add specializations (authenticated)

## Implementation Details

### Service Layer
The endpoint uses `ArtisanProfileService.getPublicProfile()` which:
1. Fetches basic profile information from `artisan_profiles` table
2. Checks if profile exists (throws 404 if not)
3. Checks if profile is published (throws 403 if not)
4. Fetches specializations with JOIN to `specializations` table
5. Fetches portfolio images from `portfolio_images` table
6. Calculates review statistics from `reviews` table
7. Returns complete `ArtisanProfileDTO`

### Database Queries
The service performs the following queries:
```sql
-- 1. Fetch profile
SELECT * FROM artisan_profiles WHERE user_id = ?

-- 2. Fetch specializations (with JOIN)
SELECT 
  as.specialization_id,
  s.id,
  s.name
FROM artisan_specializations as
JOIN specializations s ON as.specialization_id = s.id
WHERE as.artisan_id = ?

-- 3. Fetch portfolio images
SELECT id, image_url, created_at
FROM portfolio_images
WHERE artisan_id = ?
ORDER BY created_at DESC

-- 4. Fetch review ratings
SELECT rating FROM reviews WHERE reviewee_id = ?
```

### Performance Considerations
- Specializations, portfolio, and reviews are fetched in **parallel** using `Promise.all()` for optimal performance
- Portfolio images are limited by the artisan (max 10 per profile as per business rules)
- Review statistics are calculated in-memory rather than using database aggregation for flexibility

## Security Considerations
- ✅ No authentication required - this is intentionally a public endpoint
- ✅ Validates artisanId format (UUID) to prevent injection
- ✅ Only returns published profiles (`is_public = true`)
- ✅ No sensitive data exposed (NIP is public business information in Poland)
- ✅ Portfolio images served from secure Supabase Storage with proper RLS policies

## Testing
- **Unit Tests**: `tests/unit/services/artisan-profile.service.test.ts`
- **Integration Tests**: `tests/integration/api/get-artisan-profile.integration.test.ts`
- **Coverage**: Profile not found, profile not published, successful retrieval with full data

## Changelog
- **2025-10-21**: Initial implementation of public artisan profile endpoint
