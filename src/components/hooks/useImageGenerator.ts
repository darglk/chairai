import { useState, useCallback } from "react";
import type { GeneratedImageDTO, GenerateImageResponseDTO } from "@/types";

export interface ErrorMessage {
  code: string;
  message: string;
  details?: Record<string, string>;
  retryable?: boolean;
}

export interface GeneratorViewState {
  prompt: string;
  isLoading: boolean;
  error: ErrorMessage | null;
  generatedImage: GeneratedImageDTO | null;
  remainingGenerations: number;
}

interface UseImageGeneratorReturn {
  state: GeneratorViewState;
  generateImage: (prompt: string) => Promise<void>;
  saveImage: (imageId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const mapErrorToUserMessage = (error: unknown): ErrorMessage => {
  if (error instanceof Response) {
    if (error.status === 400) {
      return {
        code: "VALIDATION_ERROR",
        message: "Opis mebla musi zawierać 10-500 znaków",
        retryable: true,
      };
    }
    if (error.status === 401) {
      return {
        code: "UNAUTHORIZED",
        message: "Sesja wygasła. Zaloguj się ponownie",
        retryable: false,
      };
    }
    if (error.status === 403) {
      return {
        code: "FORBIDDEN",
        message: "Tylko klienci mogą generować obrazy",
        retryable: false,
      };
    }
    if (error.status === 429) {
      return {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Osiągnięto limit 10 darmowych generacji. Aby wygenerować więcej, uaktualnij konto.",
        retryable: false,
      };
    }
    if (error.status === 503) {
      return {
        code: "SERVICE_UNAVAILABLE",
        message: "Usługa generowania obrazów jest tymczasowo niedostępna. Spróbuj ponownie za chwilę.",
        retryable: true,
      };
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("timeout") || error.message.includes("Timeout")) {
      return {
        code: "TIMEOUT",
        message: "Połączenie zostało przerwane. Spróbuj ponownie.",
        retryable: true,
      };
    }
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "Wystąpił błąd serwera. Spróbuj ponownie później lub skontaktuj się z supportem.",
    retryable: true,
  };
};

export const useImageGenerator = (): UseImageGeneratorReturn => {
  const [state, setState] = useState<GeneratorViewState>({
    prompt: "",
    isLoading: false,
    error: null,
    generatedImage: null,
    remainingGenerations: 10,
  });

  const generateImage = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) {
        setState((prev) => ({
          ...prev,
          error: {
            code: "VALIDATION_ERROR",
            message: "Opis mebla musi zawierać co najmniej 10 znaków",
            retryable: true,
          },
        }));
        return;
      }

      if (prompt.length < 10 || prompt.length > 500) {
        setState((prev) => ({
          ...prev,
          error: {
            code: "VALIDATION_ERROR",
            message: "Opis mebla musi zawierać 10-500 znaków",
            retryable: true,
          },
        }));
        return;
      }

      if (state.remainingGenerations <= 0) {
        setState((prev) => ({
          ...prev,
          error: {
            code: "GENERATION_LIMIT_REACHED",
            message: "Osiągnięto limit 10 darmowych generacji. Aby wygenerować więcej, uaktualnij konto.",
            retryable: false,
          },
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        const response = await fetch("/api/images/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw response;
        }

        const data: GenerateImageResponseDTO = await response.json();

        setState((prev) => ({
          ...prev,
          isLoading: false,
          generatedImage: {
            id: data.id,
            user_id: data.user_id,
            prompt: data.prompt,
            image_url: data.image_url,
            created_at: data.created_at,
            is_used: data.is_used,
          },
          remainingGenerations: data.remaining_generations,
          prompt: "",
        }));
      } catch (error) {
        const errorMessage = mapErrorToUserMessage(error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    },
    [state.remainingGenerations]
  );

  const saveImage = useCallback(async (imageId: string) => {
    // Guard clause: no image to save
    if (!imageId) {
      setState((prev) => ({
        ...prev,
        error: {
          code: "INVALID_IMAGE",
          message: "Nie można zapisać obrazu bez ID",
          retryable: false,
        },
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch(`/api/images/generated/${imageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_used: true }),
      });

      if (!response.ok) {
        throw response;
      }

      // Reset to show success feedback
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = mapErrorToUserMessage(error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      generatedImage: null,
      error: null,
      prompt: "",
    }));
  }, []);

  return {
    state,
    generateImage,
    saveImage,
    clearError,
    reset,
  };
};
