/**
 * Prompt Engineer Service
 *
 * Transforms user furniture descriptions into detailed, professional prompts
 * optimized for AI image generation. Focuses on creating images that are
 * suitable for craftsmen to assess project feasibility, with emphasis on:
 * - Technical accuracy (dimensions, materials, construction)
 * - Professional photography style
 * - Clear, recognizable design details
 * - Production-ready quality
 */

/**
 * Enhanced prompt result with metadata
 */
export interface EnhancedPromptResult {
  positivePrompt: string;
  negativePrompt: string;
  technicalNotes: string;
  materials: string[];
  style: string;
}

/**
 * Prompt enhancement configuration
 */
interface PromptEngineerConfig {
  includePhotographyStyle?: boolean;
  includeTechnicalDetails?: boolean;
  emphasizeMaterials?: boolean;
  emphasizePrecision?: boolean;
}

const DEFAULT_CONFIG: PromptEngineerConfig = {
  includePhotographyStyle: true,
  includeTechnicalDetails: true,
  emphasizeMaterials: true,
  emphasizePrecision: true,
};

/**
 * Service for engineering prompts for furniture image generation
 * tailored towards craftsman evaluation and project feasibility assessment
 */
export class PromptEngineerService {
  private readonly config: PromptEngineerConfig;

  constructor(config: Partial<PromptEngineerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Transform a user description into a detailed professional prompt
   * suitable for craftsmen evaluation
   *
   * @param userDescription Simple user furniture description
   * @returns Enhanced prompt with positive, negative, and technical components
   */
  enhancePrompt(userDescription: string): EnhancedPromptResult {
    const description = (userDescription || "").toString().trim();

    // Extract materials if mentioned
    const materials = this.extractMaterials(description);

    // Identify design style
    const style = this.identifyStyle(description);

    // Build technical notes for craftsmen
    const technicalNotes = this.buildTechnicalNotes(description, materials, style);

    // Create positive prompt (what we want)
    const positivePrompt = this.buildPositivePrompt(description, materials, style);

    // Create negative prompt (what we don't want)
    const negativePrompt = this.buildNegativePrompt();

    return {
      positivePrompt,
      negativePrompt,
      technicalNotes,
      materials,
      style,
    };
  }

  /**
   * Extract materials mentioned in the description
   * @private
   */
  private extractMaterials(description: string): string[] {
    const materialPatterns: Record<string, string[]> = {
      wood: ["drewn", "oak", "beech", "walnut", "pine", "birch", "ash", "wood"],
      metal: ["metal", "steel", "aluminum", "iron", "brass", "chrome", "stalo", "stalowy"],
      leather: ["leather", "skór", "skóra"],
      fabric: ["fabric", "cloth", "canvas", "linen", "cotton", "velvet", "wool", "tkanin"],
      plastic: ["plastic", "polymer", "resin", "composite", "tworzywo"],
      glass: ["glass", "szk", "szkło", "szklany"],
      upholstery: ["upholster", "tapicerowa", "polster", "tapicerk"],
    };

    const descLower = description.toLowerCase();
    const foundMaterials: string[] = [];

    for (const [category, keywords] of Object.entries(materialPatterns)) {
      for (const keyword of keywords) {
        if (descLower.includes(keyword)) {
          foundMaterials.push(category);
          break;
        }
      }
    }

    return foundMaterials.length > 0 ? foundMaterials : ["wood"];
  }

  /**
   * Identify design style from description
   * @private
   */
  private identifyStyle(description: string): string {
    const stylePatterns: Record<string, string[]> = {
      Scandinavian: ["skandynaw", "minimalist", "simple", "clean"],
      Modern: ["modern", "contemporary", "minimalist", "nowoczesn"],
      Industrial: ["industrial", "industrial", "metal", "loft"],
      Classic: ["classic", "traditional", "vintage", "antique", "klasyczn"],
      Rustic: ["rustic", "rustykalny", "country", "wiejsk"],
      Luxury: ["luxury", "premium", "high-end", "ekskluzyw"],
    };

    const descLower = description.toLowerCase();

    for (const [style, keywords] of Object.entries(stylePatterns)) {
      for (const keyword of keywords) {
        if (descLower.includes(keyword)) {
          return style;
        }
      }
    }

    return "Contemporary";
  }

  /**
   * Build technical notes that would help a craftsman evaluate feasibility
   * @private
   */
  private buildTechnicalNotes(description: string, materials: string[], style: string): string {
    const notes: string[] = [];

    // Add material considerations (always)
    if (materials.includes("wood")) {
      notes.push("• Wood construction - show grain patterns, joinery details");
    }
    if (materials.includes("metal")) {
      notes.push("• Metal components - emphasize welding/connection details");
    }
    if (materials.includes("leather") || materials.includes("fabric")) {
      notes.push("• Upholstery visible - show stitching and material texture");
    }

    // Add style-specific notes (always)
    notes.push(`• ${style} style - appropriate proportions and details`);

    // Photography and construction details (respects config)
    if (this.config.includeTechnicalDetails) {
      notes.push("• Professional photography angle to assess quality");
      notes.push("• Clear view of construction methods and joints");
      notes.push("• Realistic materials and finishes");
    }

    // Check for dimension mentions (always)
    if (
      /\b\d+\s*(cm|mm|inch|in|m|meter)/i.test(description) ||
      /width|height|length|size|dimension/i.test(description)
    ) {
      notes.push("• Maintain accurate proportions based on dimensions");
    }

    return notes.length > 0 ? notes.join("\n") : "Professional furniture design focused on realistic representation";
  }

  /**
   * Build the positive prompt for AI image generation
   * @private
   */
  private buildPositivePrompt(description: string, materials: string[], style: string): string {
    const parts: string[] = [];

    // Main description
    parts.push(description);

    // Style and design approach
    parts.push(`${style} design style`);

    // Material emphasis
    if (this.config.emphasizeMaterials && materials.length > 0) {
      const materialDescriptions: Record<string, string> = {
        wood: "solid wood construction with visible grain and natural finish",
        metal: "precision metal components with clean welds and hardware",
        leather: "high-quality leather with visible stitching and patina",
        fabric: "premium upholstery with detailed fabric texture visible",
        glass: "clear glass with clean edges",
      };

      for (const material of materials) {
        if (materialDescriptions[material]) {
          parts.push(materialDescriptions[material]);
        }
      }
    }

    // Technical precision for craftsmen
    if (this.config.emphasizePrecision) {
      parts.push("precise measurements and proportions");
      parts.push("professional construction methods clearly visible");
      parts.push("joinery and connection details prominent");
    }

    // Photography style for realistic assessment
    if (this.config.includePhotographyStyle) {
      parts.push("professional photography, studio lighting, soft shadows");
      parts.push("neutral background");
      parts.push("high resolution, 4K quality, photorealistic render");
      parts.push("optimal angle for design evaluation");
    }

    return parts.join(", ");
  }

  /**
   * Build the negative prompt to exclude undesired elements
   * @private
   */
  private buildNegativePrompt(): string {
    const unwanted = [
      "blurry, out of focus",
      "low quality, poor resolution",
      "cartoon, illustration, sketch, drawing",
      "deformed, distorted, ugly",
      "oversaturated colors",
      "poor lighting, dark shadows",
      "cluttered background",
      "unrealistic materials",
      "impossible geometry",
      "anatomically incorrect",
      "3D render artifacts",
      "watermarks, text, logos",
      "partially cut off",
      "wrong proportions",
    ];

    return unwanted.join(", ");
  }
}

/**
 * Singleton instance for prompt engineering
 */
let promptEngineerInstance: PromptEngineerService | null = null;

/**
 * Get or create the prompt engineer service instance
 */
export function getPromptEngineer(config?: Partial<PromptEngineerConfig>): PromptEngineerService {
  if (!promptEngineerInstance) {
    promptEngineerInstance = new PromptEngineerService(config);
  }
  return promptEngineerInstance;
}
