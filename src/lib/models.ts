import { getTextProviders } from "./api/util";
import { AIModel } from "./types";

// Define available models
export const availableModels: AIModel[] = [
  {
    id: "azure-gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description:
      "OpenAI's most advanced model with broad general knowledge and domain expertise",
    capabilities: [
      "Knowledge Graph Generation",
      "Detailed Explanations",
      "Reasoning",
    ],
  },
  {
    id: "claude-bedrock",
    name: "Claude",
    provider: "Anthropic",
    description:
      "Anthropic's Claude model with strong reasoning and conversation abilities",
    capabilities: [
      "Knowledge Graph Generation",
      "Detailed Explanations",
      "Reasoning",
    ],
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    description:
      "Google's versatile model optimized for text, code, and reasoning tasks",
    capabilities: ["Code Generation", "Detailed Explanations", "Reasoning"],
  },
  {
    id: "ollama-llama3",
    name: "Llama 3",
    provider: "Ollama",
    description:
      "Locally hosted Llama 3 model with fast responses and privacy protection",
    capabilities: ["Local Execution", "Privacy", "Fast Response"],
  },
  {
    id: "ollama-mistral",
    name: "Mistral",
    provider: "Ollama",
    description: "Locally hosted Mistral model running on your own hardware",
    capabilities: ["Local Execution", "Privacy", "Fast Response"],
  },
];

// Get the default model
export function getDefaultModel(): AIModel {
  // Try to get available models from the API
  try {
    // Default to one of the available models from the API
    const providers = getTextProviders();
    if (providers.includes("claude-bedrock")) {
      return getModelById("claude-bedrock") || availableModels[0];
    } else if (providers.includes("azure-gpt-4o")) {
      return getModelById("azure-gpt-4o") || availableModels[0];
    } else if (providers.includes("gemini-pro")) {
      return getModelById("gemini-pro") || availableModels[0];
    } else if (providers.includes("ollama-llama3")) {
      return getModelById("ollama-llama3") || availableModels[0];
    }
    return availableModels[0];
  } catch (error) {
    console.error("Error getting default model:", error);
    return availableModels[0];
  }
}

// Load available models based on API keys and Ollama
export async function loadAvailableModels(): Promise<AIModel[]> {
  try {
    // Get available providers from the API
    const providers = getTextProviders();
    console.log("Available providers:", providers);

    // Use the list of providers returned by getTextProviders directly
    // This list already includes base providers and dynamically added Ollama providers
    let availableProviders = [...providers];

    // Check for API keys in localStorage for non-Ollama providers
    const openaiKey = localStorage.getItem("llm_api_key_openai");
    const anthropicKey = localStorage.getItem("llm_api_key_anthropic");
    const geminiKey = localStorage.getItem("llm_api_key_gemini");

    // Add providers based on available keys
    if (openaiKey && !availableProviders.includes("azure-gpt-4o")) {
      availableProviders.push("azure-gpt-4o");
    }
    if (anthropicKey && !availableProviders.includes("claude-bedrock")) {
      availableProviders.push("claude-bedrock");
    }
    if (geminiKey && !availableProviders.includes("gemini-pro")) {
      availableProviders.push("gemini-pro");
    }

    // Map provider IDs to AIModel objects
    const dynamicModels: AIModel[] = availableProviders
      .map((providerId) => {
        // Check if we already have this model defined in the base availableModels list
        const existingModel = availableModels.find(
          (model) => model.id === providerId,
        );

        if (existingModel) {
          return existingModel;
        }

        // If not found in base list, create a new model definition
        // (This logic might be redundant if getTextProviders always aligns with availableModels,
        // but kept for robustness in case of discrepancies)
        let provider = "Unknown";
        let name = providerId;
        let description = "AI language model";

        // Parse provider name from ID
        if (providerId.includes("azure")) {
          provider = "OpenAI";
          name = providerId.replace("azure-", "").toUpperCase();
          description =
            "Azure-hosted OpenAI model with advanced reasoning capabilities";
        } else if (providerId.includes("claude")) {
          provider = "Anthropic";
          name = "Claude";
          description =
            "Anthropic's Claude model with strong reasoning and conversation abilities";
        } else if (providerId.includes("gemini")) {
          provider = "Google";
          name = providerId.replace("gemini-", "").replace("pro", "Pro");
          if (name === "Pro") name = "Gemini Pro";
          description =
            "Google's versatile AI model with strong reasoning capabilities";
        } else if (providerId.includes("ollama")) {
          provider = "Ollama";
          const modelName = providerId.replace("ollama-", "");
          name = modelName.charAt(0).toUpperCase() + modelName.slice(1);
          description = "Locally hosted model running on your own hardware";
        }

        return {
          id: providerId,
          name: name,
          provider: provider,
          description: description,
          capabilities:
            provider === "Ollama"
              ? ["Local Execution", "Privacy", "Fast Response"]
              : [
                  "Knowledge Graph Generation",
                  "Detailed Explanations",
                  "Reasoning",
                ],
        };
      })
      // Filter out any potential null/undefined entries if mapping failed
      .filter(
        (model): model is AIModel => model !== null && model !== undefined,
      );

    console.log("Mapped models:", dynamicModels);

    // Further refine Ollama models based on actual detection
    if (dynamicModels.some((model) => model.provider === "Ollama")) {
      try {
        const ollamaResponse = await fetch("http://localhost:11434/api/tags", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (ollamaResponse.ok) {
          const ollamaData = await ollamaResponse.json();
          console.log("Available Ollama models:", ollamaData);

          // Get list of detected FULL Ollama model names (e.g., "llama3:latest", "qwen2.5:14b")
          const detectedOllamaFullNames =
            ollamaData.models?.map((m: any) => m.name) || [];

          // Filter the dynamicModels list: Keep non-Ollama models
          // + Ollama models whose *base name* (before :) matches a detected model's base name.
          // This handles cases where the static config might have 'ollama-llama3' but Ollama has 'llama3:8b'
          const finalModels = dynamicModels.filter((model) => {
            if (model.provider !== "Ollama") {
              return true; // Keep non-Ollama models
            }
            // Keep pre-defined Ollama model only if its base name exists among detected models
            const modelBaseName = model.id.replace("ollama-", "").split(":")[0];
            return detectedOllamaFullNames.some(
              (fullName) => fullName.split(":")[0] === modelBaseName,
            );
          });

          // Add/Update Ollama models based on actual detection, using the FULL name for ID
          detectedOllamaFullNames.forEach((fullModelName: string) => {
            const modelId = `ollama-${fullModelName}`; // ID now includes the tag, e.g., "ollama-llama3.2:1b"
            const existingIndex = finalModels.findIndex(
              (m) => m.id === modelId,
            );

            // Prepare the display name (often nicer without ':latest')
            let displayName = fullModelName;
            if (displayName.endsWith(":latest")) {
              displayName = displayName.substring(
                0,
                displayName.lastIndexOf(":latest"),
              );
            }
            // Capitalize first letter for display name
            displayName =
              displayName.charAt(0).toUpperCase() + displayName.slice(1);

            const ollamaModelData = {
              id: modelId,
              name: displayName, // User-friendly name
              provider: "Ollama",
              description: `Locally hosted ${fullModelName} model running on your own hardware`,
              capabilities: ["Local Execution", "Privacy", "Fast Response"],
            };

            if (existingIndex === -1) {
              // Add new model if not already present with the exact ID
              finalModels.push(ollamaModelData);
            } else {
              // Optional: Update existing entry if needed (e.g., description)
              // finalModels[existingIndex] = ollamaModelData;
            }
          });

          console.log("Final models after Ollama check:", finalModels);
          return finalModels.length > 0 ? finalModels : availableModels; // Fallback if filtering removed everything
        } else {
          // Ollama fetch failed, return models without Ollama
          console.warn(
            "Ollama fetch failed, returning models without Ollama providers.",
          );
          return dynamicModels.filter((model) => model.provider !== "Ollama");
        }
      } catch (error) {
        console.error("Error fetching/processing Ollama models:", error);
        // Network or other error, return models without Ollama
        console.warn(
          "Error during Ollama check, returning models without Ollama providers.",
        );
        return dynamicModels.filter((model) => model.provider !== "Ollama");
      }
    }

    // If no Ollama models were in the initial list, return the mapped models
    return dynamicModels.length > 0 ? dynamicModels : availableModels; // Fallback if mapping failed
  } catch (error) {
    console.error("Error loading available models:", error);
    // Fallback to the static list in case of errors during fetching/processing
    return availableModels;
  }
}

// Get a model by ID
export function getModelById(id: string): AIModel | undefined {
  return availableModels.find((model) => model.id === id);
}

// Get models grouped by provider
export function getModelsByProvider(): Record<string, AIModel[]> {
  return availableModels.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, AIModel[]>,
  );
}
