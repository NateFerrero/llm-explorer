"use client";

import React, { useState, useEffect } from "react";
import ModelSelector from "@/components/ModelSelector";
import KnowledgeExplorer from "@/components/KnowledgeExplorer";
import dynamic from "next/dynamic";
import { useApiStore } from "@/lib/stores/apiStore";
import { getDefaultModel } from "@/lib/models";
import { Loader2 } from "lucide-react";

// Dynamically import the AFrameWrapper component to avoid SSR issues
// Use { ssr: false } to ensure it's only loaded on the client side
const AFrameWrapper = dynamic(() => import("@/components/AFrameWrapper"), {
  ssr: false
});
export default function HomePage() {
  const {
    hasSelectedModel,
    setHasSelectedModel,
    setSelectedModel
  } = useApiStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for stored model selection on component mount
  useEffect(() => {
    const initializeApp = async () => {
      if (typeof window !== 'undefined') {
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
    return <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center" data-unique-id="963b864b-1c6f-487f-aa1a-c13737a73ad9" data-loc="69:11-69:139" data-file-name="app/page.tsx">
        <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
        <p className="text-slate-300" data-unique-id="6e3c9167-b15f-4495-b2ff-0c47949da1c9" data-loc="71:8-71:38" data-file-name="app/page.tsx">Initializing LLM Browser...</p>
      </div>;
  }
  return <AFrameWrapper>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white" data-unique-id="fd386f53-37b8-477f-9656-62ff53d7c2d3" data-loc="75:6-75:92" data-file-name="app/page.tsx">
        <header className="bg-slate-950 py-6 px-8 shadow-lg" data-unique-id="62c2424d-0cf1-44b3-9abd-a0ec42c746e3" data-loc="76:8-76:61" data-file-name="app/page.tsx">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600" data-unique-id="5a962816-3065-4197-8da4-62266de2a07f" data-loc="77:10-77:120" data-file-name="app/page.tsx">
            LLM Browser
          </h1>
          <p className="text-slate-300 mt-1" data-unique-id="079f7286-e1c3-406d-81ae-6dc02d0854bf" data-loc="80:10-80:45" data-file-name="app/page.tsx">
            Dive deep into AI knowledge graphs and explore language models interactively
          </p>
        </header>
        
        <main className="container mx-auto px-4 py-8" data-unique-id="ab086cec-76d3-47b0-9eae-fd794b8a9ea6" data-loc="85:8-85:54" data-file-name="app/page.tsx">
          {!hasSelectedModel ? <ModelSelector onModelSelected={() => setHasSelectedModel(true)} /> : <KnowledgeExplorer />}
        </main>
        
        <footer className="bg-slate-950 py-4 px-8 text-center text-slate-400 text-sm" data-unique-id="d7f71cee-90a8-4326-a186-a2c4341e83c1" data-loc="89:8-89:86" data-file-name="app/page.tsx">
          <p data-unique-id="64f1fab2-1e0a-4172-83b1-d89a5de68869" data-loc="90:10-90:13" data-file-name="app/page.tsx">LLM Browser — Visualize and explore language model knowledge</p>
        </footer>
      </div>
    </AFrameWrapper>;
}