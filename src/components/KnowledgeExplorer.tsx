"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useApiStore } from "@/lib/stores/apiStore";
import { GraphData, NodeObject, LinkObject } from "@/lib/types";
import { generateKnowledgeGraph } from "@/lib/graphGenerator";
import { generateNodeContent } from "@/lib/api-clients";
import SummaryPanel from "@/components/SummaryPanel";
import { Search, Sliders, RefreshCw, ZoomIn, ZoomOut, HelpCircle, Move, Maximize, Minimize, Focus, Hand, MousePointer, Lock, Unlock, Keyboard } from "lucide-react";
import NodeDetail from "./NodeDetail";
import KeyboardShortcuts from "./KeyboardShortcuts";
import ModelSwitcher from "./ModelSwitcher";
import { useAFrame } from "./AFrameWrapper";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph').then(mod => mod.ForceGraph2D), {
  ssr: false
});
const KnowledgeExplorer: React.FC = () => {
  // Get A-Frame context and handle loading state
  const {
    isAFrameLoaded,
    aframeInstance
  } = useAFrame();

  // Log when A-Frame is loaded to help with debugging
  useEffect(() => {
    if (isAFrameLoaded && aframeInstance) {
      console.log("A-Frame is loaded and ready to use in KnowledgeExplorer");
    }
  }, [isAFrameLoaded, aframeInstance]);
  const {
    selectedModel,
    providerType
  } = useApiStore();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: []
  });
  const [selectedNode, setSelectedNode] = useState<NodeObject | null>(null);
  const [summaryText, setSummaryText] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [interactionMode, setInteractionMode] = useState<"select" | "pan">("select");
  const [isGraphLocked, setIsGraphLocked] = useState<boolean>(false);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [centerFocusedNode, setCenterFocusedNode] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState<boolean>(false);
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate initial graph data
  useEffect(() => {
    // For demo purposes, start with a sample concept if no search query
    if (graphData.nodes.length === 0) {
      handleSearch("artificial intelligence");
    }
  }, []);
  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setSelectedNode(null);
    setSummaryText("");
    try {
      const result = await generateKnowledgeGraph(query, selectedModel.id);
      setGraphData(result);
      setSearchQuery(query);
    } catch (err) {
      console.error("Error generating knowledge graph:", err);
      setError("Failed to generate knowledge graph. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleNodeClick = useCallback(async (node: any) => {
    // Cast the node to our NodeObject type
    const nodeObj = node as NodeObject;

    // If in pan mode, don't select the node
    if (interactionMode === "pan") return;
    setSelectedNode(nodeObj);
    setSummaryLoading(true);

    // Highlight the selected node and its connections
    const newHighlightNodes = new Set<string>();
    newHighlightNodes.add(nodeObj.id);

    // Add connected nodes to highlights
    if (nodeObj.connections) {
      nodeObj.connections.forEach(connId => {
        newHighlightNodes.add(connId);
      });
    }

    // Find links where this node is source or target
    graphData.links.forEach(link => {
      if (link.source && (link.source === nodeObj.id || typeof link.source === 'object' && link.source && 'id' in link.source && (link.source as {
        id: string;
      }).id === nodeObj.id)) {
        const targetId = link.target ? typeof link.target === 'object' ? link.target && 'id' in link.target ? (link.target as {
          id: string;
        }).id : '' : link.target : '';
        if (targetId) newHighlightNodes.add(targetId);
      }
      if (link.target && (link.target === nodeObj.id || typeof link.target === 'object' && link.target && 'id' in link.target && (link.target as {
        id: string;
      }).id === nodeObj.id)) {
        const sourceId = link.source ? typeof link.source === 'object' ? link.source && 'id' in link.source ? (link.source as {
          id: string;
        }).id : '' : link.source : '';
        if (sourceId) newHighlightNodes.add(sourceId);
      }
    });
    setHighlightNodes(newHighlightNodes);

    // Center on the node if centerFocusedNode is true
    if (centerFocusedNode && graphRef.current) {
      const distance = 40;
      const distRatio = 1 + distance / Math.hypot(nodeObj.x || 0, nodeObj.y || 0);
      if (nodeObj.x !== undefined && nodeObj.y !== undefined) {
        graphRef.current.centerAt(nodeObj.x, nodeObj.y, 1000);
        graphRef.current.zoom(zoomLevel * 1.5, 1000);
      }
    }
    try {
      console.log(`Generating content using model: ${selectedModel.name} (${selectedModel.id})`);

      // Generate content using the selected model
      let content;
      try {
        content = await generateNodeContent(nodeObj, searchQuery, selectedModel.id);
      } catch (apiError) {
        console.error("API route error:", apiError);

        // Check if the error message is from the API response
        if (typeof apiError === 'string') {
          const errorMessage = `Failed to generate content for ${nodeObj.name || nodeObj.id}. ${apiError}`;
          setSummaryText(errorMessage);
          setSummaryLoading(false);
          return;
        }

        // Fallback to a mock content generation if the API fails
        content = generateFallbackContent(nodeObj, searchQuery);
      }
      setSummaryText(content);
      setSummaryLoading(false);
    } catch (err) {
      console.error("Error fetching node summary:", err);

      // Create a more informative error message that includes the model name
      setSummaryText(`Failed to generate content for ${nodeObj.name || nodeObj.id} using ${selectedModel.name}. Please try again later.`);
      setSummaryLoading(false);
    }
  }, [interactionMode, graphData.links, centerFocusedNode, zoomLevel, searchQuery, selectedModel]);

  // Fallback content generator when API calls fail
  const generateFallbackContent = (node: NodeObject, mainConcept: string): string => {
    const nodeName = node.name || node.id;
    const description = node.description || `A concept related to ${mainConcept}`;
    return `# ${nodeName}

${description}

## Overview
${nodeName} is an important concept in the field of ${mainConcept}. It represents a significant area of study and application that has evolved over time through research and practical implementation.

## Key Aspects
- ${nodeName} contributes to the broader understanding of ${mainConcept}
- It has distinctive characteristics that set it apart from related concepts
- Researchers and practitioners in this field have developed various methodologies and frameworks

## Applications
The practical applications of ${nodeName} span across multiple domains, including technology, science, and business. Its versatility makes it a valuable concept to understand and implement.

## Current Developments
Recent advancements in ${nodeName} have opened new possibilities for innovation and problem-solving. Ongoing research continues to expand our understanding of this important concept.

*Note: This is generated fallback content. For more detailed information, please try again later when the AI service is available.*`;
  };
  const handleZoom = (direction: "in" | "out") => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      const newZoom = direction === "in" ? currentZoom * 1.5 : currentZoom / 1.5;
      graphRef.current.zoom(newZoom, 400);
      setZoomLevel(newZoom);
    }
  };
  const resetZoom = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 30); // 400ms transition, 30px padding
      setZoomLevel(1);
    }
  };
  const centerGraph = () => {
    if (graphRef.current) {
      graphRef.current.centerAt(0, 0, 800);
      graphRef.current.zoom(1, 800);
      setZoomLevel(1);
    }
  };
  const toggleInteractionMode = () => {
    setInteractionMode(prev => prev === "select" ? "pan" : "select");
  };
  const toggleGraphLock = () => {
    setIsGraphLocked(prev => !prev);
  };
  const toggleCenterFocus = () => {
    setCenterFocusedNode(prev => !prev);
  };

  // Handle node hover
  const handleNodeHover = (node: any) => {
    setHoverNode(node ? node.id : null);
  };

  // Toggle help tooltip
  const toggleHelp = () => {
    setShowHelp(prev => !prev);
    setShowKeyboardShortcuts(false);
  };

  // Toggle keyboard shortcuts
  const toggleKeyboardShortcuts = () => {
    setShowKeyboardShortcuts(prev => !prev);
    setShowHelp(false);
  };

  // Add keyboard shortcuts component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowHelp(false);
        setShowKeyboardShortcuts(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  return <div className="flex flex-col h-[calc(100vh-12rem)]" data-unique-id="11f1c3d3-90c0-45b4-bb10-2659a93b04b7" data-loc="248:9-248:62" data-file-name="components/KnowledgeExplorer.tsx">
      {/* Keyboard shortcuts handler */}
      <KeyboardShortcuts onZoomIn={() => handleZoom("in")} onZoomOut={() => handleZoom("out")} onReset={resetZoom} onToggleMode={toggleInteractionMode} onToggleLock={toggleGraphLock} onToggleHelp={toggleHelp} />
      {/* Search and Controls */}
      <div className="mb-4 flex flex-col md:flex-row gap-4" data-unique-id="ac1f9b89-dcb6-4c95-9dc5-215d1657b372" data-loc="252:6-252:60" data-file-name="components/KnowledgeExplorer.tsx">
        <div className="flex-grow relative" data-unique-id="9d13a953-e4e9-41af-a4f8-587b9aed314a" data-loc="253:8-253:44" data-file-name="components/KnowledgeExplorer.tsx">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" data-unique-id="000e2de2-46ec-40bd-8956-8e477c647fe5" data-loc="254:10-254:96" data-file-name="components/KnowledgeExplorer.tsx">
            <Search size={18} className="text-slate-400" />
          </div>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Enter a concept to explore (e.g., quantum physics, machine learning)" className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" onKeyDown={e => e.key === "Enter" && handleSearch()} data-unique-id="15b21fb2-6c37-4e03-9f6d-9ea5794dcbc0" data-loc="257:10-257:369" data-file-name="components/KnowledgeExplorer.tsx" />
        </div>
        <div className="flex gap-2" data-unique-id="106f28cf-ad44-42a9-8189-ff80b2e34d31" data-loc="259:8-259:36" data-file-name="components/KnowledgeExplorer.tsx">
          <button onClick={() => handleSearch()} disabled={isLoading || !searchQuery.trim()} className={`px-5 py-2 rounded-md font-medium transition-colors ${isLoading || !searchQuery.trim() ? "bg-slate-600 text-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`} data-unique-id="f802f1f6-ff15-4e1b-8c74-9c6f73655db3" data-loc="260:10-260:290" data-file-name="components/KnowledgeExplorer.tsx">
            {isLoading ? "Loading..." : "Explore"}
          </button>
          
          {/* Provider indicator */}
          <div className={`flex items-center px-3 py-1 rounded-md border ${providerType === "openai" ? "bg-blue-900/20 border-blue-700/50 text-blue-300" : providerType === "anthropic" ? "bg-purple-900/20 border-purple-700/50 text-purple-300" : "bg-green-900/20 border-green-700/50 text-green-300"}`} data-unique-id="32c622b4-57dc-4e4a-82db-1339213a3c42" data-loc="265:10-265:300" data-file-name="components/KnowledgeExplorer.tsx">
            <span className="text-sm font-medium" data-unique-id="ce7f6276-8a2f-41a8-be4a-fd4b48184d0e" data-loc="266:12-266:50" data-file-name="components/KnowledgeExplorer.tsx">
              {providerType === "openai" ? "OpenAI" : providerType === "anthropic" ? "Claude" : "Gemini"}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2" data-unique-id="da6ca14f-e04c-41ea-9227-c896c9b91be0" data-loc="272:8-272:46" data-file-name="components/KnowledgeExplorer.tsx">
          {/* Graph Controls Toolbar */}
          <div className="flex bg-slate-800 rounded-lg p-1 shadow-lg" data-unique-id="e9db3201-7d90-4166-a919-b001c0508da5" data-loc="274:10-274:70" data-file-name="components/KnowledgeExplorer.tsx">
            {/* Zoom Controls */}
            <div className="flex border-r border-slate-600 pr-1" data-unique-id="620501d4-f787-476b-82c9-d11a9231b33b" data-loc="276:12-276:65" data-file-name="components/KnowledgeExplorer.tsx">
              <motion.button whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.95
            }} onClick={() => handleZoom("in")} className="p-2 rounded-md hover:bg-slate-700 transition-colors" title="Zoom In" data-unique-id="a3f95690-8571-46b8-9ccb-bb864a7485fe" data-loc="277:14-281:128" data-file-name="components/KnowledgeExplorer.tsx">
                <ZoomIn size={20} />
              </motion.button>
              <motion.button whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.95
            }} onClick={() => handleZoom("out")} className="p-2 rounded-md hover:bg-slate-700 transition-colors" title="Zoom Out" data-unique-id="7fea930e-0884-4804-a7a9-1f6e6b990f12" data-loc="284:14-288:130" data-file-name="components/KnowledgeExplorer.tsx">
                <ZoomOut size={20} />
              </motion.button>
            </div>
            
            {/* Navigation Controls */}
            <div className="flex border-r border-slate-600 px-1" data-unique-id="ff1edced-2cf7-453f-925a-7cd47f937a67" data-loc="294:12-294:65" data-file-name="components/KnowledgeExplorer.tsx">
              <motion.button whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.95
            }} onClick={resetZoom} className="p-2 rounded-md hover:bg-slate-700 transition-colors" title="Fit Graph to View" data-unique-id="eac5485b-c53d-4e66-9f05-797ceb57d3db" data-loc="295:14-299:125" data-file-name="components/KnowledgeExplorer.tsx">
                <Maximize size={20} />
              </motion.button>
              <motion.button whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.95
            }} onClick={centerGraph} className="p-2 rounded-md hover:bg-slate-700 transition-colors" title="Center Graph" data-unique-id="8d8b1fe5-f032-4c1b-b095-8ba69eab013f" data-loc="302:14-306:122" data-file-name="components/KnowledgeExplorer.tsx">
                <Focus size={20} />
              </motion.button>
            </div>
            
            {/* Interaction Mode Controls */}
            <div className="flex border-r border-slate-600 px-1" data-unique-id="f4480896-5209-4760-91a3-0d69e7454144" data-loc="312:12-312:65" data-file-name="components/KnowledgeExplorer.tsx">
              <motion.button whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.95
            }} onClick={toggleInteractionMode} className={`p-2 rounded-md transition-colors ${interactionMode === "select" ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-slate-700"}`} title={interactionMode === "select" ? "Selection Mode (Click to switch to Pan Mode)" : "Pan Mode (Click to switch to Selection Mode)"} data-unique-id="f22a41ee-389c-46e6-be7e-519863328a9a" data-loc="313:14-317:318" data-file-name="components/KnowledgeExplorer.tsx">
                {interactionMode === "select" ? <MousePointer size={20} /> : <Hand size={20} />}
              </motion.button>
              <motion.button whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.95
            }} onClick={toggleGraphLock} className={`p-2 rounded-md transition-colors ${isGraphLocked ? "bg-amber-600 hover:bg-amber-700" : "hover:bg-slate-700"}`} title={isGraphLocked ? "Unlock Graph" : "Lock Graph"} data-unique-id="3d31d532-c447-4bed-bedc-a8a90ea22c09" data-loc="320:14-324:218" data-file-name="components/KnowledgeExplorer.tsx">
                {isGraphLocked ? <Lock size={20} /> : <Unlock size={20} />}
              </motion.button>
            </div>
            
            {/* Focus Controls */}
            <div className="flex pl-1" data-unique-id="552901d6-b614-44d6-bbf2-7cb1a0a5973b" data-loc="330:12-330:39" data-file-name="components/KnowledgeExplorer.tsx">
              <motion.button whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.95
            }} onClick={toggleCenterFocus} className={`p-2 rounded-md transition-colors ${centerFocusedNode ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-slate-700"}`} title={centerFocusedNode ? "Auto-center on selection enabled" : "Auto-center on selection disabled"} data-unique-id="a6fb0152-2ab5-4250-b0ad-9419a05086f8" data-loc="331:14-335:273" data-file-name="components/KnowledgeExplorer.tsx">
                <Focus size={20} />
              </motion.button>
              <motion.button whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.95
            }} className="p-2 rounded-md hover:bg-slate-700 transition-colors" title="Help" data-unique-id="4e9b3b76-8b91-4bc9-b380-bbb071d4801d" data-loc="338:14-342:92" data-file-name="components/KnowledgeExplorer.tsx">
                <HelpCircle size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200" data-unique-id="9ff200e6-1ce7-42ad-8311-105d66cda70f" data-loc="351:16-351:102" data-file-name="components/KnowledgeExplorer.tsx">
          {error}
        </div>}
      
      {/* Main content area */}
      <div className="flex flex-1 gap-4 h-full min-h-[500px]" data-unique-id="9b8c72e6-7cb6-44e7-b60c-9b55d86fe51e" data-loc="356:6-356:62" data-file-name="components/KnowledgeExplorer.tsx">
        {/* Graph visualization */}
        <div className="flex-grow bg-slate-850 rounded-lg overflow-hidden relative" ref={containerRef} data-unique-id="5a5ac78c-beaf-4133-bd2f-63b4bab6025a" data-loc="358:8-358:103" data-file-name="components/KnowledgeExplorer.tsx">
          {/* Graph interaction mode indicator */}
          <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-lg" data-unique-id="0a6532c5-7d29-47dd-9146-df29db6ed7f7" data-loc="360:10-360:154" data-file-name="components/KnowledgeExplorer.tsx">
            {interactionMode === "select" ? <>
                <MousePointer size={16} className="text-blue-400" />
                <span data-unique-id="35ecc474-7fc5-4249-a80f-af36f27232a0" data-loc="363:16-363:22" data-file-name="components/KnowledgeExplorer.tsx">Selection Mode</span>
              </> : <>
                <Hand size={16} className="text-green-400" />
                <span data-unique-id="b8f52689-dea3-4b6e-973e-211e7b1f3c6c" data-loc="366:16-366:22" data-file-name="components/KnowledgeExplorer.tsx">Pan Mode</span>
              </>}
          </div>
          
          {/* Graph lock indicator */}
          {isGraphLocked && <div className="absolute top-4 right-4 z-10 bg-amber-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-lg" data-unique-id="238dd421-bf80-4db5-b2fa-96d5c1859ad6" data-loc="371:28-371:173" data-file-name="components/KnowledgeExplorer.tsx">
              <Lock size={16} className="text-amber-400" />
              <span data-unique-id="8da885de-9012-4be0-8adf-55a23dfaf7c1" data-loc="373:14-373:20" data-file-name="components/KnowledgeExplorer.tsx">Graph Locked</span>
            </div>}
          {isLoading ? <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10" data-unique-id="2b624dd2-1ce9-4c82-913a-850b1a7c1317" data-loc="375:23-375:111" data-file-name="components/KnowledgeExplorer.tsx">
              <div className="flex flex-col items-center" data-unique-id="b2e2bfc1-131a-4390-98b9-cf62e116aa7b" data-loc="376:14-376:58" data-file-name="components/KnowledgeExplorer.tsx">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" data-unique-id="aa127d0d-a8d9-4f1f-a312-df4e7157e69a" data-loc="377:16-377:101" data-file-name="components/KnowledgeExplorer.tsx"></div>
                <p className="text-slate-300" data-unique-id="7f151f11-f809-4798-b3b8-2305c01b1f55" data-loc="378:16-378:46" data-file-name="components/KnowledgeExplorer.tsx">Generating knowledge graph...</p>
              </div>
            </div> : graphData.nodes.length === 0 ? <div className="absolute inset-0 flex items-center justify-center" data-unique-id="aa472b2f-9668-4fb8-ae03-a099aacdf6db" data-loc="380:52-380:119" data-file-name="components/KnowledgeExplorer.tsx">
                <div className="text-center text-slate-400" data-unique-id="a9e7276a-768b-4174-901e-0d199cccd08b" data-loc="381:16-381:60" data-file-name="components/KnowledgeExplorer.tsx">
                  <HelpCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p data-unique-id="006f1076-cb18-49c5-a90c-af1a527acca0" data-loc="383:18-383:21" data-file-name="components/KnowledgeExplorer.tsx">Enter a concept above to start exploring</p>
                </div>
              </div> : <ForceGraph2D ref={graphRef} graphData={graphData} nodeLabel={(node: any) => node.name || node.id} nodeColor={(node: any) => {
          if (selectedNode && node.id === selectedNode.id) return "#ff6b6b"; // Selected node
          if (hoverNode === node.id) return "#feca57"; // Hovered node
          if (highlightNodes.has(node.id)) return "#54a0ff"; // Connected node
          return node.color || "#1e88e5"; // Default color
        }} linkColor={(link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          if (selectedNode && (sourceId === selectedNode.id || targetId === selectedNode.id)) {
            return "#ff9ff3"; // Links connected to selected node
          }
          return "#ffffff30"; // Default link color
        }} nodeRelSize={8} linkWidth={link => {
          const sourceId = typeof link.source === 'object' ? link.source?.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target?.id : link.target;
          if (selectedNode && (sourceId === selectedNode.id || targetId === selectedNode.id)) {
            return 2; // Thicker links for selected node
          }
          return 1; // Default link width
        }} linkDirectionalParticles={link => {
          const sourceId = typeof link.source === 'object' ? link.source?.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target?.id : link.target;
          if (selectedNode && (sourceId === selectedNode.id || targetId === selectedNode.id)) {
            return 4; // More particles for selected node links
          }
          return 2; // Default particles
        }} linkDirectionalParticleWidth={2} onNodeClick={handleNodeClick} onNodeHover={handleNodeHover} width={containerRef.current?.clientWidth || 800} height={containerRef.current?.clientHeight || 600} cooldownTicks={100} cooldownTime={2000} backgroundColor="#1e293b" enableNodeDrag={!isGraphLocked} enableZoomInteraction={true} enablePanInteraction={true} nodeCanvasObjectMode={() => "after"} nodeCanvasObject={(node, ctx, globalScale) => {
          // Add a highlight effect for selected nodes
          if (selectedNode && node.id === selectedNode.id) {
            const size = 8;
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, size + 2, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(255, 107, 107, 0.2)";
            ctx.fill();
          }

          // Display node name on hover
          if (hoverNode === node.id) {
            const label = node.name || node.id;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';

            // Draw background for text
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth + 10, fontSize + 4].map(n => n / globalScale);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect((node.x || 0) - bckgDimensions[0] / 2, (node.y || 0) - bckgDimensions[1] / 2 - 10 / globalScale, bckgDimensions[0], bckgDimensions[1]);

            // Draw text
            ctx.fillStyle = 'white';
            ctx.fillText(label, node.x || 0, (node.y || 0) - 10 / globalScale);
          }
        }} onEngineStop={() => {
          // When the graph stabilizes, we can perform additional operations
          if (isGraphLocked && graphRef.current) {
            // Freeze the nodes in place when locked
            graphData.nodes.forEach((node: any) => {
              node.fx = node.x;
              node.fy = node.y;
            });
          } else {
            // Unfreeze nodes when unlocked
            graphData.nodes.forEach((node: any) => {
              node.fx = undefined;
              node.fy = undefined;
            });
          }
        }} />}
        </div>
        
        {/* Right sidebar - Node details and summary */}
        <div className="w-80 bg-slate-800 rounded-lg p-4 overflow-y-auto" data-unique-id="c8536d1b-261b-4513-805d-ee4b4539d02e" data-loc="459:8-459:74" data-file-name="components/KnowledgeExplorer.tsx">
          {selectedNode ? <NodeDetail node={selectedNode} summary={summaryText} isLoading={summaryLoading} onFocusNode={nodeId => {
          // Find the node in the graph data
          const node = graphData.nodes.find(n => n.id === nodeId);
          if (node) {
            handleNodeClick(node);
          }
        }} /> : <div className="text-center text-slate-400 h-full flex flex-col items-center justify-center" data-unique-id="2c7f69c7-e5fc-4fff-bfbd-2893a55dab0b" data-loc="466:16-466:109" data-file-name="components/KnowledgeExplorer.tsx">
              <div className="mb-4 p-3 rounded-full bg-slate-700" data-unique-id="e11d3d3d-de56-49f3-b404-7cca75988252" data-loc="467:14-467:66" data-file-name="components/KnowledgeExplorer.tsx">
                <HelpCircle size={28} className="text-slate-400" />
              </div>
              <p className="mb-2" data-unique-id="98322f57-19b5-47b2-89cf-0fbb2c5b369d" data-loc="470:14-470:34" data-file-name="components/KnowledgeExplorer.tsx">Click on a node in the graph to see details</p>
              <p className="text-sm" data-unique-id="00b69def-c089-4845-ae58-f45484be69e3" data-loc="471:14-471:37" data-file-name="components/KnowledgeExplorer.tsx">Explore the knowledge graph by clicking on different concepts</p>
            </div>}
        </div>
      </div>
    </div>;
};
export default KnowledgeExplorer;