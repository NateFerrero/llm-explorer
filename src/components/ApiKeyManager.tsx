"use client";

import React, { useState, useEffect } from "react";
import { useApiStore } from "@/lib/stores/apiStore";
import { LucideKey, CheckCircle2, AlertCircle } from "lucide-react";
interface ApiKeyManagerProps {
  onApiKeySet: () => void;
}
const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  onApiKeySet
}) => {
  const {
    setApiKey,
    providerType,
    setProviderType
  } = useApiStore();
  const [apiKey, setApiKeyLocal] = useState("");
  const [keyStatus, setKeyStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if we already have an API key in session storage
  useEffect(() => {
    const storedProvider = sessionStorage.getItem("llm_provider");
    const storedKey = sessionStorage.getItem("llm_api_key");
    if (storedProvider && storedKey) {
      setProviderType(storedProvider as "openai" | "anthropic" | "gemini");
      setApiKey(storedKey);
      onApiKeySet();
    }
  }, [setApiKey, setProviderType, onApiKeySet]);
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProviderType(e.target.value as "openai" | "anthropic" | "gemini");
    setKeyStatus("idle");
  };
  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      return;
    }
    setIsLoading(true);

    // Simple validation based on key format - in real app we'd make a test API call
    let isValid = false;
    try {
      if (providerType === "openai" && apiKey.startsWith("sk-") || providerType === "anthropic" && apiKey.startsWith("sk-ant-") || providerType === "gemini" && apiKey.length > 10) {
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
  return <div className="max-w-2xl mx-auto" data-unique-id="30d699ba-5686-425b-976f-3f358bc4184e" data-loc="66:9-66:44" data-file-name="components/ApiKeyManager.tsx">
      <div className="bg-slate-800 rounded-lg p-8 shadow-xl" data-unique-id="3b191657-ab00-40ac-8b63-6f87129574c3" data-loc="67:6-67:61" data-file-name="components/ApiKeyManager.tsx">
        <div className="flex items-center gap-3 mb-6" data-unique-id="1bbbcc12-69c5-4e88-8752-6b0df2cedc55" data-loc="68:8-68:54" data-file-name="components/ApiKeyManager.tsx">
          <div className="bg-blue-600 p-3 rounded-full" data-unique-id="2a78d633-4795-4c27-a27e-9329f23ed21d" data-loc="69:10-69:56" data-file-name="components/ApiKeyManager.tsx">
            <LucideKey size={24} />
          </div>
          <h2 className="text-2xl font-bold" data-unique-id="fb73586c-9623-4b04-ac83-ff8f9f9d9f2a" data-loc="72:10-72:45" data-file-name="components/ApiKeyManager.tsx">Setup Your API Key</h2>
        </div>
        
        <p className="mb-6 text-slate-300" data-unique-id="f3827cec-f333-44cd-9050-f142a9930b15" data-loc="75:8-75:43" data-file-name="components/ApiKeyManager.tsx">
          To use the LLM Browser, you'll need to provide your API key for one of the supported language model providers.
          Your key is stored locally in session storage and will be cleared when you close your browser.
        </p>
        
        <div className="space-y-6" data-unique-id="f41d9753-638f-4663-96ee-ca83f5e08116" data-loc="80:8-80:35" data-file-name="components/ApiKeyManager.tsx">
          <div data-unique-id="a1503ceb-7763-4515-b806-af9768830152" data-loc="81:10-81:15" data-file-name="components/ApiKeyManager.tsx">
            <label htmlFor="providerSelect" className="block text-sm font-medium mb-2 text-slate-300" data-unique-id="77b8a4f8-c77b-40e2-b566-d34e376cf420" data-loc="82:12-82:102" data-file-name="components/ApiKeyManager.tsx">
              Select AI Provider
            </label>
            <div className="grid grid-cols-3 gap-3 mb-4" data-unique-id="ea291cf3-6a5c-47e0-884e-7978ac931e34" data-loc="85:12-85:57" data-file-name="components/ApiKeyManager.tsx">
              <button type="button" onClick={() => setProviderType("openai")} className={`flex flex-col items-center justify-center p-3 rounded-lg border ${providerType === "openai" ? "bg-blue-900/30 border-blue-500 text-blue-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"}`} data-unique-id="76e5ea88-82b3-4899-9964-49a589b8afa5" data-loc="86:14-86:302" data-file-name="components/ApiKeyManager.tsx">
                <div className="text-lg font-semibold" data-unique-id="c267b8c6-e0b3-4b2b-9763-aba18ab3f331" data-loc="87:16-87:55" data-file-name="components/ApiKeyManager.tsx">OpenAI</div>
                <div className="text-xs mt-1" data-unique-id="04649193-3b71-4c72-b715-02029e442cb3" data-loc="88:16-88:46" data-file-name="components/ApiKeyManager.tsx">GPT-4</div>
              </button>
              <button type="button" onClick={() => setProviderType("anthropic")} className={`flex flex-col items-center justify-center p-3 rounded-lg border ${providerType === "anthropic" ? "bg-purple-900/30 border-purple-500 text-purple-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"}`} data-unique-id="47538e5a-5b63-4cfd-9943-7ab86730f22e" data-loc="90:14-90:314" data-file-name="components/ApiKeyManager.tsx">
                <div className="text-lg font-semibold" data-unique-id="1ce0ac2f-3b89-42a3-b6be-b7419edfc842" data-loc="91:16-91:55" data-file-name="components/ApiKeyManager.tsx">Anthropic</div>
                <div className="text-xs mt-1" data-unique-id="a82cd308-f68c-4013-b3e5-ad035859cd15" data-loc="92:16-92:46" data-file-name="components/ApiKeyManager.tsx">Claude</div>
              </button>
              <button type="button" onClick={() => setProviderType("gemini")} className={`flex flex-col items-center justify-center p-3 rounded-lg border ${providerType === "gemini" ? "bg-green-900/30 border-green-500 text-green-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"}`} data-unique-id="ded1f77a-7194-41ed-a7c4-491f68e20c83" data-loc="94:14-94:305" data-file-name="components/ApiKeyManager.tsx">
                <div className="text-lg font-semibold" data-unique-id="7cee4e44-7484-400c-82b8-cfc5ba934244" data-loc="95:16-95:55" data-file-name="components/ApiKeyManager.tsx">Google</div>
                <div className="text-xs mt-1" data-unique-id="143ce2b5-edf8-4303-935e-c8d42e522881" data-loc="96:16-96:46" data-file-name="components/ApiKeyManager.tsx">Gemini</div>
              </button>
            </div>
            <div className="text-center text-sm text-slate-400 mb-4" data-unique-id="d9a86dea-7321-44e9-a6bb-81e10eb5da5b" data-loc="99:12-99:69" data-file-name="components/ApiKeyManager.tsx">
              Selected Provider: <span className="font-semibold text-white" data-unique-id="b09f1b2d-a6df-4ca2-8566-d2991d38b499" data-loc="100:33-100:76" data-file-name="components/ApiKeyManager.tsx">{providerType.charAt(0).toUpperCase() + providerType.slice(1)}</span>
            </div>
          </div>
          
          <div data-unique-id="8221047e-9523-4d63-a152-f14984f75163" data-loc="104:10-104:15" data-file-name="components/ApiKeyManager.tsx">
            <label htmlFor="apiKeyInput" className="block text-sm font-medium mb-2 text-slate-300" data-unique-id="7f2414f2-ba88-45cd-8d72-118b0c7a1f8f" data-loc="105:12-105:99" data-file-name="components/ApiKeyManager.tsx">
              API Key
            </label>
            <div className="relative" data-unique-id="8e56cd6e-8bae-443b-94d8-3f9f324e636c" data-loc="108:12-108:38" data-file-name="components/ApiKeyManager.tsx">
              <input id="apiKeyInput" type={showKey ? "text" : "password"} value={apiKey} onChange={e => {
              setApiKeyLocal(e.target.value);
              setKeyStatus("idle");
            }} placeholder={`Enter your ${providerType} API key`} className="w-full bg-slate-700 border border-slate-600 rounded-md px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500" data-unique-id="bd19204a-a418-450b-b2f1-1e0c58dd2756" data-loc="109:14-112:203" data-file-name="components/ApiKeyManager.tsx" />
              <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white" data-unique-id="4fefbe72-8d00-4ce7-b827-5fd7d90cad42" data-loc="113:14-113:169" data-file-name="components/ApiKeyManager.tsx">
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            
            {keyStatus === "valid" && <div className="mt-2 flex items-center text-green-400 text-sm" data-unique-id="1e4823fe-dc78-4e27-ae8b-f5c5bfdad2f0" data-loc="118:38-118:101" data-file-name="components/ApiKeyManager.tsx">
                <CheckCircle2 size={16} className="mr-1" />
                API key is valid. Setting up your environment...
              </div>}
            
            {keyStatus === "invalid" && <div className="mt-2 flex items-center text-red-400 text-sm" data-unique-id="47697968-7a32-40ae-899b-3a5b704accda" data-loc="123:40-123:101" data-file-name="components/ApiKeyManager.tsx">
                <AlertCircle size={16} className="mr-1" />
                Invalid API key format. Please check and try again.
              </div>}
            
            <div className="text-xs text-slate-400 mt-2" data-unique-id="6c14e368-b7be-4e9a-bab6-e5a2df4164df" data-loc="128:12-128:57" data-file-name="components/ApiKeyManager.tsx">
              <p data-unique-id="fed7a8c4-d112-4232-b67c-a459ff225c99" data-loc="129:14-129:17" data-file-name="components/ApiKeyManager.tsx">Example formats:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1" data-unique-id="ff470ef5-84ee-43c2-9bdf-9da3fde0e946" data-loc="130:14-130:60" data-file-name="components/ApiKeyManager.tsx">
                <li data-unique-id="a9f000d7-bfd7-4eb8-afc7-d924014cf3f1" data-loc="131:16-131:20" data-file-name="components/ApiKeyManager.tsx">OpenAI: sk-xxxxxxxxxxxxxxxxxxxxxxxx</li>
                <li data-unique-id="b31e8505-1975-4d62-8c9e-f6618e1fbabf" data-loc="132:16-132:20" data-file-name="components/ApiKeyManager.tsx">Anthropic: sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx</li>
                <li data-unique-id="55e06ef0-d0b6-4fc1-9512-42721ddaa33e" data-loc="133:16-133:20" data-file-name="components/ApiKeyManager.tsx">Gemini: xxxxxxxxxxxxxxxxxxxxxxxx</li>
              </ul>
            </div>
          </div>
          
          <button onClick={validateApiKey} disabled={isLoading || !apiKey.trim()} className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${isLoading || !apiKey.trim() ? "bg-slate-600 text-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`} data-unique-id="caa649dc-fce2-49b2-aa6c-72447d23e8bd" data-loc="138:10-138:281" data-file-name="components/ApiKeyManager.tsx">
            {isLoading ? "Validating..." : "Continue"}
          </button>
          
          <p className="text-xs text-slate-400 text-center mt-4" data-unique-id="2a3b2ac6-578f-4e22-819d-f0b9576a329e" data-loc="142:10-142:65" data-file-name="components/ApiKeyManager.tsx">
            Your API key is stored locally in your browser's session storage and is never sent to our servers.
            It will be automatically deleted when you close your browser.
          </p>
        </div>
      </div>
    </div>;
};
export default ApiKeyManager;