import { describe, it, expect } from "vitest";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";

describe("API Utils", () => {
  describe("createErrorResponse", () => {
    it("powinien utworzyć odpowiedź błędu z odpowiednim kodem statusu", async () => {
      const response = createErrorResponse("TEST_ERROR", "Test error message", 400);

      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "TEST_ERROR",
          message: "Test error message",
        },
      });
    });

    it("powinien utworzyć odpowiedź błędu z dodatkowymi szczegółami", async () => {
      const details = {
        email: "Nieprawidłowy format",
        password: "Za krótkie",
      };

      const response = createErrorResponse("VALIDATION_ERROR", "Błąd walidacji", 400, details);

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "Błąd walidacji",
          details: {
            email: "Nieprawidłowy format",
            password: "Za krótkie",
          },
        },
      });
    });

    it("powinien obsługiwać różne kody statusu", async () => {
      const testCases = [
        { code: "UNAUTHORIZED", message: "Brak autoryzacji", status: 401 },
        { code: "FORBIDDEN", message: "Brak dostępu", status: 403 },
        { code: "NOT_FOUND", message: "Nie znaleziono", status: 404 },
        { code: "CONFLICT", message: "Konflikt", status: 409 },
        { code: "SERVER_ERROR", message: "Błąd serwera", status: 500 },
      ];

      for (const testCase of testCases) {
        const response = createErrorResponse(testCase.code, testCase.message, testCase.status);
        expect(response.status).toBe(testCase.status);

        const body = await response.json();
        expect(body.error.code).toBe(testCase.code);
        expect(body.error.message).toBe(testCase.message);
      }
    });

    it("nie powinien zawierać pola details gdy nie podano", async () => {
      const response = createErrorResponse("TEST_ERROR", "Test message", 400);

      const body = await response.json();
      expect(body.error).not.toHaveProperty("details");
    });

    it("powinien zawierać pole details gdy podano puste szczegóły", async () => {
      const response = createErrorResponse("TEST_ERROR", "Test message", 400, {});

      const body = await response.json();
      expect(body.error).toHaveProperty("details");
      expect(body.error.details).toEqual({});
    });
  });

  describe("createSuccessResponse", () => {
    it("powinien utworzyć odpowiedź sukcesu z kodem 200", async () => {
      const data = { success: true, message: "Operation successful" };
      const response = createSuccessResponse(data);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const body = await response.json();
      expect(body).toEqual(data);
    });

    it("powinien utworzyć odpowiedź sukcesu z niestandardowym kodem statusu", async () => {
      const data = { id: "123", created: true };
      const response = createSuccessResponse(data, 201);

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toEqual(data);
    });

    it("powinien obsługiwać różne typy danych", async () => {
      // String
      const stringResponse = createSuccessResponse("Success");
      expect(await stringResponse.text()).toBe(JSON.stringify("Success"));

      // Number
      const numberResponse = createSuccessResponse(42);
      expect(await numberResponse.json()).toBe(42);

      // Boolean
      const booleanResponse = createSuccessResponse(true);
      expect(await booleanResponse.json()).toBe(true);

      // Array
      const arrayData = [1, 2, 3];
      const arrayResponse = createSuccessResponse(arrayData);
      expect(await arrayResponse.json()).toEqual(arrayData);

      // Object
      const objectData = { name: "Test", value: 123 };
      const objectResponse = createSuccessResponse(objectData);
      expect(await objectResponse.json()).toEqual(objectData);
    });

    it("powinien obsługiwać null i undefined", async () => {
      const nullResponse = createSuccessResponse(null);
      expect(await nullResponse.json()).toBe(null);

      const undefinedResponse = createSuccessResponse(undefined);
      const text = await undefinedResponse.text();
      expect(text === "" || text === "null").toBe(true);
    });

    it("powinien obsługiwać zagnieżdżone struktury danych", async () => {
      const complexData = {
        user: {
          id: "123",
          profile: {
            name: "John Doe",
            settings: {
              theme: "dark",
              notifications: true,
            },
          },
        },
        timestamp: new Date().toISOString(),
      };

      const response = createSuccessResponse(complexData);
      const body = await response.json();
      expect(body).toEqual(complexData);
    });
  });

  describe("Formatowanie odpowiedzi", () => {
    it("odpowiedzi powinny być prawidłowym JSON", async () => {
      const errorResponse = createErrorResponse("TEST", "Test", 400);
      const errorText = await errorResponse.text();
      expect(() => JSON.parse(errorText)).not.toThrow();

      const successResponse = createSuccessResponse({ test: true });
      const successText = await successResponse.text();
      expect(() => JSON.parse(successText)).not.toThrow();
    });

    it("odpowiedzi powinny mieć odpowiedni Content-Type", () => {
      const errorResponse = createErrorResponse("TEST", "Test", 400);
      expect(errorResponse.headers.get("Content-Type")).toBe("application/json");

      const successResponse = createSuccessResponse({ test: true });
      expect(successResponse.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć bardzo długie wiadomości", async () => {
      const longMessage = "A".repeat(10000);
      const response = createErrorResponse("TEST", longMessage, 400);

      const body = await response.json();
      expect(body.error.message).toBe(longMessage);
      expect(body.error.message.length).toBe(10000);
    });

    it("powinien obsłużyć wiele szczegółów walidacji", async () => {
      const manyDetails: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        manyDetails[`field${i}`] = `Error ${i}`;
      }

      const response = createErrorResponse("VALIDATION_ERROR", "Multiple errors", 400, manyDetails);

      const body = await response.json();
      expect(body.error.details).toBeDefined();
      expect(Object.keys(body.error.details || {}).length).toBe(100);
    });

    it("powinien obsłużyć znaki specjalne w wiadomościach", async () => {
      const specialCharsMessage = 'Test "quotes" \\backslash\\ \n newline \t tab';
      const response = createErrorResponse("TEST", specialCharsMessage, 400);

      const body = await response.json();
      expect(body.error.message).toBe(specialCharsMessage);
    });

    it("powinien obsłużyć znaki Unicode", async () => {
      const unicodeMessage = "Test 你好 🎉 émojis ąćęłńóśźż";
      const response = createErrorResponse("TEST", unicodeMessage, 400);

      const body = await response.json();
      expect(body.error.message).toBe(unicodeMessage);
    });
  });
});
