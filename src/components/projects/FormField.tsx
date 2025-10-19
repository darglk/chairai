import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormFieldOption {
  id: string;
  name: string;
}

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  type: "text" | "select";
  options?: FormFieldOption[];
  placeholder?: string;
  required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  value,
  error,
  onChange,
  onBlur,
  type,
  options = [],
  placeholder,
  required = false,
}) => {
  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
      <Label htmlFor={name} className="text-sm md:text-base">
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="wymagane">
            *
          </span>
        )}
      </Label>

      {type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            id={name}
            onBlur={onBlur}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
            className={error ? "border-destructive focus:ring-destructive/20" : ""}
          >
            <SelectValue placeholder={`Wybierz ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Brak dostępnych opcji</div>
            ) : (
              options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={error ? "border-destructive focus:ring-destructive/20" : ""}
        />
      )}

      {error && (
        <p
          id={`${name}-error`}
          className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
