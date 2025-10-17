# REST API Plan for ChairAI

## 1. Resources

| Resource | Database Table(s) | Description |
|----------|------------------|-------------|
| Auth | `users` (via Supabase Auth) | User authentication and session management |
| Users | `users` | Basic user information and role |
| Artisan Profiles | `artisan_profiles`, `artisan_specializations`, `portfolio_images` | Extended profile information for artisan users |
| Generated Images | `generated_images` | AI-generated furniture images |
| Projects | `projects` | Client-created furniture project listings |
| Proposals | `proposals` | Artisan proposals for projects |
| Reviews | `reviews` | Bidirectional ratings and reviews |
| Categories | `categories` | Dictionary of furniture categories |
| Materials | `materials` | Dictionary of materials |
| Specializations | `specializations` | Dictionary of artisan specializations |

## 2. Endpoints

### 2.1 Authentication

#### Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Description**: Register a new user account (client or artisan)
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "client" // or "artisan"
}
```
- **Success Response** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client",
    "created_at": "2025-10-12T10:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid email format or weak password
  - `409 Conflict`: Email already exists
  - `422 Unprocessable Entity`: Invalid role value

#### Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Description**: Authenticate user and obtain session token
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
- **Success Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client",
    "created_at": "2025-10-12T10:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid credentials

#### Logout
- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Description**: Invalidate current session
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (204 No Content)
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired token

### 2.2 Users

#### Get Current User
- **Method**: `GET`
- **Path**: `/api/users/me`
- **Description**: Get current authenticated user information
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (200 OK):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "client",
  "created_at": "2025-10-12T10:00:00Z"
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired token

### 2.3 Artisan Profiles

#### Get Artisan Profile
- **Method**: `GET`
- **Path**: `/api/artisans/{artisanId}`
- **Description**: Get public artisan profile information
- **Success Response** (200 OK):
```json
{
  "user_id": "uuid",
  "company_name": "Master Woodworks",
  "nip": "1234567890",
  "is_public": true,
  "specializations": [
    {
      "id": "uuid",
      "name": "Tables"
    },
    {
      "id": "uuid",
      "name": "Chairs"
    }
  ],
  "portfolio_images": [
    {
      "id": "uuid",
      "image_url": "https://storage.supabase.co/...",
      "created_at": "2025-10-12T10:00:00Z"
    }
  ],
  "average_rating": 4.5,
  "total_reviews": 12,
  "updated_at": "2025-10-12T10:00:00Z"
}
```
- **Error Responses**:
  - `404 Not Found`: Artisan not found or profile not public

#### Get My Artisan Profile
- **Method**: `GET`
- **Path**: `/api/artisans/me`
- **Description**: Get own artisan profile (including non-public data)
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (200 OK): Same as Get Artisan Profile
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User is not an artisan
  - `404 Not Found`: Profile not yet created

#### Create/Update Artisan Profile
- **Method**: `PUT`
- **Path**: `/api/artisans/me`
- **Description**: Create or update own artisan profile
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:
```json
{
  "company_name": "Master Woodworks",
  "nip": "1234567890"
}
```
- **Success Response** (200 OK):
```json
{
  "user_id": "uuid",
  "company_name": "Master Woodworks",
  "nip": "1234567890",
  "is_public": false,
  "updated_at": "2025-10-12T10:00:00Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid NIP format (must be 10 digits)
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User is not an artisan
  - `409 Conflict`: NIP already exists

#### Add Artisan Specializations
- **Method**: `POST`
- **Path**: `/api/artisans/me/specializations`
- **Description**: Add specializations to artisan profile
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:
```json
{
  "specialization_ids": ["uuid1", "uuid2"]
}
```
- **Success Response** (200 OK):
```json
{
  "specializations": [
    {
      "id": "uuid1",
      "name": "Tables"
    },
    {
      "id": "uuid2",
      "name": "Chairs"
    }
  ]
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid specialization IDs
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User is not an artisan

#### Remove Artisan Specialization
- **Method**: `DELETE`
- **Path**: `/api/artisans/me/specializations/{specializationId}`
- **Description**: Remove specialization from artisan profile
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (204 No Content)
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User is not an artisan
  - `404 Not Found`: Specialization not found in profile

#### Upload Portfolio Image
- **Method**: `POST`
- **Path**: `/api/artisans/me/portfolio`
- **Description**: Upload image to artisan portfolio
- **Headers**: 
  - `Authorization: Bearer {access_token}`
  - `Content-Type: multipart/form-data`
- **Request Body**: Form data with `image` file field
- **Success Response** (201 Created):
```json
{
  "id": "uuid",
  "artisan_id": "uuid",
  "image_url": "https://storage.supabase.co/...",
  "created_at": "2025-10-12T10:00:00Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid image format or size
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User is not an artisan

#### Delete Portfolio Image
- **Method**: `DELETE`
- **Path**: `/api/artisans/me/portfolio/{imageId}`
- **Description**: Delete image from artisan portfolio
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (204 No Content)
- **Error Responses**:
  - `400 Bad Request`: Cannot delete if it would result in less than 5 images and profile is public
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User is not an artisan or doesn't own the image
  - `404 Not Found`: Image not found

### 2.4 Generated Images

#### Generate Image
- **Method**: `POST`
- **Path**: `/api/images/generate`
- **Description**: Generate furniture image using AI based on text prompt
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:
```json
{
  "prompt": "A modern oak dining table with metal legs"
}
```
- **Success Response** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "prompt": "A modern oak dining table with metal legs",
  "image_url": "https://storage.supabase.co/...",
  "created_at": "2025-10-12T10:00:00Z",
  "remaining_generations": 9
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid or empty prompt
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User is not a client or generation limit exceeded
  - `503 Service Unavailable`: AI service temporarily unavailable

#### List My Generated Images
- **Method**: `GET`
- **Path**: `/api/images/generated`
- **Description**: Get list of user's generated images
- **Headers**: `Authorization: Bearer {access_token}`
- **Query Parameters**:
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 20, max: 100): Items per page
  - `unused_only` (optional, default: false): Filter to show only images not used in projects
- **Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "prompt": "A modern oak dining table with metal legs",
      "image_url": "https://storage.supabase.co/...",
      "created_at": "2025-10-12T10:00:00Z",
      "is_used": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "total_pages": 1
  },
  "remaining_generations": 9
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User is not a client

#### Get Generated Image
- **Method**: `GET`
- **Path**: `/api/images/generated/{imageId}`
- **Description**: Get specific generated image details
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "prompt": "A modern oak dining table with metal legs",
  "image_url": "https://storage.supabase.co/...",
  "created_at": "2025-10-12T10:00:00Z",
  "is_used": false
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User doesn't own the image
  - `404 Not Found`: Image not found

#### Delete Generated Image
- **Method**: `DELETE`
- **Path**: `/api/images/generated/{imageId}`
- **Description**: Delete generated image (only if not used in project)
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (204 No Content)
- **Error Responses**:
  - `400 Bad Request`: Cannot delete image already used in project
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User doesn't own the image
  - `404 Not Found`: Image not found

### 2.5 Projects

#### Create Project
- **Method**: `POST`
- **Path**: `/api/projects`
- **Description**: Create new project listing based on generated image
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:
```json
{
  "generated_image_id": "uuid",
  "category_id": "uuid",
  "material_id": "uuid",
  "dimensions": "200cm x 90cm x 75cm",
  "budget_range": "2000-3000 PLN"
}
```
- **Success Response** (201 Created):
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "generated_image_id": "uuid",
  "category_id": "uuid",
  "material_id": "uuid",
  "status": "open",
  "dimensions": "200cm x 90cm x 75cm",
  "budget_range": "2000-3000 PLN",
  "accepted_proposal_id": null,
  "accepted_price": null,
  "created_at": "2025-10-12T10:00:00Z",
  "updated_at": "2025-10-12T10:00:00Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing required fields or invalid IDs
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User is not a client or doesn't own the image
  - `404 Not Found`: Generated image, category, or material not found
  - `409 Conflict`: Image already used in another project

#### List Projects (Marketplace)
- **Method**: `GET`
- **Path**: `/api/projects`
- **Description**: List open projects (marketplace view for artisans)
- **Headers**: `Authorization: Bearer {access_token}` (required for artisans)
- **Query Parameters**:
  - `status` (optional, default: open): Filter by status
  - `category_id` (optional): Filter by category
  - `material_id` (optional): Filter by material
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 20, max: 100): Items per page
- **Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "generated_image": {
        "id": "uuid",
        "image_url": "https://storage.supabase.co/...",
        "prompt": "A modern oak dining table with metal legs"
      },
      "category": {
        "id": "uuid",
        "name": "Tables"
      },
      "material": {
        "id": "uuid",
        "name": "Oak"
      },
      "status": "open",
      "dimensions": "200cm x 90cm x 75cm",
      "budget_range": "2000-3000 PLN",
      "created_at": "2025-10-12T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired token (if authentication required)
  - `403 Forbidden`: User is not an artisan (for non-open projects)

#### Get Project Details
- **Method**: `GET`
- **Path**: `/api/projects/{projectId}`
- **Description**: Get detailed project information
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (200 OK):
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "generated_image": {
    "id": "uuid",
    "image_url": "https://storage.supabase.co/...",
    "prompt": "A modern oak dining table with metal legs"
  },
  "category": {
    "id": "uuid",
    "name": "Tables"
  },
  "material": {
    "id": "uuid",
    "name": "Oak"
  },
  "status": "open",
  "dimensions": "200cm x 90cm x 75cm",
  "budget_range": "2000-3000 PLN",
  "accepted_proposal_id": null,
  "accepted_price": null,
  "proposals_count": 3,
  "created_at": "2025-10-12T10:00:00Z",
  "updated_at": "2025-10-12T10:00:00Z"
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User doesn't have access to this project
  - `404 Not Found`: Project not found

#### List My Projects
- **Method**: `GET`
- **Path**: `/api/projects/me`
- **Description**: List current user's projects
- **Headers**: `Authorization: Bearer {access_token}`
- **Query Parameters**:
  - `status` (optional): Filter by status
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 20, max: 100): Items per page
- **Success Response** (200 OK): Same structure as List Projects
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User is not a client

#### Update Project Status
- **Method**: `PATCH`
- **Path**: `/api/projects/{projectId}/status`
- **Description**: Update project status (client only)
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:
```json
{
  "status": "completed"
}
```
- **Success Response** (200 OK):
```json
{
  "id": "uuid",
  "status": "completed",
  "updated_at": "2025-10-12T10:00:00Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid status transition
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User doesn't own the project
  - `404 Not Found`: Project not found

#### Accept Proposal
- **Method**: `POST`
- **Path**: `/api/projects/{projectId}/accept-proposal`
- **Description**: Accept an artisan's proposal and change project status to in_progress
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:
```json
{
  "proposal_id": "uuid"
}
```
- **Success Response** (200 OK):
```json
{
  "id": "uuid",
  "status": "in_progress",
  "accepted_proposal_id": "uuid",
  "accepted_price": 2500.00,
  "updated_at": "2025-10-12T10:00:00Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid proposal or project not in open status
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User doesn't own the project
  - `404 Not Found`: Project or proposal not found

### 2.6 Proposals

#### Create Proposal
- **Method**: `POST`
- **Path**: `/api/projects/{projectId}/proposals`
- **Description**: Submit proposal for a project
- **Headers**: 
  - `Authorization: Bearer {access_token}`
  - `Content-Type: multipart/form-data`
- **Request Body**: Form data with:
  - `price` (number): Proposed price in PLN
  - `attachment` (file): PDF or image file with specifications
- **Success Response** (201 Created):
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "artisan_id": "uuid",
  "price": 2500.00,
  "attachment_url": "https://storage.supabase.co/...",
  "created_at": "2025-10-12T10:00:00Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing or invalid fields, invalid file format
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User is not an artisan or project is not open
  - `404 Not Found`: Project not found
  - `409 Conflict`: Artisan already submitted proposal for this project

#### List Project Proposals
- **Method**: `GET`
- **Path**: `/api/projects/{projectId}/proposals`
- **Description**: Get all proposals for a project (client owner only)
- **Headers**: `Authorization: Bearer {access_token}`
- **Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "artisan": {
        "user_id": "uuid",
        "company_name": "Master Woodworks",
        "average_rating": 4.5,
        "total_reviews": 12
      },
      "price": 2500.00,
      "attachment_url": "https://storage.supabase.co/...",
      "created_at": "2025-10-12T10:00:00Z"
    }
  ],
  "total": 3
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User doesn't own the project
  - `404 Not Found`: Project not found

#### Get My Proposals
- **Method**: `GET`
- **Path**: `/api/proposals/me`
- **Description**: Get all proposals submitted by current artisan
- **Headers**: `Authorization: Bearer {access_token}`
- **Query Parameters**:
  - `status` (optional): Filter by project status (open, in_progress, completed)
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 20, max: 100): Items per page
- **Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "project": {
        "id": "uuid",
        "status": "open",
        "category": {
          "id": "uuid",
          "name": "Tables"
        },
        "generated_image": {
          "image_url": "https://storage.supabase.co/..."
        }
      },
      "price": 2500.00,
      "attachment_url": "https://storage.supabase.co/...",
      "created_at": "2025-10-12T10:00:00Z",
      "is_accepted": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User is not an artisan

### 2.7 Reviews

#### Create Review
- **Method**: `POST`
- **Path**: `/api/projects/{projectId}/reviews`
- **Description**: Submit review for completed project
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:
```json
{
  "rating": 5,
  "comment": "Excellent craftsmanship and communication"
}
```
- **Success Response** (201 Created):
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "reviewer_id": "uuid",
  "reviewee_id": "uuid",
  "rating": 5,
  "comment": "Excellent craftsmanship and communication",
  "created_at": "2025-10-12T10:00:00Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid rating (must be 1-5) or project not completed
  - `401 Unauthorized`: Invalid or expired token
  - `403 Forbidden`: User not involved in project or already reviewed
  - `404 Not Found`: Project not found
  - `409 Conflict`: User already submitted review for this project

#### Get Artisan Reviews
- **Method**: `GET`
- **Path**: `/api/artisans/{artisanId}/reviews`
- **Description**: Get all reviews for an artisan
- **Query Parameters**:
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 20, max: 100): Items per page
- **Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "project": {
        "id": "uuid",
        "category": {
          "name": "Tables"
        }
      },
      "reviewer": {
        "id": "uuid",
        "email": "client@example.com"
      },
      "rating": 5,
      "comment": "Excellent craftsmanship and communication",
      "created_at": "2025-10-12T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "total_pages": 1
  },
  "summary": {
    "average_rating": 4.5,
    "total_reviews": 12,
    "rating_distribution": {
      "5": 8,
      "4": 3,
      "3": 1,
      "2": 0,
      "1": 0
    }
  }
}
```
- **Error Responses**:
  - `404 Not Found`: Artisan not found

### 2.8 Dictionary Resources

#### List Categories
- **Method**: `GET`
- **Path**: `/api/categories`
- **Description**: Get all furniture categories
- **Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Tables"
    },
    {
      "id": "uuid",
      "name": "Chairs"
    }
  ]
}
```

#### List Materials
- **Method**: `GET`
- **Path**: `/api/materials`
- **Description**: Get all available materials
- **Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Oak"
    },
    {
      "id": "uuid",
      "name": "Pine"
    }
  ]
}
```

#### List Specializations
- **Method**: `GET`
- **Path**: `/api/specializations`
- **Description**: Get all artisan specializations
- **Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Tables"
    },
    {
      "id": "uuid",
      "name": "Custom Furniture"
    }
  ]
}
```

## 3. Authentication and Authorization

### Authentication Mechanism
- **Provider**: Supabase Auth
- **Method**: JWT (JSON Web Token) based authentication
- **Token Storage**: Client-side (localStorage or httpOnly cookies recommended)
- **Token Lifetime**: Access token (1 hour), Refresh token (30 days)

### Implementation Details

1. **Registration Flow**:
   - User submits credentials and role to `/api/auth/register`
   - System creates entry in `auth.users` (Supabase managed)
   - System creates corresponding entry in `users` table with role
   - System returns user object and session tokens

2. **Authentication Flow**:
   - User submits credentials to `/api/auth/login`
   - Supabase validates credentials
   - System returns JWT access token and refresh token
   - Client includes token in `Authorization: Bearer {token}` header for subsequent requests

3. **Token Refresh**:
   - Use Supabase client library to automatically refresh tokens
   - Refresh endpoint: `/api/auth/refresh` (handled by Supabase)

4. **Authorization Levels**:
   - **Public**: Dictionary endpoints (categories, materials, specializations), public artisan profiles
   - **Authenticated**: All other endpoints require valid JWT token
   - **Role-based**: 
     - Client-only: Image generation, project creation, proposal acceptance
     - Artisan-only: Artisan profile management, proposal submission
     - Owner-only: Updating own resources, accessing private data

5. **Row-Level Security (RLS)**:
   - All database access goes through Supabase's RLS policies
   - API layer respects and enforces RLS policies defined in database
   - JWT token contains user metadata (id, role) used by RLS policies

### Authorization Matrix

| Endpoint | Public | Client | Artisan | Notes |
|----------|--------|--------|---------|-------|
| POST /api/auth/register | ✓ | ✓ | ✓ | |
| POST /api/auth/login | ✓ | ✓ | ✓ | |
| GET /api/categories | ✓ | ✓ | ✓ | |
| GET /api/materials | ✓ | ✓ | ✓ | |
| GET /api/specializations | ✓ | ✓ | ✓ | |
| GET /api/artisans/{id} | ✓ | ✓ | ✓ | Only if is_public=true |
| POST /api/images/generate | ✗ | ✓ | ✗ | |
| POST /api/projects | ✗ | ✓ | ✗ | |
| GET /api/projects | ✗ | ✗ | ✓ | Open projects only |
| POST /api/projects/{id}/proposals | ✗ | ✗ | ✓ | |
| PUT /api/artisans/me | ✗ | ✗ | ✓ | |
| POST /api/artisans/me/portfolio | ✗ | ✗ | ✓ | |

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### User Registration
- **email**: Valid email format, unique
- **password**: Minimum 8 characters, must contain uppercase, lowercase, and number
- **role**: Must be one of: 'client', 'artisan'

#### Artisan Profile
- **company_name**: Required, max 255 characters
- **nip**: Required, exactly 10 digits, unique
- **portfolio_images**: Minimum 5 images required before profile can be public
- **specializations**: At least 1 specialization required before profile can be public

#### Generated Images
- **prompt**: Required, min 10 characters, max 500 characters
- **generation_limit**: Maximum 10 generations per client account

#### Projects
- **generated_image_id**: Required, must exist, must not be used in another project, must belong to user
- **category_id**: Required, must exist in categories table
- **material_id**: Required, must exist in materials table
- **dimensions**: Optional, max 100 characters
- **budget_range**: Optional, max 50 characters

#### Proposals
- **price**: Required, positive decimal number, max 2 decimal places
- **attachment**: Required, allowed formats: PDF, JPG, PNG, max size: 10MB
- **uniqueness**: One proposal per artisan per project

#### Reviews
- **rating**: Required, integer between 1 and 5 (inclusive)
- **comment**: Optional, max 1000 characters
- **uniqueness**: One review per user per project

### 4.2 Business Logic Implementation

#### AI Image Generation
```
1. Check if user is authenticated and has role 'client'
2. Count existing generated_images for user
3. If count >= 10, return 403 Forbidden
4. Validate prompt (not empty, reasonable length)
5. Call AI service to generate image
6. Upload generated image to Supabase Storage
7. Create record in generated_images table
8. Return image URL and remaining generations count
```

#### Artisan Profile Publication
```
1. Check if artisan profile exists
2. Validate required fields:
   - company_name: not null
   - nip: valid format (10 digits)
3. Count portfolio_images for artisan
4. If count < 5, set is_public = false
5. Count specializations for artisan
6. If count < 1, set is_public = false
7. If all requirements met, set is_public = true
8. Update artisan_profiles record
```

#### Project Creation
```
1. Check if user is authenticated and has role 'client'
2. Validate generated_image_id exists and belongs to user
3. Check if image is already used in another project
4. If used, return 409 Conflict
5. Validate category_id and material_id exist
6. Create project with status = 'open'
7. Return created project
```

#### Proposal Submission
```
1. Check if user is authenticated and has role 'artisan'
2. Verify artisan profile is_public = true
3. Validate project exists and status = 'open'
4. Check if artisan already submitted proposal to this project
5. If exists, return 409 Conflict
6. Validate price is positive number
7. Upload attachment to Supabase Storage
8. Create proposal record
9. Send notification to project owner (client)
10. Return created proposal
```

#### Proposal Acceptance
```
1. Check if user is authenticated and owns the project
2. Validate project status = 'open'
3. Validate proposal exists and belongs to the project
4. Begin transaction:
   a. Update project:
      - status = 'in_progress'
      - accepted_proposal_id = proposal_id
      - accepted_price = proposal.price
   b. Commit transaction
5. Send notification to artisan
6. Return updated project
```

#### Project Completion
```
1. Check if user is authenticated
2. Validate user is either project owner or accepted artisan
3. Current implementation: Simple status update to 'completed'
4. Future: Implement two-step confirmation:
   - First party marks as complete (status = 'pending_completion')
   - Second party confirms (status = 'completed')
5. Trigger review flow
```

#### Review Submission
```
1. Check if user is authenticated
2. Validate project exists and status = 'completed'
3. Verify user is involved in project (client or accepted artisan)
4. Check if user already submitted review for this project
5. If exists, return 409 Conflict
6. Determine reviewee_id:
   - If user is client: reviewee = accepted artisan
   - If user is artisan: reviewee = client
7. Validate rating (1-5)
8. Create review record
9. Update average rating for reviewee (if artisan)
10. Return created review
```

### 4.3 Error Handling Standards

All API errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Specific field error details"
    }
  }
}
```

**Common Error Codes**:
- `VALIDATION_ERROR`: Request validation failed
- `UNAUTHORIZED`: Authentication required or failed
- `FORBIDDEN`: User doesn't have permission
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (duplicate, constraint violation)
- `LIMIT_EXCEEDED`: Rate limit or quota exceeded
- `INTERNAL_ERROR`: Server error

### 4.4 Rate Limiting

- **AI Generation**: 10 total generations per client account (enforced at database level)
- **API Rate Limits** (recommended for production):
  - Authenticated requests: 1000 requests per hour per user
  - File uploads: 20 requests per hour per user
  - Public endpoints: 100 requests per hour per IP

### 4.5 File Upload Specifications

**Supported Formats**:
- **Portfolio Images**: JPEG, PNG
- **Proposal Attachments**: PDF, JPEG, PNG
- **AI Generated Images**: PNG (generated by AI service)

**Size Limits**:
- **Portfolio Images**: 5MB per file
- **Proposal Attachments**: 10MB per file

**Storage**:
- All files stored in Supabase Storage
- Organized in buckets:
  - `portfolio-images/{artisan_id}/`
  - `proposal-attachments/{proposal_id}/`
  - `generated-images/{user_id}/`
- Storage RLS policies match API authorization rules

## 5. Additional Considerations

### 5.1 Pagination
All list endpoints support pagination with standard parameters:
- `page`: Page number (1-indexed)
- `limit`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### 5.2 Filtering and Sorting
- **Projects**: Filter by status, category_id, material_id
- **Proposals**: Filter by project status
- **Reviews**: No filtering required for MVP
- **Sorting**: Default by `created_at DESC`, can be extended in future

### 5.3 Notifications
While not part of REST API, the following events should trigger notifications:
- New proposal submitted → notify project owner
- Proposal accepted → notify artisan
- Project status changed → notify both parties
- Review submitted → notify reviewee

Notification implementation can use:
- Email (Supabase Auth integration)
- WebSocket/Server-Sent Events for real-time updates (future enhancement)

### 5.4 Performance Optimization
- Use database indexes on foreign keys and frequently filtered columns
- Implement caching for dictionary resources (categories, materials, specializations)
- Paginate all list endpoints
- Use Supabase RLS for authorization (database-level security)
- Optimize image storage with CDN (Supabase Storage includes CDN)

### 5.5 Future API Extensions (Post-MVP)
- Payment integration endpoints
- Advanced search and recommendations
- Analytics endpoints for users
- Batch operations for portfolio management
- Websocket API for real-time chat
- Admin endpoints for platform management
