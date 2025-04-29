"use client";

import KnowledgeExplorer from "@/components/KnowledgeExplorer";
import ModelSelector from "@/components/ModelSelector";
import { getDefaultModel } from "@/lib/models";
import { useApiStore } from "@/lib/stores/apiStore";
import { InfoIcon, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import the AFrameWrapper component to avoid SSR issues
// Use { ssr: false } to ensure it's only loaded on the client side
const AFrameWrapper = dynamic(() => import("@/components/AFrameWrapper"), {
  ssr: false,
});
export default function HomePage() {
  const { hasSelectedModel, setHasSelectedModel, setSelectedModel } =
    useApiStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for stored model selection on component mount
  useEffect(() => {
    const initializeApp = async () => {
      if (typeof window !== "undefined") {
        try {
          setIsInitializing(true);

          // Check if user has previously selected a model
          const storedHasSelected = localStorage.getItem("has_selected_model");

          // Try to load stored model from localStorage
          const storedModelJson = localStorage.getItem("selected_model");
          if (storedModelJson) {
            try {
              const storedModel = JSON.parse(storedModelJson);
              setSelectedModel(storedModel);
            } catch (error) {
              console.error("Error parsing stored model:", error);
              // If parsing fails, set default model
              setSelectedModel(getDefaultModel());
            }
          } else {
            // If no stored model, set default model
            setSelectedModel(getDefaultModel());
          }

          // Set hasSelectedModel based on stored value
          if (storedHasSelected === "true") {
            setHasSelectedModel(true);
          }
          setIsLoaded(true);
        } catch (error) {
          console.error("Error initializing app:", error);
          // Set default values in case of error
          setSelectedModel(getDefaultModel());
          setIsLoaded(true);
        } finally {
          setIsInitializing(false);
        }
      }
    };
    initializeApp();
  }, [setHasSelectedModel, setSelectedModel]);
  if (!isLoaded || isInitializing) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white"
        data-unique-id="963b864b-1c6f-487f-aa1a-c13737a73ad9"
        data-loc="69:11-69:139"
        data-file-name="app/page.tsx"
      >
        <Loader2 size={48} className="mb-4 animate-spin text-blue-500" />
        <p
          className="text-slate-300"
          data-unique-id="6e3c9167-b15f-4495-b2ff-0c47949da1c9"
          data-loc="71:8-71:38"
          data-file-name="app/page.tsx"
        >
          Initializing LLM Browser...
        </p>
      </div>
    );
  }
  return (
    <AFrameWrapper>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        {/* Small info badge in bottom right instead of top right */}
        <div className="group absolute bottom-4 right-4 z-10">
          <div className="flex cursor-help items-center gap-1 rounded-full bg-slate-800/80 px-3 py-1 text-xs shadow-lg backdrop-blur-sm">
            <InfoIcon size={12} className="text-blue-400" />
            <span className="font-medium">LLM Browser</span>
          </div>
          {/* Tooltip that appears on hover */}
          <div className="invisible absolute bottom-full right-0 z-20 mb-2 w-64 rounded-lg bg-slate-800/95 p-3 text-xs opacity-0 shadow-xl backdrop-blur-sm transition-all duration-300 group-hover:visible group-hover:opacity-100">
            <h3 className="mb-1 font-bold text-blue-400">LLM Browser</h3>
            <p className="mb-2 text-slate-300">
              Dive deep into AI knowledge graphs and explore language models
              interactively
            </p>
            <p className="text-slate-400">
              Browse and visualize concepts using different AI models to
              generate insightful knowledge maps.
            </p>
          </div>
        </div>

        <main className="flex-1 overflow-hidden">
          {!hasSelectedModel ? (
            <ModelSelector onModelSelected={() => setHasSelectedModel(true)} />
          ) : (
            <KnowledgeExplorer />
          )}
        </main>
      </div>
    </AFrameWrapper>
  );
}
