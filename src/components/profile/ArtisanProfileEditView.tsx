import { useArtisanProfileForm, FormStep } from "@/components/hooks/useArtisanProfileForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { CompanyDataForm } from "./CompanyDataForm";
import { SpecializationsForm } from "./SpecializationsForm";
import { PortfolioManager } from "./PortfolioManager";

/**
 * Main container component for artisan profile editing
 * Manages multi-step form flow and displays appropriate step component
 */
export default function ArtisanProfileEditView() {
  const {
    currentStep,
    profileData,
    isLoading,
    isSubmitting,
    error,
    handleCompanyDataNext,
    handleSpecializationsNext,
    handlePortfolioUpload,
    handlePortfolioDelete,
    handleFinish,
    goToPrevStep,
  } = useArtisanProfileForm();

  // Loading state while fetching initial data
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Ładowanie danych profilu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edycja profilu rzemieślnika</h1>
        <p className="mt-2 text-muted-foreground">
          Wypełnij wszystkie informacje, aby aktywować swój profil na platformie
        </p>
      </div>

      {/* Stepper Navigation - TODO: Implement in next step */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <StepIndicator
            step={1}
            label="Dane firmy"
            isActive={currentStep === FormStep.CompanyData}
            isCompleted={currentStep > FormStep.CompanyData}
          />
          <div className="h-px flex-1 bg-border mx-4" />
          <StepIndicator
            step={2}
            label="Specjalizacje"
            isActive={currentStep === FormStep.Specializations}
            isCompleted={currentStep > FormStep.Specializations}
          />
          <div className="h-px flex-1 bg-border mx-4" />
          <StepIndicator step={3} label="Portfolio" isActive={currentStep === FormStep.Portfolio} isCompleted={false} />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error.error.message}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <div className="rounded-lg border bg-card p-6">
        {currentStep === FormStep.CompanyData && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Krok 1: Dane firmy</h2>
            <p className="text-muted-foreground mb-6">Podaj podstawowe informacje o swojej firmie</p>
            <CompanyDataForm
              initialData={{
                company_name: profileData.company_name,
                nip: profileData.nip,
                is_public: profileData.is_public,
              }}
              onNext={handleCompanyDataNext}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {currentStep === FormStep.Specializations && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Krok 2: Specjalizacje</h2>
            <p className="text-muted-foreground mb-6">Wybierz swoje specjalizacje</p>
            <SpecializationsForm
              availableSpecializations={[]}
              selectedIds={profileData.specialization_ids}
              onBack={goToPrevStep}
              onNext={handleSpecializationsNext}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {currentStep === FormStep.Portfolio && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Krok 3: Portfolio</h2>
            <p className="text-muted-foreground mb-6">Dodaj zdjęcia swoich prac (minimum 5)</p>
            <PortfolioManager
              portfolioImages={profileData.portfolio_images}
              onBack={goToPrevStep}
              onUpload={handlePortfolioUpload}
              onDelete={handlePortfolioDelete}
              onFinish={handleFinish}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Step indicator component for stepper navigation
 */
interface StepIndicatorProps {
  step: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

function StepIndicator({ step, label, isActive, isCompleted }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
          isActive
            ? "border-primary bg-primary text-primary-foreground"
            : isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground"
        }`}
      >
        {isCompleted ? "✓" : step}
      </div>
      <span className={`mt-2 text-sm ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}
