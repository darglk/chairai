/**
 * Login API Endpoint
 *
 * Handles user authentication via Supabase Auth.
 * Sets session cookies on successful login.
 */

import type { APIRoute } from "astro";
import { LoginSchema } from "@/lib/schemas";
import { createErrorResponse, createSuccessResponse, setSessionCookies } from "@/lib/api-utils";
import { ZodError } from "zod";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Parse and validate request body
    const body = await context.request.json();
    const validatedData = LoginSchema.parse(body);

    // Attempt to sign in with Supabase
    const { data, error } = await context.locals.supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    // Handle authentication errors
    if (error) {
      // Return 401 for invalid credentials
      if (error.message.includes("Invalid login credentials")) {
        return createErrorResponse("INVALID_CREDENTIALS", "Nieprawidłowy e-mail lub hasło", 401);
      }

      // Return 400 for other authentication errors
      return createErrorResponse("AUTH_ERROR", error.message, 400);
    }

    // Ensure we have a valid session
    if (!data.session) {
      return createErrorResponse("NO_SESSION", "Nie udało się utworzyć sesji", 500);
    }

    // Set session cookies
    setSessionCookies(context, data.session.access_token, data.session.refresh_token);

    // Return success response
    return createSuccessResponse({
      success: true,
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

    // Handle unexpected errors - log them but don't expose details
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił błąd serwera. Spróbuj ponownie później.", 500);
  }
};
