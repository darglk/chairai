# API Documentation - Generated Images Endpoints

## Overview
Endpoints for managing AI-generated furniture images. Part of US-004 implementation.

## Endpoints

### 1. Generate Image
**POST** `/api/images/generate`

Generates a furniture image using AI based on a text prompt.

#### Authentication
Required: Yes (Client role only)

#### Request Body
```json
{
  "prompt": "A modern oak dining table with metal legs"
}
```

#### Validation
- `prompt`: Required, 10-500 characters

#### Success Response (201 Created)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "prompt": "A modern oak dining table with metal legs",
  "image_url": "https://...",
  "created_at": "2025-10-17T10:00:00Z",
  "is_used": false,
  "remaining_generations": 9
}
```

#### Error Responses
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User is not a client
- `404 Not Found` - User not found
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Generation limit (10) reached
- `500 Internal Server Error` - Database error
- `503 Service Unavailable` - AI service error

---

### 2. List Generated Images
**GET** `/api/images/generated`

Returns paginated list of user's generated images.

#### Authentication
Required: Yes (Client role only)

#### Query Parameters
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page
- `unused_only` (optional, default: false): Show only images not used in projects

#### Success Response (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "prompt": "A modern oak dining table",
      "image_url": "https://...",
      "created_at": "2025-10-17T10:00:00Z",
      "is_used": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  },
  "remaining_generations": 5
}
```

#### Error Responses
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User is not a client
- `404 Not Found` - User not found
- `422 Unprocessable Entity` - Invalid query parameters
- `500 Internal Server Error` - Database error

---

### 3. Get Image Details
**GET** `/api/images/generated/{imageId}`

Returns details of a specific generated image.

#### Authentication
Required: Yes (Client role only, must be image owner)

#### URL Parameters
- `imageId`: UUID of the image

#### Success Response (200 OK)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "prompt": "A modern oak dining table",
  "image_url": "https://...",
  "created_at": "2025-10-17T10:00:00Z",
  "is_used": false
}
```

#### Error Responses
- `400 Bad Request` - Missing imageId
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User is not a client
- `404 Not Found` - Image not found or not owned by user
- `500 Internal Server Error` - Database error

---

### 4. Delete Image
**DELETE** `/api/images/generated/{imageId}`

Deletes a generated image. Only allowed if image is not used in any project.

#### Authentication
Required: Yes (Client role only, must be image owner)

#### URL Parameters
- `imageId`: UUID of the image

#### Success Response (204 No Content)
No response body.

#### Error Responses
- `400 Bad Request` - Missing imageId OR image is used in a project
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User is not a client
- `404 Not Found` - Image not found or not owned by user
- `500 Internal Server Error` - Database error

---

## Implementation Notes

### AI Service
Currently uses a mock implementation with Unsplash images. Production implementation should integrate with:
- DALL-E API
- Stable Diffusion
- Midjourney API
- Or other AI image generation service

Location: `src/lib/services/ai-image.service.ts`

### Generation Limit
- Maximum free generations: 10 per client
- Configured in: `AI_IMAGE_CONFIG.MAX_FREE_GENERATIONS`

### Database Schema
Table: `generated_images`
```sql
- id: uuid (primary key)
- user_id: uuid (foreign key to users)
- prompt: text (nullable)
- image_url: text
- created_at: timestamp
```

### Security
- All endpoints require authentication
- Only clients can access these endpoints
- Users can only access/modify their own images
- Images used in projects cannot be deleted
- Row Level Security (RLS) enabled on database table

### Performance Considerations
- Image listings use pagination
- `unused_only` filter uses subquery (may be slow with many images)
- Consider adding database index on `generated_image_id` in `projects` table
- AI generation timeout: 30 seconds

## Testing

### Manual Testing Examples

```bash
# 1. Generate image
curl -X POST http://localhost:4321/api/images/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A modern oak dining table with metal legs"}'

# 2. List images
curl -X GET "http://localhost:4321/api/images/generated?page=1&limit=20&unused_only=false" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Get image details
curl -X GET http://localhost:4321/api/images/generated/IMAGE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Delete image
curl -X DELETE http://localhost:4321/api/images/generated/IMAGE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Scenarios
1. ✅ Generate image with valid prompt
2. ✅ Generate image with too short prompt (< 10 chars)
3. ✅ Generate image after reaching 10 generation limit
4. ✅ List images with pagination
5. ✅ List only unused images
6. ✅ Get image details for owned image
7. ✅ Try to get image details for another user's image
8. ✅ Delete unused image
9. ✅ Try to delete image used in project
10. ✅ Try to access endpoints as artisan user

## Next Steps
- [ ] Integrate real AI image generation service
- [ ] Add image storage service (S3, Cloudinary, etc.)
- [ ] Implement image optimization and resizing
- [ ] Add webhooks for async generation
- [ ] Implement generation analytics
- [ ] Add NSFW content filtering
- [ ] Consider paid generation plans beyond free limit
