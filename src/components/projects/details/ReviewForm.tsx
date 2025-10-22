/**
 * ReviewForm Component
 *
 * Form for submitting a review after project completion.
 * Allows rating (1-5 stars) and optional comment.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Star } from "lucide-react";
import type { CreateReviewCommand } from "@/types";

interface ReviewFormProps {
  onSubmit: (data: CreateReviewCommand) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Review form component with star rating and comment
 */
export function ReviewForm({ onSubmit, isLoading = false }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Proszę wybrać ocenę");
      return;
    }

    if (!comment.trim()) {
      setError("Proszę dodać komentarz");
      return;
    }

    try {
      await onSubmit({ rating, comment: comment.trim() });
      setSuccess(true);
      setRating(0);
      setComment("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się wysłać oceny";
      setError(errorMessage);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dziękujemy za opinię!</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>Twoja ocena została pomyślnie wysłana.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wystaw ocenę</CardTitle>
        <CardDescription>Podziel się swoim doświadczeniem z realizacji tego projektu</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Ocena (wymagana)</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={isLoading}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                Wybrano: {rating} {rating === 1 ? "gwiazdka" : rating < 5 ? "gwiazdki" : "gwiazdek"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Komentarz (wymagany)</Label>
            <Textarea
              id="comment"
              placeholder="Opisz swoje doświadczenie z realizacji projektu..."
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isLoading}
              required
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">{comment.length}/1000 znaków</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || rating === 0 || !comment.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              "Wyślij opinię"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
