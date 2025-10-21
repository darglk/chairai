import { useState, useEffect, useCallback } from "react";
import type {
  ArtisanProfileDTO,
  CreateUpdateArtisanProfileCommand,
  AddArtisanSpecializationsCommand,
  PortfolioImageDTO,
  ApiErrorDTO,
} from "@/types";

/**
 * View model for the entire artisan profile form
 */
export interface ArtisanProfileViewModel {
  company_name: string;
  nip: string;
  specialization_ids: string[];
  portfolio_images: PortfolioImageDTO[];
  is_public: boolean;
}

/**
 * View model for step 1 - Company Data
 */
export interface CompanyDataViewModel {
  company_name: string;
  nip: string;
}

/**
 * Form steps
 */
export enum FormStep {
  CompanyData = 1,
  Specializations = 2,
  Portfolio = 3,
}

interface UseArtisanProfileFormReturn {
  currentStep: FormStep;
  profileData: ArtisanProfileViewModel;
  isLoading: boolean;
  isSubmitting: boolean;
  error: ApiErrorDTO | null;
  handleCompanyDataNext: (data: CompanyDataViewModel) => void;
  handleSpecializationsNext: (selectedIds: string[]) => Promise<void>;
  handlePortfolioUpload: (files: File[]) => Promise<void>;
  handlePortfolioDelete: (imageId: string) => Promise<void>;
  handleFinish: () => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  clearError: () => void;
}

const INITIAL_PROFILE_DATA: ArtisanProfileViewModel = {
  company_name: "",
  nip: "",
  specialization_ids: [],
  portfolio_images: [],
  is_public: false,
};

/**
 * Custom hook for managing artisan profile multi-step form
 */
export function useArtisanProfileForm(): UseArtisanProfileFormReturn {
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.CompanyData);
  const [profileData, setProfileData] = useState<ArtisanProfileViewModel>(INITIAL_PROFILE_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiErrorDTO | null>(null);

  /**
   * Fetch existing profile data on mount
   */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/artisans/me");

        if (response.ok) {
          const data: ArtisanProfileDTO = await response.json();

          // Map DTO to view model
          setProfileData({
            company_name: data.company_name,
            nip: data.nip,
            specialization_ids: data.specializations.map((s) => s.id),
            portfolio_images: data.portfolio_images,
            is_public: data.is_public,
          });
        } else if (response.status === 404) {
          // Profile doesn't exist yet, that's okay
          setProfileData(INITIAL_PROFILE_DATA);
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

    fetchProfile();
  }, []);

  /**
   * Handle company data submission and move to next step
   */
  const handleCompanyDataNext = useCallback((data: CompanyDataViewModel) => {
    setProfileData((prev) => ({
      ...prev,
      company_name: data.company_name,
      nip: data.nip,
    }));
    setCurrentStep(FormStep.Specializations);
    setError(null);
  }, []);

  /**
   * Handle specializations selection and move to next step
   * Creates the artisan profile and saves specializations before moving to portfolio step
   */
  const handleSpecializationsNext = useCallback(
    async (selectedIds: string[]) => {
      try {
        setIsSubmitting(true);
        setError(null);

        // Save selected specializations to state first
        setProfileData((prev) => ({
          ...prev,
          specialization_ids: selectedIds,
        }));

        // Step 1: Create/update artisan profile with company data
        const companyDataCommand: CreateUpdateArtisanProfileCommand = {
          company_name: profileData.company_name,
          nip: profileData.nip,
        };

        const companyResponse = await fetch("/api/artisans/me", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(companyDataCommand),
        });

        if (!companyResponse.ok) {
          const errorData: ApiErrorDTO = await companyResponse.json();
          setError(errorData);
          return;
        }

        // Step 2: Add specializations
        const specializationsCommand: AddArtisanSpecializationsCommand = {
          specialization_ids: selectedIds,
        };

        const specializationsResponse = await fetch("/api/artisans/me/specializations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(specializationsCommand),
        });

        if (!specializationsResponse.ok) {
          const errorData: ApiErrorDTO = await specializationsResponse.json();
          setError(errorData);
          return;
        }

        // Move to portfolio step only if both saves succeeded
        setCurrentStep(FormStep.Portfolio);
      } catch {
        setError({
          error: {
            code: "SAVE_ERROR",
            message: "Nie udało się zapisać danych. Spróbuj ponownie.",
          },
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [profileData.company_name, profileData.nip]
  );

  /**
   * Handle portfolio image upload
   * Uploads multiple files sequentially to avoid overwhelming the server
   */
  const handlePortfolioUpload = useCallback(async (files: File[]) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const uploadedImages: PortfolioImageDTO[] = [];

      // Upload files sequentially
      for (const file of files) {
        const formData = new FormData();
        formData.append("image", file); // Note: "image" not "images"

        const response = await fetch("/api/artisans/me/portfolio", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData: ApiErrorDTO = await response.json();
          setError(errorData);
          // Stop uploading remaining files on first error
          return;
        }

        const uploadedImage: PortfolioImageDTO = await response.json();
        uploadedImages.push(uploadedImage);
      }

      // Add all successfully uploaded images to profile
      setProfileData((prev) => ({
        ...prev,
        portfolio_images: [...prev.portfolio_images, ...uploadedImages],
      }));
    } catch {
      setError({
        error: {
          code: "UPLOAD_ERROR",
          message: "Nie udało się przesłać zdjęć. Spróbuj ponownie.",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Handle portfolio image deletion
   */
  const handlePortfolioDelete = useCallback(async (imageId: string) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/artisans/me/portfolio/${imageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData: ApiErrorDTO = await response.json();
        setError(errorData);
        return;
      }

      setProfileData((prev) => ({
        ...prev,
        portfolio_images: prev.portfolio_images.filter((img) => img.id !== imageId),
      }));
    } catch {
      setError({
        error: {
          code: "DELETE_ERROR",
          message: "Nie udało się usunąć zdjęcia. Spróbuj ponownie.",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Finalize profile creation and redirect to profile page
   * Company data and specializations are already saved in handleSpecializationsNext
   * Portfolio images are already uploaded via handlePortfolioUpload
   */
  const handleFinish = useCallback(() => {
    // All data is already saved, just redirect
    window.location.href = "/profile";
  }, []);

  /**
   * Navigate to next step
   */
  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, FormStep.Portfolio) as FormStep);
    setError(null);
  }, []);

  /**
   * Navigate to previous step
   */
  const goToPrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, FormStep.CompanyData) as FormStep);
    setError(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
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
    goToNextStep,
    goToPrevStep,
    clearError,
  };
}
