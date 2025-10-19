import type { PaginationMetaDTO } from "@/types";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  pagination: PaginationMetaDTO;
  onPageChange: (newPage: number) => void;
}

export default function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  const { page, total_pages, total } = pagination;

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
      // Scroll to top after page change
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (page < total_pages) {
      onPageChange(page + 1);
      // Scroll to top after page change
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8">
      <Button onClick={handlePrevious} disabled={page <= 1} variant="outline" size="lg" aria-label="Poprzednia strona">
        ← Poprzednia
      </Button>

      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium">
          Strona {page} z {total_pages}
        </span>
        <span className="text-xs text-muted-foreground">Łącznie obrazów: {total}</span>
      </div>

      <Button
        onClick={handleNext}
        disabled={page >= total_pages}
        variant="outline"
        size="lg"
        aria-label="Następna strona"
      >
        Następna →
      </Button>
    </div>
  );
}
