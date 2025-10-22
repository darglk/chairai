import { useEffect, useState } from "react";
import { ProfileSummaryCard } from "./ProfileSummaryCard";
import { QuickStatsGrid } from "./QuickStatsGrid";
import { AvailableProjectsList } from "./AvailableProjectsList";
import { InProgressProjectsList } from "./InProgressProjectsList";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import type { ApiErrorDTO } from "@/types";

/**
 * Main Artisan Dashboard Container
 *
 * Orchestrates all dashboard sections and manages data fetching
 */
export default function ArtisanDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiErrorDTO | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  /**
   * Check if artisan has completed profile setup
   */
  useEffect(() => {
    const checkProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/artisans/me");

        if (response.ok) {
          setHasProfile(true);
        } else if (response.status === 404) {
          // Profile doesn't exist yet
          setHasProfile(false);
        } else {
          const errorData: ApiErrorDTO = await response.json();
          setError(errorData);
        }
      } catch {
        setError({
          error: {
            code: "NETWORK_ERROR",
            message: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.",
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Ładowanie pulpitu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error.error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show profile setup prompt if profile doesn't exist
  if (!hasProfile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Uzupełnij swój profil</AlertTitle>
          <AlertDescription className="mt-2">
            Aby korzystać z pełnej funkcjonalności platformy, musisz najpierw uzupełnić swój profil zawodowy.
          </AlertDescription>
          <div className="mt-4">
            <a
              href="/profile/edit"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Przejdź do edycji profilu
            </a>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pulpit Rzemieślnika</h1>
        <p className="text-muted-foreground">Zarządzaj swoimi projektami i ofertami w jednym miejscu</p>
      </div>

      {/* Main content */}
      <div className="space-y-8">
        {/* Profile Summary and Quick Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <ProfileSummaryCard />
          </div>
          <div className="md:col-span-2">
            <QuickStatsGrid />
          </div>
        </div>

        {/* Available Projects */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Dostępne Projekty</h2>
              <p className="text-sm text-muted-foreground">Projekty oczekujące na ofertę</p>
            </div>
            <a href="/market" className="text-sm font-medium text-primary hover:underline">
              Zobacz wszystkie →
            </a>
          </div>
          <AvailableProjectsList />
        </section>

        {/* In Progress Projects */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">Projekty w Realizacji</h2>
            <p className="text-sm text-muted-foreground">Twoje aktywne zlecenia</p>
          </div>
          <InProgressProjectsList />
        </section>

        {/* Completed Projects - Link only */}
        <section>
          <div className="rounded-lg border bg-card p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Zakończone Projekty</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Zobacz wszystkie projekty, które zrealizowałeś oraz opinie klientów
            </p>
            <a
              href="/projects?status=completed"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Pokaż zakończone projekty
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
