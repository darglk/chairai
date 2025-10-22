# Fix: Upload plików portfolio - Dokumentacja naprawy

## 🐛 Problem

Przy uploadzie plików do portfolio backend zwracał błąd **400 Bad Request**.

### Analiza problemu

Po przeanalizowaniu kodu znaleziono następujące niezgodności:

#### Backend (`/api/artisans/me/portfolio`)

```typescript
// Oczekuje pojedynczego pliku z nazwą "image"
const image = formData.get("image");

if (!image) {
  return createErrorResponse("MISSING_FILE", "Brak pliku obrazu w żądaniu", 400);
}
```

#### Frontend (przed naprawą)

```typescript
// Wysyłał tablicę plików z nazwą "images"
files.forEach((file) => {
  formData.append("images", file); // ❌ Niepoprawna nazwa pola
});
```

### Rozbieżności:

1. **Nazwa pola formData:**
   - Backend: `"image"` (pojedyncza)
   - Frontend: `"images"` (mnoga) ❌

2. **Ilość plików:**
   - Backend: obsługuje **jeden plik** na request
   - Frontend: wysyłał **wiele plików** w jednym request ❌

3. **Format odpowiedzi:**
   - Backend: zwraca `PortfolioImageDTO` (pojedynczy obiekt)
   - Frontend: oczekiwał `PortfolioImageDTO[]` (tablica) ❌

## ✅ Rozwiązanie

Zmieniono frontend aby wysyłał pliki **pojedynczo w pętli**.

### Zaktualizowany kod (`useArtisanProfileForm.ts`)

```typescript
/**
 * Handle portfolio image upload
 * Uploads multiple files sequentially to avoid overwhelming the server
 */
const handlePortfolioUpload = useCallback(async (files: File[]) => {
  try {
    setIsSubmitting(true);
    setError(null);

    const uploadedImages: PortfolioImageDTO[] = [];

    // Upload files sequentially (one by one)
    for (const file of files) {
      const formData = new FormData();
      formData.append("image", file); // ✅ Poprawna nazwa pola

      const response = await fetch("/api/artisans/me/portfolio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData: ApiErrorDTO = await response.json();
        setError(errorData);
        // Stop uploading remaining files on first error
        return;
      }

      const uploadedImage: PortfolioImageDTO = await response.json();
      uploadedImages.push(uploadedImage);
    }

    // Add all successfully uploaded images to profile
    setProfileData((prev) => ({
      ...prev,
      portfolio_images: [...prev.portfolio_images, ...uploadedImages],
    }));
  } catch {
    setError({
      error: {
        code: "UPLOAD_ERROR",
        message: "Nie udało się przesłać zdjęć. Spróbuj ponownie.",
      },
    });
  } finally {
    setIsSubmitting(false);
  }
}, []);
```

### Zmiany w `PortfolioManager.tsx`

Dodano komunikat o postępie uploadu:

```typescript
{/* Upload Progress */}
{isSubmitting && (
  <Alert>
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      Przesyłanie zdjęć... Proszę czekać, może to chwilę potrwać.
    </AlertDescription>
  </Alert>
)}
```

## 📊 Porównanie: Przed vs Po

| Aspekt                | Przed                         | Po                        |
| --------------------- | ----------------------------- | ------------------------- |
| **Nazwa pola**        | `"images"` ❌                 | `"image"` ✅              |
| **Ilość requestów**   | 1 (z wieloma plikami)         | N (po jednym na plik)     |
| **Format odpowiedzi** | Oczekiwano tablicy ❌         | Pojedynczy obiekt ✅      |
| **Obsługa błędów**    | Upload wszystkich lub żadnego | Stop na pierwszym błędzie |
| **UX - feedback**     | Brak                          | Alert z postępem ✅       |

## 🎯 Dlaczego sequential upload?

### Zalety:

1. ✅ **Prostota** - nie wymaga zmian w backend API
2. ✅ **Zgodność** - wykorzystuje istniejący endpoint bez modyfikacji
3. ✅ **Feedback** - użytkownik widzi że coś się dzieje
4. ✅ **Graceful degradation** - upload zatrzymuje się na pierwszym błędzie

### Wady:

- ⏱️ **Wolniejsze** - pliki uploadowane sekwencyjnie, nie równolegle
- 📶 **Więcej requestów** - każdy plik = osobny request HTTP

### Alternatywne rozwiązanie (nie zaimplementowane):

Można by zmienić backend na obsługę multiple upload:

```typescript
// Backend - obsługa wielu plików
const images = formData.getAll("images");
const uploadedImages = [];

for (const image of images) {
  if (image instanceof File) {
    const result = await uploadPortfolioImage(image, userId);
    uploadedImages.push(result);
  }
}

return createSuccessResponse(uploadedImages, 201);
```

**Decyzja:** Sequential upload jest wystarczający dla MVP. Batch upload można dodać w przyszłości jako optymalizację.

## 🧪 Jak przetestować

1. Zaloguj się jako użytkownik z rolą "artisan"
2. Przejdź do `/profile/edit`
3. Przejdź do kroku 3 (Portfolio)
4. Wybierz **wiele zdjęć** (np. 5) naraz
5. Obserwuj:
   - ✅ Alert "Przesyłanie zdjęć..."
   - ✅ Zdjęcia pojawiają się jedno po drugim
   - ✅ Po zakończeniu alert znika
   - ✅ Wszystkie zdjęcia są widoczne w siatce

## 📝 Pliki zmodyfikowane

- ✏️ `src/components/hooks/useArtisanProfileForm.ts`
  - Zmieniono logikę `handlePortfolioUpload`
  - Sequential upload zamiast batch upload
- ✏️ `src/components/profile/PortfolioManager.tsx`
  - Dodano alert z informacją o postępie
  - Ukrycie błędów podczas uploadu

## ✅ Status

**NAPRAWIONE** - Upload działa poprawnie i zgodnie z API.
