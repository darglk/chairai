# Przewodnik Implementacji: OpenRouterService

**Data:** 18 października 2025
**Wersja:** 1.0
**Autor:** GitHub Copilot (Architekt Oprogramowania)

## 1. Opis usługi

`OpenRouterService` to kluczowy komponent w architekturze aplikacji, odpowiedzialny za komunikację z zewnętrznym API OpenRouter. Jego głównym zadaniem jest transformacja prostych zapytań tekstowych użytkowników (np. "dębowe krzesło w stylu skandynawskim") w rozbudowane, kreatywne prompty zoptymalizowane pod kątem modeli generujących obrazy (text-to-image).

Usługa będzie hermetyzować logikę tworzenia zapytań, wysyłania ich do API, obsługi odpowiedzi oraz walidacji i parsowania danych. Dzięki wykorzystaniu `response_format` z `json_schema`, usługa zapewni, że odpowiedzi z LLM będą zawsze ustrukturyzowane i przewidywalne, co ułatwi ich integrację z resztą systemu.

## 2. Opis konstruktora

Konstruktor klasy `OpenRouterService` będzie odpowiedzialny za inicjalizację usługi z niezbędną konfiguracją.

```typescript
// src/lib/services/openrouter.service.ts

import { z } from 'zod';
import { imagePromptSchema } from '@/lib/schemas'; // Schemat do zdefiniowania

type OpenRouterServiceConfig = {
  apiKey: string;
  baseUrl?: string;
};

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: OpenRouterServiceConfig) {
    if (!config.apiKey) {
      throw new Error('OpenRouter API key is required.');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
  }

  // ... metody
}
```

- **`config`**: Obiekt konfiguracyjny.
  - **`apiKey`**: Klucz API do uwierzytelnienia w OpenRouter. Będzie pobierany ze zmiennych środowiskowych (`import.meta.env.OPENROUTER_API_KEY`).
  - **`baseUrl`**: Opcjonalny adres URL API, z domyślną wartością `https://openrouter.ai/api/v1`.

## 3. Publiczne metody i pola

### `async generateImagePrompt(userContent: string): Promise<z.infer<typeof imagePromptSchema>>`

Główna metoda publiczna usługi. Przyjmuje tekst od użytkownika i zwraca ustrukturyzowany obiekt z promptem do generowania obrazu.

- **`userContent`**: `string` - tekst wprowadzony przez użytkownika (np. "nowoczesny fotel").
- **Zwraca**: `Promise<ImagePrompt>` - Obiekt zgodny ze zdefiniowanym schematem Zod `imagePromptSchema`, zawierający `positivePrompt` i `negativePrompt`.

**Przykład użycia:**

```typescript
// W endpoint'cie API Astro: src/pages/api/images/generate.ts
const openrouterService = new OpenRouterService({ apiKey: import.meta.env.OPENROUTER_API_KEY });
const userInput = "A comfortable armchair for a modern living room";
try {
  const imagePrompt = await openrouterService.generateImagePrompt(userInput);
  console.log(imagePrompt.positivePrompt);
  // -> "cinematic photo of a comfortable armchair in a modern living room, minimalist design, soft fabric, warm lighting, 4k, photorealistic"
  console.log(imagePrompt.negativePrompt);
  // -> "blurry, low quality, cartoon, drawing, ugly, deformed"
} catch (error) {
  // obsługa błędów
}
```

## 4. Prywatne metody i pola

### `private async createChatCompletion(payload: object): Promise<any>`

Prywatna metoda odpowiedzialna za wykonanie zapytania `fetch` do API OpenRouter.

- **`payload`**: Obiekt zawierający wszystkie dane potrzebne do zapytania, w tym `model`, `messages`, `response_format` itp.
- **Logika**:
  1. Ustawia nagłówki (`Authorization: Bearer ${this.apiKey}`, `Content-Type: application/json`).
  2. Wykonuje zapytanie `POST` na adres `${this.baseUrl}/chat/completions`.
  3. Sprawdza status odpowiedzi HTTP. Jeśli nie jest `2xx`, rzuca `HttpError` z odpowiednim statusem i komunikatem.
  4. Parsuje odpowiedź JSON i ją zwraca.

### `private buildRequestPayload(userContent: string): object`

Metoda budująca kompletny obiekt `payload` dla zapytania do API.

- **`userContent`**: Tekst od użytkownika.
- **Logika**:
  1. **Komunikat systemowy**: Definiuje rolę i zadanie dla LLM.
     - *Przykład*: `"You are an expert in interior design and creative writing, specializing in crafting detailed prompts for AI image generation models. Your task is to take a user's simple description of a piece of furniture and expand it into a rich, detailed prompt that will produce a photorealistic and aesthetically pleasing image. You must also provide a negative prompt to exclude common visual artifacts."`
  2. **Komunikat użytkownika**: Przekazuje treść od użytkownika.
     - *Przykład*: `userContent`
  3. **`response_format` (schemat JSON)**: Wymusza strukturę odpowiedzi.
     - *Przykład*:
       ```json
       {
         "type": "json_schema",
         "json_schema": {
           "name": "imagePromptGenerator",
           "strict": true,
           "schema": {
             "type": "object",
             "properties": {
               "positivePrompt": {
                 "type": "string",
                 "description": "A detailed, comma-separated prompt for generating a high-quality image."
               },
               "negativePrompt": {
                 "type": "string",
                 "description": "A comma-separated list of keywords to avoid in the generated image."
               }
             },
             "required": ["positivePrompt", "negativePrompt"]
           }
         }
       }
       ```
  4. **Nazwa modelu**: Określa model do użycia.
     - *Przykład*: `"anthropic/claude-3.5-sonnet"` (dobry balans między jakością a kosztem).
  5. **Parametry modelu**: Dostraja zachowanie modelu.
     - *Przykład*: `temperature: 0.7`, `max_tokens: 512`.
  6. Zwraca złożony obiekt `payload`.

## 5. Obsługa błędów

Usługa musi implementować solidną obsługę błędów, aby zapewnić stabilność i przewidywalność.

1.  **Błędy walidacji Zod**: Jeśli odpowiedź API nie jest zgodna z `imagePromptSchema`, metoda `parse` z Zod rzuci wyjątek. Należy go przechwycić i opakować we własny, bardziej opisowy błąd, np. `ValidationError`.
2.  **Błędy HTTP**: Metoda `createChatCompletion` powinna rzucać niestandardowe błędy w zależności od statusu odpowiedzi:
    - `400 Bad Request`: Błąd w składni zapytania.
    - `401 Unauthorized`: Nieprawidłowy klucz API.
    - `429 Too Many Requests`: Przekroczono limit zapytań.
    - `500 Internal Server Error`: Błąd po stronie OpenRouter.
3.  **Błędy sieciowe**: Błędy związane z `fetch` (np. brak połączenia z internetem) powinny być przechwytywane i obsługiwane.
4.  **Brak klucza API**: Konstruktor powinien rzucać błąd, jeśli klucz API nie zostanie dostarczony, aby zapobiec inicjalizacji niekompletnej usługi.

## 6. Kwestie bezpieczeństwa

1.  **Zarządzanie kluczem API**: Klucz API OpenRouter (`OPENROUTER_API_KEY`) **musi** być przechowywany jako zmienna środowiskowa i nigdy nie może być umieszczany bezpośrednio w kodzie. Dostęp do niego powinien odbywać się wyłącznie po stronie serwera (w endpointach Astro), aby nie wyciekł do klienta.
2.  **Walidacja danych wejściowych**: Chociaż w tym przypadku ryzyko jest niskie, zawsze należy traktować dane od użytkownika (`userContent`) jako potencjalnie niebezpieczne. W przyszłości można dodać podstawową sanitację, aby usunąć potencjalnie szkodliwe ciągi znaków.
3.  **Ograniczenie zapytań (Rate Limiting)**: Aby chronić się przed nadużyciami i niekontrolowanymi kosztami, należy zaimplementować mechanizm ograniczający liczbę zapytań do API na użytkownika w określonym czasie. Można to zrealizować w warstwie pośredniej (middleware) Astro lub bezpośrednio w endpoincie.

## 7. Plan wdrożenia krok po kroku

**Krok 1: Konfiguracja środowiska**

1.  Dodaj `OPENROUTER_API_KEY` do pliku `.env` w głównym katalogu projektu.
    ```
    OPENROUTER_API_KEY="twoj_klucz_api"
    ```
2.  Upewnij się, że plik `.env` jest dodany do `.gitignore`.

**Krok 2: Definicja schematów Zod**

1.  Utwórz lub zaktualizuj plik `src/lib/schemas.ts`.
2.  Dodaj schemat `imagePromptSchema` do walidacji odpowiedzi z API.

    ```typescript
    // src/lib/schemas.ts
    import { z } from 'zod';

    export const imagePromptSchema = z.object({
      positivePrompt: z.string().min(1, "Positive prompt cannot be empty."),
      negativePrompt: z.string().min(1, "Negative prompt cannot be empty."),
    });
    ```

**Krok 3: Implementacja `OpenRouterService`**

1.  Utwórz nowy plik `src/lib/services/openrouter.service.ts`.
2.  Zaimplementuj klasę `OpenRouterService` zgodnie z opisem w sekcjach 2, 3 i 4 tego dokumentu. Zwróć szczególną uwagę na logikę `buildRequestPayload` i obsługę błędów w `createChatCompletion`.

**Krok 4: Integracja usługi z endpointem API Astro**

1.  Zmodyfikuj istniejący lub utwórz nowy endpoint, np. `src/pages/api/images/generate.ts`.
2.  Zgodnie z wytycznymi projektu, użyj `export const prerender = false;`.
3.  Zaimplementuj logikę endpointu `POST`, która:
    a. Pobiera dane wejściowe od klienta.
    b. Inicjalizuje `OpenRouterService` z kluczem API ze zmiennych środowiskowych.
    c. Wywołuje metodę `generateImagePrompt`.
    d. Obsługuje potencjalne błędy i zwraca odpowiednią odpowiedź HTTP (np. `200 OK` z danymi lub `500 Internal Server Error` z komunikatem o błędzie).

    ```typescript
    // src/pages/api/images/generate.ts
    import type { APIRoute } from 'astro';
    import { OpenRouterService } from '@/lib/services/openrouter.service';
    import { z } from 'zod';

    export const prerender = false;

    const requestBodySchema = z.object({
      prompt: z.string().min(5).max(200),
    });

    export const POST: APIRoute = async ({ request }) => {
      try {
        const body = await request.json();
        const validation = requestBodySchema.safeParse(body);

        if (!validation.success) {
          return new Response(JSON.stringify({ error: 'Invalid input.' }), { status: 400 });
        }

        const { prompt } = validation.data;

        const openrouterService = new OpenRouterService({
          apiKey: import.meta.env.OPENROUTER_API_KEY,
        });

        const imagePrompt = await openrouterService.generateImagePrompt(prompt);

        return new Response(JSON.stringify(imagePrompt), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Error in generate endpoint:', error);
        // TODO: Dodać bardziej szczegółową obsługę błędów
        return new Response(JSON.stringify({ error: 'Failed to generate image prompt.' }), { status: 500 });
      }
    };
    ```

**Krok 5: Testowanie**

1.  Napisz testy jednostkowe dla `OpenRouterService`, mockując `fetch`, aby sprawdzić, czy `buildRequestPayload` tworzy poprawny obiekt i czy obsługa błędów działa zgodnie z oczekiwaniami.
2.  Napisz testy integracyjne dla endpointu `/api/images/generate`, aby zweryfikować całą ścieżkę od zapytania klienta do odpowiedzi.

**Krok 6: Dokumentacja**

1.  Dodaj komentarze JSDoc do klasy `OpenRouterService` i jej publicznych metod, wyjaśniając ich działanie, parametry i zwracane wartości.
2.  Zaktualizuj `README.md` lub inną relevantną dokumentację, jeśli usługa wprowadza nowe zmienne środowiskowe lub kroki konfiguracyjne.
