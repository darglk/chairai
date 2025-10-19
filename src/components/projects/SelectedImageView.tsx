import React from "react";

interface SelectedImageViewProps {
  imageUrl: string;
  prompt: string | null;
}

const SelectedImageView: React.FC<SelectedImageViewProps> = ({ imageUrl, prompt }) => {
  return (
    <div className="rounded-lg border bg-card overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <div className="aspect-video relative bg-muted">
        <img
          src={imageUrl}
          alt={prompt || "Wygenerowany obraz mebla"}
          className="w-full h-full object-cover transition-transform hover:scale-[1.02] duration-300"
          loading="lazy"
        />
      </div>
      {prompt && (
        <div className="p-3 md:p-4 border-t bg-muted/30">
          <p className="text-xs md:text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Prompt: </span>
            <span className="italic">{prompt}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SelectedImageView;
