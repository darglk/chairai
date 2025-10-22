import { describe, it, expect, beforeEach, vi } from "vitest";
import type { APIContext } from "astro";
import { GET } from "@/pages/api/projects/[projectId]/proposals";
import type { SupabaseClient } from "@/db/supabase.client";

const createMockContext = (
  projectId: string,
  user: { id: string; role: string } | null,
  supabaseClient?: SupabaseClient
): APIContext => {
  return {
    params: { projectId },
    request: new Request(`http://localhost:3000/api/projects/${projectId}/proposals`),
    locals: { user, supabase: supabaseClient || createMockSupabaseClient() },
  } as unknown as APIContext;
};

const createMockSupabaseClient = () => {
  return { from: vi.fn() } as unknown as SupabaseClient;
};

describe("Integration: GET /api/projects/{projectId}/proposals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    const context = createMockContext("123e4567-e89b-12d3-a456-426614174000", null);
    const response = await GET(context);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error.code).toBe("UNAUTHORIZED");
    expect(data.error.message).toBe("Wymagane uwierzytelnienie");
  });

  it("should return 400 for invalid UUID format", async () => {
    const mockUser = { id: "user-123", role: "client" };
    const context = createMockContext("invalid-uuid", mockUser);
    const response = await GET(context);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error.code).toBe("VALIDATION_ERROR");
    expect(data.error.message).toBe("Nieprawidłowy format ID projektu");
  });

  it("should return 404 when project does not exist", async () => {
    const mockUser = { id: "user-123", role: "client" };
    const mockSupabase = createMockSupabaseClient();
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockSupabase.from = vi.fn().mockReturnValue({ select: mockSelect });
    const context = createMockContext("123e4567-e89b-12d3-a456-426614174000", mockUser, mockSupabase);
    const response = await GET(context);
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error.code).toBe("NOT_FOUND");
    expect(data.error.message).toBe("Projekt nie został znaleziony");
  });
});
