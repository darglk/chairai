import type { UserDTO } from "@/types";
import React, { useState, useCallback } from "react";
import PromptInput from "./PromptInput";
import GenerateButton from "./GenerateButton";
import QuotaDisplay from "./QuotaDisplay";
import GeneratedImageDisplay from "./GeneratedImageDisplay";
import ErrorMessage from "./ErrorMessage";
import { useImageGenerator } from "./hooks/useImageGenerator";

interface ImageGeneratorContainerProps {
  user: UserDTO;
}

const ImageGeneratorContainer: React.FC<ImageGeneratorContainerProps> = () => {
  const { state, generateImage, clearError, reset } = useImageGenerator();

  const [prompt, setPrompt] = useState("");

  const handleGenerateClick = useCallback(async () => {
    await generateImage(prompt);
    setPrompt("");
  }, [prompt, generateImage]);

  const handleUseInProject = useCallback(() => {
    if (state.generatedImage) {
      window.location.href = `/projects/new/${state.generatedImage.id}`;
    }
  }, [state.generatedImage]);

  const handleReset = useCallback(() => {
    setPrompt("");
    reset();
  }, [reset]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>💡 Wskazówka:</strong> Opisz mebel szczegółowo. Im więcej szczegółów, tym lepszy obraz.
        </p>
      </div>

      <QuotaDisplay remaining={state.remainingGenerations} total={10} />

      {state.error && <ErrorMessage error={state.error} onClose={clearError} />}

      {!state.generatedImage && (
        <div className="space-y-4">
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            disabled={state.isLoading || state.remainingGenerations === 0}
            placeholder="np. Nowoczesny stół jadalny z litego drewna dębu z metalowymi nogami..."
            maxLength={500}
          />

          <GenerateButton
            onClick={handleGenerateClick}
            isLoading={state.isLoading}
            disabled={state.isLoading || !prompt.trim() || prompt.length < 10 || state.remainingGenerations === 0}
            remainingGenerations={state.remainingGenerations}
          />
        </div>
      )}

      {state.generatedImage && (
        <div className="space-y-4">
          <GeneratedImageDisplay image={state.generatedImage} onUseInProject={handleUseInProject} />

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Wygeneruj nowy obraz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGeneratorContainer;
