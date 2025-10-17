/**
 * Password Reset API Endpoint
 *
 * Handles password reset after user clicks the link from their email.
 * Updates the user's password with the new one.
 */

import type { APIRoute } from "astro";
import { PasswordResetSchema } from "@/lib/schemas";
import { createErrorResponse, createSuccessResponse, setSessionCookies } from "@/lib/api-utils";
import { ZodError } from "zod";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Parse and validate request body
    const body = await context.request.json();
    const validatedData = PasswordResetSchema.parse(body);

    // Update user's password
    // This works because the user came from the email link which sets a temporary session
    const { data, error } = await context.locals.supabase.auth.updateUser({
      password: validatedData.password,
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes("session")) {
        return createErrorResponse(
          "SESSION_ERROR",
          "Link resetujący wygasł lub jest nieprawidłowy. Spróbuj ponownie.",
          400
        );
      }

      return createErrorResponse("PASSWORD_UPDATE_ERROR", "Nie udało się zaktualizować hasła. Spróbuj ponownie.", 400);
    }

    // Ensure we have a valid session and user
    if (!data.user) {
      return createErrorResponse("NO_USER", "Nie znaleziono użytkownika. Spróbuj ponownie zresetować hasło.", 400);
    }

    // Get the new session after password update
    const { data: sessionData, error: sessionError } = await context.locals.supabase.auth.getSession();

    if (!sessionError && sessionData.session) {
      // Set session cookies to automatically log the user in
      setSessionCookies(context, sessionData.session.access_token, sessionData.session.refresh_token);
    }

    // Return success response
    return createSuccessResponse({
      success: true,
      message: "Hasło zostało pomyślnie zaktualizowane.",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
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
