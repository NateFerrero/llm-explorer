"use client";

import {
  availableModels,
  getDefaultModel,
  getModelsByProvider,
  loadAvailableModels,
} from "@/lib/models";
import { useApiStore } from "@/lib/stores/apiStore";
import { AIModel } from "@/lib/types";
import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Loader2,
  Lock,
  Server,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface ModelSelectorProps {
  onModelSelected: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelSelected }) => {
  const {
    setSelectedModel,
    setHasSelectedModel,
    providerType,
    setProviderType,
  } = useApiStore();
  const [models, setModels] = useState<AIModel[]>(availableModels);
  const [selectedModel, setSelectedModelLocal] =
    useState<AIModel>(getDefaultModel());
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [modelsByProvider, setModelsByProvider] = useState<
    Record<string, AIModel[]>
  >(getModelsByProvider());
  const [selectedProvider, setSelectedProvider] = useState<string>(
    selectedModel.provider,
  );
  const [ollamaStatus, setOllamaStatus] = useState<
    "checking" | "available" | "unavailable"
  >("checking");
  const [apiKeyStatus, setApiKeyStatus] = useState<"missing" | "available">(
    "missing",
  );
  const [step, setStep] = useState<"provider" | "model" | "apiSetup">(
    "provider",
  );
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isSavingKey, setIsSavingKey] = useState<boolean>(false);

  // Check for Ollama availability
  const checkOllamaAvailability = async () => {
    setOllamaStatus("checking");
    try {
      const response = await fetch("http://localhost:11434/api/tags", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setOllamaStatus("available");
      } else {
        setOllamaStatus("unavailable");
      }
    } catch (error) {
      console.error("Error checking Ollama availability:", error);
      setOllamaStatus("unavailable");
    }
  };

  // Load available models on component mount
  useEffect(() => {
    checkOllamaAvailability();

    // Check if API key is available for selected provider
    const storedProvider = sessionStorage.getItem("llm_provider");
    const storedKey = sessionStorage.getItem("llm_api_key");

    if (storedProvider && storedKey && storedProvider !== "ollama") {
      setApiKeyStatus("available");
    } else if (storedProvider === "ollama") {
      setApiKeyStatus("available"); // Ollama doesn't need API key
    }

    const fetchModels = async () => {
      try {
        setIsLoading(true);
        const availableModels = await loadAvailableModels();
        console.log("Available models:", availableModels);
        if (availableModels.length === 0) {
          // If no models are found, add default models
          const defaultModels = [
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
              capabilities: [
                "Code Generation",
                "Detailed Explanations",
                "Reasoning",
              ],
            },
            {
              id: "ollama-llama3",
              name: "Llama 3",
              provider: "Ollama",
              description:
                "Locally hosted Llama 3 model with fast responses and privacy protection",
              capabilities: ["Local Execution", "Privacy", "Fast Response"],
            },
          ];
          setModels(defaultModels);

          // Group default models by provider
          const groupedDefaultModels = defaultModels.reduce(
            (acc, model) => {
              if (!acc[model.provider]) {
                acc[model.provider] = [];
              }
              acc[model.provider].push(model);
              return acc;
            },
            {} as Record<string, AIModel[]>,
          );
          setModelsByProvider(groupedDefaultModels);
        } else {
          setModels(availableModels);

          // Group models by provider
          const groupedModels = availableModels.reduce(
            (acc, model) => {
              if (!acc[model.provider]) {
                acc[model.provider] = [];
              }
              acc[model.provider].push(model);
              return acc;
            },
            {} as Record<string, AIModel[]>,
          );
          setModelsByProvider(groupedModels);
        }

        // Set default model
        const defaultModel = getDefaultModel();
        setSelectedModelLocal(defaultModel);
        setSelectedProvider(defaultModel.provider);
      } catch (error) {
        console.error("Error loading models:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModels();
  }, []);

  // Select a provider
  const handleSelectProvider = (provider: string) => {
    setSelectedProvider(provider);
    setIsProviderDropdownOpen(false);
    const providerType =
      provider.toLowerCase() === "google" ? "gemini" : provider.toLowerCase();
    setProviderType(
      providerType as "openai" | "anthropic" | "gemini" | "ollama",
    );

    // If provider is Ollama, we don't need API key
    if (provider === "Ollama") {
      setApiKeyStatus("available");
      setStep("model");
      localStorage.setItem("llm_provider", "ollama");

      // Filter models to only show Ollama models
      const ollamaModels = models.filter(
        (model) => model.provider === "Ollama",
      );
      if (ollamaModels.length > 0) {
        // Set the first Ollama model as the selected model
        setSelectedModelLocal(ollamaModels[0]);
      }
    } else if (
      localStorage.getItem("llm_provider") === providerType &&
      localStorage.getItem(`llm_api_key_${providerType}`)
    ) {
      // If we already have API key for this provider
      setApiKeyStatus("available");
      setStep("model");

      // Filter models for the selected provider
      const providerModels = models.filter(
        (model) => model.provider === provider,
      );
      if (providerModels.length > 0) {
        // Set the first model from this provider as the selected model
        setSelectedModelLocal(providerModels[0]);
      }
    } else {
      // Instead of redirecting, switch to API key setup UI
      setApiKeyStatus("missing");
      // Set the API key setup state
      setStep("apiSetup");
    }
  };

  // Select a model
  const handleSelectModel = (model: AIModel) => {
    setSelectedModelLocal(model);
    setIsModelDropdownOpen(false);
  };

  const handleContinue = () => {
    if (models.length === 0) {
      // If no models are available, show an error
      alert("No AI models are available. Please try again later.");
      return;
    }
    setSelectedModel(selectedModel);
    setHasSelectedModel(true);
    onModelSelected();
  };

  // Get available models for the selected provider
  const getFilteredModels = () => {
    return models.filter((model) => model.provider === selectedProvider);
  };

  // Handle API key change
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    if (apiKeyError) setApiKeyError(null);
  };

  // Save API key
  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setApiKeyError("Please enter a valid API key");
      return;
    }

    setIsSavingKey(true);
    setApiKeyError(null);

    try {
      // Logic for validating the API key - similar to ModelSwitcher
      let isValid = false;
      const providerType =
        selectedProvider.toLowerCase() === "google"
          ? "gemini"
          : selectedProvider.toLowerCase();

      // Test the key with an API call
      const response = await fetch(
        `/api/models?provider=${providerType}&apiKey=${encodeURIComponent(apiKey)}`,
      );

      isValid = response.ok;

      if (!isValid) {
        const errorData = await response.json();
        setApiKeyError(errorData.error || "Invalid API key");
      } else {
        // Save the API key using the correct format
        localStorage.setItem(`llm_api_key_${providerType}`, apiKey);
        localStorage.setItem("llm_provider", providerType);
        setApiKeyStatus("available");

        // Move to model selection
        setStep("model");

        // Get available models for this provider
        const providerModels = models.filter(
          (model) => model.provider === selectedProvider,
        );
        if (providerModels.length > 0) {
          setSelectedModelLocal(providerModels[0]);
        }
      }
    } catch (error) {
      console.error("Error validating API key:", error);
      setApiKeyError("Failed to validate API key. Please try again.");
    } finally {
      setIsSavingKey(false);
    }
  };

  // Render the provider selector step
  const renderProviderSelector = () => {
    const providers = Object.keys(modelsByProvider);

    return (
      <div className="space-y-6">
        <div>
          <label
            htmlFor="providerSelect"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Select AI Provider
          </label>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              onClick={() => handleSelectProvider("Ollama")}
              className={`relative flex items-center rounded-lg border p-4 ${
                selectedProvider === "Ollama"
                  ? "border-amber-500 bg-amber-900/30 text-amber-300"
                  : "border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
              disabled={ollamaStatus === "unavailable"}
            >
              <div className="mr-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-900/50 text-amber-300">
                  <Server size={20} />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-lg font-medium">Ollama</div>
                <div className="text-sm text-slate-400">
                  {ollamaStatus === "available"
                    ? "Run models locally - No API key required"
                    : "Ollama not detected - Please install and run"}
                </div>
              </div>
              {ollamaStatus === "checking" && (
                <div className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-slate-400"></div>
              )}
              {ollamaStatus === "available" && (
                <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-400"></div>
              )}
              {ollamaStatus === "unavailable" && (
                <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-400"></div>
              )}
            </button>

            <button
              onClick={() => handleSelectProvider("OpenAI")}
              className={`flex items-center rounded-lg border p-4 ${
                selectedProvider === "OpenAI"
                  ? "border-green-500 bg-green-900/30 text-green-300"
                  : "border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <div className="mr-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-900/50 text-green-300">
                  <div className="text-lg font-bold">O</div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-lg font-medium">OpenAI</div>
                <div className="text-sm text-slate-400">
                  GPT-4o and other OpenAI models
                </div>
              </div>
              {apiKeyStatus === "missing" && (
                <Lock size={16} className="text-slate-400" />
              )}
            </button>

            <button
              onClick={() => handleSelectProvider("Anthropic")}
              className={`flex items-center rounded-lg border p-4 ${
                selectedProvider === "Anthropic"
                  ? "border-purple-500 bg-purple-900/30 text-purple-300"
                  : "border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <div className="mr-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-900/50 text-purple-300">
                  <div className="text-lg font-bold">A</div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-lg font-medium">Anthropic</div>
                <div className="text-sm text-slate-400">
                  Claude models with excellent reasoning
                </div>
              </div>
              {apiKeyStatus === "missing" && (
                <Lock size={16} className="text-slate-400" />
              )}
            </button>

            <button
              onClick={() => handleSelectProvider("Google")}
              className={`flex items-center rounded-lg border p-4 ${
                selectedProvider === "Google"
                  ? "border-blue-500 bg-blue-900/30 text-blue-300"
                  : "border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <div className="mr-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900/50 text-blue-300">
                  <div className="text-lg font-bold">G</div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-lg font-medium">Google</div>
                <div className="text-sm text-slate-400">
                  Gemini models for text and code
                </div>
              </div>
              {apiKeyStatus === "missing" && (
                <Lock size={16} className="text-slate-400" />
              )}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            <p>
              Providers requiring API keys will redirect you to the setup
              screen.
            </p>
            <p className="mt-1">
              Ollama runs locally and doesn't require an API key.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render the model selector step
  const renderModelSelector = () => {
    const filteredModels = getFilteredModels();

    return (
      <div className="space-y-6">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <label
              htmlFor="modelSelect"
              className="block text-sm font-medium text-slate-300"
            >
              Select a {selectedProvider} Model
            </label>
            <button
              onClick={() => setStep("provider")}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Change Provider
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md border border-slate-600 bg-slate-700 px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            >
              <div className="flex items-center">
                <div className="mr-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      selectedModel.provider === "OpenAI"
                        ? "bg-green-900/30 text-green-300"
                        : selectedModel.provider === "Anthropic"
                          ? "bg-purple-900/30 text-purple-300"
                          : selectedModel.provider === "Google"
                            ? "bg-blue-900/30 text-blue-300"
                            : selectedModel.provider === "Ollama"
                              ? "bg-amber-900/30 text-amber-300"
                              : "bg-blue-900/30 text-blue-300"
                    }`}
                  >
                    {selectedModel.provider.charAt(0)}
                  </div>
                </div>
                <div>
                  <div className="font-medium">{selectedModel.name}</div>
                  <div className="text-xs text-slate-400">
                    {selectedModel.provider}
                  </div>
                </div>
              </div>
              <ChevronDown
                size={20}
                className={`transition-transform ${isModelDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isModelDropdownOpen && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                }}
                className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-700 bg-slate-800 shadow-lg"
              >
                <div className="py-1">
                  <div className="sticky top-0 flex justify-between bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-400">
                    <span>Available {selectedProvider} Models</span>
                    <span className="text-slate-500">
                      {filteredModels.length} models
                    </span>
                  </div>

                  {filteredModels.map((model) => (
                    <button
                      key={model.id}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-700 ${selectedModel.id === model.id ? "bg-slate-700/50" : ""}`}
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
                          <div>{model.name}</div>
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
              </motion.div>
            )}
          </div>

          <div className="mt-4">
            <div className="rounded-md bg-slate-700/50 p-4">
              <h3 className="mb-2 font-medium">{selectedModel.name}</h3>
              <p className="mb-3 text-sm text-slate-300">
                {selectedModel.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedModel.capabilities.map((capability, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-slate-600/50 px-2 py-1 text-xs text-blue-300"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Continue with {selectedModel.name}
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          You can change the AI model later in the settings.
        </p>
      </div>
    );
  };

  // Render API key setup UI
  const renderApiKeySetup = () => (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="apiKey"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          {selectedProvider} API Key
        </label>
        <p className="mb-4 text-sm text-slate-400">
          {selectedProvider === "OpenAI" &&
            "Enter your OpenAI API key to use GPT models"}
          {selectedProvider === "Anthropic" &&
            "Enter your Anthropic API key to use Claude models"}
          {selectedProvider === "Google" &&
            "Enter your Google API key to use Gemini models"}
        </p>
        <input
          type="password"
          id="apiKey"
          name="apiKey"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder={`Enter your ${selectedProvider} API key`}
          className="w-full rounded-md border border-slate-600 bg-slate-700 px-4 py-3 text-slate-300"
        />
        {apiKeyError && (
          <p className="mt-2 text-sm text-red-400">{apiKeyError}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSaveApiKey}
          disabled={isSavingKey || !apiKey.trim()}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-600 disabled:text-slate-300"
        >
          {isSavingKey ? (
            <span className="flex items-center justify-center">
              <Loader2 size={18} className="mr-2 animate-spin" /> Validating...
            </span>
          ) : (
            "Save API Key"
          )}
        </button>
        <button
          onClick={() => setStep("provider")}
          className="rounded-md border border-slate-600 px-4 py-2 font-medium transition-colors hover:bg-slate-700"
        >
          Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-lg bg-slate-800 p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-blue-600 p-3">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl font-bold">
            {step === "provider"
              ? "Select AI Provider"
              : step === "apiSetup"
                ? "Set Up API Key"
                : "Select AI Model"}
          </h2>
        </div>

        <p className="mb-6 text-slate-300">
          {step === "provider"
            ? "Choose an AI provider for your knowledge exploration. Each provider offers different models with unique capabilities."
            : step === "apiSetup"
              ? "Please enter your API key to continue."
              : "Choose an AI model from this provider. Different models have different capabilities and specialties."}
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={40} className="mb-4 animate-spin text-blue-500" />
            <p className="text-slate-300">Loading available models...</p>
          </div>
        ) : step === "provider" ? (
          renderProviderSelector()
        ) : step === "apiSetup" ? (
          renderApiKeySetup()
        ) : (
          renderModelSelector()
        )}
      </div>
    </div>
  );
};

export default ModelSelector;
