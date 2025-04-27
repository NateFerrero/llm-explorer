import { create } from 'zustand';
import { AIModel } from '../types';
import { getDefaultModel } from '../models';

interface ApiStore {
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  hasSelectedModel: boolean;
  setHasSelectedModel: (hasSelected: boolean) => void;
  isModelLoading: boolean;
  setIsModelLoading: (isLoading: boolean) => void;
  providerType: "openai" | "anthropic" | "gemini";
  setProviderType: (provider: "openai" | "anthropic" | "gemini") => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const useApiStore = create<ApiStore>((set, get) => ({
  selectedModel: getDefaultModel(),
  hasSelectedModel: false,
  isModelLoading: false,
  providerType: "openai",
  apiKey: "",
  
  setSelectedModel: (model) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('selected_model', JSON.stringify(model));
      } catch (error) {
        console.error("Error saving model to localStorage:", error);
      }
    }
    set({ selectedModel: model });
  },
  
  setHasSelectedModel: (hasSelected) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('has_selected_model', String(hasSelected));
      } catch (error) {
        console.error("Error saving model selection state to localStorage:", error);
      }
    }
    set({ hasSelectedModel: hasSelected });
  },
  
  setIsModelLoading: (isLoading) => {
    set({ isModelLoading: isLoading });
  },
  
  setProviderType: (provider) => {
    set({ providerType: provider });
  },
  
  setApiKey: (key) => {
    set({ apiKey: key });
  }
}));
