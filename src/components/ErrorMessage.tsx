import React from "react";
import type { ErrorMessage as ErrorMessageType } from "./hooks/useImageGenerator";

interface ErrorMessageProps {
  error: ErrorMessageType;
  onClose: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onClose }) => {
  const getIcon = () => {
    switch (error.code) {
      case "VALIDATION_ERROR":
        return "⚠️";
      case "UNAUTHORIZED":
        return "🔐";
      case "FORBIDDEN":
        return "🚫";
      case "GENERATION_LIMIT_REACHED":
      case "RATE_LIMIT_EXCEEDED":
        return "⏱️";
      case "SERVICE_UNAVAILABLE":
      case "TIMEOUT":
        return "🔌";
      default:
        return "❌";
    }
  };

  return (
    <div className="w-full bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
      <span className="text-xl flex-shrink-0 mt-0.5">{getIcon()}</span>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">Błąd</h4>
        <p className="text-sm text-red-800 dark:text-red-200">{error.message}</p>
        {error.details && (
          <ul className="mt-2 text-xs text-red-700 dark:text-red-300 space-y-1">
            {Object.entries(error.details).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {value}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        onClick={onClose}
        aria-label="Zamknij komunikat o błędzie"
        className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
      >
        ✕
      </button>
    </div>
  );
};

export default ErrorMessage;
