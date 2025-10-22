import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanyDataViewModel } from "@/components/hooks/useArtisanProfileForm";

interface CompanyDataFormProps {
  initialData: CompanyDataViewModel;
  onNext: (data: CompanyDataViewModel) => void;
  isSubmitting: boolean;
}

interface FieldErrors {
  company_name?: string;
  nip?: string;
}

/**
 * Step 1: Company Data Form
 * Collects basic company information (name and NIP)
 */
export function CompanyDataForm({ initialData, onNext, isSubmitting }: CompanyDataFormProps) {
  const [companyName, setCompanyName] = useState(initialData.company_name);
  const [nip, setNip] = useState(initialData.nip);
  const [isPublic, setIsPublic] = useState(initialData.is_public);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<{ company_name: boolean; nip: boolean }>({
    company_name: false,
    nip: false,
  });

  /**
   * Validate company name
   */
  const validateCompanyName = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Nazwa firmy jest wymagana";
    }
    if (value.trim().length < 2) {
      return "Nazwa firmy musi mieć co najmniej 2 znaki";
    }
    return undefined;
  };

  /**
   * Validate NIP (must be exactly 10 digits)
   */
  const validateNip = (value: string): string | undefined => {
    if (!value.trim()) {
      return "NIP jest wymagany";
    }
    if (!/^\d{10}$/.test(value.trim())) {
      return "NIP musi składać się z dokładnie 10 cyfr";
    }
    return undefined;
  };

  /**
   * Handle company name blur - validate on blur
   */
  const handleCompanyNameBlur = () => {
    setTouched((prev) => ({ ...prev, company_name: true }));
    const error = validateCompanyName(companyName);
    setFieldErrors((prev) => ({ ...prev, company_name: error }));
  };

  /**
   * Handle NIP blur - validate on blur
   */
  const handleNipBlur = () => {
    setTouched((prev) => ({ ...prev, nip: true }));
    const error = validateNip(nip);
    setFieldErrors((prev) => ({ ...prev, nip: error }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ company_name: true, nip: true });

    // Validate all fields
    const companyNameError = validateCompanyName(companyName);
    const nipError = validateNip(nip);

    setFieldErrors({
      company_name: companyNameError,
      nip: nipError,
    });

    // If no errors, proceed to next step
    if (!companyNameError && !nipError) {
      onNext({
        company_name: companyName.trim(),
        nip: nip.trim(),
        is_public: isPublic,
      });
    }
  };

  const isFormValid = !validateCompanyName(companyName) && !validateNip(nip);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Company Name Field */}
        <div className="space-y-2">
          <Label htmlFor="company_name">
            Nazwa firmy <span className="text-destructive">*</span>
          </Label>
          <Input
            id="company_name"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onBlur={handleCompanyNameBlur}
            placeholder="np. Meble Kowalski"
            aria-invalid={touched.company_name && !!fieldErrors.company_name}
            aria-describedby={fieldErrors.company_name ? "company_name-error" : undefined}
            disabled={isSubmitting}
            className="w-full"
          />
          {touched.company_name && fieldErrors.company_name && (
            <p id="company_name-error" className="text-sm text-destructive">
              {fieldErrors.company_name}
            </p>
          )}
        </div>

        {/* NIP Field */}
        <div className="space-y-2">
          <Label htmlFor="nip">
            NIP <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nip"
            type="text"
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            onBlur={handleNipBlur}
            placeholder="1234567890"
            maxLength={10}
            aria-invalid={touched.nip && !!fieldErrors.nip}
            aria-describedby={fieldErrors.nip ? "nip-error" : undefined}
            disabled={isSubmitting}
            className="w-full"
          />
          {touched.nip && fieldErrors.nip && (
            <p id="nip-error" className="text-sm text-destructive">
              {fieldErrors.nip}
            </p>
          )}
          <p className="text-xs text-muted-foreground">Wprowadź 10 cyfr bez kresek i spacji</p>
        </div>

        {/* Profile Visibility Field */}
        <div className="flex items-center space-x-2 rounded-lg border p-4">
          <input
            id="is_public"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
          />
          <div className="flex-1">
            <Label htmlFor="is_public" className="cursor-pointer">
              Udostępnij profil publicznie
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Twój profil będzie widoczny w katalogu rzemieślników i dostępny dla potencjalnych klientów
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button type="submit" disabled={!isFormValid || isSubmitting} size="lg">
          {isSubmitting ? "Przetwarzanie..." : "Dalej"}
        </Button>
      </div>
    </form>
  );
}
