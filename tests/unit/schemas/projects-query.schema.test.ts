/**
 * Unit Tests: Project Query Schemas
 *
 * Tests validation schemas for project-related API endpoints.
 */

import { describe, it, expect } from "vitest";
import { ProjectsQuerySchema, ProjectIdSchema } from "@/lib/schemas";

describe("ProjectsQuerySchema", () => {
  describe("Success Cases", () => {
    it("should validate with default values", () => {
      const result = ProjectsQuerySchema.safeParse({
        status: null,
        category_id: null,
        material_id: null,
        page: null,
        limit: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("open");
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.category_id).toBeUndefined();
        expect(result.data.material_id).toBeUndefined();
      }
    });

    it("should validate with all valid parameters", () => {
      const result = ProjectsQuerySchema.safeParse({
        status: "in_progress",
        category_id: "550e8400-e29b-41d4-a716-446655440000",
        material_id: "550e8400-e29b-41d4-a716-446655440001",
        page: "2",
        limit: "50",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("in_progress");
        expect(result.data.category_id).toBe("550e8400-e29b-41d4-a716-446655440000");
        expect(result.data.material_id).toBe("550e8400-e29b-41d4-a716-446655440001");
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it("should validate all valid statuses", () => {
      const validStatuses = ["open", "in_progress", "completed", "closed"];

      validStatuses.forEach((status) => {
        const result = ProjectsQuerySchema.safeParse({
          status,
          category_id: null,
          material_id: null,
          page: null,
          limit: null,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      });
    });

    it("should accept maximum limit of 100", () => {
      const result = ProjectsQuerySchema.safeParse({
        status: null,
        category_id: null,
        material_id: null,
        page: null,
        limit: "100",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });
  });

  describe("Status Validation", () => {
    it("should reject invalid status", () => {
      const result = ProjectsQuerySchema.safeParse({
        status: "invalid_status",
        category_id: null,
        material_id: null,
        page: null,
        limit: null,
      });

      expect(result.success).toBe(false);
    });

    it("should use default 'open' for empty status", () => {
      const result = ProjectsQuerySchema.safeParse({
        status: "",
        category_id: null,
        material_id: null,
        page: null,
        limit: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("open");
      }
    });
  });

  describe("UUID Validation", () => {
    it("should reject invalid category_id format", () => {
      const result = ProjectsQuerySchema.safeParse({
        status: null,
        category_id: "not-a-uuid",
        material_id: null,
        page: null,
        limit: null,
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid material_id format", () => {
      const result = ProjectsQuerySchema.safeParse({
        status: null,
        category_id: null,
        material_id: "not-a-uuid",
        page: null,
        limit: null,
      });

      expect(result.success).toBe(false);
    });

    it("should accept valid UUID for category_id", () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const result = ProjectsQuerySchema.safeParse({
        status: null,
        category_id: validUuid,
        material_id: null,
        page: null,
        limit: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category_id).toBe(validUuid);
      }
    });

    it("should accept valid UUID for material_id", () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const result = ProjectsQuerySchema.safeParse({
        status: null,
        category_id: null,
        material_id: validUuid,
        page: null,
        limit: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.material_id).toBe(validUuid);
      }
    });
  });

  describe("Pagination Validation", () => {
    it("should reject zero page", () => {
      const result = ProjectsQuerySchema.safeParse({
        status: null,
        category_id: null,
        material_id: null,
        page: "0",
        limit: null,
      });

      expect(result.success).toBe(false);
    });

    it("should reject negative page", () => {
      const result = ProjectsQuerySchema.safeParse({
        status: null,
        category_id: null,
        material_id: null,
        page: "-1",
        limit: null,
      });

      expect(result.success).toBe(false);
    });

    it("should reject zero limit", () => {
      const result = ProjectsQuerySchema.safeParse({
        status: null,
        category_id: null,
        material_id: null,
        page: null,
        limit: "0",
      });

      expect(result.success).toBe(false);
    });

    it("should reject limit exceeding 100", () => {
      const result = ProjectsQuerySchema.safeParse({
        status: null,
        category_id: null,
        material_id: null,
        page: null,
        limit: "101",
      });

      expect(result.success).toBe(false);
    });

    it("should reject negative limit", () => {
      const result = ProjectsQuerySchema.safeParse({
        status: null,
        category_id: null,
        material_id: null,
        page: null,
        limit: "-1",
      });

      expect(result.success).toBe(false);
    });
  });
});

describe("ProjectIdSchema", () => {
  describe("Success Cases", () => {
    it("should validate valid UUID", () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const result = ProjectIdSchema.safeParse(validUuid);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(validUuid);
      }
    });

    it("should validate different valid UUID formats", () => {
      const validUuids = [
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "00000000-0000-0000-0000-000000000000",
        "ffffffff-ffff-ffff-ffff-ffffffffffff",
      ];

      validUuids.forEach((uuid) => {
        const result = ProjectIdSchema.safeParse(uuid);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(uuid);
        }
      });
    });
  });

  describe("Validation Errors", () => {
    it("should reject invalid UUID format", () => {
      const result = ProjectIdSchema.safeParse("not-a-uuid");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Nieprawidłowy UUID dla projektu");
      }
    });

    it("should reject UUID without hyphens", () => {
      const result = ProjectIdSchema.safeParse("550e8400e29b41d4a716446655440000");

      expect(result.success).toBe(false);
    });

    it("should reject UUID with wrong length", () => {
      const result = ProjectIdSchema.safeParse("550e8400-e29b-41d4-a716-44665544000");

      expect(result.success).toBe(false);
    });

    it("should reject empty string", () => {
      const result = ProjectIdSchema.safeParse("");

      expect(result.success).toBe(false);
    });

    it("should reject null", () => {
      const result = ProjectIdSchema.safeParse(null);

      expect(result.success).toBe(false);
    });

    it("should reject undefined", () => {
      const result = ProjectIdSchema.safeParse(undefined);

      expect(result.success).toBe(false);
    });

    it("should reject number", () => {
      const result = ProjectIdSchema.safeParse(123);

      expect(result.success).toBe(false);
    });

    it("should reject object", () => {
      const result = ProjectIdSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" });

      expect(result.success).toBe(false);
    });
  });
});
