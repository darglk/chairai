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
