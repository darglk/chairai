import React from "react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
  maxLength?: number;
}

const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, disabled, placeholder, maxLength = 500 }) => {
  const charCount = value.length;
  const isNearLimit = charCount >= 400;
  const isAtLimit = charCount >= maxLength;

  return (
    <div className="w-full space-y-2">
      <label htmlFor="prompt-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Opisz mebel
      </label>
      <textarea
        id="prompt-input"
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= maxLength) {
            onChange(e.target.value);
          }
        }}
        disabled={disabled}
        placeholder={placeholder || "Np. Nowoczesny stół jadalny z litego drewna dębu z metalowymi nogami..."}
        maxLength={maxLength}
        rows={4}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      />
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {charCount < 10 ? (
            <span className="text-orange-600 dark:text-orange-400">Minimum 10 znaków ({10 - charCount} zostało)</span>
          ) : (
            <span className="text-green-600 dark:text-green-400">✓ Wystarczająca długość</span>
          )}
        </p>
        <p
          className={`text-xs font-medium ${
            isAtLimit
              ? "text-red-600 dark:text-red-400"
              : isNearLimit
                ? "text-orange-600 dark:text-orange-400"
                : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {charCount}/{maxLength}
        </p>
      </div>
    </div>
  );
};

export default PromptInput;
