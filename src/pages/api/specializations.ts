/**
 * Specializations Dictionary Endpoint
 *
 * GET /api/specializations
 *
 * Fetches all artisan specializations available in the system.
 * This is a public endpoint that does not require authentication.
 *
 * @route GET /api/specializations
 * @returns {Object} { data: SpecializationDTO[] } - Array of all specializations
 * @statusCode 200 - Successfully retrieved specializations
 * @statusCode 500 - Internal server error
 *
 * @example
 * // Request
 * GET /api/specializations
 *
 * // Response (200 OK)
 * {
 *   "data": [
 *     { "id": "uuid-1", "name": "Stoliarstwo" },
 *     { "id": "uuid-2", "name": "Tapicerstwo" }
 *   ]
 * }
 *
 * // Response (500 Internal Server Error)
 * {
 *   "error": {
 *     "code": "INTERNAL_SERVER_ERROR",
 *     "message": "Wystąpił nieoczekiwany błąd serwera."
 *   }
 * }
 */

import type { APIContext } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../lib/api-utils";
import { DictionaryService } from "../../lib/services/dictionary.service";

export const prerender = false;

/**
 * GET handler for specializations endpoint
 *
 * Retrieves all artisan specializations from the database.
 * Handles errors gracefully and returns standardized error responses.
 */
export async function GET({ locals }: APIContext): Promise<Response> {
  try {
    // Retrieve Supabase client from Astro context
    const supabase = locals.supabase;

    if (!supabase) {
      return createErrorResponse("INTERNAL_SERVER_ERROR", "Niekonfigurowany klient bazy danych.", 500);
    }

    // Initialize DictionaryService with Supabase client
    const dictionaryService = new DictionaryService(supabase);

    // Fetch specializations from database
    const specializations = await dictionaryService.getSpecializations();

    // Return successful response with specializations data
    return createSuccessResponse({ data: specializations }, 200);
  } catch {
    // Return standardized error response
    return createErrorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd serwera.", 500);
  }
}
