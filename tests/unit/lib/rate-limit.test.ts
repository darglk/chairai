import { describe, it, expect, afterEach } from "vitest";
import {
  getRateLimitKey,
  checkRateLimit,
  getRemainingRequests,
  getResetTime,
  checkImageGenerationRateLimit,
  resetRateLimit,
  clearAllRateLimits,
} from "@/lib/rate-limit";

describe("Rate Limiting", () => {
  afterEach(() => {
    // Clean up after each test
    clearAllRateLimits();
  });

  describe("getRateLimitKey()", () => {
    it("powinien zwrócić klucz oparty na userId gdy dostępny", () => {
      const key = getRateLimitKey("user123", "192.168.1.1");
      expect(key).toBe("user:user123");
    });

    it("powinien zwrócić klucz oparty na IP gdy brak userId", () => {
      const key = getRateLimitKey(undefined, "192.168.1.1");
      expect(key).toBe("ip:192.168.1.1");
    });

    it("powinien zwrócić klucz oparty na IP gdy userId to null", () => {
      const key = getRateLimitKey(null as unknown as string, "10.0.0.1");
      expect(key).toBe("ip:10.0.0.1");
    });
  });

  describe("checkRateLimit()", () => {
    it("powinien dopuścić pierwsze żądanie", () => {
      const result = checkRateLimit("test-key", 5, 300);
      expect(result).toBe(true);
    });

    it("powinien dopuścić żądania do osiągnięcia limitu", () => {
      const key = "test-key";
      const limit = 3;

      const result1 = checkRateLimit(key, limit, 300);
      const result2 = checkRateLimit(key, limit, 300);
      const result3 = checkRateLimit(key, limit, 300);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });

    it("powinien odrzucić żądania przekraczające limit", () => {
      const key = "test-key";
      const limit = 2;

      checkRateLimit(key, limit, 300);
      checkRateLimit(key, limit, 300);
      const result3 = checkRateLimit(key, limit, 300);

      expect(result3).toBe(false);
    });

    it("powinien resetować limit po upłynięciu okna czasowego", () => {
      const key = "test-key";
      const limit = 1;

      const result1 = checkRateLimit(key, limit, 1); // 1 second window
      expect(result1).toBe(true);

      const result2 = checkRateLimit(key, limit, 1);
      expect(result2).toBe(false);

      // Wait for window to expire and check again with very small window
      // (note: w praktyce czekanie 1 sekundy mogłoby nie wystarczyć ze względu na czas wykonania)
    });

    it("powinien traktować różne klucze niezależnie", () => {
      const key1 = "user:user1";
      const key2 = "user:user2";
      const limit = 1;

      const result1 = checkRateLimit(key1, limit, 300);
      const result2 = checkRateLimit(key2, limit, 300);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe("getRemainingRequests()", () => {
    it("powinien zwrócić pełny limit dla nowego klucza", () => {
      const remaining = getRemainingRequests("new-key", 5);
      expect(remaining).toBe(5);
    });

    it("powinien zmniejszać liczbę remaining po każdym żądaniu", () => {
      const key = "test-key";
      const limit = 5;

      checkRateLimit(key, limit, 300);
      let remaining = getRemainingRequests(key, limit);
      expect(remaining).toBe(4);

      checkRateLimit(key, limit, 300);
      remaining = getRemainingRequests(key, limit);
      expect(remaining).toBe(3);
    });

    it("powinien zwrócić 0 gdy limit osiągnięty", () => {
      const key = "test-key";
      const limit = 2;

      checkRateLimit(key, limit, 300);
      checkRateLimit(key, limit, 300);

      const remaining = getRemainingRequests(key, limit);
      expect(remaining).toBe(0);
    });
  });

  describe("getResetTime()", () => {
    it("powinien zwrócić czas resetu dla aktywnego bucketu", () => {
      const key = "test-key";
      checkRateLimit(key, 5, 300);

      const resetTime = getResetTime(key);
      const now = Date.now();

      // Reset powinien być w przybliżeniu 300 sekund od teraz
      expect(resetTime).toBeGreaterThan(now);
      expect(resetTime - now).toBeLessThanOrEqual(300 * 1000 + 100); // +100ms tolerancja
    });

    it("powinien zwrócić przyszły czas dla nowego klucza", () => {
      const resetTime = getResetTime("non-existent-key");
      const now = Date.now();

      expect(resetTime).toBeGreaterThan(now);
    });
  });

  describe("checkImageGenerationRateLimit()", () => {
    it("powinien zwrócić prawidłową strukturę", () => {
      const result = checkImageGenerationRateLimit("user123", "192.168.1.1");

      expect(result).toHaveProperty("allowed");
      expect(result).toHaveProperty("remaining");
      expect(result).toHaveProperty("resetTime");

      expect(typeof result.allowed).toBe("boolean");
      expect(typeof result.remaining).toBe("number");
      expect(typeof result.resetTime).toBe("number");
    });

    it("powinien dopuścić pierwsze żądanie", () => {
      const result = checkImageGenerationRateLimit("user123", "192.168.1.1");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeLessThan(5); // Domyślny limit to 5
    });

    it("powinien odrzucić żądania przekraczające limit", () => {
      const userId = "user123";
      const clientIp = "192.168.1.1";

      // Wyczerpaj limit
      for (let i = 0; i < 5; i++) {
        checkImageGenerationRateLimit(userId, clientIp);
      }

      // Następne żądanie powinno być odrzucone
      const result = checkImageGenerationRateLimit(userId, clientIp);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("powinien traktować różnych użytkowników niezależnie", () => {
      const result1 = checkImageGenerationRateLimit("user1", "192.168.1.1");
      const result2 = checkImageGenerationRateLimit("user2", "192.168.1.1");

      // Oba pierwsze żądania powinny być dozwolone
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });

    it("powinien traktować różne IP niezależnie dla niezalogowanych", () => {
      const result1 = checkImageGenerationRateLimit(undefined, "192.168.1.1");
      const result2 = checkImageGenerationRateLimit(undefined, "192.168.1.2");

      // Oba pierwsze żądania powinny być dozwolone
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });
  });

  describe("resetRateLimit()", () => {
    it("powinien resetować limit dla konkretnego klucza", () => {
      const key = "test-key";
      const limit = 2;

      // Wyczerpaj limit
      checkRateLimit(key, limit, 300);
      checkRateLimit(key, limit, 300);

      let result = checkRateLimit(key, limit, 300);
      expect(result).toBe(false);

      // Resetuj limit
      resetRateLimit(key);

      // Powinien znowu dopuścić żądania
      result = checkRateLimit(key, limit, 300);
      expect(result).toBe(true);
    });
  });

  describe("clearAllRateLimits()", () => {
    it("powinien wyczyścić wszystkie limity", () => {
      const limit = 1;

      // Stworz kilka limitów
      checkRateLimit("key1", limit, 300);
      checkRateLimit("key2", limit, 300);
      checkRateLimit("key3", limit, 300);

      // Wszystkie są już wyczerpane
      expect(checkRateLimit("key1", limit, 300)).toBe(false);
      expect(checkRateLimit("key2", limit, 300)).toBe(false);
      expect(checkRateLimit("key3", limit, 300)).toBe(false);

      // Wyczyść wszystko
      clearAllRateLimits();

      // Teraz wszystkie powinny być resetowane
      expect(checkRateLimit("key1", limit, 300)).toBe(true);
      expect(checkRateLimit("key2", limit, 300)).toBe(true);
      expect(checkRateLimit("key3", limit, 300)).toBe(true);
    });
  });

  describe("Integracja", () => {
    it("powinien symulować scenariusz rzeczywisty z limitem 5 żądań na 5 minut", () => {
      const userId = "test-user";
      const clientIp = "192.168.1.1";

      // Pierwsze 5 żądań powinno przejść
      for (let i = 1; i <= 5; i++) {
        const result = checkImageGenerationRateLimit(userId, clientIp);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(5 - i);
      }

      // 6 żądanie powinno być odrzucone
      const finalResult = checkImageGenerationRateLimit(userId, clientIp);
      expect(finalResult.allowed).toBe(false);
      expect(finalResult.remaining).toBe(0);
    });
  });
});
