/**
 * ReviewsList Component
 *
 * Displays list of reviews for a completed project with ratings and comments.
 */

import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Review {
  id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ReviewsListProps {
  reviews: Review[];
  reviewerLabel?: string;
}

/**
 * Renders star rating visualization
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const isFilled = i < rating;
        return (
          <Star
            key={i}
            className={isFilled ? "h-4 w-4 fill-yellow-400 text-yellow-400" : "h-4 w-4 fill-gray-200 text-gray-200"}
          />
        );
      })}
    </div>
  );
}

/**
 * Get initials from user ID for avatar fallback
 */
function getInitials(userId: string): string {
  return userId.substring(0, 2).toUpperCase();
}

/**
 * Format date to Polish locale
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ReviewsList({ reviews, reviewerLabel = "Opinie" }: ReviewsListProps) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{reviewerLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {getInitials(review.reviewer_id)}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <StarRating rating={review.rating} />
                    <time className="text-sm text-muted-foreground">{formatDate(review.created_at)}</time>
                  </div>

                  {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
