import { useState } from "react";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  /**
   * Tekst wyświetlany na przycisku
   */
  children?: React.ReactNode;
  /**
   * Dodatkowe klasy CSS
   */
  className?: string;
  /**
   * Wariant przycisku
   */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /**
   * Callback wywoływany po pomyślnym wylogowaniu (opcjonalny)
   */
  onLogoutSuccess?: () => void;
  /**
   * Callback wywoływany w przypadku błędu (opcjonalny)
   */
  onLogoutError?: (error: Error) => void;
}

/**
 * Komponent przycisku wylogowania
 * Wysyła żądanie POST do /api/auth/logout
 */
export function LogoutButton({
  children = "Wyloguj",
  className,
  variant = "ghost",
  onLogoutSuccess,
  onLogoutError,
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    // Zapobiegaj wielokrotnym wywołaniom
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (response.ok || response.redirected) {
        // Wywołaj callback sukcesu jeśli istnieje
        try {
          onLogoutSuccess?.();
        } catch {
          // Błąd w callbacku - ignoruj i kontynuuj wylogowanie
        }

        // Przekieruj na stronę główną
        window.location.href = "/";
      } else {
        throw new Error("Wylogowanie nie powiodło się");
      }
    } catch (error) {
      const errorObject = error instanceof Error ? error : new Error("Nieznany błąd");

      // Wywołaj callback błędu jeśli istnieje
      try {
        onLogoutError?.(errorObject);
      } catch {
        // Błąd w callbacku - ignoruj
      }

      // Mimo błędu, przekieruj na stronę główną (bezpieczeństwo)
      window.location.href = "/";
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleLogout}
      disabled={isLoading}
      aria-label="Wyloguj się z systemu"
    >
      {isLoading ? "Wylogowywanie..." : children}
    </Button>
  );
}
