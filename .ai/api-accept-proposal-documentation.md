# API Endpoint Documentation: Accept Proposal

## Overview

This document provides comprehensive documentation for the **Accept Proposal** API endpoint, which allows authenticated clients (project owners) to accept a proposal submitted by an artisan for their project.

**Endpoint:** `POST /api/projects/{projectId}/accept-proposal`

**Status:** ✅ Implemented (2025-10-22)

---

## Authentication & Authorization

### Required Authentication

- ✅ **Authentication:** Required - Valid Supabase JWT token in `Authorization` header or cookie
- ✅ **User Session:** Must be authenticated via middleware (`locals.user`)

### Authorization Rules

- ✅ **Ownership:** Only the project owner (client) can accept proposals for their project
- ✅ **Project Status:** Can only accept proposals for projects with status `open`
- ✅ **Single Acceptance:** Once a proposal is accepted, project status changes to `in_progress`

---

## Request

### Path Parameters

| Parameter   | Type   | Required | Description         | Validation                |
| ----------- | ------ | -------- | ------------------- | ------------------------- |
| `projectId` | string | ✅ Yes   | UUID of the project | Must be valid UUID format |

### Request Body

**Content-Type:** `application/json`

| Field         | Type   | Required | Description                    | Validation                |
| ------------- | ------ | -------- | ------------------------------ | ------------------------- |
| `proposal_id` | string | ✅ Yes   | UUID of the proposal to accept | Must be valid UUID format |

### Example Request

```bash
curl -X POST https://api.chairai.com/api/projects/123e4567-e89b-12d3-a456-426614174000/accept-proposal \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proposal_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**JavaScript/TypeScript Example:**

```typescript
const response = await fetch(`/api/projects/${projectId}/accept-proposal`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    proposal_id: proposalId,
  }),
});

const result = await response.json();
```

---

## Response

### Success Response (200 OK)

Returns the updated project with accepted proposal details.

**Response Body Schema:**

```typescript
{
  id: string; // UUID of the project
  status: "in_progress"; // New project status
  accepted_proposal_id: string; // UUID of the accepted proposal
  accepted_price: number; // Price from the accepted proposal (PLN)
  updated_at: string; // ISO 8601 timestamp of update
}
```

**Example Response:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "in_progress",
  "accepted_proposal_id": "550e8400-e29b-41d4-a716-446655440000",
  "accepted_price": 2500.0,
  "updated_at": "2025-10-22T10:00:00.000Z"
}
```

---

## Error Responses

### 400 Bad Request - Validation Error

Invalid input data (projectId or proposal_id format).

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Nieprawidłowy format ID projektu"
  }
}
```

**Common validation errors:**

- Invalid UUID format for `projectId`
- Invalid UUID format for `proposal_id`
- Missing `proposal_id` in request body

---

### 400 Bad Request - Project Not Open

Project status is not `open`, so proposals cannot be accepted.

```json
{
  "error": {
    "code": "PROJECT_NOT_OPEN",
    "message": "Nie można zaakceptować propozycji. Projekt nie jest otwarty"
  }
}
```

**When this occurs:**

- Project status is `in_progress`, `completed`, or `closed`
- A proposal has already been accepted

---

### 400 Bad Request - Proposal Mismatch

The proposal does not belong to the specified project.

```json
{
  "error": {
    "code": "PROPOSAL_PROJECT_MISMATCH",
    "message": "Propozycja nie należy do tego projektu"
  }
}
```

---

### 401 Unauthorized - Authentication Required

No valid authentication token provided.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wymagane uwierzytelnienie"
  }
}
```

**When this occurs:**

- Missing JWT token
- Invalid or expired JWT token
- User session not found

---

### 403 Forbidden - Not Project Owner

Authenticated user is not the owner of the project.

```json
{
  "error": {
    "code": "PROJECT_FORBIDDEN",
    "message": "Nie masz uprawnień do akceptacji propozycji dla tego projektu"
  }
}
```

**Authorization check:**

- User's ID must match `client_id` of the project
- Only project owner can accept proposals

---

### 404 Not Found - Project Not Found

Project with the specified ID does not exist.

```json
{
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Nie znaleziono projektu"
  }
}
```

---

### 404 Not Found - Proposal Not Found

Proposal with the specified ID does not exist.

```json
{
  "error": {
    "code": "PROPOSAL_NOT_FOUND",
    "message": "Nie znaleziono propozycji"
  }
}
```

---

### 500 Internal Server Error

Unexpected server error during proposal acceptance.

```json
{
  "error": {
    "code": "PROPOSAL_ACCEPT_FAILED",
    "message": "Nie udało się zaakceptować propozycji"
  }
}
```

**When this occurs:**

- Database connection failure
- Transaction rollback
- Unexpected system error

---

## Business Logic Flow

### 1. Authentication Verification

- Verify user is authenticated via JWT token
- Extract user ID from session

### 2. Path Parameter Validation

- Validate `projectId` is a valid UUID
- Return `400` if validation fails

### 3. Request Body Validation

- Parse JSON body
- Validate `proposal_id` is present and valid UUID
- Return `400` if validation fails

### 4. Project Authorization

- Fetch project from database
- Verify project exists (return `404` if not)
- Verify user is project owner (return `403` if not)
- Verify project status is `open` (return `400` if not)

### 5. Proposal Validation

- Fetch proposal from database
- Verify proposal exists (return `404` if not)
- Verify proposal belongs to project (return `400` if mismatch)

### 6. Accept Proposal (Transaction)

- Update project record:
  - Set `status` to `in_progress`
  - Set `accepted_proposal_id` to proposal ID
  - Set `accepted_price` to proposal price
  - Update `updated_at` timestamp
- Return updated project data

---

## Database Operations

### Tables Involved

1. **projects** - Updated with accepted proposal details
2. **proposals** - Read to get proposal details

### Transaction Safety

- All operations are performed within a single database transaction
- Ensures data consistency if any step fails

### RLS (Row Level Security) Policies

- **UPDATE on projects:** Only `client_id` matches authenticated user
- **SELECT on proposals:** Visible to project owner and proposal author

---

## Testing

### Unit Tests

✅ **File:** `tests/unit/services/project-service-accept-proposal.test.ts`

**Test Coverage:**

- ✅ Successful proposal acceptance
- ✅ Project not found (404)
- ✅ Unauthorized user (403)
- ✅ Project not open (400)
- ✅ Proposal not found (404)
- ✅ Proposal mismatch (400)
- ✅ Database update failure (500)

### Integration Tests

✅ **File:** `tests/integration/api/accept-proposal.integration.test.ts`

**Test Coverage:**

- ✅ Authentication validation
- ✅ Input validation (projectId, proposal_id)
- ✅ Authorization checks
- ✅ Business logic validation
- ✅ Database operations
- ✅ Error handling

### E2E Tests

📋 **Planned:** `tests/e2e/accept-proposal.spec.ts`

**Test Scenarios:**

- Full user flow: Create project → Receive proposal → Accept proposal
- Status transition validation
- UI state updates after acceptance

---

## Related Endpoints

### Get Project Details

- **Endpoint:** `GET /api/projects/{projectId}`
- **Purpose:** View project details including accepted proposal

### List Project Proposals

- **Endpoint:** `GET /api/projects/{projectId}/proposals`
- **Purpose:** View all proposals for a project before accepting

### Create Proposal

- **Endpoint:** `POST /api/projects/{projectId}/proposals`
- **Purpose:** Artisan submits proposal to project

---

## Implementation Details

### Files Modified/Created

#### Handler

**File:** `src/pages/api/projects/[projectId]/accept-proposal.ts`

- Implements POST endpoint
- Handles authentication and validation
- Calls ProjectService for business logic

#### Service

**File:** `src/lib/services/project.service.ts`

- Method: `acceptProposal(projectId, proposalId, userId)`
- Contains all business logic and validations
- Performs database operations

#### Schema

**File:** `src/lib/schemas.ts`

- `AcceptProposalSchema` - Validates request body
- `ProjectIdSchema` - Validates path parameter

#### Types

**File:** `src/types.ts`

- `AcceptProposalCommand` - Request body type
- `ProjectDTO` - Response type (partial)

---

## Security Considerations

### Authentication

- ✅ JWT token validation via Astro middleware
- ✅ Session verification in handler

### Authorization

- ✅ Ownership verification: User must be project owner
- ✅ Status verification: Project must be open
- ✅ Relationship verification: Proposal must belong to project

### Data Validation

- ✅ UUID format validation for all IDs
- ✅ Request body validation using Zod
- ✅ SQL injection prevention via parameterized queries

### RLS Policies

- ✅ Database-level security enforced by Supabase RLS
- ✅ Double verification (application + database)

---

## Performance Considerations

### Database Queries

- 3 database operations per request:
  1. SELECT project (with authorization check)
  2. SELECT proposal (with validation)
  3. UPDATE project (with transaction)

### Optimization

- Uses indexed columns (primary keys, foreign keys)
- Single transaction for atomicity
- Minimal data returned in response

### Expected Load

- Low to medium frequency endpoint
- Triggered only when client accepts proposal
- No caching needed (state-changing operation)

---

## Changelog

### 2025-10-22 - Initial Implementation

- ✅ Implemented POST endpoint handler
- ✅ Created ProjectService.acceptProposal() method
- ✅ Added Zod validation schemas
- ✅ Implemented comprehensive error handling
- ✅ Added unit tests (7 tests)
- ✅ Added integration tests (11 tests)
- ✅ Created API documentation

---

## Support

For questions or issues related to this endpoint, please refer to:

- **Implementation Plan:** `.ai/accept-proposal-rest-implementation-plan.md`
- **Implementation Report:** `.ai/accept-proposal-implementation-report.md`
- **Project Types:** `src/types.ts`
- **Test Files:** `tests/unit/services/` and `tests/integration/api/`
