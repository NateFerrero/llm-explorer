import { AIModel } from './types';
import { getTextProviders } from './api/util';

// Define available models
export const availableModels: AIModel[] = [
  {
    id: "azure-gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "OpenAI's most advanced model with broad general knowledge and domain expertise",
    capabilities: ["Knowledge Graph Generation", "Detailed Explanations", "Reasoning"]
  },
  {
    id: "claude-bedrock",
    name: "Claude",
    provider: "Anthropic",
    description: "Anthropic's Claude model with strong reasoning and conversation abilities",
    capabilities: ["Knowledge Graph Generation", "Detailed Explanations", "Reasoning"]
  }
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
    }
    return availableModels[0];
  } catch (error) {
    console.error("Error getting default model:", error);
    return availableModels[0];
  }
}

// Load available models from the API
export async function loadAvailableModels(): Promise<AIModel[]> {
  try {
    // Get available providers from the API
    const providers = getTextProviders();
    console.log("Available providers:", providers);
    
    // Create models based on available providers
    const dynamicModels: AIModel[] = providers.map(providerId => {
      // Check if we already have this model defined
      const existingModel = availableModels.find(model => model.id === providerId);
      
      if (existingModel) {
        return existingModel;
      }
      
      // Create a new model definition based on the provider ID
      let provider = "Unknown";
      let name = providerId;
      let description = "AI language model";
      
      // Parse provider name from ID
      if (providerId.includes("azure")) {
        provider = "OpenAI";
        name = providerId.replace("azure-", "").toUpperCase();
        description = "Azure-hosted OpenAI model with advanced reasoning capabilities";
      } else if (providerId.includes("claude")) {
        provider = "Anthropic";
        name = "Claude";
        description = "Anthropic's Claude model with strong reasoning and conversation abilities";
      }
      
      return {
        id: providerId,
        name: name,
        provider: provider,
        description: description,
        capabilities: ["Knowledge Graph Generation", "Detailed Explanations", "Reasoning"]
      };
    });
    
    // Only return models that are actually available from the API
    const filteredModels = dynamicModels.filter(model => providers.includes(model.id));
    console.log("Filtered models:", filteredModels);
    
    return filteredModels.length > 0 ? filteredModels : [];
  } catch (error) {
    console.error("Error loading available models:", error);
    // Return only the models that we know are available from util.ts
    return availableModels.filter(model => 
      model.id === "claude-bedrock" || model.id === "azure-gpt-4o"
    );
  }
}

// Get a model by ID
export function getModelById(id: string): AIModel | undefined {
  return availableModels.find(model => model.id === id);
}

// Get models grouped by provider
export function getModelsByProvider(): Record<string, AIModel[]> {
  return availableModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);
}
