/**
 * POST /api/chat/users
 *
 * Creates or updates users in GetStream.
 * This endpoint is called before creating a channel to ensure all members exist.
 */

import type { APIRoute } from "astro";
import { StreamChat } from "stream-chat";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import { z } from "zod";

export const prerender = false;

const CreateUsersSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(10),
});

/**
 * POST handler for creating/updating users in GetStream
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return createErrorResponse("UNAUTHORIZED", "Musisz być zalogowany", 401);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = CreateUsersSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse("VALIDATION_ERROR", "Nieprawidłowe dane wejściowe", 400);
    }

    const { userIds } = validation.data;

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

    // Create users with minimal data (GetStream will use IDs as names if needed)
    // We create them with just IDs - names will be set when they connect via /api/chat/token
    const usersToUpsert = userIds.map((userId) => ({
      id: userId,
      role: "user",
    }));

    // Upsert users in GetStream
    await serverClient.upsertUsers(usersToUpsert);

    return createSuccessResponse(
      {
        created: usersToUpsert.length,
        userIds: usersToUpsert.map((u) => u.id),
      },
      200
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[API] Error creating GetStream users:", error);
    return createErrorResponse("INTERNAL_ERROR", "Wystąpił błąd podczas tworzenia użytkowników czatu", 500);
  }
};
