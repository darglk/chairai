import React from "react";

interface GenerateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
  remainingGenerations: number;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({ onClick, isLoading, disabled, remainingGenerations }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={remainingGenerations === 0 ? "Osiągnięto limit generacji" : ""}
    className="w-full px-6 py-3 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
    {isLoading && (
      <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    )}
    <span>{isLoading ? "Generowanie obrazu..." : "Generuj obraz AI"}</span>
  </button>
);

export default GenerateButton;
