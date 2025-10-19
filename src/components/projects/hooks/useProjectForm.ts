import { useState } from "react";
import type { CreateProjectCommand } from "@/types";

interface ProjectFormViewModel {
  category_id: string;
  material_id: string;
  dimensions: string;
  budget_range: string;
}

interface FormErrors {
  category_id?: string;
  material_id?: string;
  dimensions?: string;
  budget_range?: string;
  general?: string;
}

interface UseProjectFormOptions {
  imageId: string;
  onSuccess?: (projectId: string) => void;
}

export const useProjectForm = ({ imageId, onSuccess }: UseProjectFormOptions) => {
  const [formData, setFormData] = useState<ProjectFormViewModel>({
    category_id: "",
    material_id: "",
    dimensions: "",
    budget_range: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (name: keyof ProjectFormViewModel, value: string): string | undefined => {
    switch (name) {
      case "category_id":
        return value ? undefined : "Kategoria jest wymagana";
      case "material_id":
        return value ? undefined : "Materiał jest wymagany";
      case "dimensions":
        if (value && value.length < 5) {
          return "Wymiary muszą mieć co najmniej 5 znaków";
        }
        return undefined;
      case "budget_range":
        return undefined;
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    Object.keys(formData).forEach((key) => {
      const fieldName = key as keyof ProjectFormViewModel;
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (name: keyof ProjectFormViewModel, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Wyczyść błąd dla tego pola
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBlur = (name: keyof ProjectFormViewModel) => {
    const error = validateField(name, formData[name]);
    if (error) {
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Walidacja formularza
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const command: CreateProjectCommand = {
        generated_image_id: imageId,
        category_id: formData.category_id,
        material_id: formData.material_id,
        ...(formData.dimensions && { dimensions: formData.dimensions }),
        ...(formData.budget_range && { budget_range: formData.budget_range }),
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Obsługa błędów walidacji z backendu
        if (response.status === 400 && errorData.error?.details) {
          const backendErrors: FormErrors = {};
          Object.entries(errorData.error.details).forEach(([field, message]) => {
            backendErrors[field as keyof FormErrors] = message as string;
          });
          setErrors(backendErrors);
          return;
        }

        // Obsługa konfliktu (obraz już użyty)
        if (response.status === 409) {
          setErrors({
            general: "Ten obraz został już wykorzystany w innym projekcie.",
          });
          return;
        }

        // Obsługa błędów autoryzacji
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }

        // Ogólny błąd
        setErrors({
          general: errorData.error?.message || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
        });
        return;
      }

      const data = await response.json();

      // Callback lub przekierowanie
      if (onSuccess) {
        onSuccess(data.id);
      } else {
        window.location.href = `/projects/${data.id}`;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating project:", error);
      setErrors({
        general: "Wystąpił błąd połączenia. Sprawdź połączenie internetowe i spróbuj ponownie.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    window.history.back();
  };

  return {
    formData,
    errors,
    isLoading,
    handleChange,
    handleBlur,
    handleSubmit,
    handleCancel,
  };
};

export type { ProjectFormViewModel, FormErrors };
