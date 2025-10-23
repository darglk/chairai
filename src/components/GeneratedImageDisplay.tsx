import React from "react";
import type { GeneratedImageDTO } from "@/types";

interface GeneratedImageDisplayProps {
  image: GeneratedImageDTO;
  onUseInProject: () => void;
}

const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({ image, onUseInProject }) => (
  <div className="w-full space-y-4">
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Wygenerowany obraz</h3>
      <div className="relative w-full rounded-lg overflow-hidden shadow-lg bg-slate-100 dark:bg-slate-800 aspect-video flex items-center justify-center">
        <img
          src={image.image_url}
          alt={image.prompt || "Wygenerowany obraz meble"}
          className="w-full h-full object-cover"
        />
      </div>
    </div>

    {image.prompt && (
      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Użyty prompt:</p>
        <p className="text-sm text-slate-700 dark:text-slate-300 italic">&ldquo;{image.prompt}&rdquo;</p>
      </div>
    )}

    <button
      onClick={onUseInProject}
      className="w-full px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium transition-colors"
    >
      ➜ Użyj w projekcie
    </button>
  </div>
);

export default GeneratedImageDisplay;
