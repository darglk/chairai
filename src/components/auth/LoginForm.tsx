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

export function LoginForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{
    email?: string;
    password?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Basic client-side validation
    if (!email) {
      setFieldErrors({ email: "To pole jest wymagane" });
      return;
    }

    if (!password) {
      setFieldErrors({ password: "To pole jest wymagane" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const data: ValidationErrorResponse = await response.json();

        // Handle validation errors (422)
        if (response.status === 422 && data.error.details) {
          setFieldErrors(data.error.details);
          return;
        }

        // Handle authentication errors (401)
        if (response.status === 401) {
          setError("Nieprawidłowy e-mail lub hasło");
          return;
        }

        // Handle other errors
        setError(data.error.message || "Wystąpił błąd podczas logowania");
        return;
      }

      // Successful login - wait a moment for cookies to be set, then fetch user role
      await new Promise((resolve) => setTimeout(resolve, 100));

      const userResponse = await fetch("/api/users/me", {
        credentials: "same-origin", // Ensure cookies are sent
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        // Redirect based on role
        if (userData.role === "artisan") {
          window.location.href = "/dashboard/artisan";
        } else {
          window.location.href = "/dashboard/client";
        }
      } else {
        // Fallback to home if role fetch fails
        window.location.href = "/";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd serwera. Spróbuj ponownie później.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
          autoComplete="current-password"
        />
        {fieldErrors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {fieldErrors.password}
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
        {loading ? "Logowanie..." : "Zaloguj się"}
      </Button>
    </form>
  );
}
