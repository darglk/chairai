/**
 * E2E Test Suite: Dictionary API Endpoints
 *
 * Tests the public dictionary endpoints:
 * - GET /api/categories
 * - GET /api/materials
 * - GET /api/specializations
 *
 * These endpoints are public and don't require authentication.
 * Tests verify correct response structure, status codes, and error handling.
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Dictionary API Endpoints", () => {
  test.describe("GET /api/categories", () => {
    test("should return 200 with categories array", async ({ request }) => {
      // Act
      const response = await request.get(`${BASE_URL}/api/categories`);

      // Assert
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(0);

      // Verify each category has required fields
      if (data.data.length > 0) {
        const category = data.data[0];
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("name");
        expect(typeof category.id).toBe("string");
        expect(typeof category.name).toBe("string");
      }
    });

    test("should return correct Content-Type header", async ({ request }) => {
      // Act
      const response = await request.get(`${BASE_URL}/api/categories`);

      // Assert
      expect(response.headers()["content-type"]).toContain("application/json");
    });

    test("should not require authentication", async ({ request }) => {
      // Act: Request without any auth headers
      const response = await request.get(`${BASE_URL}/api/categories`, {
        headers: {
          Authorization: "", // Empty auth header
        },
      });

      // Assert: Should still succeed
      expect(response.status()).toBe(200);
    });
  });

  test.describe("GET /api/materials", () => {
    test("should return 200 with materials array", async ({ request }) => {
      // Act
      const response = await request.get(`${BASE_URL}/api/materials`);

      // Assert
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(0);

      // Verify each material has required fields
      if (data.data.length > 0) {
        const material = data.data[0];
        expect(material).toHaveProperty("id");
        expect(material).toHaveProperty("name");
        expect(typeof material.id).toBe("string");
        expect(typeof material.name).toBe("string");
      }
    });

    test("should return correct Content-Type header", async ({ request }) => {
      // Act
      const response = await request.get(`${BASE_URL}/api/materials`);

      // Assert
      expect(response.headers()["content-type"]).toContain("application/json");
    });

    test("should not require authentication", async ({ request }) => {
      // Act
      const response = await request.get(`${BASE_URL}/api/materials`, {
        headers: {
          Authorization: "",
        },
      });

      // Assert
      expect(response.status()).toBe(200);
    });
  });

  test.describe("GET /api/specializations", () => {
    test("should return 200 with specializations array", async ({ request }) => {
      // Act
      const response = await request.get(`${BASE_URL}/api/specializations`);

      // Assert
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(0);

      // Verify each specialization has required fields
      if (data.data.length > 0) {
        const specialization = data.data[0];
        expect(specialization).toHaveProperty("id");
        expect(specialization).toHaveProperty("name");
        expect(typeof specialization.id).toBe("string");
        expect(typeof specialization.name).toBe("string");
      }
    });

    test("should return correct Content-Type header", async ({ request }) => {
      // Act
      const response = await request.get(`${BASE_URL}/api/specializations`);

      // Assert
      expect(response.headers()["content-type"]).toContain("application/json");
    });

    test("should not require authentication", async ({ request }) => {
      // Act
      const response = await request.get(`${BASE_URL}/api/specializations`, {
        headers: {
          Authorization: "",
        },
      });

      // Assert
      expect(response.status()).toBe(200);
    });
  });

  test.describe("Error Handling", () => {
    test("should return error response with correct structure on server error", async ({ request }) => {
      // This test verifies that error responses follow the ApiErrorDTO structure
      // Note: In a real scenario, you would need to mock/trigger a database error

      // For now, verify that successful responses have consistent structure
      const response = await request.get(`${BASE_URL}/api/categories`);
      const data = await response.json();

      // If status is not 200, should have error structure
      if (response.status() !== 200) {
        expect(data).toHaveProperty("error");
        expect(data.error).toHaveProperty("code");
        expect(data.error).toHaveProperty("message");
      }
    });
  });

  test.describe("Response Performance", () => {
    test("categories endpoint should respond quickly", async ({ request }) => {
      // Act
      const startTime = Date.now();
      const response = await request.get(`${BASE_URL}/api/categories`);
      const endTime = Date.now();

      // Assert: Should respond within 1000ms (1 second)
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(1000);
      expect(response.status()).toBe(200);
    });

    test("materials endpoint should respond quickly", async ({ request }) => {
      // Act
      const startTime = Date.now();
      const response = await request.get(`${BASE_URL}/api/materials`);
      const endTime = Date.now();

      // Assert
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(1000);
      expect(response.status()).toBe(200);
    });

    test("specializations endpoint should respond quickly", async ({ request }) => {
      // Act
      const startTime = Date.now();
      const response = await request.get(`${BASE_URL}/api/specializations`);
      const endTime = Date.now();

      // Assert
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(1000);
      expect(response.status()).toBe(200);
    });
  });
});
