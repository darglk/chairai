/**
 * Unit tests for ProposalService
 *
 * Tests the business logic for creating proposals, including validation,
 * file uploads, and authorization checks.
 *
 * Note: These are simplified unit tests focusing on error conditions.
 * For full integration testing, see integration tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProposalService, ProposalError } from "@/lib/services/proposal.service";
import type { SupabaseClient } from "@/db/supabase.client";

// Helper to create mock File with proper arrayBuffer method
const createMockFile = (name: string, size: number, type: string): File => {
  const content = "x".repeat(size);
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });

  // Mock arrayBuffer for Node.js environment
  if (!file.arrayBuffer) {
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => {
        const buffer = Buffer.from(content);
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      },
    });
  }

  return file;
};

describe("ProposalService - createProposal()", () => {
  let service: ProposalService;
  let mockSupabase: SupabaseClient;
  let mockFrom: ReturnType<typeof vi.fn>;

  const mockData = {
    projectId: "project-uuid-1",
    price: 2500,
    attachment: createMockFile("proposal.pdf", 1024, "application/pdf"),
    userId: "artisan-uuid-1",
  };

  beforeEach(() => {
    mockFrom = vi.fn();
    mockSupabase = {
      from: mockFrom,
      storage: {
        from: vi.fn(),
      },
    } as unknown as SupabaseClient;
    service = new ProposalService(mockSupabase);
    vi.clearAllMocks();
  });

  describe("Authorization and Validation", () => {
    it("powinien rzucić błąd gdy użytkownik nie istnieje", async () => {
      // Mock: User not found
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "User not found" },
        }),
      };

      mockFrom.mockReturnValue(mockChain);

      try {
        await service.createProposal(mockData);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ProposalError);
        expect((error as ProposalError).message).toContain("Nie znaleziono użytkownika");
      }
    });

    it("powinien rzucić błąd gdy użytkownik nie jest rzemieślnikiem", async () => {
      // Mock: User exists but is not an artisan
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockData.userId, role: "client" },
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockChain);

      try {
        await service.createProposal(mockData);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ProposalError);
        expect((error as ProposalError).message).toContain("Tylko rzemieślnicy mogą składać propozycje");
      }
    });

    it("powinien rzucić błąd gdy projekt nie istnieje", async () => {
      // Mock chains for both queries
      const mockUserChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockData.userId, role: "artisan" },
          error: null,
        }),
      };

      const mockProjectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Project not found" },
        }),
      };

      mockFrom.mockReturnValueOnce(mockUserChain).mockReturnValueOnce(mockProjectChain);

      try {
        await service.createProposal(mockData);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ProposalError);
        expect((error as ProposalError).message).toContain("Nie znaleziono projektu");
      }
    });

    it("powinien rzucić błąd gdy projekt nie ma statusu 'open'", async () => {
      const mockUserChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockData.userId, role: "artisan" },
          error: null,
        }),
      };

      const mockProjectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockData.projectId,
            status: "closed",
            client_id: "client-uuid",
          },
          error: null,
        }),
      };

      mockFrom.mockReturnValueOnce(mockUserChain).mockReturnValueOnce(mockProjectChain);

      try {
        await service.createProposal(mockData);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ProposalError);
        expect((error as ProposalError).message).toContain("Projekt nie przyjmuje już propozycji");
      }
    });

    it("powinien rzucić błąd gdy rzemieślnik już złożył propozycję do tego projektu", async () => {
      const mockUserChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockData.userId, role: "artisan" },
          error: null,
        }),
      };

      const mockProjectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockData.projectId,
            status: "open",
            client_id: "client-uuid",
          },
          error: null,
        }),
      };

      const mockProposalChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "existing-proposal-uuid" },
          error: null,
        }),
      };

      mockFrom
        .mockReturnValueOnce(mockUserChain)
        .mockReturnValueOnce(mockProjectChain)
        .mockReturnValueOnce(mockProposalChain);

      try {
        await service.createProposal(mockData);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ProposalError);
        expect((error as ProposalError).message).toContain("Już złożyłeś propozycję do tego projektu");
      }
    });
  });

  describe("File Upload", () => {
    it("powinien rzucić błąd gdy plik jest za duży", async () => {
      // Create file larger than 5MB
      const largeFile = createMockFile("large.pdf", 6 * 1024 * 1024, "application/pdf");
      const dataWithLargeFile = { ...mockData, attachment: largeFile };

      const mockUserChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockData.userId, role: "artisan" },
          error: null,
        }),
      };

      const mockProjectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockData.projectId,
            status: "open",
            client_id: "client-uuid",
          },
          error: null,
        }),
      };

      const mockProposalChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockFrom
        .mockReturnValueOnce(mockUserChain)
        .mockReturnValueOnce(mockProjectChain)
        .mockReturnValueOnce(mockProposalChain);

      try {
        await service.createProposal(dataWithLargeFile);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ProposalError);
        expect((error as ProposalError).message).toContain("Rozmiar pliku nie może przekraczać");
      }
    });
  });

  describe("Integration Notes", () => {
    it("should note that full flow tests including successful creation are in integration tests", () => {
      // These unit tests focus on error conditions and validation
      // For full end-to-end testing including successful proposal creation,
      // file upload, and database operations, see:
      // - tests/integration/api/create-proposal.integration.test.ts
      expect(true).toBe(true);
    });
  });
});
