import { useEffect, useState } from "react";
import { QuickActionsSection } from "./QuickActionsSection";
import { ClientProjectsList } from "./ClientProjectsList";
import { ClientStatsGrid } from "./ClientStatsGrid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import type { ApiErrorDTO } from "@/types";

/**
 * Main Client Dashboard Container
 *
 * Orchestrates all dashboard sections for client users
 */
export default function ClientDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiErrorDTO | null>(null);

  /**
   * Initialize dashboard - basic health check
   */
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simple check to verify user is authenticated
        const response = await fetch("/api/users/me");

        if (!response.ok) {
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

    init();
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Witaj w ChairAI</h1>
        <p className="text-muted-foreground">Zarządzaj swoimi projektami mebli w jednym miejscu</p>
      </div>

      {/* Main content */}
      <div className="space-y-8">
        {/* Quick Actions */}
        <QuickActionsSection />

        {/* Stats Grid */}
        <ClientStatsGrid />

        {/* Active Projects */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">Twoje Projekty</h2>
            <p className="text-sm text-muted-foreground">Aktywne zlecenia i projekty w realizacji</p>
          </div>
          <ClientProjectsList />
        </section>
      </div>
    </div>
  );
}
