# API Endpoint Documentation: Create Proposal

## Overview

This document provides comprehensive documentation for the **Create Proposal** API endpoint, which allows authenticated artisans to submit proposals for open projects.

**Endpoint:** `POST /api/projects/{projectId}/proposals`

**Status:** ✅ Implemented (2025-10-21)

---

## Authentication & Authorization

### Required Authentication

- ✅ **Authentication:** Required - Valid Supabase JWT token in `Authorization` header or cookie
- ✅ **User Session:** Must be authenticated via middleware (`locals.user`)

### Authorization Rules

- ✅ **Role Requirement:** Only users with role `artisan` can create proposals
- ✅ **Project Status:** Can only submit proposals to projects with status `open`
- ✅ **Uniqueness:** Each artisan can submit only one proposal per project

---

## Request

### Path Parameters

| Parameter   | Type   | Required | Description         | Validation                |
| ----------- | ------ | -------- | ------------------- | ------------------------- |
| `projectId` | string | ✅ Yes   | UUID of the project | Must be valid UUID format |

### Request Body

**Content-Type:** `multipart/form-data`

| Field        | Type   | Required | Description                                         | Validation                     |
| ------------ | ------ | -------- | --------------------------------------------------- | ------------------------------ |
| `price`      | number | ✅ Yes   | Proposed price for the project (PLN)                | Positive number, max 1,000,000 |
| `attachment` | File   | ✅ Yes   | Proposal attachment (specification, sketches, etc.) | PDF, JPG, PNG; max 5MB         |

### Example Request

```bash
curl -X POST https://api.chairai.com/api/projects/123e4567-e89b-12d3-a456-426614174000/proposals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "price=2500" \
  -F "attachment=@proposal.pdf"
```

---

## Response

### Success Response (201 Created)

Returns the created proposal with artisan details and review statistics.

**Response Body Schema:**

```typescript
{
  id: string; // UUID of the created proposal
  project_id: string; // UUID of the project
  artisan: {
    user_id: string; // UUID of the artisan
    company_name: string; // Artisan's company name
    average_rating: number | null; // Average rating (1-5) or null if no reviews
    total_reviews: number; // Total number of reviews received
  }
  price: number; // Proposed price in PLN
  attachment_url: string; // Public URL of the uploaded attachment
  created_at: string; // ISO 8601 timestamp
}
```

**Example Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "123e4567-e89b-12d3-a456-426614174000",
  "artisan": {
    "user_id": "artisan-uuid-123",
    "company_name": "Stolarstwo Kowalski",
    "average_rating": 4.7,
    "total_reviews": 15
  },
  "price": 2500,
  "attachment_url": "https://storage.chairai.com/proposal-attachments/artisan-uuid-123/project-uuid/file.pdf",
  "created_at": "2025-10-21T14:30:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Error

Invalid input data (projectId, price, or attachment).

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Nieprawidłowy format ID projektu"
  }
}
```

**Common Validation Errors:**

- Invalid `projectId` format (not a valid UUID)
- `price` is not a positive number or exceeds 1,000,000
- `attachment` file is missing, too large (>5MB), or has invalid type
- Missing required fields

#### 401 Unauthorized

User is not authenticated.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wymagane uwierzytelnienie"
  }
}
```

#### 403 Forbidden - Not an Artisan

User is authenticated but doesn't have the `artisan` role.

```json
{
  "error": {
    "code": "FORBIDDEN_NOT_ARTISAN",
    "message": "Tylko rzemieślnicy mogą składać propozycje"
  }
}
```

#### 403 Forbidden - Project Not Open

Project exists but is not accepting proposals (status is not `open`).

```json
{
  "error": {
    "code": "PROJECT_NOT_OPEN",
    "message": "Projekt nie przyjmuje już propozycji"
  }
}
```

#### 404 Not Found - Project Not Found

Project with the specified ID doesn't exist.

```json
{
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Nie znaleziono projektu"
  }
}
```

#### 409 Conflict - Duplicate Proposal

Artisan has already submitted a proposal for this project.

```json
{
  "error": {
    "code": "PROPOSAL_ALREADY_EXISTS",
    "message": "Już złożyłeś propozycję do tego projektu"
  }
}
```

#### 500 Internal Server Error

Unexpected server error (e.g., database connection failure, storage upload failure).

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Wystąpił nieoczekiwany błąd"
  }
}
```

---

## Business Logic Flow

1. **Authentication Check**
   - Verify user is logged in via middleware
   - Extract user ID and role from session

2. **Path Parameter Validation**
   - Validate `projectId` is a valid UUID format

3. **Request Body Parsing**
   - Parse `multipart/form-data`
   - Extract `price` (convert string to number)
   - Extract `attachment` File object

4. **Input Validation**
   - Validate `price` is positive and within limits
   - Validate `attachment` size (<5MB) and type (PDF/JPG/PNG)

5. **Authorization Checks** (via ProposalService)
   - Verify user role is `artisan`
   - Verify project exists and has status `open`
   - Verify artisan hasn't already submitted a proposal

6. **File Upload**
   - Sanitize filename and create unique path: `{artisan_id}/{project_id}/{timestamp}-{random}.{ext}`
   - Upload to Supabase Storage bucket: `proposal-attachments`
   - Get public URL for the uploaded file

7. **Database Insert**
   - Insert new record in `proposals` table
   - Link to project and artisan
   - Store price and attachment URL

8. **Response Enrichment**
   - Fetch artisan profile (company name)
   - Calculate review statistics (average rating, total count)
   - Format response as ProposalDTO

9. **Success Response**
   - Return 201 Created with full proposal data

---

## Storage & File Handling

### Supabase Storage Bucket

**Bucket Name:** `proposal-attachments`

**Configuration:**

- **Public Access:** No (authenticated access only)
- **Max File Size:** 5MB
- **Allowed Types:** PDF, JPG, PNG

### File Organization

Files are organized by artisan and project:

```
proposal-attachments/
├── {artisan_id_1}/
│   ├── {project_id_1}/
│   │   ├── 1729512000000-abc123.pdf
│   │   └── 1729513000000-def456.pdf
│   └── {project_id_2}/
│       └── 1729514000000-ghi789.pdf
└── {artisan_id_2}/
    └── {project_id_3}/
        └── 1729515000000-jkl012.png
```

### RLS (Row Level Security) Policies

| Operation  | Who Can Access | Condition                                            |
| ---------- | -------------- | ---------------------------------------------------- |
| **INSERT** | Artisans       | Can upload to their own folder (`artisan_id`)        |
| **SELECT** | Artisans       | Can view their own files                             |
| **SELECT** | Project Owners | Can view attachments for proposals in their projects |
| **UPDATE** | Artisans       | Can update their own files                           |
| **DELETE** | Artisans       | Can delete their own files                           |

---

## Implementation Details

### Files Created

1. **Schema Validation:** `/src/lib/schemas.ts`
   - `CreateProposalSchema` - Zod schema for input validation

2. **Service Layer:** `/src/lib/services/proposal.service.ts`
   - `ProposalService` - Business logic and database operations
   - `ProposalError` - Custom error class

3. **API Endpoint:** `/src/pages/api/projects/[projectId]/proposals.ts`
   - `POST` handler for creating proposals

4. **Database Migration:** `/supabase/migrations/20251021170000_create_proposal_attachments_bucket.sql`
   - Creates `proposal-attachments` storage bucket
   - Sets up RLS policies

5. **Unit Tests:** `/tests/unit/services/proposal.service.test.ts`
   - Tests for ProposalService business logic

6. **Integration Tests:** `/tests/integration/api/create-proposal.integration.test.ts`
   - Tests for complete API endpoint flow

### Type Definitions

All types are defined in `/src/types.ts`:

- `ProposalDTO` - Response structure
- `CreateProposalCommand` - Request structure (for frontend)
- `ProposalArtisanDTO` - Artisan data in proposal context

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run specific test file
npm test proposal.service.test.ts
```

### Test Coverage

- ✅ **Unit Tests:** 100% coverage of ProposalService
  - Authorization checks (role, project status, uniqueness)
  - File upload validation (size, type)
  - Error handling scenarios
  - Successful proposal creation

- ✅ **Integration Tests:** Complete API flow testing
  - Authentication/authorization
  - Input validation (projectId, price, attachment)
  - Business logic validation
  - Success scenarios with mocked database and storage

---

## Security Considerations

### Authentication

- JWT token validation via Supabase Auth
- Session management through middleware

### Authorization

- Role-based access control (artisans only)
- Project status verification (open projects only)
- One proposal per artisan per project

### File Security

- File type validation (whitelist: PDF, JPG, PNG)
- File size limit (5MB)
- Filename sanitization to prevent path traversal
- Secure storage with RLS policies
- Access control: artisan + project owner only

### Input Validation

- Strict Zod schema validation
- UUID format validation for projectId
- Numeric range validation for price
- File metadata validation

---

## Performance Considerations

- **Database Queries:** Optimized to minimize round-trips
- **File Upload:** Direct upload to Supabase Storage (no server buffering)
- **Response Size:** Efficient DTO structure with only necessary data
- **Error Handling:** Fast-fail validation with early returns

---

## Future Enhancements

Potential improvements for future iterations:

1. **Direct Client Upload:** Consider using signed URLs for direct client-to-storage uploads
2. **Proposal Versioning:** Allow artisans to update their proposals
3. **Proposal Templates:** Provide pre-made proposal templates
4. **Real-time Notifications:** Notify project owners of new proposals
5. **Proposal Analytics:** Track view counts and engagement metrics

---

## Related Endpoints

- `GET /api/projects/{projectId}` - Get project details
- `GET /api/projects/{projectId}/proposals` - List proposals for a project
- `GET /api/artisans/{artisanId}` - Get artisan public profile
- `GET /api/proposals/me` - Get artisan's own proposals

---

## Changelog

| Date       | Version | Changes                                            |
| ---------- | ------- | -------------------------------------------------- |
| 2025-10-21 | 1.0.0   | Initial implementation of Create Proposal endpoint |

---

## Support & Contact

For questions or issues with this endpoint, please:

1. Check the error response for specific error codes
2. Review the validation requirements in this documentation
3. Contact the development team if issues persist

---

**Last Updated:** 2025-10-21  
**Maintained By:** ChairAI Development Team
