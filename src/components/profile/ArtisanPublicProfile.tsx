/**
 * ArtisanPublicProfile Component
 *
 * Displays public artisan profile with portfolio, specializations, and reviews.
 * Used on /artisan/[id] page.
 */

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Star, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { ArtisanProfileDTO } from "@/types";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    category: {
      name: string;
    };
  };
}

interface ReviewsResponse {
  data: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  summary: {
    average_rating: number;
    total_reviews: number;
    rating_distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
}

interface ArtisanPublicProfileProps {
  artisanId: string;
}

export default function ArtisanPublicProfile({ artisanId }: ArtisanPublicProfileProps) {
  const [profile, setProfile] = useState<ArtisanProfileDTO | null>(null);
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/artisans/${artisanId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Nie udało się załadować profilu");
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Nie udało się załadować profilu";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [artisanId]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoadingReviews(true);

        const response = await fetch(`/api/artisans/${artisanId}/reviews?limit=10`);

        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch {
        // Silently fail - reviews are optional
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [artisanId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Ładowanie profilu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error || "Nie znaleziono profilu"}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <a href="/market" className="inline-flex items-center text-sm text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wróć do marketplace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <a href="/market" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wróć do marketplace
        </a>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <CardTitle className="text-3xl">{profile.company_name}</CardTitle>
              <div className="flex items-center gap-4 text-muted-foreground">
                {profile.average_rating !== null && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{profile.average_rating.toFixed(1)}</span>
                    <span className="text-sm">({profile.total_reviews} opinii)</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Specializations */}
        {profile.specializations && profile.specializations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Specjalizacje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.specializations.map((spec) => (
                  <Badge key={spec.id} variant="secondary">
                    {spec.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio */}
        {profile.portfolio_images && profile.portfolio_images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.portfolio_images.map((image) => (
                  <div key={image.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={image.image_url} alt="Portfolio" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">NIP:</span>
              <span className="ml-2 text-sm text-muted-foreground">{profile.nip}</span>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle>Opinie klientów ({profile.total_reviews})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingReviews ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : reviews && reviews.data.length > 0 ? (
              <div className="space-y-6">
                {reviews.data.map((review) => (
                  <div key={review.id} className="border-b last:border-0 pb-6 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={
                                i < review.rating
                                  ? "h-4 w-4 fill-yellow-400 text-yellow-400"
                                  : "h-4 w-4 fill-gray-200 text-gray-200"
                              }
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">Projekt: {review.project.category.name}</p>
                      </div>
                      <time className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("pl-PL", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                    {review.comment && <p className="text-sm leading-relaxed mt-2">{review.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Brak opinii</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
