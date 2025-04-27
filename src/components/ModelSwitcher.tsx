"use client";

import React, { useState, useEffect } from "react";
import { useApiStore } from "@/lib/stores/apiStore";
import { AIModel } from "@/lib/types";
import { availableModels, loadAvailableModels } from "@/lib/models";
import { motion } from "framer-motion";
import { ChevronDown, Settings, Loader2, Check } from "lucide-react";
const ModelSwitcher: React.FC = () => {
  const {
    selectedModel,
    setSelectedModel
  } = useApiStore();
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<AIModel[]>(availableModels);
  const [isLoading, setIsLoading] = useState(false);

  // Load available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        const availableModels = await loadAvailableModels();
        console.log("Available models for switcher:", availableModels);
        setModels(availableModels);
      } catch (error) {
        console.error("Error loading models:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModels();
  }, []);
  const handleSelectModel = (model: AIModel) => {
    setSelectedModel(model);
    setIsOpen(false);
  };
  return <div className="relative" data-unique-id="0491db7e-1fb0-4dca-a44f-3417ecb454f1" data-loc="38:9-38:35" data-file-name="components/ModelSwitcher.tsx">
      <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${isLoading ? "bg-slate-700/50 border-slate-600/50 text-slate-400" : selectedModel.provider === "OpenAI" ? "bg-green-900/20 border-green-700/50 text-green-300 hover:bg-green-900/30" : selectedModel.provider === "Anthropic" ? "bg-purple-900/20 border-purple-700/50 text-purple-300 hover:bg-purple-900/30" : "bg-blue-900/20 border-blue-700/50 text-blue-300 hover:bg-blue-900/30"}`} disabled={isLoading} data-unique-id="b0b9da91-b6d8-41e4-8e09-683e8d1912a5" data-loc="39:6-51:7" data-file-name="components/ModelSwitcher.tsx">
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} className="mr-1" />}
        <span className="text-sm font-medium" data-unique-id="c9bf090c-53a4-4136-85fb-368b256d4eed" data-loc="57:8-57:46" data-file-name="components/ModelSwitcher.tsx">
          {isLoading ? "Loading..." : selectedModel.name}
        </span>
        <ChevronDown size={14} className={`ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && !isLoading && <motion.div initial={{
      opacity: 0,
      y: -10
    }} animate={{
      opacity: 1,
      y: 0
    }} exit={{
      opacity: 0,
      y: -10
    }} className="absolute right-0 mt-1 z-50 w-72 bg-slate-800 border border-slate-700 rounded-md shadow-xl overflow-hidden" data-unique-id="3e036f89-8941-44f2-9aed-0b554bee543e" data-loc="63:31-68:7" data-file-name="components/ModelSwitcher.tsx">
          <div className="p-2" data-unique-id="a5fdc8d5-4c23-4913-b768-6890fb690bc9" data-loc="69:10-69:31" data-file-name="components/ModelSwitcher.tsx">
            <div className="text-xs font-semibold text-slate-400 px-2 py-1 flex justify-between items-center" data-unique-id="7a0fe39e-0630-4564-993b-079478fe20a4" data-loc="70:12-70:110" data-file-name="components/ModelSwitcher.tsx">
              <span data-unique-id="4eb5a43f-fcec-431c-ad9b-ab67cfe2fead" data-loc="71:14-71:20" data-file-name="components/ModelSwitcher.tsx">Select Model</span>
              <span className="text-xs text-slate-500" data-unique-id="d427b1e0-cc23-42be-adc0-2b77306d420c" data-loc="72:14-72:55" data-file-name="components/ModelSwitcher.tsx">{models.length} available</span>
            </div>
            
            {models.length === 0 ? <div className="py-3 px-2 text-center text-slate-400 text-sm" data-unique-id="11d4d242-3bce-482a-b459-a944378ae186" data-loc="75:35-75:97" data-file-name="components/ModelSwitcher.tsx">
                No models available
              </div> : <div className="mt-1 space-y-1 max-h-72 overflow-y-auto" data-unique-id="1e3fad56-c933-435e-8c29-543d52274aab" data-loc="77:23-77:80" data-file-name="components/ModelSwitcher.tsx">
                {Object.entries(models.reduce((acc, model) => {
            if (!acc[model.provider]) {
              acc[model.provider] = [];
            }
            acc[model.provider].push(model);
            return acc;
          }, {} as Record<string, AIModel[]>)).map(([provider, providerModels]) => <div key={provider} className="mb-2" data-unique-id="ed6bd285-2e6f-47ca-ba54-837a117fc437" data-loc="84:83-84:120" data-file-name="components/ModelSwitcher.tsx">
                    <div className="px-2 py-1 text-xs font-semibold text-slate-400 bg-slate-800/80 sticky top-0" data-unique-id="c38398bd-33c5-4f0c-88bc-ad988bd01ba5" data-loc="85:20-85:113" data-file-name="components/ModelSwitcher.tsx">
                      {provider}
                    </div>
                    {providerModels.map(model => <button key={model.id} className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between hover:bg-slate-700 ${selectedModel.id === model.id ? "bg-slate-700/50" : ""}`} onClick={() => handleSelectModel(model)} data-unique-id="92f1e6de-c5f3-48ca-814f-4b279855379e" data-loc="88:49-88:276" data-file-name="components/ModelSwitcher.tsx">
                        <div className="flex items-center" data-unique-id="89d691fd-36eb-4cef-bf1b-61582c35d207" data-loc="89:24-89:59" data-file-name="components/ModelSwitcher.tsx">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${model.provider === "OpenAI" ? "bg-green-900/30 text-green-300" : model.provider === "Anthropic" ? "bg-purple-900/30 text-purple-300" : "bg-blue-900/30 text-blue-300"}`} data-unique-id="dd55dba7-ca6f-46e2-9115-a473a8102171" data-loc="90:26-90:273" data-file-name="components/ModelSwitcher.tsx">
                            {model.provider.charAt(0)}
                          </div>
                          <div data-unique-id="40869ddc-7768-4333-bc8f-75b9fb72f364" data-loc="93:26-93:31" data-file-name="components/ModelSwitcher.tsx">
                            <div className="text-sm" data-unique-id="b50b1a69-13aa-4454-9e04-7ea5232db18f" data-loc="94:28-94:53" data-file-name="components/ModelSwitcher.tsx">{model.name}</div>
                            <div className="text-xs text-slate-400" data-unique-id="27db53c8-5bc2-4951-a807-91b701d11f76" data-loc="95:28-95:68" data-file-name="components/ModelSwitcher.tsx">{model.id}</div>
                          </div>
                        </div>
                        {selectedModel.id === model.id && <Check size={16} className="text-blue-400" />}
                      </button>)}
                  </div>)}
              </div>}
          </div>
        </motion.div>}
    </div>;
};
export default ModelSwitcher;