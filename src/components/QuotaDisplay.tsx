import React from "react";

interface QuotaDisplayProps {
  remaining: number;
  total?: number;
}

const QuotaDisplay: React.FC<QuotaDisplayProps> = ({ remaining, total = 10 }) => {
  const used = total - remaining;
  const percentage = (used / total) * 100;
  const isLow = remaining <= 2;
  const isEmpty = remaining === 0;

  return (
    <div className="w-full space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Limit generacji</h3>
        <span
          className={`text-sm font-semibold ${
            isEmpty
              ? "text-red-600 dark:text-red-400"
              : isLow
                ? "text-orange-600 dark:text-orange-400"
                : "text-green-600 dark:text-green-400"
          }`}
        >
          {remaining}/{total}
        </span>
      </div>

      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isEmpty
              ? "bg-red-500 dark:bg-red-600"
              : isLow
                ? "bg-orange-500 dark:bg-orange-600"
                : "bg-green-500 dark:bg-green-600"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isEmpty && (
        <p className="text-xs text-red-700 dark:text-red-300 font-medium">
          ⚠️ Wyczerpałeś limit darmowych generacji. Uaktualnij konto aby generować więcej.
        </p>
      )}
      {isLow && !isEmpty && (
        <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">
          ⚠️ Zostało Ci już tylko {remaining} generacji.
        </p>
      )}
    </div>
  );
};

export default QuotaDisplay;
