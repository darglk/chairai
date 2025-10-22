import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMetaDTO } from "../../types";

interface PaginationControlsProps {
  pagination: PaginationMetaDTO;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export default function PaginationControls({ pagination, onPageChange, isLoading }: PaginationControlsProps) {
  const { page, total_pages } = pagination;

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < total_pages) {
      onPageChange(page + 1);
    }
  };

  return (
    <nav className="flex items-center justify-between" aria-label="Nawigacja po stronach">
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={page === 1 || isLoading}
        aria-label="Poprzednia strona"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Poprzednia
      </Button>

      <span className="text-sm text-gray-700">
        Strona <span className="font-medium">{page}</span> z <span className="font-medium">{total_pages}</span>
      </span>

      <Button
        variant="outline"
        onClick={handleNext}
        disabled={page === total_pages || isLoading}
        aria-label="Następna strona"
      >
        Następna
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </nav>
  );
}
