/**
 * Register API Endpoint
 *
 * Handles user registration via Supabase Auth.
 * Sends email confirmation link to the user's email address.
 * User role record is created automatically via database trigger.
 */

import type { APIRoute } from "astro";
import { RegisterSchema } from "@/lib/schemas";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import { ZodError } from "zod";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Parse and validate request body
    const body = await context.request.json();
    const validatedData = RegisterSchema.parse(body);

    // Attempt to sign up with Supabase
    const { data, error } = await context.locals.supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          account_type: validatedData.accountType,
        },
      },
    });

    // Handle registration errors
    if (error) {
      // Handle specific error cases
      if (error.message.includes("already registered")) {
        return createErrorResponse("EMAIL_EXISTS", "Ten adres e-mail jest już zarejestrowany", 400);
      }

      if (error.message.includes("Password")) {
        return createErrorResponse("WEAK_PASSWORD", "Hasło nie spełnia wymagań bezpieczeństwa", 400);
      }

      // Return generic error for other cases
      return createErrorResponse("AUTH_ERROR", error.message, 400);
    }

    // Ensure we have user data
    if (!data.user) {
      return createErrorResponse("REGISTRATION_FAILED", "Nie udało się utworzyć konta", 500);
    }

    // Return success response
    // Note: Supabase will send a confirmation email to the user
    // User role record is created automatically via database trigger
    return createSuccessResponse(
      {
        success: true,
        message:
          "Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail i kliknij w link aktywacyjny, aby potwierdzić rejestrację.",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        requiresEmailConfirmation: true,
      },
      201
    );
  } catch (error) {
    // Handle validation errors from Zod
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};

      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });

      return createErrorResponse("VALIDATION_ERROR", "Błąd walidacji danych", 422, fieldErrors);
    }

    // Handle unexpected errors - don't expose details to user
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił błąd serwera. Spróbuj ponownie później.", 500);
  }
};
