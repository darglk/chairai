import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ValidationErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export function PasswordResetForm() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Basic client-side validation
    if (!password) {
      setFieldErrors({ password: "To pole jest wymagane" });
      return;
    }

    if (password.length < 8) {
      setFieldErrors({ password: "Hasło musi mieć co najmniej 8 znaków" });
      return;
    }

    if (!confirmPassword) {
      setFieldErrors({ confirmPassword: "To pole jest wymagane" });
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Hasła nie są zgodne" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          confirmPassword,
        }),
      });

      if (!response.ok) {
        const data: ValidationErrorResponse = await response.json();

        // Handle validation errors (422)
        if (response.status === 422 && data.error.details) {
          setFieldErrors(data.error.details);
          return;
        }

        // Handle other errors
        setError(data.error.message || "Wystąpił błąd podczas resetowania hasła");
        return;
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd serwera. Spróbuj ponownie później.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {success ? (
        <div
          className="p-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
          role="status"
        >
          Hasło zostało zmienione pomyślnie. Za chwilę zostaniesz przekierowany do strony logowania...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">Nowe hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              disabled={loading}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
              disabled={loading}
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword && (
              <p id="confirm-password-error" className="text-sm text-destructive">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {error && (
            <div
              className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
              role="alert"
            >
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resetowanie..." : "Zresetuj hasło"}
          </Button>
        </form>
      )}
    </div>
  );
}
