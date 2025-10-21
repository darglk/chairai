import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PortfolioImageDTO } from "@/types";

interface PortfolioManagerProps {
  portfolioImages: PortfolioImageDTO[];
  onBack: () => void;
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (imageId: string) => Promise<void>;
  onFinish: () => void;
  isSubmitting: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_IMAGES_REQUIRED = 5;

/**
 * Step 3: Portfolio Manager
 * Handles uploading and managing portfolio images
 */
export function PortfolioManager({
  portfolioImages,
  onBack,
  onUpload,
  onDelete,
  onFinish,
  isSubmitting,
}: PortfolioManagerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate file before upload
   */
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `Plik ${file.name} jest zbyt duży (maksymalnie 5MB)`;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return `Plik ${file.name} ma nieobsługiwany format. Użyj JPG, PNG lub WEBP`;
    }
    return null;
  };

  /**
   * Handle file selection
   */
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadError(null);
    setValidationError(null);

    const fileArray = Array.from(files);

    // Validate all files
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        return;
      }
    }

    try {
      await onUpload(fileArray);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Nie udało się przesłać zdjęć");
    }
  };

  /**
   * Handle drag events
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  /**
   * Handle drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  /**
   * Handle file input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  /**
   * Handle click on upload area
   */
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle delete image
   */
  const handleDeleteImage = async (imageId: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć to zdjęcie?")) {
      try {
        await onDelete(imageId);
      } catch {
        setUploadError("Nie udało się usunąć zdjęcia");
      }
    }
  };

  const isFormValid = portfolioImages.length >= MIN_IMAGES_REQUIRED;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div>
        <div className="block text-sm font-medium mb-2">
          Zdjęcia portfolio <span className="text-destructive">*</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Dodaj minimum 5 zdjęć swoich prac. Akceptowane formaty: JPG, PNG, WEBP (max 5MB każde)
        </p>

        <div
          role="button"
          tabIndex={0}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50"
          } ${isSubmitting ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            onChange={handleChange}
            className="hidden"
            disabled={isSubmitting}
            aria-label="Upload portfolio images"
          />

          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium mb-1">Kliknij aby wybrać pliki lub przeciągnij je tutaj</p>
          <p className="text-xs text-muted-foreground">JPG, PNG lub WEBP (max 5MB)</p>
        </div>
      </div>

      {/* Upload Progress */}
      {isSubmitting && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Przesyłanie zdjęć... Proszę czekać, może to chwilę potrwać.</AlertDescription>
        </Alert>
      )}

      {/* Errors */}
      {(uploadError || validationError) && !isSubmitting && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError || validationError}</AlertDescription>
        </Alert>
      )}

      {/* Image Grid */}
      {portfolioImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">
              Dodane zdjęcia: {portfolioImages.length} / {MIN_IMAGES_REQUIRED}
            </p>
            {!isFormValid && (
              <p className="text-sm text-destructive">
                Dodaj jeszcze {MIN_IMAGES_REQUIRED - portfolioImages.length} zdjęć
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {portfolioImages.map((image) => (
              <div key={image.id} className="relative group aspect-square rounded-lg overflow-hidden border">
                <img
                  src={image.image_url}
                  alt="Zdjęcie portfolio"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteImage(image.id)}
                    disabled={isSubmitting}
                    aria-label="Usuń zdjęcie"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {portfolioImages.length === 0 && (
        <div className="text-center py-8 border rounded-lg bg-accent/50">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Nie dodano jeszcze żadnych zdjęć</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting} size="lg">
          Wstecz
        </Button>
        <Button type="button" onClick={onFinish} disabled={!isFormValid || isSubmitting} size="lg">
          {isSubmitting ? "Zapisywanie..." : "Zakończ"}
        </Button>
      </div>
    </div>
  );
}
