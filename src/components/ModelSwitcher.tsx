"use client";

import { availableModels } from "@/lib/models";
import { useApiStore } from "@/lib/stores/apiStore";
import { AIModel } from "@/lib/types";
import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Key,
  Loader2,
  Save,
  Settings,
  Trash,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface ModelSwitcherProps {
  id?: string;
  onClose?: () => void;
}

const ModelSwitcher: React.FC<ModelSwitcherProps> = ({ id, onClose }) => {
  const { selectedModel, setSelectedModel, providerType, setProviderType } =
    useApiStore();
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<AIModel[]>(availableModels);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    "providers" | "models" | "setup"
  >("models");
  const [tempProvider, setTempProvider] = useState<string>(
    selectedModel.provider,
  );
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeySaved, setApiKeySaved] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [anthropicModels, setAnthropicModels] = useState<
    { id: string; name: string }[]
  >([]);

  // Load available models on component mount
  useEffect(() => {
    fetchModels();
  }, []);

  // Reset state when provider changes
  useEffect(() => {
    const providerLower = tempProvider.toLowerCase();
    const apiProvider = providerLower === "google" ? "gemini" : providerLower;

    const storedProvider = localStorage.getItem("llm_provider");
    const storedKey = localStorage.getItem(`llm_api_key_${apiProvider}`);

    if (storedKey) {
      setApiKeySaved(true);
      setApiKey("••••••••••••••••••••••••••"); // Masked key for UI
    } else {
      setApiKeySaved(false);
      setApiKey("");
    }

    // Load Anthropic models if provider is Anthropic and we have a key
    if (
      providerLower === "anthropic" &&
      storedKey &&
      storedKey !== "••••••••••••••••••••••••••"
    ) {
      fetchAnthropicModels(storedKey);
    }
  }, [tempProvider]);

  const fetchModels = async () => {
    try {
      setIsLoading(true);

      // Fetch Ollama models if available
      let ollamaModels: AIModel[] = [];
      try {
        const ollamaResponse = await fetch("/api/models?provider=ollama");
        if (ollamaResponse.ok) {
          const ollamaData = await ollamaResponse.json();
          ollamaModels = ollamaData.models;
        }
      } catch (error) {
        console.error("Error fetching Ollama models:", error);
      }

      // Fetch models for other providers if API keys are available
      const storedProviders = ["openai", "anthropic", "gemini"];
      const providerModels: AIModel[] = [];

      for (const provider of storedProviders) {
        const apiKey = localStorage.getItem(`llm_api_key_${provider}`);
        if (apiKey) {
          try {
            const response = await fetch(
              `/api/models?provider=${provider}&apiKey=${encodeURIComponent(apiKey)}`,
            );
            if (response.ok) {
              const data = await response.json();
              providerModels.push(...data.models);
            }
          } catch (error) {
            console.error(`Error fetching ${provider} models:`, error);
          }
        }
      }

      // Combine all models
      const allModels = [...providerModels, ...ollamaModels];

      // If no models were found, use the default models
      if (allModels.length === 0) {
        setModels(availableModels);
      } else {
        setModels(allModels);
      }

      console.log("Available models for switcher:", allModels);
    } catch (error) {
      console.error("Error loading models:", error);
      setModels(availableModels);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnthropicModels = async (key: string) => {
    setLoadingModels(true);
    try {
      const response = await fetch(
        `/api/models?provider=anthropic&apiKey=${encodeURIComponent(key)}`,
      );

      if (response.ok) {
        const data = await response.json();
        setAnthropicModels(data.models);
        setApiKeyError(null);
      } else {
        const errorData = await response.json();
        setApiKeyError(errorData.error || "Failed to fetch Anthropic models");
        setAnthropicModels([]);
      }
    } catch (error) {
      console.error("Error fetching Anthropic models:", error);
      setApiKeyError("Failed to connect to API");
      setAnthropicModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  // Select a model
  const handleSelectModel = (model: AIModel) => {
    setSelectedModel(model);
    setProviderType(
      model.provider.toLowerCase() === "google"
        ? "gemini"
        : (model.provider.toLowerCase() as
            | "openai"
            | "anthropic"
            | "gemini"
            | "ollama"),
    );
    if (onClose) {
      onClose();
    } else {
      setIsOpen(false);
    }
  };

  // Select a provider and switch to models tab or setup tab
  const handleSelectProvider = (provider: string) => {
    const providerLower = provider.toLowerCase();
    setTempProvider(provider);

    // Set the provider type with special handling for Google/Gemini
    setProviderType(
      providerLower === "google"
        ? "gemini"
        : (providerLower as "openai" | "anthropic" | "gemini" | "ollama"),
    );

    // Check if API key is required and missing
    if (providerLower !== "ollama") {
      // For Google provider, check the key under gemini
      const keyProvider = providerLower === "google" ? "gemini" : providerLower;
      const storedKey = localStorage.getItem(`llm_api_key_${keyProvider}`);

      if (!storedKey) {
        // Key is required but missing
        setSelectedTab("setup");
        return;
      }
    }

    // If Ollama or API key is present, proceed to select models
    setSelectedTab("models");
  };

  // Save API key to localStorage
  const handleSaveApiKey = async () => {
    if (!apiKey || apiKey === "••••••••••••••••••••••••••") {
      setApiKeyError("Please enter a valid API key");
      return;
    }

    setIsTestingApi(true);
    setApiKeyError(null);

    try {
      // Test the API key before saving
      let isValid = false;
      const providerLower = tempProvider.toLowerCase();
      const apiProvider = providerLower === "google" ? "gemini" : providerLower;

      if (providerLower === "anthropic") {
        const response = await fetch(
          `/api/models?provider=anthropic&apiKey=${encodeURIComponent(apiKey)}`,
        );
        isValid = response.ok;

        if (isValid) {
          // Load the models if the key is valid
          const data = await response.json();
          setAnthropicModels(data.models);
        } else {
          const errorData = await response.json();
          setApiKeyError(errorData.error || "Invalid API key");
        }
      } else if (providerLower === "openai") {
        const response = await fetch(
          `/api/models?provider=openai&apiKey=${encodeURIComponent(apiKey)}`,
        );
        isValid = response.ok;
        if (!isValid) {
          const errorData = await response.json();
          setApiKeyError(errorData.error || "Invalid API key");
        }
      } else if (providerLower === "google") {
        const response = await fetch(
          `/api/models?provider=gemini&apiKey=${encodeURIComponent(apiKey)}`,
        );
        isValid = response.ok;
        if (!isValid) {
          const errorData = await response.json();
          setApiKeyError(errorData.error || "Invalid API key");
        }
      }

      if (isValid) {
        // Save the API key to localStorage if valid
        localStorage.setItem(`llm_api_key_${apiProvider}`, apiKey);
        localStorage.setItem("llm_provider", apiProvider);

        setApiKeySaved(true);
        setApiKeyError(null);

        // Refresh models with new API key
        await fetchModels();

        // Switch to models tab
        setSelectedTab("models");
      }
    } catch (error) {
      console.error("Error validating API key:", error);
      setApiKeyError("Failed to validate API key");
    } finally {
      setIsTestingApi(false);
    }
  };

  // Remove API key from localStorage
  const handleRemoveApiKey = () => {
    localStorage.removeItem(`llm_api_key_${tempProvider.toLowerCase()}`);
    setApiKeySaved(false);
    setApiKey("");
    setAnthropicModels([]);
  };

  // Get models for the selected provider
  const getModelsForProvider = (provider: string): AIModel[] => {
    // For Anthropic, if we have fetched models from their API, convert them to AIModel format
    if (provider === "Anthropic" && anthropicModels.length > 0) {
      return anthropicModels.map((model) => ({
        id: model.id,
        name: model.name,
        provider: "Anthropic",
        description:
          "Anthropic's Claude model with strong reasoning and conversation abilities",
        capabilities: [
          "Knowledge Graph Generation",
          "Detailed Explanations",
          "Reasoning",
        ],
      }));
    }

    // Otherwise return the filtered models from our available models list
    return models.filter((model) => model.provider === provider);
  };

  // Group models by provider
  const getModelsByProvider = () => {
    return models.reduce(
      (acc, model) => {
        if (!acc[model.provider]) {
          acc[model.provider] = [];
        }
        acc[model.provider].push(model);
        return acc;
      },
      {} as Record<string, AIModel[]>,
    );
  };

  // Available providers
  const getAvailableProviders = (): string[] => {
    return Object.keys(getModelsByProvider());
  };

  const renderSetupTab = () => {
    return (
      <div className="p-3">
        <h3 className="mb-3 text-base font-medium">
          Set up {tempProvider} API Key
        </h3>
        <div className="mb-4 text-xs text-slate-400">
          {tempProvider === "OpenAI" &&
            "Enter your OpenAI API key to use GPT models"}
          {tempProvider === "Anthropic" &&
            "Enter your Anthropic API key to use Claude models"}
          {tempProvider === "Google" &&
            "Enter your Google API key to use Gemini models"}
        </div>

        <div className="relative mb-4">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`${tempProvider} API Key`}
            className="w-full rounded-md border border-slate-600 bg-slate-700 p-2 pr-8 focus:border-blue-500 focus:outline-none"
          />
          {apiKey && (
            <button
              onClick={() => setApiKey("")}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {apiKeyError && (
          <div className="mb-3 rounded-md bg-red-900/20 p-2 text-xs text-red-300">
            {apiKeyError}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSaveApiKey}
            disabled={
              isTestingApi || !apiKey || apiKey === "••••••••••••••••••••••••••"
            }
            className="flex-grow rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-600 disabled:text-slate-300"
          >
            {isTestingApi ? (
              <span className="flex items-center justify-center">
                <Loader2 size={14} className="mr-2 animate-spin" /> Testing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Save size={14} className="mr-2" /> Save API Key
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedTab("providers")}
            className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-700"
          >
            Back
          </button>
        </div>
      </div>
    );
  };

  // When used as a popover, we don't need the toggle button
  if (onClose) {
    return (
      <div className="w-72">
        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setSelectedTab("providers")}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
              selectedTab === "providers"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:bg-slate-700/50"
            }`}
          >
            Providers
          </button>
          <button
            onClick={() => selectedTab !== "setup" && setSelectedTab("models")}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
              selectedTab === "models"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:bg-slate-700/50"
            }`}
          >
            Models
          </button>
          {selectedTab === "setup" && (
            <button className="flex-1 bg-slate-700 px-2 py-2 text-xs font-medium text-white">
              Setup
            </button>
          )}
        </div>

        {/* Tab content */}
        <div className="max-h-80 overflow-y-auto">
          {selectedTab === "providers" && (
            <>
              <div className="p-2 text-xs text-slate-400">
                Select an AI provider:
              </div>
              <div className="mt-1 max-h-72 space-y-1 overflow-y-auto p-1">
                {getAvailableProviders().map((provider) => {
                  const hasApiKey =
                    provider.toLowerCase() === "ollama" ||
                    localStorage.getItem(
                      `llm_api_key_${provider.toLowerCase()}`,
                    );

                  return (
                    <button
                      key={provider}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-slate-700"
                      onClick={() => handleSelectProvider(provider)}
                    >
                      <div className="flex items-center">
                        <div
                          className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full ${
                            provider === "OpenAI"
                              ? "bg-green-900/30 text-green-300"
                              : provider === "Anthropic"
                                ? "bg-purple-900/30 text-purple-300"
                                : provider === "Google"
                                  ? "bg-blue-900/30 text-blue-300"
                                  : provider === "Ollama"
                                    ? "bg-amber-900/30 text-amber-300"
                                    : "bg-blue-900/30 text-blue-300"
                          }`}
                        >
                          {provider.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm">{provider}</div>
                          <div className="text-xs text-slate-400">
                            {provider === "Ollama"
                              ? "Local models"
                              : hasApiKey
                                ? "API key configured"
                                : "Requires API key"}
                          </div>
                        </div>
                      </div>
                      {tempProvider === provider && (
                        <Check size={16} className="text-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {selectedTab === "models" && (
            <>
              <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
                <div className="flex items-center">
                  <div
                    className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full ${
                      tempProvider === "OpenAI"
                        ? "bg-green-900/30 text-green-300"
                        : tempProvider === "Anthropic"
                          ? "bg-purple-900/30 text-purple-300"
                          : tempProvider === "Google"
                            ? "bg-blue-900/30 text-blue-300"
                            : tempProvider === "Ollama"
                              ? "bg-amber-900/30 text-amber-300"
                              : "bg-blue-900/30 text-blue-300"
                    }`}
                  >
                    {tempProvider.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{tempProvider}</span>
                </div>

                {/* Show API key management options for non-Ollama providers */}
                {tempProvider.toLowerCase() !== "ollama" && (
                  <div className="flex gap-1">
                    {apiKeySaved ? (
                      <button
                        onClick={handleRemoveApiKey}
                        title="Remove API Key"
                        className="rounded p-1 text-red-400 hover:bg-slate-700"
                      >
                        <Trash size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedTab("setup")}
                        title="Set API Key"
                        className="rounded p-1 text-blue-400 hover:bg-slate-700"
                      >
                        <Key size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {tempProvider.toLowerCase() !== "ollama" && !apiKeySaved ? (
                <div className="p-3 text-center">
                  <div className="mb-2 text-sm">API key not configured</div>
                  <button
                    onClick={() => setSelectedTab("setup")}
                    className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium hover:bg-blue-700"
                  >
                    Configure API Key
                  </button>
                </div>
              ) : loadingModels ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin text-blue-400" />
                </div>
              ) : getModelsForProvider(tempProvider).length === 0 ? (
                <div className="px-2 py-3 text-center text-sm text-slate-400">
                  No models available
                </div>
              ) : (
                <div className="mt-1 max-h-72 space-y-1 overflow-y-auto">
                  {getModelsForProvider(tempProvider).map((model) => (
                    <button
                      key={model.id}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-slate-700 ${
                        selectedModel.id === model.id ? "bg-slate-700/50" : ""
                      }`}
                      onClick={() => handleSelectModel(model)}
                    >
                      <div className="flex items-center">
                        <div
                          className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full ${
                            model.provider === "OpenAI"
                              ? "bg-green-900/30 text-green-300"
                              : model.provider === "Anthropic"
                                ? "bg-purple-900/30 text-purple-300"
                                : model.provider === "Google"
                                  ? "bg-blue-900/30 text-blue-300"
                                  : model.provider === "Ollama"
                                    ? "bg-amber-900/30 text-amber-300"
                                    : "bg-blue-900/30 text-blue-300"
                          }`}
                        >
                          {model.provider.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm">{model.name}</div>
                          <div className="text-xs text-slate-400">
                            {model.id}
                          </div>
                        </div>
                      </div>
                      {selectedModel.id === model.id && (
                        <Check size={16} className="text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {selectedTab === "setup" && renderSetupTab()}
        </div>
      </div>
    );
  }

  // Original version with toggle button for use outside of popover
  return (
    <div className="relative">
      <button
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
          isLoading
            ? "border-slate-600/50 bg-slate-700/50 text-slate-400"
            : selectedModel.provider === "OpenAI"
              ? "border-green-700/50 bg-green-900/20 text-green-300 hover:bg-green-900/30"
              : selectedModel.provider === "Anthropic"
                ? "border-purple-700/50 bg-purple-900/20 text-purple-300 hover:bg-purple-900/30"
                : selectedModel.provider === "Google"
                  ? "border-blue-700/50 bg-blue-900/20 text-blue-300 hover:bg-blue-900/30"
                  : selectedModel.provider === "Ollama"
                    ? "border-amber-700/50 bg-amber-900/20 text-amber-300 hover:bg-amber-900/30"
                    : "border-blue-700/50 bg-blue-900/20 text-blue-300 hover:bg-blue-900/30"
        }`}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Settings size={16} className="mr-1" />
        )}
        <span className="text-sm font-medium">
          {isLoading ? "Loading..." : selectedModel.name}
        </span>
        <ChevronDown
          size={14}
          className={`ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 z-50 mt-1 w-72 overflow-hidden rounded-md border border-slate-700 bg-slate-800 shadow-xl"
        >
          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setSelectedTab("providers")}
              className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                selectedTab === "providers"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:bg-slate-700/50"
              }`}
            >
              Providers
            </button>
            <button
              onClick={() =>
                selectedTab !== "setup" && setSelectedTab("models")
              }
              className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                selectedTab === "models"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:bg-slate-700/50"
              }`}
            >
              Models
            </button>
            {selectedTab === "setup" && (
              <button className="flex-1 bg-slate-700 px-2 py-2 text-xs font-medium text-white">
                Setup
              </button>
            )}
          </div>

          {/* Tab content */}
          <div className="max-h-80 overflow-y-auto">
            {selectedTab === "providers" && (
              <>
                <div className="p-2 text-xs text-slate-400">
                  Select an AI provider:
                </div>
                <div className="mt-1 max-h-72 space-y-1 overflow-y-auto p-1">
                  {getAvailableProviders().map((provider) => {
                    const hasApiKey =
                      provider.toLowerCase() === "ollama" ||
                      localStorage.getItem(
                        `llm_api_key_${provider.toLowerCase()}`,
                      );

                    return (
                      <button
                        key={provider}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-slate-700"
                        onClick={() => handleSelectProvider(provider)}
                      >
                        <div className="flex items-center">
                          <div
                            className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full ${
                              provider === "OpenAI"
                                ? "bg-green-900/30 text-green-300"
                                : provider === "Anthropic"
                                  ? "bg-purple-900/30 text-purple-300"
                                  : provider === "Google"
                                    ? "bg-blue-900/30 text-blue-300"
                                    : provider === "Ollama"
                                      ? "bg-amber-900/30 text-amber-300"
                                      : "bg-blue-900/30 text-blue-300"
                            }`}
                          >
                            {provider.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm">{provider}</div>
                            <div className="text-xs text-slate-400">
                              {provider === "Ollama"
                                ? "Local models"
                                : hasApiKey
                                  ? "API key configured"
                                  : "Requires API key"}
                            </div>
                          </div>
                        </div>
                        {tempProvider === provider && (
                          <Check size={16} className="text-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {selectedTab === "models" && (
              <>
                <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
                  <div className="flex items-center">
                    <div
                      className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full ${
                        tempProvider === "OpenAI"
                          ? "bg-green-900/30 text-green-300"
                          : tempProvider === "Anthropic"
                            ? "bg-purple-900/30 text-purple-300"
                            : tempProvider === "Google"
                              ? "bg-blue-900/30 text-blue-300"
                              : tempProvider === "Ollama"
                                ? "bg-amber-900/30 text-amber-300"
                                : "bg-blue-900/30 text-blue-300"
                      }`}
                    >
                      {tempProvider.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{tempProvider}</span>
                  </div>

                  {/* Show API key management options for non-Ollama providers */}
                  {tempProvider.toLowerCase() !== "ollama" && (
                    <div className="flex gap-1">
                      {apiKeySaved ? (
                        <button
                          onClick={handleRemoveApiKey}
                          title="Remove API Key"
                          className="rounded p-1 text-red-400 hover:bg-slate-700"
                        >
                          <Trash size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedTab("setup")}
                          title="Set API Key"
                          className="rounded p-1 text-blue-400 hover:bg-slate-700"
                        >
                          <Key size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {tempProvider.toLowerCase() !== "ollama" && !apiKeySaved ? (
                  <div className="p-3 text-center">
                    <div className="mb-2 text-sm">API key not configured</div>
                    <button
                      onClick={() => setSelectedTab("setup")}
                      className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium hover:bg-blue-700"
                    >
                      Configure API Key
                    </button>
                  </div>
                ) : loadingModels ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin text-blue-400" />
                  </div>
                ) : getModelsForProvider(tempProvider).length === 0 ? (
                  <div className="px-2 py-3 text-center text-sm text-slate-400">
                    No models available
                  </div>
                ) : (
                  <div className="mt-1 max-h-72 space-y-1 overflow-y-auto">
                    {getModelsForProvider(tempProvider).map((model) => (
                      <button
                        key={model.id}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-slate-700 ${
                          selectedModel.id === model.id ? "bg-slate-700/50" : ""
                        }`}
                        onClick={() => handleSelectModel(model)}
                      >
                        <div className="flex items-center">
                          <div
                            className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full ${
                              model.provider === "OpenAI"
                                ? "bg-green-900/30 text-green-300"
                                : model.provider === "Anthropic"
                                  ? "bg-purple-900/30 text-purple-300"
                                  : model.provider === "Google"
                                    ? "bg-blue-900/30 text-blue-300"
                                    : model.provider === "Ollama"
                                      ? "bg-amber-900/30 text-amber-300"
                                      : "bg-blue-900/30 text-blue-300"
                            }`}
                          >
                            {model.provider.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm">{model.name}</div>
                            <div className="text-xs text-slate-400">
                              {model.id}
                            </div>
                          </div>
                        </div>
                        {selectedModel.id === model.id && (
                          <Check size={16} className="text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {selectedTab === "setup" && renderSetupTab()}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ModelSwitcher;
