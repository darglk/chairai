/**
 * Password Recovery API Endpoint
 *
 * Handles password recovery requests by sending a reset link to the user's email.
 * Always returns success to prevent email enumeration attacks.
 */

import type { APIRoute } from "astro";
import { PasswordRecoverySchema } from "@/lib/schemas";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import { ZodError } from "zod";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Parse and validate request body
    const body = await context.request.json();
    const validatedData = PasswordRecoverySchema.parse(body);

    // Get the origin URL for the reset link
    const origin = context.url.origin;
    const redirectTo = `${origin}/password-reset`;

    // Send password reset email via Supabase
    const { error } = await context.locals.supabase.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo,
    });

    // Even if there's an error (e.g., email doesn't exist),
    // we return success to prevent email enumeration
    if (error) {
      // Log error for debugging but don't expose to client
      // In production, you might want to use a proper logging service
    }

    // Always return success message
    return createSuccessResponse({
      success: true,
      message: "Jeśli konto istnieje, link do resetowania hasła został wysłany na Twój adres e-mail.",
    });
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

    // Handle unexpected errors
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił błąd serwera. Spróbuj ponownie później.", 500);
  }
};
