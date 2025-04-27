"use client";

import React, { useState, useEffect } from "react";
import { useApiStore } from "@/lib/stores/apiStore";
import { AIModel } from "@/lib/types";
import { availableModels, getModelsByProvider, loadAvailableModels, getDefaultModel } from "@/lib/models";
import { motion } from "framer-motion";
import { Check, ChevronDown, Sparkles, Loader2 } from "lucide-react";
interface ModelSelectorProps {
  onModelSelected: () => void;
}
const ModelSelector: React.FC<ModelSelectorProps> = ({
  onModelSelected
}) => {
  const {
    setSelectedModel,
    setHasSelectedModel
  } = useApiStore();
  const [models, setModels] = useState<AIModel[]>(availableModels);
  const [selectedModel, setSelectedModelLocal] = useState<AIModel>(getDefaultModel());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [modelsByProvider, setModelsByProvider] = useState<Record<string, AIModel[]>>(getModelsByProvider());

  // Load available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        const availableModels = await loadAvailableModels();
        console.log("Available models:", availableModels);
        if (availableModels.length === 0) {
          // If no models are found, add default models
          const defaultModels = [{
            id: "azure-gpt-4o",
            name: "GPT-4o",
            provider: "OpenAI",
            description: "OpenAI's most advanced model with broad general knowledge and domain expertise",
            capabilities: ["Knowledge Graph Generation", "Detailed Explanations", "Reasoning"]
          }, {
            id: "claude-bedrock",
            name: "Claude",
            provider: "Anthropic",
            description: "Anthropic's Claude model with strong reasoning and conversation abilities",
            capabilities: ["Knowledge Graph Generation", "Detailed Explanations", "Reasoning"]
          }];
          setModels(defaultModels);

          // Group default models by provider
          const groupedDefaultModels = defaultModels.reduce((acc, model) => {
            if (!acc[model.provider]) {
              acc[model.provider] = [];
            }
            acc[model.provider].push(model);
            return acc;
          }, {} as Record<string, AIModel[]>);
          setModelsByProvider(groupedDefaultModels);
        } else {
          setModels(availableModels);

          // Group models by provider
          const groupedModels = availableModels.reduce((acc, model) => {
            if (!acc[model.provider]) {
              acc[model.provider] = [];
            }
            acc[model.provider].push(model);
            return acc;
          }, {} as Record<string, AIModel[]>);
          setModelsByProvider(groupedModels);
        }

        // Set default model
        const defaultModel = getDefaultModel();
        setSelectedModelLocal(defaultModel);
      } catch (error) {
        console.error("Error loading models:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModels();
  }, []);
  const handleSelectModel = (model: AIModel) => {
    setSelectedModelLocal(model);
    setIsDropdownOpen(false);
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
  return <div className="max-w-2xl mx-auto" data-unique-id="9cb78da0-1a01-4154-93e9-b88515f56e8a" data-loc="101:9-101:44" data-file-name="components/ModelSelector.tsx">
      <div className="bg-slate-800 rounded-lg p-8 shadow-xl" data-unique-id="8e6c5a20-24d1-4401-abf7-d15bc27fd01c" data-loc="102:6-102:61" data-file-name="components/ModelSelector.tsx">
        <div className="flex items-center gap-3 mb-6" data-unique-id="f6ea043a-3c97-4064-9a10-ed6c208d2b86" data-loc="103:8-103:54" data-file-name="components/ModelSelector.tsx">
          <div className="bg-blue-600 p-3 rounded-full" data-unique-id="c5f9de60-6e2c-45d3-9e4e-da8c67aa458b" data-loc="104:10-104:56" data-file-name="components/ModelSelector.tsx">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl font-bold" data-unique-id="90e495f4-f473-47c6-a871-3599bbaf3663" data-loc="107:10-107:45" data-file-name="components/ModelSelector.tsx">Select AI Model</h2>
        </div>
        
        <p className="mb-6 text-slate-300" data-unique-id="e43ebc57-0ed8-4d2b-a1c1-68310f82ac3e" data-loc="110:8-110:43" data-file-name="components/ModelSelector.tsx">
          Choose an AI model to power your knowledge exploration. Different models have different capabilities and specialties.
        </p>
        
        {isLoading ? <div className="flex flex-col items-center justify-center py-12" data-unique-id="4be238f5-af68-434b-8a0c-bcbdeeca315b" data-loc="114:21-114:86" data-file-name="components/ModelSelector.tsx">
            <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
            <p className="text-slate-300" data-unique-id="081bfce1-23a0-4119-8548-cc425d6f3cf9" data-loc="116:12-116:42" data-file-name="components/ModelSelector.tsx">Loading available models...</p>
          </div> : <div className="space-y-6" data-unique-id="e6839970-1242-42fd-b30c-15827fb857fc" data-loc="117:19-117:46" data-file-name="components/ModelSelector.tsx">
            <div data-unique-id="2c685235-6618-4466-a247-dd0ce3659280" data-loc="118:12-118:17" data-file-name="components/ModelSelector.tsx">
              <label htmlFor="modelSelect" className="block text-sm font-medium mb-2 text-slate-300" data-unique-id="353d333f-82bb-48d4-9b3d-ef1a0d96f361" data-loc="119:14-119:101" data-file-name="components/ModelSelector.tsx">
                Available Models
              </label>
              
              <div className="relative" data-unique-id="8f10d05f-ad17-48e8-984a-4555d34c4846" data-loc="123:14-123:40" data-file-name="components/ModelSelector.tsx">
                <button type="button" className="w-full flex items-center justify-between bg-slate-700 border border-slate-600 rounded-md px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => setIsDropdownOpen(!isDropdownOpen)} data-unique-id="512ed5fe-3352-4c21-8911-057f3320f2c7" data-loc="124:16-124:262" data-file-name="components/ModelSelector.tsx">
                  <div className="flex items-center" data-unique-id="b786e4c4-2e43-4c97-b9ff-6bdd2deffe5f" data-loc="125:18-125:53" data-file-name="components/ModelSelector.tsx">
                    <div className="mr-3" data-unique-id="c5595ed4-676d-4251-8dd8-cd28f8130fc1" data-loc="126:20-126:42" data-file-name="components/ModelSelector.tsx">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedModel.provider === "OpenAI" ? "bg-green-900/30 text-green-300" : selectedModel.provider === "Anthropic" ? "bg-purple-900/30 text-purple-300" : "bg-blue-900/30 text-blue-300"}`} data-unique-id="3f7b5142-757e-44f4-b9f2-6ba7afb9d506" data-loc="127:22-127:280" data-file-name="components/ModelSelector.tsx">
                        {selectedModel.provider.charAt(0)}
                      </div>
                    </div>
                    <div data-unique-id="75d53ab8-1620-43dd-ab08-ed1beb3f40be" data-loc="131:20-131:25" data-file-name="components/ModelSelector.tsx">
                      <div className="font-medium" data-unique-id="9635842d-dfdc-4964-b896-2343684ad0bc" data-loc="132:22-132:51" data-file-name="components/ModelSelector.tsx">{selectedModel.name}</div>
                      <div className="text-xs text-slate-400" data-unique-id="babfd27b-2a77-4a7e-973f-f2e13be4743a" data-loc="133:22-133:62" data-file-name="components/ModelSelector.tsx">{selectedModel.provider}</div>
                    </div>
                  </div>
                  <ChevronDown size={20} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                {isDropdownOpen && <motion.div initial={{
              opacity: 0,
              y: -10
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: -10
            }} className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg max-h-72 overflow-auto" data-unique-id="af873d28-c486-41b2-b5cb-69f5e0f9d673" data-loc="139:35-148:134" data-file-name="components/ModelSelector.tsx">
                    <div className="py-1" data-unique-id="76f0c9fe-8487-415d-b9c7-b7c3e022b052" data-loc="149:20-149:42" data-file-name="components/ModelSelector.tsx">
                      <div className="px-3 py-1 text-xs font-semibold text-slate-400 bg-slate-800/80 sticky top-0 flex justify-between" data-unique-id="29524888-d7a6-4b84-bf85-41390b77c07a" data-loc="150:22-150:136" data-file-name="components/ModelSelector.tsx">
                        <span data-unique-id="b07f0a89-a5e5-4634-b06b-fb1dd8a05e07" data-loc="151:24-151:30" data-file-name="components/ModelSelector.tsx">Available Models</span>
                        <span className="text-slate-500" data-unique-id="6cc5ea75-61ce-4338-b2ac-26e5d5d09eba" data-loc="152:24-152:57" data-file-name="components/ModelSelector.tsx">{models.length} total</span>
                      </div>
                      
                      {Object.entries(modelsByProvider).map(([provider, providerModels]) => <div key={provider} data-unique-id="d633e08b-20f9-4824-8705-2f019ff60f33" data-loc="155:92-155:112" data-file-name="components/ModelSelector.tsx">
                          <div className="px-3 py-1 text-xs font-semibold text-slate-400 bg-slate-800/80 sticky top-6" data-unique-id="04921c48-939f-4218-b919-3374dc598a69" data-loc="156:26-156:119" data-file-name="components/ModelSelector.tsx">
                            {provider}
                          </div>
                          {providerModels.map(model => <button key={model.id} className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-700 ${selectedModel.id === model.id ? "bg-slate-700/50" : ""}`} onClick={() => handleSelectModel(model)} data-unique-id="25081671-a390-4c90-a1b6-8596fdb65d93" data-loc="159:55-159:271" data-file-name="components/ModelSelector.tsx">
                              <div className="flex items-center" data-unique-id="59707ec7-12b9-42d9-97fa-2a394ec898d2" data-loc="160:30-160:65" data-file-name="components/ModelSelector.tsx">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${model.provider === "OpenAI" ? "bg-green-900/30 text-green-300" : model.provider === "Anthropic" ? "bg-purple-900/30 text-purple-300" : "bg-blue-900/30 text-blue-300"}`} data-unique-id="3bece3cf-a80e-45ef-bf09-7a263a7b085b" data-loc="161:32-161:279" data-file-name="components/ModelSelector.tsx">
                                  {model.provider.charAt(0)}
                                </div>
                                <div data-unique-id="eca48925-0f31-4b1c-8b14-f7d9ecc6efbe" data-loc="164:32-164:37" data-file-name="components/ModelSelector.tsx">
                                  <div data-unique-id="a880d518-50d8-402f-a066-eae78c2e21d1" data-loc="165:34-165:39" data-file-name="components/ModelSelector.tsx">{model.name}</div>
                                  <div className="text-xs text-slate-400" data-unique-id="7e668623-9660-44bc-be93-99b70b7b7fb5" data-loc="166:34-166:74" data-file-name="components/ModelSelector.tsx">{model.id}</div>
                                </div>
                              </div>
                              {selectedModel.id === model.id && <Check size={16} className="text-blue-400" />}
                            </button>)}
                        </div>)}
                    </div>
                  </motion.div>}
              </div>
              
              <div className="mt-4" data-unique-id="3cb6e3a2-539d-4e5a-b98a-9beff491d25a" data-loc="176:14-176:36" data-file-name="components/ModelSelector.tsx">
                <div className="bg-slate-700/50 rounded-md p-4" data-unique-id="2b58a11d-4e1b-45b8-b496-e5db9967da05" data-loc="177:16-177:64" data-file-name="components/ModelSelector.tsx">
                  <h3 className="font-medium mb-2" data-unique-id="3993b427-0d10-4151-b7ef-ef195d933342" data-loc="178:18-178:51" data-file-name="components/ModelSelector.tsx">{selectedModel.name}</h3>
                  <p className="text-sm text-slate-300 mb-3" data-unique-id="76b1772e-3e66-4ddf-9395-234799f99135" data-loc="179:18-179:61" data-file-name="components/ModelSelector.tsx">{selectedModel.description}</p>
                  <div className="flex flex-wrap gap-2" data-unique-id="8579fac9-d402-4131-8cb1-c7b7c016cb6d" data-loc="180:18-180:56" data-file-name="components/ModelSelector.tsx">
                    {selectedModel.capabilities.map((capability, index) => <span key={index} className="px-2 py-1 bg-slate-600/50 text-blue-300 text-xs rounded-full" data-unique-id="d182762a-5d86-4349-93c7-300eaec71e90" data-loc="181:75-181:166" data-file-name="components/ModelSelector.tsx">
                        {capability}
                      </span>)}
                  </div>
                </div>
              </div>
            </div>
            
            <button onClick={handleContinue} className="w-full py-2 px-4 rounded-md font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white" data-unique-id="08fe58cf-bbc3-4b3e-8a5d-63c67df7efa6" data-loc="189:12-189:156" data-file-name="components/ModelSelector.tsx">
              Continue with {selectedModel.name}
            </button>
            
            <p className="text-xs text-slate-400 text-center mt-4" data-unique-id="7517dd2b-d073-49ab-abf7-2ad2acd1b439" data-loc="193:12-193:67" data-file-name="components/ModelSelector.tsx">
              You can change the AI model later in the settings.
            </p>
          </div>}
      </div>
    </div>;
};
export default ModelSelector;