/**
 * GET /api/chat/token
 *
 * Generates a GetStream Chat token for the authenticated user.
 * This token is required to connect to GetStream Chat.
 */

import type { APIRoute } from "astro";
import { StreamChat } from "stream-chat";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";

export const prerender = false;

/**
 * GET handler for generating GetStream Chat token
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return createErrorResponse("UNAUTHORIZED", "Musisz być zalogowany", 401);
    }

    // Get GetStream credentials from environment
    const apiKey = import.meta.env.GETSTREAM_API_KEY;
    const apiSecret = import.meta.env.GETSTREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      // eslint-disable-next-line no-console
      console.error("[API] GetStream credentials not configured");
      return createErrorResponse("INTERNAL_ERROR", "Konfiguracja czatu jest niepoprawna", 500);
    }

    // Initialize GetStream server client
    const serverClient = StreamChat.getInstance(apiKey, apiSecret);

    // Get user name from metadata
    const userName =
      (locals.user.user_metadata?.full_name as string) ||
      (locals.user.email ? locals.user.email.split("@")[0] : locals.user.id);

    // Upsert user in GetStream (create or update)
    await serverClient.upsertUser({
      id: locals.user.id,
      name: userName,
      role: "user",
    });

    // Generate token for user
    const token = serverClient.createToken(locals.user.id);

    // Return token and user info
    return createSuccessResponse(
      {
        token,
        userId: locals.user.id,
        apiKey,
      },
      200
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[API] Error generating GetStream token:", error);
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił błąd podczas generowania tokenu czatu", 500);
  }
};
