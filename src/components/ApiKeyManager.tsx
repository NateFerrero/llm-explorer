"use client";

import { useApiStore } from "@/lib/stores/apiStore";
import { AlertCircle, CheckCircle2, LucideKey, Server } from "lucide-react";
import React, { useEffect, useState } from "react";
interface ApiKeyManagerProps {
  onApiKeySet: () => void;
}
const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onApiKeySet }) => {
  const { setApiKey, providerType, setProviderType } = useApiStore();
  const [apiKey, setApiKeyLocal] = useState("");
  const [keyStatus, setKeyStatus] = useState<"idle" | "valid" | "invalid">(
    "idle",
  );
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<
    "checking" | "available" | "unavailable"
  >("checking");

  // Check if we already have an API key in session storage or if Ollama was previously selected
  useEffect(() => {
    const storedProvider = sessionStorage.getItem("llm_provider");
    const storedKey = sessionStorage.getItem("llm_api_key");

    if (storedProvider === "ollama") {
      setProviderType("ollama");
      checkOllamaAvailability();
      onApiKeySet();
    } else if (storedProvider && storedKey) {
      setProviderType(storedProvider as "openai" | "anthropic" | "gemini");
      setApiKey(storedKey);
      onApiKeySet();
    } else {
      checkOllamaAvailability();
    }
  }, [setApiKey, setProviderType, onApiKeySet]);

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

  const handleProviderChange = (
    provider: "openai" | "anthropic" | "gemini" | "ollama",
  ) => {
    setProviderType(provider);
    setKeyStatus("idle");
  };

  const validateApiKey = async () => {
    if (providerType === "ollama") {
      // For Ollama, we don't need an API key
      sessionStorage.setItem("llm_provider", "ollama");
      // Clear any previous API key
      sessionStorage.removeItem("llm_api_key");
      setApiKey("");
      onApiKeySet();
      return;
    }

    if (!apiKey.trim()) {
      return;
    }
    setIsLoading(true);

    // Simple validation based on key format - in real app we'd make a test API call
    let isValid = false;
    try {
      if (
        (providerType === "openai" && apiKey.startsWith("sk-")) ||
        (providerType === "anthropic" && apiKey.startsWith("sk-ant-")) ||
        (providerType === "gemini" && apiKey.length > 10)
      ) {
        isValid = true;

        // Store the API key in session storage
        sessionStorage.setItem("llm_provider", providerType);
        sessionStorage.setItem("llm_api_key", apiKey);

        // Update global state
        setApiKey(apiKey);
        setTimeout(() => {
          onApiKeySet();
        }, 1000);
      }
      setKeyStatus(isValid ? "valid" : "invalid");
    } catch (error) {
      console.error("Error validating API key:", error);
      setKeyStatus("invalid");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg bg-slate-800 p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-blue-600 p-3">
            <LucideKey size={24} />
          </div>
          <h2 className="text-2xl font-bold">Setup Your AI Provider</h2>
        </div>

        <p className="mb-6 text-slate-300">
          To use the LLM Browser, you'll need to provide your API key for one of
          the supported language model providers, or use a locally hosted Ollama
          model that doesn't require an API key.
        </p>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="providerSelect"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Select AI Provider
            </label>
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <button
                type="button"
                onClick={() => handleProviderChange("openai")}
                className={`flex flex-col items-center justify-center rounded-lg border p-3 ${providerType === "openai" ? "border-blue-500 bg-blue-900/30 text-blue-300" : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
              >
                <div className="text-lg font-semibold">OpenAI</div>
                <div className="mt-1 text-xs">GPT-4</div>
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange("anthropic")}
                className={`flex flex-col items-center justify-center rounded-lg border p-3 ${providerType === "anthropic" ? "border-purple-500 bg-purple-900/30 text-purple-300" : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
              >
                <div className="text-lg font-semibold">Anthropic</div>
                <div className="mt-1 text-xs">Claude</div>
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange("gemini")}
                className={`flex flex-col items-center justify-center rounded-lg border p-3 ${providerType === "gemini" ? "border-green-500 bg-green-900/30 text-green-300" : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
              >
                <div className="text-lg font-semibold">Google</div>
                <div className="mt-1 text-xs">Gemini</div>
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange("ollama")}
                className={`relative flex flex-col items-center justify-center rounded-lg border p-3 ${
                  providerType === "ollama"
                    ? "border-amber-500 bg-amber-900/30 text-amber-300"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
                disabled={ollamaStatus === "unavailable"}
              >
                <div className="text-lg font-semibold">Ollama</div>
                <div className="mt-1 text-xs">Local Models</div>
                {ollamaStatus === "checking" && (
                  <div className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-slate-400"></div>
                )}
                {ollamaStatus === "available" && (
                  <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-green-400"></div>
                )}
                {ollamaStatus === "unavailable" && (
                  <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-400"></div>
                )}
              </button>
            </div>
            <div className="mb-4 text-center text-sm text-slate-400">
              Selected Provider:{" "}
              <span className="font-semibold text-white">
                {providerType.charAt(0).toUpperCase() + providerType.slice(1)}
              </span>
            </div>
          </div>

          {providerType !== "ollama" ? (
            <div>
              <label
                htmlFor="apiKeyInput"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                API Key
              </label>
              <div className="relative">
                <input
                  id="apiKeyInput"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKeyLocal(e.target.value);
                    setKeyStatus("idle");
                  }}
                  placeholder={`Enter your ${providerType} API key`}
                  className="w-full rounded-md border border-slate-600 bg-slate-700 px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transform text-slate-400 hover:text-white"
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>

              {keyStatus === "valid" && (
                <div className="mt-2 flex items-center text-sm text-green-400">
                  <CheckCircle2 size={16} className="mr-1" />
                  API key is valid. Setting up your environment...
                </div>
              )}

              {keyStatus === "invalid" && (
                <div className="mt-2 flex items-center text-sm text-red-400">
                  <AlertCircle size={16} className="mr-1" />
                  Invalid API key format. Please check and try again.
                </div>
              )}

              <div className="mt-2 text-xs text-slate-400">
                <p>Example formats:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>OpenAI: sk-xxxxxxxxxxxxxxxxxxxxxxxx</li>
                  <li>Anthropic: sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx</li>
                  <li>Gemini: xxxxxxxxxxxxxxxxxxxxxxxx</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-amber-900/30 bg-amber-900/20 p-4">
              <div className="flex items-start">
                <Server size={20} className="mr-3 mt-1 text-amber-400" />
                <div>
                  <h3 className="mb-1 font-medium text-amber-300">
                    Using Local Ollama Models
                  </h3>
                  <p className="text-sm text-slate-300">
                    {ollamaStatus === "available"
                      ? "Ollama is running on your machine. You can use local models without an API key."
                      : "Ollama doesn't appear to be running. Please start Ollama and refresh this page."}
                  </p>
                  {ollamaStatus === "unavailable" && (
                    <p className="mt-2 text-xs text-slate-400">
                      Make sure Ollama is installed and running on port 11434.
                      Visit{" "}
                      <a
                        href="https://ollama.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        ollama.com
                      </a>{" "}
                      to learn more.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={validateApiKey}
            disabled={
              isLoading ||
              (providerType !== "ollama" && !apiKey.trim()) ||
              (providerType === "ollama" && ollamaStatus === "unavailable")
            }
            className={`w-full rounded-md px-4 py-2 font-medium transition-colors ${
              isLoading ||
              (providerType !== "ollama" && !apiKey.trim()) ||
              (providerType === "ollama" && ollamaStatus === "unavailable")
                ? "cursor-not-allowed bg-slate-600 text-slate-300"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isLoading
              ? "Validating..."
              : providerType === "ollama"
                ? "Continue with Ollama"
                : "Continue"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            {providerType === "ollama"
              ? "Ollama runs locally on your machine and doesn't require an API key."
              : "Your API key is stored locally in your browser's session storage and is never sent to our servers. It will be automatically deleted when you close your browser."}
          </p>
        </div>
      </div>
    </div>
  );
};
export default ApiKeyManager;
