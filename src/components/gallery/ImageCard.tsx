import type { GeneratedImageDTO } from "@/types";
import { Button } from "@/components/ui/button";

interface ImageCardProps {
  image: GeneratedImageDTO;
}

export default function ImageCard({ image }: ImageCardProps) {
  const formattedDate = new Date(image.created_at).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative group border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200 bg-card">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image.image_url}
          alt={image.prompt ?? "Wygenerowany obraz mebla"}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Usage badge */}
        {image.is_used && (
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
            ✓ Użyto w projekcie
          </div>
        )}

        {/* Hover overlay with action button */}
        {!image.is_used && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button asChild size="lg" className="shadow-xl">
              <a href={`/projects/create?imageId=${image.id}`}>Stwórz projekt</a>
            </Button>
          </div>
        )}
      </div>

      {/* Card footer with details */}
      <div className="p-4 space-y-2">
        {image.prompt && (
          <p className="text-sm text-foreground line-clamp-2" title={image.prompt}>
            {image.prompt}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>
    </div>
  );
}
