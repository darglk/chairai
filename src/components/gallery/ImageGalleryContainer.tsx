"use client";

import { useImageGallery } from "@/components/hooks/useImageGallery";
import ImageCard from "@/components/gallery/ImageCard";
import PaginationControls from "@/components/gallery/PaginationControls";
import { Button } from "@/components/ui/button";

export default function ImageGalleryContainer() {
  const { images, pagination, isLoading, error, setCurrentPage } = useImageGallery();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Ładowanie obrazów...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="text-red-500 text-5xl">⚠️</div>
        <h2 className="text-xl font-semibold text-red-500">Wystąpił błąd</h2>
        <p className="text-muted-foreground text-center max-w-md">{error.error.message}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  // Empty state
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="text-6xl">🖼️</div>
        <h2 className="text-2xl font-semibold">Brak wygenerowanych obrazów</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Nie wygenerowałeś jeszcze żadnych obrazów. Przejdź do generatora, aby zacząć tworzyć!
        </p>
        <Button asChild>
          <a href="/generate">Przejdź do generatora</a>
        </Button>
      </div>
    );
  }

  // Success state with images
  // Note: Filter controls temporarily disabled due to RLS infinite recursion issue
  // TODO: Re-enable filter after fixing RLS policies on projects table
  return (
    <div className="space-y-6">
      {/* Images grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((image) => (
          <ImageCard key={image.id} image={image} />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <PaginationControls pagination={pagination} onPageChange={setCurrentPage} />
      )}
    </div>
  );
}
