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
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  unused_only: z.coerce.boolean().default(false),
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
