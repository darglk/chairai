/**
 * ChairAI Application Types
 *
 * This file contains all DTO (Data Transfer Object) and Command Model types
 * used for API communication. All types are derived from database models
 * defined in database.types.ts to ensure type safety and consistency.
 */

import type { Tables, Enums } from "./db/database.types";

// ============================================================================
// Database Type Aliases
// ============================================================================

export type UserRole = Enums<"user_role">;
export type ProjectStatus = Enums<"project_status">;

// ============================================================================
// Common/Shared Types
// ============================================================================

/**
 * Pagination metadata for paginated API responses
 */
export interface PaginationMetaDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: PaginationMetaDTO;
}

/**
 * Standard API error response structure
 */
export interface ApiErrorDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

// ============================================================================
// User Types
// ============================================================================

/**
 * User DTO - Basic user information
 * Used in: GET /api/users/me
 */
export interface UserDTO {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

// ============================================================================
// Dictionary Resource Types
// ============================================================================

/**
 * Category DTO - Furniture category
 * Source: categories table
 * Used in: GET /api/categories
 */
export type CategoryDTO = Tables<"categories">;

/**
 * Material DTO - Furniture material
 * Source: materials table
 * Used in: GET /api/materials
 */
export type MaterialDTO = Tables<"materials">;

/**
 * Specialization DTO - Artisan specialization
 * Source: specializations table
 * Used in: GET /api/specializations
 */
export type SpecializationDTO = Tables<"specializations">;

// ============================================================================
// Artisan Profile Types
// ============================================================================

/**
 * Artisan Specialization DTO - Specialization in profile context
 * Used as nested object in ArtisanProfileDTO
 */
export interface ArtisanSpecializationDTO {
  id: string;
  name: string;
}

/**
 * Portfolio Image DTO - Image in artisan portfolio
 * Source: portfolio_images table
 */
export type PortfolioImageDTO = Pick<Tables<"portfolio_images">, "id" | "image_url" | "created_at">;

/**
 * Artisan Profile DTO - Public artisan profile information
 * Source: artisan_profiles + related tables + aggregated reviews
 * Used in: GET /api/artisans/{id}, GET /api/artisans/me
 */
export interface ArtisanProfileDTO {
  user_id: string;
  company_name: string;
  nip: string;
  is_public: boolean;
  specializations: ArtisanSpecializationDTO[];
  portfolio_images: PortfolioImageDTO[];
  average_rating: number | null;
  total_reviews: number;
  updated_at: string;
}

/**
 * Create/Update Artisan Profile Command
 * Used in: PUT /api/artisans/me
 */
export interface CreateUpdateArtisanProfileCommand {
  company_name: string;
  nip: string;
}

/**
 * Add Artisan Specializations Command
 * Used in: POST /api/artisans/me/specializations
 */
export interface AddArtisanSpecializationsCommand {
  specialization_ids: string[];
}

// ============================================================================
// Generated Images Types
// ============================================================================

/**
 * Generated Image DTO - AI-generated furniture image
 * Source: generated_images table
 * Used in: GET /api/images/generated/{id}
 */
export interface GeneratedImageDTO {
  id: string;
  user_id: string;
  prompt: string | null;
  image_url: string;
  created_at: string;
  is_used: boolean;
}

/**
 * Generate Image Command
 * Used in: POST /api/images/generate
 */
export interface GenerateImageCommand {
  prompt: string;
}

/**
 * Generate Image Response DTO
 * Used in: POST /api/images/generate (response)
 */
export interface GenerateImageResponseDTO extends GeneratedImageDTO {
  remaining_generations: number;
}

/**
 * Generated Images List Response DTO
 * Used in: GET /api/images/generated
 */
export interface GeneratedImagesListResponseDTO {
  data: GeneratedImageDTO[];
  pagination: PaginationMetaDTO;
  remaining_generations: number;
}

// ============================================================================
// Project Types
// ============================================================================

/**
 * Project Generated Image DTO - Simplified image data in project context
 * Used as nested object in ProjectDTO
 */
export interface ProjectGeneratedImageDTO {
  id: string;
  image_url: string;
  prompt: string | null;
}

/**
 * Project Category DTO - Category data in project context
 * Used as nested object in ProjectDTO
 */
export interface ProjectCategoryDTO {
  id: string;
  name: string;
}

/**
 * Project Material DTO - Material data in project context
 * Used as nested object in ProjectDTO
 */
export interface ProjectMaterialDTO {
  id: string;
  name: string;
}

/**
 * Project DTO - Detailed project information
 * Source: projects table + related entities
 * Used in: GET /api/projects/{id}
 */
export interface ProjectDTO {
  id: string;
  client_id: string;
  generated_image: ProjectGeneratedImageDTO;
  category: ProjectCategoryDTO;
  material: ProjectMaterialDTO;
  status: ProjectStatus;
  dimensions: string | null;
  budget_range: string | null;
  accepted_proposal_id: string | null;
  accepted_price: number | null;
  proposals_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Project List Item DTO - Simplified project data for listings
 * Used in: GET /api/projects, GET /api/projects/me
 */
export type ProjectListItemDTO = Omit<ProjectDTO, "proposals_count">;

/**
 * Create Project Command
 * Used in: POST /api/projects
 */
export interface CreateProjectCommand {
  generated_image_id: string;
  category_id: string;
  material_id: string;
  dimensions?: string;
  budget_range?: string;
}

/**
 * Update Project Status Command
 * Used in: PATCH /api/projects/{id}/status
 */
export interface UpdateProjectStatusCommand {
  status: ProjectStatus;
}

/**
 * Accept Proposal Command
 * Used in: POST /api/projects/{id}/accept-proposal
 */
export interface AcceptProposalCommand {
  proposal_id: string;
}

// ============================================================================
// Proposal Types
// ============================================================================

/**
 * Proposal Artisan DTO - Artisan data in proposal context
 * Used as nested object in ProposalDTO
 */
export interface ProposalArtisanDTO {
  user_id: string;
  company_name: string;
  average_rating: number | null;
  total_reviews: number;
}

/**
 * Proposal DTO - Artisan proposal for a project
 * Source: proposals table + artisan profile + reviews aggregation
 * Used in: GET /api/projects/{id}/proposals
 */
export interface ProposalDTO {
  id: string;
  project_id: string;
  artisan: ProposalArtisanDTO;
  price: number;
  attachment_url: string;
  created_at: string;
}

/**
 * My Proposal Project DTO - Project data in "my proposals" context
 * Used as nested object in MyProposalDTO
 */
export interface MyProposalProjectDTO {
  id: string;
  status: ProjectStatus;
  category: ProjectCategoryDTO;
  generated_image: {
    image_url: string;
  };
}

/**
 * My Proposal DTO - Proposal in artisan's proposals list
 * Source: proposals table + related project data
 * Used in: GET /api/proposals/me
 */
export interface MyProposalDTO {
  id: string;
  project: MyProposalProjectDTO;
  price: number;
  attachment_url: string;
  created_at: string;
  is_accepted: boolean;
}

/**
 * Create Proposal Command
 * Used in: POST /api/projects/{id}/proposals
 * Note: File attachment handled via multipart/form-data
 */
export interface CreateProposalCommand {
  price: number;
  attachment: File;
}

// ============================================================================
// Review Types
// ============================================================================

/**
 * Review Project DTO - Project data in review context
 * Used as nested object in ReviewDTO
 */
export interface ReviewProjectDTO {
  id: string;
  category: {
    name: string;
  };
}

/**
 * Reviewer DTO - Reviewer data in review context
 * Used as nested object in ReviewDTO
 */
export interface ReviewerDTO {
  id: string;
  email: string;
}

/**
 * Review DTO - Rating and review for completed project
 * Source: reviews table + related entities
 * Used in: GET /api/artisans/{id}/reviews
 */
export interface ReviewDTO {
  id: string;
  project: ReviewProjectDTO;
  reviewer: ReviewerDTO;
  rating: number;
  comment: string | null;
  created_at: string;
}

/**
 * Review Summary DTO - Aggregated review statistics
 * Used in: GET /api/artisans/{id}/reviews (summary section)
 */
export interface ReviewSummaryDTO {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

/**
 * Create Review Command
 * Used in: POST /api/projects/{id}/reviews
 */
export interface CreateReviewCommand {
  rating: number;
  comment?: string;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Common pagination query parameters
 */
export interface PaginationQueryParams {
  page?: number;
  limit?: number;
}

/**
 * Project list query parameters
 * Used in: GET /api/projects
 */
export interface ProjectsQueryParams extends PaginationQueryParams {
  status?: ProjectStatus;
  category_id?: string;
  material_id?: string;
}

/**
 * Generated images list query parameters
 * Used in: GET /api/images/generated
 */
export interface GeneratedImagesQueryParams extends PaginationQueryParams {
  unused_only?: boolean;
}

/**
 * My proposals query parameters
 * Used in: GET /api/proposals/me
 */
export interface MyProposalsQueryParams extends PaginationQueryParams {
  status?: ProjectStatus;
}

/**
 * Reviews query parameters
 * Used in: GET /api/artisans/{id}/reviews
 */
export type ReviewsQueryParams = PaginationQueryParams;
