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

export function PasswordRecoveryForm() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{
    email?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setFieldErrors({});

    // Basic client-side validation
    if (!email) {
      setFieldErrors({ email: "To pole jest wymagane" });
      return;
    }

    if (!validateEmail(email)) {
      setFieldErrors({ email: "Nieprawidłowy format adresu e-mail" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/password-recovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
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
        setError(data.error.message || "Wystąpił błąd podczas wysyłania linku resetującego");
        return;
      }

      // Always show success message (prevents email enumeration)
      setSuccess(true);
      setEmail("");
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
          Jeśli konto istnieje, link do resetowania hasła został wysłany na Twój adres e-mail.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Adres e-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              disabled={loading}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {fieldErrors.email}
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
            {loading ? "Wysyłanie..." : "Wyślij link resetujący"}
          </Button>
        </form>
      )}
    </div>
  );
}
