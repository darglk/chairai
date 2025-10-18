import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/pages/api/images/generate";
import type { APIContext } from "astro";

const mockSupabaseAuth = {
  getUser: vi.fn(),
};

vi.mock("@/lib/services/ai-image.service", () => {
  // Base64 encoded 1x1 transparent PNG pixel
  const mockBase64Image =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  return {
    AIImageService: vi.fn().mockImplementation(() => ({
      generateFurnitureImage: vi.fn().mockResolvedValue({
        // Return base64-encoded PNG image (1x1 transparent pixel)
        imageUrl: mockBase64Image,
        success: true,
        positivePrompt: "test positive prompt",
        negativePrompt: "test negative prompt",
      }),
      getMaxFreeGenerations: vi.fn().mockReturnValue(10),
    })),
  };
});

vi.mock("@/lib/rate-limit", () => {
  return {
    checkImageGenerationRateLimit: vi.fn().mockReturnValue({
      allowed: true,
      resetTime: Date.now() + 60000,
    }),
  };
});

vi.mock("@/lib/services/supabase-storage.service", () => {
  return {
    uploadBase64Image: vi.fn().mockResolvedValue({
      success: true,
      publicUrl: "https://storage.example.com/chairai_bucket/user-123/image.png",
      fileName: "user-123/image.png",
    }),
  };
});

function createMockContext(body: unknown, userRole = "client"): APIContext {
  let insertedData: Record<string, unknown> | null = null;

  const mockFromChain = (tableName: string) => {
    if (tableName === "users") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: userRole },
          error: null,
        }),
      };
    }

    if (tableName === "generated_images") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        head: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation((data) => {
          // Capture the inserted data
          insertedData = data;
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "image-123",
                user_id: "user-123",
                prompt: insertedData?.prompt || "test",
                image_url: insertedData?.image_url || "https://storage.example.com/chairai_bucket/user-123/image.png",
                created_at: new Date().toISOString(),
                is_used: false,
              },
              error: null,
            }),
          };
        }),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "image-123",
            user_id: "user-123",
            prompt: "test",
            image_url: "https://storage.example.com/chairai_bucket/user-123/image.png",
            created_at: new Date().toISOString(),
            is_used: false,
          },
          error: null,
        }),
      };
    }

    // Default for other tables (including projects table for usage check)
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      head: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
        count: 0,
      }),
    };
  };

  const mockStorage = {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: {
          publicUrl: "https://storage.example.com/chairai_bucket/user-123/image.png",
        },
      }),
    })),
  };

  return {
    request: {
      json: async () => body,
      headers: {
        get: vi.fn(() => "192.168.1.1"),
      },
    } as unknown as Request,
    locals: {
      supabase: {
        auth: mockSupabaseAuth,
        from: mockFromChain,
        storage: mockStorage,
      },
    } as unknown as APIContext["locals"],
    cookies: {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    } as unknown as APIContext["cookies"],
  } as unknown as APIContext;
}

describe("POST /api/images/generate", () => {
  beforeEach(() => {
    // Only reset the mockSupabaseAuth.getUser mock, not all mocks
    // This preserves the mock implementations for other services
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
  });

  describe("Walidacja wejścia", () => {
    it("powinien zaakceptować prawidłowy prompt", async () => {
      const context = createMockContext({
        prompt: "Nowoczesny fotel w stylu skandynawskim",
      });

      const response = await POST(context);
      expect(response.status).toBe(201);
    });

    it("powinien odrzucić prompt poniżej 10 znaków", async () => {
      const context = createMockContext({ prompt: "Short" });
      const response = await POST(context);
      expect(response.status).toBe(422);
    });

    it("powinien odrzucić prompt powyżej 500 znaków", async () => {
      const context = createMockContext({
        prompt: "A".repeat(501),
      });
      const response = await POST(context);
      expect(response.status).toBe(422);
    });
  });

  describe("Autentykacja", () => {
    it("powinien zalogować użytkownika z tokenem", async () => {
      const context = createMockContext({
        prompt: "Nowoczesny fotel",
      });

      const response = await POST(context);
      expect(response.status).toBe(201);
    });

    it("powinien odrzucić bez tokenem", async () => {
      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("Invalid"),
      });

      const context = createMockContext({
        prompt: "Nowoczesny fotel",
      });

      const response = await POST(context);
      expect(response.status).toBe(401);
    });
  });

  describe("Autoryzacja", () => {
    it("powinien zezwolić dla roli client", async () => {
      const context = createMockContext({ prompt: "Nowoczesny fotel" }, "client");
      const response = await POST(context);
      expect(response.status).toBe(201);
    });

    it("powinien odrzucić rolę artisan", async () => {
      const context = createMockContext({ prompt: "Nowoczesny fotel" }, "artisan");
      const response = await POST(context);
      expect(response.status).toBe(403);
    });
  });

  describe("Odpowiedź sukcesu", () => {
    it("powinien zwrócić 201", async () => {
      const context = createMockContext({
        prompt: "Nowoczesny fotel",
      });

      const response = await POST(context);
      expect(response.status).toBe(201);
    });

    it("powinien zawierać strukturę DTO", async () => {
      const context = createMockContext({
        prompt: "Nowoczesny fotel",
      });

      const response = await POST(context);
      const data = (await response.json()) as Record<string, unknown>;

      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("user_id");
      expect(data).toHaveProperty("prompt");
      expect(data).toHaveProperty("image_url");
      expect(data).toHaveProperty("created_at");
      expect(data).toHaveProperty("is_used");
      expect(data).toHaveProperty("remaining_generations");
    });

    it("powinien zawierać oryginalny prompt", async () => {
      const testPrompt = "Nowoczesny fotel skandynawski";
      const context = createMockContext({
        prompt: testPrompt,
      });

      const response = await POST(context);
      const data = (await response.json()) as Record<string, unknown>;

      expect(data.prompt).toBe(testPrompt);
    });

    it("powinien ustawić is_used na false", async () => {
      const context = createMockContext({
        prompt: "Nowoczesny fotel",
      });

      const response = await POST(context);
      const data = (await response.json()) as Record<string, unknown>;

      expect(data.is_used).toBe(false);
    });
  });

  describe("Obsługa błędów", () => {
    it("powinien zwrócić 500 na błąd", async () => {
      mockSupabaseAuth.getUser.mockImplementationOnce(() => {
        throw new Error("DB error");
      });

      const context = createMockContext({
        prompt: "Nowoczesny fotel",
      });

      const response = await POST(context);
      expect(response.status).toBe(500);
    });
  });
});
