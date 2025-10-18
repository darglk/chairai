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

interface SuccessResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
  };
  requiresEmailConfirmation: boolean;
}

export function RegisterForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [accountType, setAccountType] = React.useState<"client" | "artisan" | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    accountType?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (!password) {
      return "Hasło jest wymagane";
    }

    if (password.length < 8) {
      return "Hasło musi mieć co najmniej 8 znaków";
    }

    if (!/[a-z]/.test(password)) {
      return "Hasło musi zawierać co najmniej jedną małą literę";
    }

    if (!/[A-Z]/.test(password)) {
      return "Hasło musi zawierać co najmniej jedną wielką literę";
    }

    if (!/\d/.test(password)) {
      return "Hasło musi zawierać co najmniej jedną cyfrę";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
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

    const passwordError = validatePassword(password);
    if (passwordError) {
      setFieldErrors({ password: passwordError });
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

    if (!accountType) {
      setFieldErrors({ accountType: "Musisz wybrać typ konta" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          accountType,
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
        setError(data.error.message || "Wystąpił błąd podczas rejestracji");
        return;
      }

      // Successful registration - show success message
      const data: SuccessResponse = await response.json();
      setSuccess(data.message);

      // Clear form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd serwera. Spróbuj ponownie później.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div
          className="p-4 text-sm text-green-800 bg-green-50 dark:text-green-200 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md"
          role="alert"
        >
          <p className="font-medium mb-1">Rejestracja przebiegła pomyślnie!</p>
          <p>{success}</p>
        </div>
      )}

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

      <div className="space-y-2">
        <Label htmlFor="password">Hasło</Label>
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
        <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
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

      <div className="space-y-2">
        <Label>Typ konta</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="accountType"
              value="client"
              checked={accountType === "client"}
              onChange={(e) => setAccountType(e.target.value as "client" | "artisan")}
              disabled={loading}
              className="h-4 w-4"
            />
            <span className="text-sm">Klient</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="accountType"
              value="artisan"
              checked={accountType === "artisan"}
              onChange={(e) => setAccountType(e.target.value as "client" | "artisan")}
              disabled={loading}
              className="h-4 w-4"
            />
            <span className="text-sm">Rzemieślnik</span>
          </label>
        </div>
        {fieldErrors.accountType && <p className="text-sm text-destructive">{fieldErrors.accountType}</p>}
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
        {loading ? "Rejestrowanie..." : "Zarejestruj się"}
      </Button>
    </form>
  );
}
