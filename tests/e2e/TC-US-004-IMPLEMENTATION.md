# Image Generator Tests Documentation

## Test Structure

Tests for the Image Generator feature are organized in three levels:

### 1. Unit Tests

**Location:** `tests/unit/components/useImageGenerator.test.ts`

Tests for the custom hook `useImageGenerator`:

- Initial state validation
- Error handling for invalid prompts (empty, too short, too long)
- Generation state management
- Error mapping for different HTTP status codes (400, 429, 503)
- State clearing and reset functionality

**Run:**

```bash
npm run test:unit -- useImageGenerator.test.ts
```

### 2. Integration Tests

**Location:** `tests/integration/components/ImageGeneratorContainer.test.tsx`

Tests for the complete `ImageGeneratorContainer` component:

- Component rendering with all sections
- Prompt input field functionality
- Generate button state management (disabled/enabled)
- Character counting
- Quota display and progress bar
- Interaction between sub-components

**Run:**

```bash
npm run test:integration -- ImageGeneratorContainer.test.tsx
```

### 3. E2E Tests

**Location:** `tests/e2e/TC-US-004-image-generator.spec.ts`

Full end-to-end workflow tests using Playwright:

- Page loads correctly for authenticated clients
- Prompt validation and input handling
- Image generation workflow
- Quota updates after generation
- Save image to gallery
- Use image in project (localStorage + navigation)
- Error handling and display
- Generate new image flow (reset)
- Authentication restrictions
- Role-based access control

**Run:**

```bash
npm run test:e2e -- TC-US-004-image-generator.spec.ts
```

## Test Cases Coverage

### Prompt Validation

- ✅ Empty prompt rejected
- ✅ Prompt < 10 characters rejected
- ✅ Prompt > 500 characters rejected
- ✅ Valid prompt (10-500 characters) accepted

### Generation Flow

- ✅ Loading state displayed during generation
- ✅ Button disabled during generation
- ✅ Success response updates state with image data
- ✅ Quota decrements after successful generation

### Error Handling

- ✅ 400 Bad Request → VALIDATION_ERROR
- ✅ 401 Unauthorized → UNAUTHORIZED
- ✅ 403 Forbidden → FORBIDDEN
- ✅ 429 Too Many Requests → RATE_LIMIT_EXCEEDED
- ✅ 503 Service Unavailable → SERVICE_UNAVAILABLE
- ✅ Network timeout handled gracefully

### UI States

- ✅ Form displayed when no image generated
- ✅ Image display section shown after generation
- ✅ Error messages displayed with close button
- ✅ Quota progress bar updates correctly
- ✅ Regenerate button clears state

### Access Control

- ✅ Unauthenticated users redirected to /login
- ✅ Non-client users redirected away from /generate
- ✅ Clients can access /generate page

### Integration Points

- ✅ localStorage.setItem("selectedGeneratedImageId") on project navigation
- ✅ Redirect to /project/create with image ID
- ✅ API integration with /api/images/generate
- ✅ Middleware protects route (PROTECTED_ROUTES)

## Running All Tests

```bash
# Run all unit tests
npm run test:unit

# Run all integration tests
npm run test:integration

# Run all E2E tests
npm run test:e2e

# Run all tests
npm run test
```

## Test Data

### Mock User (Integration/E2E)

- Email: `client@example.com`
- Role: `client`
- ID: `user-123`

### Test Prompts

- Short (valid): "A modern oak dining table with metal legs" (44 chars)
- Very short (invalid): "abc" (3 chars)
- Very long (invalid): Generated with `"a".repeat(501)`
- Empty (invalid): ""

## Expected API Responses

### Success (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-123",
  "prompt": "A modern oak dining table with metal legs",
  "image_url": "https://storage.supabase.co/...",
  "created_at": "2025-10-18T12:30:45Z",
  "is_used": false,
  "remaining_generations": 9
}
```

### Error (429 Quota Exceeded)

```json
{
  "error": {
    "code": "GENERATION_LIMIT_REACHED",
    "message": "User has exceeded generation quota"
  }
}
```

## Debugging Tests

### View Playwright UI

```bash
npm run test:e2e -- --ui
```

### Debug E2E Tests

```bash
npm run test:e2e -- --debug
```

### Generate Report

```bash
npm run test:e2e -- --reporter=html
open playwright-report/index.html
```

## Notes

- Tests assume `/api/images/generate` endpoint is working correctly
- E2E tests require valid authentication setup (users must exist in database)
- Tests respect rate limiting - avoid running too many generations rapidly
- Quota is per user, so each test should clean up or use fresh user accounts
