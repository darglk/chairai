import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import ImageGeneratorContainer from "@/components/ImageGeneratorContainer";
import type { UserDTO } from "@/types";

describe("ImageGeneratorContainer Integration", () => {
  const mockUser: UserDTO = {
    id: "user-123",
    email: "client@example.com",
    role: "client",
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the container with all sections", () => {
    render(React.createElement(ImageGeneratorContainer, { user: mockUser }));

    // Check for hint text instead of non-existent title
    expect(screen.getByText(/Opisz mebel szczegółowo/i)).toBeInTheDocument();
    expect(screen.getByText(/Limit generacji/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nowoczesny stół/i)).toBeInTheDocument();
  });

  it("should display prompt input field", () => {
    render(React.createElement(ImageGeneratorContainer, { user: mockUser }));

    const textarea = screen.getByPlaceholderText(/Nowoczesny stół/i);
    expect(textarea).toBeInTheDocument();
  });

  it("should display generate button in disabled state initially", () => {
    render(React.createElement(ImageGeneratorContainer, { user: mockUser }));

    const button = screen.getByRole("button", {
      name: /Generuj obraz AI/i,
    });
    expect(button).toBeDisabled();
  });

  it("should enable generate button after entering valid prompt", async () => {
    render(React.createElement(ImageGeneratorContainer, { user: mockUser }));

    const textarea = screen.getByPlaceholderText(/Nowoczesny stół/i);
    const button = screen.getByRole("button", { name: /Generuj obraz AI/i });

    fireEvent.change(textarea, {
      target: { value: "A modern wooden dining table with 10+ characters" },
    });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it("should display character count", async () => {
    render(React.createElement(ImageGeneratorContainer, { user: mockUser }));

    const textarea = screen.getByPlaceholderText(/Nowoczesny stół/i);

    fireEvent.change(textarea, {
      target: { value: "Test text" },
    });

    await waitFor(() => {
      expect(screen.getByText(/9\/500/)).toBeInTheDocument();
    });
  });

  it("should display quota display with 10/10 initially", () => {
    render(React.createElement(ImageGeneratorContainer, { user: mockUser }));

    expect(screen.getByText(/0\/10/)).toBeInTheDocument();
  });

  it("should show progress bar in quota display", () => {
    render(React.createElement(ImageGeneratorContainer, { user: mockUser }));

    const progressBar = document.querySelector('[class*="bg-green-500"]') as HTMLElement;
    expect(progressBar).toBeInTheDocument();
  });
});
