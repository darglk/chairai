import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SpecializationDTO } from "@/types";

interface SpecializationsFormProps {
  availableSpecializations: SpecializationDTO[];
  selectedIds: string[];
  onBack: () => void;
  onNext: (selectedIds: string[]) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Step 2: Specializations Form
 * Allows artisan to select their specializations from predefined list
 */
export function SpecializationsForm({
  availableSpecializations,
  selectedIds,
  onBack,
  onNext,
  isSubmitting,
}: SpecializationsFormProps) {
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specializations, setSpecializations] = useState<SpecializationDTO[]>(availableSpecializations);

  /**
   * Fetch specializations if not provided
   */
  useEffect(() => {
    const fetchSpecializations = async () => {
      if (availableSpecializations.length > 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/specializations");

        if (!response.ok) {
          throw new Error("Nie udało się pobrać listy specjalizacji");
        }

        const result: { data: SpecializationDTO[] } = await response.json();
        setSpecializations(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd podczas ładowania specjalizacji");
      } finally {
        setLoading(false);
      }
    };

    fetchSpecializations();
  }, [availableSpecializations]);

  /**
   * Toggle specialization selection
   */
  const handleToggle = (id: string) => {
    setTouched(true);
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (selected.length === 0) {
      return;
    }

    await onNext(selected);
  };

  const isFormValid = selected.length > 0;
  const showError = touched && !isFormValid;

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Ładowanie specjalizacji...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Błąd</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-base">
            Wybierz swoje specjalizacje <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground mt-1">Wybierz co najmniej jedną specjalizację</p>
        </div>

        {/* Specializations List */}
        <div className="space-y-3 rounded-lg border p-4 max-h-[400px] overflow-y-auto">
          {specializations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Brak dostępnych specjalizacji</p>
          ) : (
            specializations.map((spec) => (
              <div key={spec.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`spec-${spec.id}`}
                  checked={selected.includes(spec.id)}
                  onCheckedChange={() => handleToggle(spec.id)}
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor={`spec-${spec.id}`}
                  className="text-sm font-normal cursor-pointer flex-1 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {spec.name}
                </Label>
              </div>
            ))
          )}
        </div>

        {/* Validation Error */}
        {showError && (
          <p className="text-sm text-destructive" role="alert">
            Musisz wybrać co najmniej jedną specjalizację
          </p>
        )}

        {/* Selected Count */}
        {selected.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Wybrano: <span className="font-medium text-foreground">{selected.length}</span>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting} size="lg">
          Wstecz
        </Button>
        <Button type="submit" disabled={!isFormValid || isSubmitting} size="lg">
          {isSubmitting ? "Przetwarzanie..." : "Dalej"}
        </Button>
      </div>
    </form>
  );
}
