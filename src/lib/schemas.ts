/**
 * Zod Validation Schemas
 *
 * This file contains all Zod schemas used for validating
 * API request data, ensuring type safety and data integrity.
 */

import { z } from "zod";

// ============================================================================
// Authentication Schemas
// ============================================================================

/**
 * Schema for user login
 */
export const LoginSchema = z.object({
  email: z
    .string({ required_error: "Adres e-mail jest wymagany" })
    .email("Nieprawidłowy format adresu e-mail")
    .min(1, "Adres e-mail jest wymagany"),
  password: z.string({ required_error: "Hasło jest wymagane" }).min(1, "Hasło jest wymagane"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Schema for user registration
 */
export const RegisterSchema = z
  .object({
    email: z
      .string({ required_error: "Adres e-mail jest wymagany" })
      .email("Nieprawidłowy format adresu e-mail")
      .min(1, "Adres e-mail jest wymagany"),
    password: z
      .string({ required_error: "Hasło jest wymagane" })
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę"
      ),
    confirmPassword: z
      .string({ required_error: "Potwierdzenie hasła jest wymagane" })
      .min(1, "Potwierdzenie hasła jest wymagane"),
    accountType: z.enum(["client", "artisan"], {
      required_error: "Typ konta jest wymagany",
      invalid_type_error: "Nieprawidłowy typ konta",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Schema for password recovery request
 */
export const PasswordRecoverySchema = z.object({
  email: z
    .string({ required_error: "Adres e-mail jest wymagany" })
    .email("Nieprawidłowy format adresu e-mail")
    .min(1, "Adres e-mail jest wymagany"),
});

export type PasswordRecoveryInput = z.infer<typeof PasswordRecoverySchema>;

/**
 * Schema for password reset
 */
export const PasswordResetSchema = z
  .object({
    password: z
      .string({ required_error: "Hasło jest wymagane" })
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę"
      ),
    confirmPassword: z
      .string({ required_error: "Potwierdzenie hasła jest wymagane" })
      .min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;

// ============================================================================
// Generated Images Schemas
// ============================================================================

/**
 * Schema for generating image with AI
 */
export const GenerateImageSchema = z.object({
  prompt: z
    .string({ required_error: "Prompt jest wymagany" })
    .min(10, "Prompt musi mieć co najmniej 10 znaków")
    .max(500, "Prompt nie może przekraczać 500 znaków"),
});

export type GenerateImageInput = z.infer<typeof GenerateImageSchema>;

/**
 * Schema for listing generated images query parameters
 * Maps to GeneratedImagesQueryParams interface from types.ts
 */
export const GeneratedImagesQuerySchema = z.object({
  page: z
    .string()
    .nullable()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .nullable()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100)),
  unused_only: z
    .string()
    .nullable()
    .transform((val) => val === "true")
    .pipe(z.boolean()),
});

export type GeneratedImagesQuery = z.infer<typeof GeneratedImagesQuerySchema>;

// ============================================================================
// AI Image Prompt Schemas
// ============================================================================

/**
 * Schema for AI-generated image prompt with positive and negative prompts
 */
export const imagePromptSchema = z.object({
  positivePrompt: z
    .string({ required_error: "Pozytywny prompt jest wymagany" })
    .min(1, "Pozytywny prompt nie może być pusty"),
  negativePrompt: z
    .string({ required_error: "Negatywny prompt jest wymagany" })
    .min(1, "Negatywny prompt nie może być pusty"),
});

export type ImagePrompt = z.infer<typeof imagePromptSchema>;

// ============================================================================
// Project Schemas
// ============================================================================

/**
 * Schema for creating a new project
 * Maps to CreateProjectCommand interface from types.ts
 */
export const CreateProjectSchema = z.object({
  generated_image_id: z.string().uuid({ message: "Nieprawidłowy UUID dla wygenerowanego obrazu" }),
  category_id: z.string().uuid({ message: "Nieprawidłowy UUID dla kategorii" }),
  material_id: z.string().uuid({ message: "Nieprawidłowy UUID dla materiału" }),
  dimensions: z.string().max(100, "Wymiary nie mogą przekraczać 100 znaków").optional(),
  budget_range: z.string().max(50, "Budżet nie może przekraczać 50 znaków").optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// ============================================================================
// Artisan Profile Schemas
// ============================================================================

/**
 * Schema for creating or updating artisan profile
 * Maps to CreateUpdateArtisanProfileCommand interface from types.ts
 */
export const CreateUpdateArtisanProfileSchema = z.object({
  company_name: z
    .string({ required_error: "Nazwa firmy jest wymagana" })
    .min(1, { message: "Nazwa firmy nie może być pusta" }),
  nip: z
    .string({ required_error: "NIP jest wymagany" })
    .regex(/^\d{10}$/, { message: "NIP musi składać się z dokładnie 10 cyfr" }),
});

export type CreateUpdateArtisanProfileInput = z.infer<typeof CreateUpdateArtisanProfileSchema>;

/**
 * Schema for adding specializations to artisan profile
 * Maps to AddArtisanSpecializationsCommand interface from types.ts
 */
export const AddArtisanSpecializationsSchema = z.object({
  specialization_ids: z
    .array(z.string().uuid({ message: "Nieprawidłowy format UUID" }))
    .min(1, "Wymagana jest co najmniej jedna specjalizacja"),
});

export type AddArtisanSpecializationsInput = z.infer<typeof AddArtisanSpecializationsSchema>;

/**
 * Schema for portfolio image upload
 * Validates file size and type
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const PortfolioImageUploadSchema = z.object({
  image: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "Maksymalny rozmiar pliku to 5MB")
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), "Obsługiwane są tylko formaty .jpg, .png i .webp"),
});

export type PortfolioImageUploadInput = z.infer<typeof PortfolioImageUploadSchema>;

// ============================================================================
// Project Query Schemas
// ============================================================================

/**
 * Schema for listing projects query parameters
 * Maps to ProjectsQueryParams interface from types.ts
 */
export const ProjectsQuerySchema = z.object({
  status: z
    .string()
    .nullable()
    .transform((val) => val || "open")
    .pipe(z.enum(["open", "in_progress", "completed", "closed"])),
  category_id: z
    .string()
    .nullable()
    .transform((val) => val || undefined)
    .pipe(z.string().uuid({ message: "Nieprawidłowy UUID dla kategorii" }).optional()),
  material_id: z
    .string()
    .nullable()
    .transform((val) => val || undefined)
    .pipe(z.string().uuid({ message: "Nieprawidłowy UUID dla materiału" }).optional()),
  page: z
    .string()
    .nullable()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .nullable()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100)),
});

export type ProjectsQuery = z.infer<typeof ProjectsQuerySchema>;

/**
 * Schema for project ID path parameter
 */
export const ProjectIdSchema = z.string().uuid({ message: "Nieprawidłowy UUID dla projektu" });

export type ProjectId = z.infer<typeof ProjectIdSchema>;

/**
 * Schema for updating project status
 * Used in: PATCH /api/projects/{id}/status
 */
export const UpdateProjectStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "completed", "closed"], {
    required_error: "Status jest wymagany",
    invalid_type_error: "Nieprawidłowy status projektu",
  }),
});

export type UpdateProjectStatusInput = z.infer<typeof UpdateProjectStatusSchema>;

// ============================================================================
// Proposal Schemas
// ============================================================================

/**
 * Schema for creating a proposal
 * Validates price and attachment file for proposal submission
 */
export const CreateProposalSchema = z.object({
  price: z
    .number({
      required_error: "Cena jest wymagana",
      invalid_type_error: "Cena musi być liczbą",
    })
    .positive({ message: "Cena musi być dodatnia" })
    .max(1000000, { message: "Cena nie może przekraczać 1,000,000 PLN" }),
  attachment: z
    .instanceof(File, { message: "Załącznik jest wymagany" })
    .refine((file) => file.size > 0, {
      message: "Plik nie może być pusty",
    })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Rozmiar pliku nie może przekraczać 5MB",
    })
    .refine((file) => ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(file.type), {
      message: "Nieprawidłowy typ pliku. Dozwolone są tylko PDF, JPG i PNG",
    }),
});

export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;

/**
 * Schema for accepting a proposal
 * Validates proposal_id in request body
 */
export const AcceptProposalSchema = z.object({
  proposal_id: z
    .string({ required_error: "ID propozycji jest wymagane" })
    .uuid({ message: "Nieprawidłowy format UUID dla propozycji" }),
});

export type AcceptProposalInput = z.infer<typeof AcceptProposalSchema>;

// ============================================================================
// Review Schemas
// ============================================================================

/**
 * Schema for creating a review
 * Validates rating (1-5) and comment
 */
export const CreateReviewSchema = z.object({
  rating: z
    .number({ required_error: "Ocena jest wymagana" })
    .int({ message: "Ocena musi być liczbą całkowitą" })
    .min(1, { message: "Ocena musi być co najmniej 1" })
    .max(5, { message: "Ocena nie może być większa niż 5" }),
  comment: z
    .string({ required_error: "Komentarz jest wymagany" })
    .min(1, { message: "Komentarz nie może być pusty" })
    .max(1000, { message: "Komentarz nie może przekraczać 1000 znaków" }),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// ============================================================================
// Artisan Profile Schemas
// ============================================================================

/**
 * Schema for artisan ID path parameter
 */
export const ArtisanIdSchema = z.string().uuid({ message: "Nieprawidłowy format ID rzemieślnika" });

export type ArtisanId = z.infer<typeof ArtisanIdSchema>;

/**
 * Schema for artisan reviews query parameters
 * Validates pagination parameters (page, limit)
 */
export const ArtisanReviewsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1).default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100).default(20)),
});

export type ArtisanReviewsQuery = z.infer<typeof ArtisanReviewsQuerySchema>;
