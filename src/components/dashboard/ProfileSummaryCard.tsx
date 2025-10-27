import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, Edit } from "lucide-react";
import type { ArtisanProfileDTO, ApiErrorDTO } from "@/types";

/**
 * Profile Summary Card
 *
 * Displays artisan's profile overview with key information:
 * - Company name
 * - Profile status (public/private)
 * - Average rating
 * - Total reviews
 * - Specializations count
 * - Portfolio images count
 */
export function ProfileSummaryCard() {
  const [profile, setProfile] = useState<ArtisanProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiErrorDTO | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/artisans/me");

        if (response.ok) {
          const data: ArtisanProfileDTO = await response.json();
          setProfile(data);
        } else {
          const errorData: ApiErrorDTO = await response.json();
          setError(errorData);
        }
      } catch {
        setError({
          error: {
            code: "NETWORK_ERROR",
            message: "Nie udało się pobrać profilu",
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-destructive">Nie udało się załadować profilu</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{profile.company_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">NIP: {profile.nip}</p>
          </div>
          <Badge variant={profile.is_public ? "default" : "secondary"}>
            {profile.is_public ? "Publiczny" : "Prywatny"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating */}
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold">{profile.average_rating ? profile.average_rating.toFixed(1) : "—"}</span>
          <span className="text-sm text-muted-foreground">
            ({profile.total_reviews} {profile.total_reviews === 1 ? "ocena" : "ocen"})
          </span>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Specjalizacje</span>
            <span className="font-medium">{profile.specializations.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Zdjęcia portfolio</span>
            <span className="font-medium">{profile.portfolio_images.length}</span>
          </div>
        </div>

        {/* Specializations */}
        {profile.specializations.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Twoje specjalizacje:</p>
            <div className="flex flex-wrap gap-2">
              {profile.specializations.slice(0, 3).map((spec) => (
                <Badge key={spec.id} variant="outline" className="text-xs">
                  {spec.name}
                </Badge>
              ))}
              {profile.specializations.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{profile.specializations.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Edit button */}
        <Button variant="outline" size="sm" className="w-full mt-4" asChild>
          <a href="/profile/edit">
            <Edit className="h-4 w-4 mr-2" />
            Edytuj profil
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
