"use client";

import { generateNodeContent } from "@/lib/api-clients";
import { generateKnowledgeGraph } from "@/lib/graphGenerator";
import {
  addToSearchHistory as addToSearchHistoryDB,
  cacheArticle,
  cacheKnowledgeGraph,
  getAllBookmarks,
  getAllGraphLogs,
  getAllSearchHistory,
  getCachedKnowledgeGraph,
  GraphLog,
  logGraphAccess,
  removeFromSearchHistory as removeFromSearchHistoryDB,
  SearchHistoryItem,
  updateGraphBookmarkCount,
} from "@/lib/indexeddb";
import { useApiStore } from "@/lib/stores/apiStore";
import { GraphData, NodeObject } from "@/lib/types";
import { motion } from "framer-motion";
import {
  Bookmark,
  ChevronDown,
  Focus,
  GrapeIcon,
  Hand,
  HelpCircle,
  History,
  Link,
  Lock,
  LogOut,
  Maximize,
  MousePointer,
  RefreshCw,
  Search,
  Share2,
  Unlock,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAFrame } from "./AFrameWrapper";
import KeyboardShortcuts from "./KeyboardShortcuts";
import ModelSwitcher from "./ModelSwitcher";
import NodeDetail from "./NodeDetail";

// Default sidebar width
const DEFAULT_SIDEBAR_WIDTH = 320; // 20rem = 320px
// Local storage key for sidebar width
const SIDEBAR_WIDTH_KEY = "knowledge-explorer-sidebar-width";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(
  () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
  {
    ssr: false,
  },
);

const KnowledgeExplorer: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get A-Frame context and handle loading state
  const { isAFrameLoaded, aframeInstance } = useAFrame();
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Load sidebar width from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      if (savedWidth) {
        setSidebarWidth(parseInt(savedWidth, 10));
      }
    }
  }, []);

  // Log when A-Frame is loaded to help with debugging
  useEffect(() => {
    if (isAFrameLoaded && aframeInstance) {
      console.log("A-Frame is loaded and ready to use in KnowledgeExplorer");
    }
  }, [isAFrameLoaded, aframeInstance]);
  const { selectedModel, providerType, setHasSelectedModel } = useApiStore();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>(""); // New state for input field
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [selectedNode, setSelectedNode] = useState<NodeObject | null>(null);
  const [summaryText, setSummaryText] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [detailLevel, setDetailLevel] = useState<number>(1);
  const [interactionMode, setInteractionMode] = useState<"select" | "pan">(
    "select",
  );
  const [isGraphLocked, setIsGraphLocked] = useState<boolean>(false);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [centerFocusedNode, setCenterFocusedNode] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] =
    useState<boolean>(false);
  const [expansionLevel, setExpansionLevel] = useState<number>(0);
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [modelSwitcherOpen, setModelSwitcherOpen] = useState(false);
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  const ForceGraph = useRef<any>(null);
  const [activeTab, setActiveTab] = useState<"explore" | "bookmarks" | "log">(
    () => {
      // Check URL parameter for initial tab if running in browser
      if (typeof window !== "undefined") {
        const tabParam = searchParams.get("explorerTab");
        if (
          tabParam === "explore" ||
          tabParam === "bookmarks" ||
          tabParam === "log"
        ) {
          return tabParam;
        }
      }
      return "explore"; // Default tab
    },
  );
  const [bookmarkedArticles, setBookmarkedArticles] = useState<any[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [graphLogs, setGraphLogs] = useState<GraphLog[]>([]);
  const [graphLogsLoading, setGraphLogsLoading] = useState(false);
  // Add a ref to track processed URL states
  const processedUrlStatesRef = useRef<Set<string>>(new Set());

  // Mouse event handlers for resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      // Get container bounds to set min and max width
      const containerWidth =
        containerRef.current?.getBoundingClientRect().width ||
        window.innerWidth;

      // Calculate new width (window width - mouse X position)
      let newWidth = window.innerWidth - e.clientX;

      // Constrain width between 240px and 50% of container
      newWidth = Math.max(240, Math.min(newWidth, containerWidth * 0.5));

      setSidebarWidth(newWidth);

      // Save width to localStorage
      localStorage.setItem(SIDEBAR_WIDTH_KEY, newWidth.toString());
    },
    [isResizing],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // If we have a graph, reheat the simulation when resizing is complete
    if (ForceGraph.current && graphData.nodes.length > 0) {
      console.log("Sidebar resize complete, reheating graph");
      setTimeout(() => {
        if (ForceGraph.current) {
          // Update the graph dimensions
          ForceGraph.current.width(containerRef.current?.clientWidth || 800);
          ForceGraph.current.height(containerRef.current?.clientHeight || 600);

          // Reheat the simulation
          const simulation = ForceGraph.current.d3Force();
          if (simulation) {
            simulation.alpha(0.3).restart();
          }
        }
      }, 100);
    }
  }, [handleMouseMove, graphData.nodes.length]);

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Generate initial graph data
  useEffect(() => {
    // Don't initialize with a default topic - let user search first
  }, []);

  // Load search history from IndexedDB
  const loadSearchHistory = useCallback(async () => {
    try {
      const history = await getAllSearchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  }, []);

  // Load search history when component mounts
  useEffect(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);

  // Add to search history using IndexedDB
  const addToSearchHistory = async (query: string) => {
    if (!query.trim()) return;

    try {
      await addToSearchHistoryDB(query);
      // Reload search history to get updated list with IDs
      await loadSearchHistory();
    } catch (error) {
      console.error("Error adding to search history:", error);
    }
  };

  // Remove from search history using IndexedDB
  const removeFromHistory = async (
    item: SearchHistoryItem,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    try {
      await removeFromSearchHistoryDB(item.id);
      // Update local state after removing from DB
      setSearchHistory((prev) =>
        prev.filter((historyItem) => historyItem.id !== item.id),
      );
    } catch (error) {
      console.error("Error removing from search history:", error);
    }
  };

  // Close search history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSearchHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExploreNode = async (node: NodeObject) => {
    const nodeName = node.name || node.id;
    console.log(`Exploring node ${nodeName} as main concept`);

    // Set the search query to the node name or ID
    setSearchQuery(nodeName);
    setInputValue(nodeName);

    // Clear the selected node and content
    setSelectedNode(null);
    setSummaryText("");
    setSummaryLoading(false);

    // Switch to the explore tab
    handleTabChange("explore");

    // Mark this URL state as processed to prevent infinite loops
    const urlStateKey = `${nodeName}-null-explore`;
    processedUrlStatesRef.current.add(urlStateKey);

    // Update URL to reflect we're viewing this node as a main concept
    // Explicitly clear the node parameter
    updateUrlParams({
      q: nodeName,
      node: undefined, // Clear the node parameter as we're viewing it as a main concept
    });

    // Set loading state
    setIsLoading(true);

    try {
      // First check if we have a cached graph for this node
      let cachedGraph = await getCachedKnowledgeGraph(nodeName);

      if (cachedGraph) {
        console.log(`Loaded cached graph for ${nodeName}`);
        setGraphData(cachedGraph);
      } else {
        console.log(`Generating new knowledge graph for ${nodeName}`);
        // Generate a new knowledge graph for this node
        const result = await generateKnowledgeGraph(nodeName, selectedModel.id);
        setGraphData(result);

        // Cache the newly generated graph
        await cacheKnowledgeGraph(nodeName, result);
      }

      // Log this access to the graph
      await logGraphAccess(nodeName);

      // Find the main node in the graph data (should be the first node)
      const mainNode =
        cachedGraph?.nodes.find((n) => n.id === nodeName) ||
        graphData.nodes.find((n) => n.id === nodeName);

      if (mainNode) {
        // Create a copy with the isMainEntry flag
        const mainEntryNode = {
          ...mainNode,
          isMainEntry: true,
          mainConcept: nodeName,
        };

        // Set as selected node
        setSelectedNode(mainEntryNode);
        setSummaryLoading(true);

        // Generate content for this node as a main concept
        try {
          const content = await generateNodeContent(
            mainEntryNode,
            nodeName, // The context is now this node itself
            selectedModel.id,
            1, // Start with detail level 1
          );

          // Update content
          updateNodeWithContent(mainEntryNode, content);

          // Cache this content
          await cacheArticle({
            id: `article-${nodeName}-1-${selectedModel.id}-${nodeName}`,
            nodeId: nodeName,
            concept: nodeName,
            title: mainNode.name || mainNode.id,
            content: content,
            detailLevel: 1,
            timestamp: Date.now(),
            mainConcept: nodeName,
          });
        } catch (error) {
          console.error("Error generating content for main entry:", error);
          updateNodeWithContent(
            mainEntryNode,
            generateFallbackContent(mainEntryNode, nodeName),
          );
        }
      } else {
        console.error(`Could not find main node for ${nodeName} in graph data`);
      }

      // Apply a single reheat after loading
      setTimeout(reheatForceSimulation, 300);
    } catch (error) {
      console.error(`Error exploring node ${nodeName} as main concept:`, error);
      setError(`Failed to explore ${nodeName}: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to manually reheat the force simulation
  const reheatForceSimulation = useCallback(() => {
    if (ForceGraph.current && graphData.nodes.length > 0) {
      console.log("Manual force reheat triggered");

      // Apply moderate repulsion force
      const chargeForce = ForceGraph.current.d3Force("charge");
      if (chargeForce) {
        chargeForce.strength(-200);
      }

      // Set moderate link distance
      const linkForce = ForceGraph.current.d3Force("link");
      if (linkForce) {
        linkForce.distance(150);
      }

      // Reheat the simulation with moderate energy
      const simulation = ForceGraph.current.d3Force();
      if (simulation && typeof simulation.alpha === "function") {
        // Use moderate alpha value
        simulation.alpha(0.5).restart();
      }
    }
  }, [graphData.nodes.length]);

  // Simplified function to expand graph to fill space
  const expandGraphToFillSpace = useCallback(() => {
    if (ForceGraph.current && graphData.nodes.length > 0) {
      // Get container dimensions
      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;

      console.log(`Expanding graph to fill space: ${width}x${height}`);

      // Apply a consistent, moderate force
      const chargeForce = ForceGraph.current.d3Force("charge");
      if (chargeForce) {
        // Moderate repulsion - increase slightly based on node count
        const baseForce = -200;
        const nodeCount = graphData.nodes.length;
        const adjustedForce = nodeCount > 30 ? baseForce * 1.5 : baseForce;

        console.log(`Setting charge force to ${adjustedForce}`);
        chargeForce.strength(adjustedForce);
      }

      // Adjust link distance modestly
      const linkForce = ForceGraph.current.d3Force("link");
      if (linkForce) {
        const nodeCount = graphData.nodes.length;
        // Scale link distance based on node count, but keep it reasonable
        const distance = Math.min(180, 120 + nodeCount);
        linkForce.distance(distance);
        console.log(`Setting link distance to ${distance}`);
      }

      // Apply moderate energy
      const simulation = ForceGraph.current.d3Force();
      if (simulation && typeof simulation.alpha === "function") {
        simulation.alpha(0.5).restart();
      }
    }
  }, [graphData.nodes.length]);

  // Update handleSearch function with the skipCache parameter
  const handleSearch = async (
    query: string = inputValue,
    skipTabChange: boolean = false,
    skipCache: boolean = false,
  ) => {
    if (!query.trim()) return;

    // Set loading state
    setIsLoading(true);
    setError("");

    // Clear the selected node and content when changing to a new concept
    if (query !== searchQuery) {
      setSelectedNode(null);
      setSummaryText("");
      setSummaryLoading(false);
    }

    // Add to search history
    await addToSearchHistory(query);

    // Create a URL state key and mark it as processed to prevent infinite loops
    const urlStateKey = `${query}-null-${activeTab}`;
    processedUrlStatesRef.current.add(urlStateKey);

    // Update URL parameters - explicitly clear node parameter when changing concepts
    updateUrlParams({
      q: query,
      node: undefined, // Clear the node parameter when searching for a new concept
    });

    // Switch to the 'explore' tab if not already there and not skipping tab change
    if (activeTab !== "explore" && !skipTabChange) {
      handleTabChange("explore");
    }

    try {
      let cachedGraph = skipCache ? null : await getCachedKnowledgeGraph(query);

      if (cachedGraph) {
        console.log(`Loaded cached graph for ${query}`);
        setGraphData(cachedGraph);
      } else {
        // If no cached graph, generate a new one
        console.log(`No cached graph for ${query}, generating new one`);
        const result = await generateKnowledgeGraph(query, selectedModel.id);
        setGraphData(result);

        // Cache the newly generated graph
        await cacheKnowledgeGraph(query, result);
      }

      setSearchQuery(query);

      // Log graph access
      await logGraphAccess(query);

      // Just use a single reheat with a slight delay
      setTimeout(reheatForceSimulation, 300);
    } catch (err) {
      console.error("Error generating knowledge graph:", err);
      setError("Failed to generate knowledge graph. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Hard reload function to force regeneration of the graph
  const handleHardReload = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      setError("");

      // Force a new graph generation by skipping cache
      await handleSearch(searchQuery, false, true);
    } catch (error) {
      console.error("Error during hard reload:", error);
      setError("Failed to reload graph. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clean up content by removing XML-like paragraph tags
  const cleanContent = (text: string): string => {
    if (!text) return "";

    // Remove <Paragraph X> and </Paragraph X> tags
    return text
      .replace(/<Paragraph\s*\d*>\s*/g, "")
      .replace(/<\/Paragraph\s*\d*>\s*/g, "\n\n")
      .replace(/<paragraph\s*\d*>\s*/g, "")
      .replace(/<\/paragraph\s*\d*>\s*/g, "\n\n");
  };

  // Once content is generated, update the node and state
  const updateNodeWithContent = (nodeObj: NodeObject, content: string) => {
    // Clean the content first
    const cleanedContent = cleanContent(content);

    console.log("Setting content for node:", nodeObj.name || nodeObj.id);
    console.log("Content length:", cleanedContent.length);
    console.log("Content preview:", cleanedContent.substring(0, 100));
    console.log("Context:", nodeObj.mainConcept || "None");

    // Set summary text state
    setSummaryText(cleanedContent);

    // Create a new node object with the content added
    const updatedNode = {
      ...nodeObj,
      content: cleanedContent,
    };

    console.log("Updated node has content property:", "content" in updatedNode);
    console.log(
      "Updated node content length:",
      updatedNode.content?.length || 0,
    );

    // Set as the selected node
    setSelectedNode(updatedNode);
    setSummaryLoading(false);
  };

  // Handler to regenerate content with increased detail
  const handleExpandDetail = async () => {
    if (!selectedNode || summaryLoading) return;

    const newDetailLevel = detailLevel + 1;
    setDetailLevel(newDetailLevel);
    setSummaryLoading(true);
    setSummaryText("");

    console.log(
      `Expanding detail for ${selectedNode.id} to level ${newDetailLevel}`,
    );

    try {
      const content = await generateNodeContent(
        selectedNode,
        searchQuery,
        selectedModel.id,
        newDetailLevel,
      );

      // Use the same method to update content consistently
      updateNodeWithContent(selectedNode, content);
    } catch (err) {
      console.error("Error fetching expanded node summary:", err);
      // Keep the detail level state but show error message
      const errorMsg = `Failed to expand content for ${selectedNode.name || selectedNode.id} to level ${newDetailLevel}. ${err instanceof Error ? err.message : "Unknown error"}`;
      updateNodeWithContent(selectedNode, errorMsg);
    }
  };

  // Fallback content generator when API calls fail
  const generateFallbackContent = (
    node: NodeObject,
    mainConcept: string,
  ): string => {
    const nodeName = node.name || node.id;
    const description =
      node.description || `A concept related to ${mainConcept}`;
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
    if (ForceGraph.current) {
      console.log("Zoom triggered:", direction);
      try {
        const currentZoom = ForceGraph.current.zoom();
        console.log("Current zoom level:", currentZoom);

        // Make zoom factor much more subtle (1.03 instead of 1.05)
        const zoomFactor = direction === "in" ? 1.03 : 0.97;
        const newZoom = currentZoom * zoomFactor;

        console.log("Setting new zoom level:", newZoom);
        ForceGraph.current.zoom(newZoom, 400); // This is the right reference
        setZoomLevel(newZoom);
      } catch (error) {
        console.error("Error during zoom operation:", error);
      }
    } else {
      console.warn("Graph reference not available for zoom operation");
    }
  };

  const resetZoom = () => {
    if (ForceGraph.current) {
      console.log("Reset zoom triggered");
      try {
        ForceGraph.current.zoomToFit(400, 30); // 400ms transition, 30px padding
        setZoomLevel(1);
      } catch (error) {
        console.error("Error during zoom reset:", error);
      }
    } else {
      console.warn("Graph reference not available for zoom reset");
    }
  };

  const centerGraph = () => {
    if (ForceGraph.current) {
      console.log("Center graph triggered");
      try {
        ForceGraph.current.centerAt(0, 0, 800);
        ForceGraph.current.zoom(1, 800);
        setZoomLevel(1);
      } catch (error) {
        console.error("Error during graph centering:", error);
      }
    } else {
      console.warn("Graph reference not available for centering");
    }
  };

  const toggleInteractionMode = () => {
    setInteractionMode((prev) => (prev === "select" ? "pan" : "select"));
  };
  const toggleGraphLock = () => {
    setIsGraphLocked((prev) => !prev);
  };
  const toggleCenterFocus = () => {
    setCenterFocusedNode((prev) => !prev);
  };

  // Handle node hover
  const handleNodeHover = (node: any) => {
    setHoverNode(node ? node.id : null);
  };

  // Toggle help tooltip
  const toggleHelp = () => {
    setShowHelp((prev) => !prev);
    setShowKeyboardShortcuts(false);
  };

  // Toggle keyboard shortcuts
  const toggleKeyboardShortcuts = () => {
    setShowKeyboardShortcuts((prev) => !prev);
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

  // Close model switcher when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelSelectorRef.current &&
        !modelSelectorRef.current.contains(event.target as Node)
      ) {
        setModelSwitcherOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Configure d3Force once graph is initialized and data is loaded
  useEffect(() => {
    // Check if ForceGraph.current exists before accessing properties
    if (ForceGraph.current && graphData.nodes.length > 0) {
      const fg = ForceGraph.current;

      // Configure link force
      const linkForce = fg.d3Force("link");
      if (linkForce) {
        // Check if the force exists before configuring
        linkForce.distance(150).strength(0.2);
      }

      // Configure charge force (repulsion)
      const chargeForce = fg.d3Force("charge");
      if (chargeForce) {
        // Check if the force exists before configuring
        chargeForce.strength(-200); // Moderate repulsion
      }

      // Configure center force to keep graph centered
      const centerForce = fg.d3Force("center");
      if (centerForce) {
        // Check if the force exists before configuring
        centerForce.x(0).y(0);
      }

      // Make zoom more subtle for mousewheel/trackpad
      if (fg.__zoomObj) {
        // Original zoom is typically around 0.1-0.2
        // Make it even more subtle by dividing by 30 instead of 15
        fg.__zoomObj.wheelDelta = (event) => {
          return (-event.deltaY * 0.01) / 30;
        };
      }

      // Start with moderate energy simulation
      const simulation = fg.d3Force();
      if (simulation && typeof simulation.alpha === "function") {
        // Moderate alpha makes the simulation less energetic
        simulation.alpha(0.6).alphaTarget(0).restart();

        // Manually run a few ticks to get initial positions
        for (let i = 0; i < 10; i++) {
          simulation.tick();
        }
      }
    }
  }, [graphData]); // Depend on graphData to apply forces when data is ready

  // Load bookmarks when the bookmarks tab is selected
  useEffect(() => {
    if (activeTab === "bookmarks") {
      loadBookmarks();
    } else if (activeTab === "log") {
      loadGraphLogs();
    }
  }, [activeTab]);

  // Load bookmarks from IndexedDB
  const loadBookmarks = async () => {
    setBookmarksLoading(true);
    try {
      const bookmarks = await getAllBookmarks();
      setBookmarkedArticles(bookmarks);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    } finally {
      setBookmarksLoading(false);
    }
  };

  // Load Graph Logs
  const loadGraphLogs = async () => {
    setGraphLogsLoading(true);
    try {
      const logs = await getAllGraphLogs();
      setGraphLogs(logs);
    } catch (error) {
      console.error("Error loading graph logs:", error);
    } finally {
      setGraphLogsLoading(false);
    }
  };

  // Handle bookmark change in NodeDetail
  const handleBookmarkToggle = async (
    isBookmarked: boolean,
    nodeData?: NodeObject,
  ) => {
    if (nodeData && isBookmarked) {
      // Make sure we're caching the graph data when a bookmark is created
      try {
        await cacheKnowledgeGraph(searchQuery, graphData);
        console.log(`Cached knowledge graph for ${searchQuery} on bookmark`);

        // Update bookmark count for this concept
        await updateGraphBookmarkCount(searchQuery);
      } catch (error) {
        console.error("Error caching knowledge graph on bookmark:", error);
      }
    } else if (nodeData && !isBookmarked) {
      // If a bookmark was removed, update the counts
      try {
        await updateGraphBookmarkCount(searchQuery);
      } catch (error) {
        console.error("Error updating bookmark counts:", error);
      }
    }

    // Always reload bookmarks when toggling, regardless of current tab
    try {
      console.log("Reloading bookmarks after toggle action");
      await loadBookmarks();

      // Also reload graph logs if on that tab
      if (activeTab === "log") {
        await loadGraphLogs();
      }
    } catch (error) {
      console.error("Error reloading bookmarks after toggle:", error);
    }
  };

  // Handle click on a bookmarked article
  const handleBookmarkClick = async (bookmark: any) => {
    setSummaryLoading(false);

    // If the bookmark has a searchQuery/mainConcept, load that graph first
    if (bookmark.mainConcept && bookmark.mainConcept !== searchQuery) {
      setIsLoading(true);
      setSearchQuery(bookmark.mainConcept);

      try {
        // Try to get the cached graph for this concept
        let cachedGraph = await getCachedKnowledgeGraph(bookmark.mainConcept);

        if (cachedGraph) {
          console.log(`Loaded cached graph for ${bookmark.mainConcept}`);

          // Create a unique URL state key and mark it as processed to prevent loops
          const urlStateKey = `${bookmark.mainConcept}-${bookmark.nodeId}-explore`;
          processedUrlStatesRef.current.add(urlStateKey);

          // Update URL params to reflect the new root concept
          updateUrlParams({
            q: bookmark.mainConcept,
            node: bookmark.nodeId,
            explorerTab: "explore",
          });

          // Set graph data
          setGraphData(cachedGraph);

          // Reheat the graph
          setTimeout(reheatForceSimulation, 200);
        } else {
          // If no cached graph, generate a new one
          console.log(
            `No cached graph for ${bookmark.mainConcept}, generating new one`,
          );
          const result = await generateKnowledgeGraph(
            bookmark.mainConcept,
            selectedModel.id,
          );

          // Create a unique URL state key and mark it as processed to prevent loops
          const urlStateKey = `${bookmark.mainConcept}-${bookmark.nodeId}-explore`;
          processedUrlStatesRef.current.add(urlStateKey);

          // Update URL params to reflect the new root concept
          updateUrlParams({
            q: bookmark.mainConcept,
            node: bookmark.nodeId,
            explorerTab: "explore",
          });

          // Set graph data
          setGraphData(result);

          // Cache the newly generated graph
          await cacheKnowledgeGraph(bookmark.mainConcept, result);

          // Reheat the graph
          setTimeout(reheatForceSimulation, 200);
        }
      } catch (error) {
        console.error(
          `Error loading graph for bookmark ${bookmark.title}:`,
          error,
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      // Even if we're using the same graph, we should update URL params to ensure the node is reflected
      // Create a unique URL state key and mark it as processed to prevent loops
      const urlStateKey = `${bookmark.mainConcept || searchQuery}-${bookmark.nodeId}-explore`;
      processedUrlStatesRef.current.add(urlStateKey);

      updateUrlParams({
        node: bookmark.nodeId,
        explorerTab: "explore",
      });
    }

    setSummaryText(bookmark.content);

    // Create a node object from the bookmark
    const nodeObj: NodeObject = {
      id: bookmark.nodeId,
      name: bookmark.title,
      description: bookmark.description || undefined,
      content: bookmark.content,
      mainConcept: bookmark.mainConcept,
    };

    setSelectedNode(nodeObj);
    setDetailLevel(1);
    handleTabChange("explore"); // Use handleTabChange instead of setActiveTab

    // Find and highlight the node in the graph
    setTimeout(() => {
      const node = graphData.nodes.find((n) => n.id === bookmark.nodeId);
      if (node && ForceGraph.current) {
        // If the node exists in the current graph, center on it
        if (node.x !== undefined && node.y !== undefined) {
          ForceGraph.current.centerAt(node.x, node.y, 1000);
          ForceGraph.current.zoom(zoomLevel * 1.05, 1000);
        }

        // Highlight the node
        const newHighlightNodes = new Set<string>();
        newHighlightNodes.add(bookmark.nodeId);

        // Add connected nodes to highlights if present
        if (node.connections) {
          node.connections.forEach((connId) => {
            newHighlightNodes.add(connId);
          });
        }

        setHighlightNodes(newHighlightNodes);
      } else {
        console.warn(`Bookmarked node ${bookmark.nodeId} not found in graph`);
      }
    }, 1500); // Longer delay to ensure graph is rendered and reheated
  };

  // Generate a shareable link for a bookmark
  const generateBookmarkLink = (bookmark: any): string => {
    const baseUrl = window.location.origin + window.location.pathname;
    const searchParam = encodeURIComponent(bookmark.mainConcept || "");
    const nodeParam = encodeURIComponent(bookmark.nodeId || "");
    return `${baseUrl}?q=${searchParam}&node=${nodeParam}`;
  };

  // Copy bookmark link to clipboard
  const copyBookmarkLink = (bookmark: any) => {
    const link = generateBookmarkLink(bookmark);
    navigator.clipboard.writeText(link).then(
      () => {
        // Could show a toast here
        console.log(`Copied link for ${bookmark.title}`);
      },
      (err) => {
        console.error("Could not copy link: ", err);
      },
    );
  };

  // Update URL parameters without full page reload by preserving all existing parameters
  const updateUrlParams = (params: Record<string, string>) => {
    if (typeof window === "undefined") return;

    // Get current URL and parameters
    const currentUrl = new URL(window.location.href);
    const newUrl = new URL(window.location.href);
    let hasChanges = false;

    // Update params
    Object.entries(params).forEach(([key, value]) => {
      const currentValue = currentUrl.searchParams.get(key);

      // Only update if the value is different
      if (value !== currentValue) {
        hasChanges = true;
        if (value) {
          newUrl.searchParams.set(key, value);
        } else {
          newUrl.searchParams.delete(key);
        }
      }
    });

    // Only update history if something has changed
    if (hasChanges) {
      // Use history API to update URL without navigation
      window.history.pushState({}, "", newUrl.toString());

      // Log the URL change
      console.log(`URL updated: ${newUrl.toString()}`);
    }
  };

  // Handle node click - now updateUrlParams is defined before this function
  const handleNodeClick = useCallback(
    async (node: any) => {
      // Cast the node to our NodeObject type
      const nodeObj = node as NodeObject;

      // If in pan mode, don't select the node
      if (interactionMode === "pan") return;

      // Prevent duplicate handling of the same node
      if (selectedNode && selectedNode.id === nodeObj.id) {
        console.log("Node already selected, skipping", nodeObj.id);
        return;
      }

      // First set the node so UI updates immediately
      setSelectedNode(nodeObj);
      setSummaryLoading(true);
      setDetailLevel(1);

      // Highlight the selected node and its connections
      const newHighlightNodes = new Set<string>();
      newHighlightNodes.add(nodeObj.id);

      // Add connected nodes to highlights
      if (nodeObj.connections) {
        nodeObj.connections.forEach((connId) => {
          newHighlightNodes.add(connId);
        });
      }

      setHighlightNodes(newHighlightNodes);

      // Update URL with the selected node - but only if we're on the explore tab
      if (activeTab === "explore") {
        // Mark this URL state as processed to prevent infinite loops
        const urlStateKey = `${searchQuery}-${nodeObj.id}-explore`;
        processedUrlStatesRef.current.add(urlStateKey);

        updateUrlParams({ node: nodeObj.id });
      }

      // Center on the node if centerFocusedNode is true
      if (centerFocusedNode && ForceGraph.current) {
        const distance = 40;
        const distRatio =
          1 + distance / Math.hypot(nodeObj.x || 0, nodeObj.y || 0);
        if (nodeObj.x !== undefined && nodeObj.y !== undefined) {
          ForceGraph.current.centerAt(nodeObj.x, nodeObj.y, 1000);
          ForceGraph.current.zoom(zoomLevel * 1.05, 1000); // More subtle zoom
        }
      }

      try {
        console.log(
          `Generating content using model: ${selectedModel.name} (${selectedModel.id})`,
        );
        console.log(
          `Node: ${nodeObj.name || nodeObj.id} in context of ${searchQuery}`,
        );

        // Create a unique article ID that includes the context
        const articleId = `article-${nodeObj.id}-1-${selectedModel.id}-${searchQuery}`;

        // Generate content using the selected model
        let content;

        // Check if we have cached content for this exact node+context combination
        try {
          const cachedArticles = await getAllBookmarks();
          const cachedArticle = cachedArticles.find(
            (article) =>
              article.nodeId === nodeObj.id &&
              article.mainConcept === searchQuery &&
              article.detailLevel === 1,
          );

          if (cachedArticle) {
            console.log(
              `Found cached content for ${nodeObj.name || nodeObj.id} in context of ${searchQuery}`,
            );
            content = cachedArticle.content;
          } else {
            // If no cached content, generate new content
            content = await generateNodeContent(
              nodeObj,
              searchQuery,
              selectedModel.id,
              1,
            );

            console.log("Content generated successfully:");
            console.log(
              content.slice(0, 100) +
                "..." +
                (content.length > 100 ? ` (${content.length} chars)` : ""),
            );

            // Cache the generated content along with the search query
            if (content && searchQuery) {
              try {
                await cacheArticle({
                  id: articleId,
                  nodeId: nodeObj.id,
                  concept: searchQuery,
                  title: nodeObj.name || nodeObj.id,
                  content: content,
                  detailLevel: 1,
                  timestamp: Date.now(),
                  mainConcept: searchQuery,
                });
              } catch (cacheError) {
                console.error("Error caching article content:", cacheError);
              }
            }
          }
        } catch (apiError) {
          console.error("API route error:", apiError);

          // Check if the error message is from the API response
          if (typeof apiError === "string") {
            const errorMessage = `Failed to generate content for ${nodeObj.name || nodeObj.id}. ${apiError}`;
            updateNodeWithContent(nodeObj, errorMessage);
            return;
          }

          // Fallback to a mock content generation if the API fails
          content = generateFallbackContent(nodeObj, searchQuery);
          console.log("Using fallback content");
        }

        // Ensure content is a string
        if (typeof content !== "string") {
          console.error("Content is not a string:", content);
          content = String(content || "No content available");
        }

        // Apply some basic markdown formatting if needed
        if (!content.includes("#")) {
          // If content doesn't have markdown headings, add a title
          content = `# ${nodeObj.name || nodeObj.id}\n\n${content}`;
        }

        // Add context information to the node object before updating
        const contextNode = {
          ...nodeObj,
          mainConcept: searchQuery,
          isMainEntry: nodeObj.id === searchQuery, // Flag if this is a main entry or subnode
        };

        // Update node with the content
        updateNodeWithContent(contextNode, content);
      } catch (err) {
        console.error("Error fetching node summary:", err);

        // Create a more informative error message that includes the model name
        const errorMessage = `Failed to generate content for ${nodeObj.name || nodeObj.id} using ${selectedModel.name}. Please try again later.`;
        updateNodeWithContent(nodeObj, errorMessage);
      }
    },
    [
      interactionMode,
      centerFocusedNode,
      zoomLevel,
      searchQuery,
      selectedModel,
      selectedNode,
      activeTab,
    ],
  );

  // Create a function to update tab and URL
  const handleTabChange = (tab: "explore" | "bookmarks" | "log") => {
    // Avoid unnecessary state updates and URL changes if tab hasn't changed
    if (activeTab === tab) {
      console.log(`Tab ${tab} already active, skipping change`);
      return;
    }

    console.log(`Changing tab from ${activeTab} to ${tab}`);
    setActiveTab(tab);

    // Update URL params silently to avoid triggering additional effects
    updateUrlParams({ explorerTab: tab });

    // Clear selected node when switching to bookmarks or log tabs
    if (tab === "bookmarks" || tab === "log") {
      setSelectedNode(null);
      setSummaryText("");
      setSummaryLoading(false);
    }

    // Load appropriate data based on the tab
    if (tab === "bookmarks") {
      loadBookmarks();
    } else if (tab === "log") {
      loadGraphLogs();
    }
  };

  // Add an effect to handle browser navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      // Update tab state based on URL when navigating with browser history
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("explorerTab");

      if (
        tabParam === "explore" ||
        tabParam === "bookmarks" ||
        tabParam === "log"
      ) {
        setActiveTab(tabParam);

        // Clear selected node when switching to bookmarks or log tabs
        if (tabParam === "bookmarks" || tabParam === "log") {
          setSelectedNode(null);
          setSummaryText("");
          setSummaryLoading(false);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // URL params handling
  useEffect(() => {
    const loadFromUrlParams = async () => {
      // Only run in browser environment
      if (typeof window === "undefined") return;

      // Get URL search parameters
      const urlParams = new URLSearchParams(window.location.search);
      const queryParam = urlParams.get("q");
      const nodeParam = urlParams.get("node");
      const tabParam = urlParams.get("explorerTab");

      // Create a unique key for this URL state
      const urlStateKey = `${queryParam || ""}-${nodeParam || ""}-${tabParam || ""}`;

      // Skip if we've already processed this exact URL state to prevent infinite loops
      if (processedUrlStatesRef.current.has(urlStateKey)) {
        return;
      }

      // Mark this URL state as processed
      processedUrlStatesRef.current.add(urlStateKey);

      // Set correct tab first (this won't trigger a re-render if tab is the same)
      if (
        tabParam === "explore" ||
        tabParam === "bookmarks" ||
        tabParam === "log"
      ) {
        // Use our improved handleTabChange to avoid unnecessary updates
        if (tabParam !== activeTab) {
          setActiveTab(tabParam);

          // Use a type-safe approach to check if we're not on the explore tab
          const currentTab = tabParam as "explore" | "bookmarks" | "log";
          if (currentTab === "bookmarks" || currentTab === "log") {
            setSelectedNode(null);
            setSummaryText("");
            setSummaryLoading(false);

            // Load appropriate data for the tab
            if (currentTab === "bookmarks") {
              loadBookmarks();
            } else if (currentTab === "log") {
              loadGraphLogs();
            }

            // If not on explore tab, don't load the graph
            return;
          }
        }
      }

      // If we don't have a query parameter, don't try to load a graph
      if (!queryParam) {
        return;
      }

      // Avoid infinite loop by checking if we're already handling this exact URL state
      const currentNodeId = selectedNode?.id;
      const isAlreadyLoadedGraph =
        graphData.nodes.length > 0 && graphData.nodes[0].id === queryParam;
      const isAlreadySelectedNode = nodeParam && currentNodeId === nodeParam;

      if (isAlreadyLoadedGraph && isAlreadySelectedNode) {
        console.log("URL params match current state, skipping reload");
        return;
      }

      console.log(
        `Loading from URL params: query=${queryParam}${nodeParam ? `, node=${nodeParam}` : ""}`,
      );

      // Set the search query state
      setSearchQuery(queryParam);
      // Also update the input value when loading from URL
      setInputValue(queryParam);

      // Only show loading indicator if we don't have graph data already
      if (graphData.nodes.length === 0) {
        setIsLoading(true);
      }

      try {
        // Check if we already have this graph loaded
        if (isAlreadyLoadedGraph) {
          console.log(
            `Graph for ${queryParam} is already loaded, skipping reload`,
          );

          // If we have a node parameter, select that node
          if (nodeParam && nodeParam !== currentNodeId) {
            const node = graphData.nodes.find((n) => n.id === nodeParam);
            if (node) {
              // Instead of calling handleNodeClick, manually set selected node
              setSelectedNode(node);
              setSummaryLoading(true);
              setDetailLevel(1);

              // Highlight the selected node and its connections
              const newHighlightNodes = new Set<string>();
              newHighlightNodes.add(node.id);

              // Add connected nodes to highlights if present
              if (node.connections) {
                node.connections.forEach((connId) => {
                  newHighlightNodes.add(connId);
                });
              }

              setHighlightNodes(newHighlightNodes);

              // Get content for node
              try {
                console.log(
                  "Generating content using model:",
                  selectedModel.name,
                  `(${selectedModel.id})`,
                );
                console.log("Node:", node.name || node.id);

                const content = await generateNodeContent(
                  node,
                  queryParam,
                  selectedModel.id,
                  1, // Default detail level
                );

                // Update node with content
                updateNodeWithContent(node, content);
              } catch (error) {
                console.error("Error generating node content:", error);
                updateNodeWithContent(
                  node,
                  generateFallbackContent(node, queryParam),
                );
              }
            }
          }
        } else {
          // Try to get the cached graph for this concept
          let graphToUse = await getCachedKnowledgeGraph(queryParam);

          if (graphToUse) {
            console.log(`Loaded cached graph for ${queryParam}`);
            setGraphData(graphToUse);

            // Only do a single reheat with a short timeout
            setTimeout(() => {
              reheatForceSimulation();
            }, 300);
          } else {
            // If no cached graph, generate a new one
            console.log(
              `No cached graph for ${queryParam}, generating new one`,
            );
            graphToUse = await generateKnowledgeGraph(
              queryParam,
              selectedModel.id,
            );
            setGraphData(graphToUse);

            // Cache the newly generated graph
            await cacheKnowledgeGraph(queryParam, graphToUse);
          }

          // If we have a node parameter, select that node after a short delay
          if (nodeParam) {
            setTimeout(() => {
              const node = graphToUse.nodes.find((n) => n.id === nodeParam);
              if (node) {
                // Instead of calling handleNodeClick, manually set selected node
                setSelectedNode(node);
                setSummaryLoading(true);
                setDetailLevel(1);

                // Highlight the selected node and its connections
                const newHighlightNodes = new Set<string>();
                newHighlightNodes.add(node.id);
                setHighlightNodes(newHighlightNodes);

                // In a timeout to ensure we don't try to get content before the graph is ready
                setTimeout(async () => {
                  try {
                    console.log(
                      "Generating content using model:",
                      selectedModel.name,
                      `(${selectedModel.id})`,
                    );
                    console.log("Node:", node.name || node.id);

                    const content = await generateNodeContent(
                      node,
                      queryParam,
                      selectedModel.id,
                      1, // Default detail level
                    );

                    // Update node with content
                    updateNodeWithContent(node, content);
                  } catch (error) {
                    console.error("Error generating node content:", error);
                    updateNodeWithContent(
                      node,
                      generateFallbackContent(node, queryParam),
                    );
                  }
                }, 500);
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error("Error loading from URL parameters:", error);
        setError(`Failed to load content from URL: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadFromUrlParams();

    // This effect should run once on mount and then only when the URL changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a separate effect to handle URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      // Reset the processed states when URL changes
      processedUrlStatesRef.current.clear();

      // Now re-run the loadFromUrlParams
      const loadFromUrlParams = async () => {
        // Only run in browser environment
        if (typeof window === "undefined") return;

        // Get URL search parameters
        const urlParams = new URLSearchParams(window.location.search);
        const queryParam = urlParams.get("q");
        const nodeParam = urlParams.get("node");
        const tabParam = urlParams.get("explorerTab");

        // Create a unique key for this URL state
        const urlStateKey = `${queryParam || ""}-${nodeParam || ""}-${tabParam || ""}`;

        // Skip if we've already processed this exact URL state
        if (processedUrlStatesRef.current.has(urlStateKey)) {
          return;
        }

        // Mark this URL state as processed
        processedUrlStatesRef.current.add(urlStateKey);

        // Set correct tab first
        if (
          tabParam === "explore" ||
          tabParam === "bookmarks" ||
          tabParam === "log"
        ) {
          if (tabParam !== activeTab) {
            setActiveTab(tabParam);

            const currentTab = tabParam as "explore" | "bookmarks" | "log";
            if (currentTab === "bookmarks" || currentTab === "log") {
              setSelectedNode(null);
              setSummaryText("");
              setSummaryLoading(false);

              if (currentTab === "bookmarks") {
                loadBookmarks();
              } else if (currentTab === "log") {
                loadGraphLogs();
              }

              return;
            }
          }
        }

        // If we don't have a query parameter, don't try to load a graph
        if (!queryParam) {
          return;
        }

        // Check if we're changing to a new root concept
        const isNewConcept = searchQuery !== queryParam;

        // Set the search query
        if (isNewConcept) {
          setSearchQuery(queryParam);
          // Also update the input value for consistency when navigating
          setInputValue(queryParam);

          // Clear selected node when changing to a new concept if there's no node param
          if (!nodeParam) {
            setSelectedNode(null);
            setSummaryText("");
            setSummaryLoading(false);
          }
        }

        // Only handle changing nodes when staying on the same graph
        if (
          graphData.nodes.length > 0 &&
          graphData.nodes[0].id === queryParam &&
          nodeParam
        ) {
          const currentNodeId = selectedNode?.id;

          // Only change the node if needed
          if (nodeParam !== currentNodeId) {
            const node = graphData.nodes.find((n) => n.id === nodeParam);
            if (node) {
              handleNodeClick(node);
            }
          }
        } else if (isNewConcept && graphData.nodes.length === 0) {
          // If changing to a new concept and we don't have graph data, trigger a search
          handleSearch(queryParam, false, false);
        }
      };

      loadFromUrlParams();
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener("popstate", handleUrlChange);

    // Initial URL handling
    handleUrlChange();

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
    };
    // Only depends on necessary values and functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery, graphData.nodes, handleNodeClick]);

  // Modify the reheat effect when graph data changes
  useEffect(() => {
    if (graphData.nodes.length > 0 && ForceGraph.current) {
      // Log when graph data is loaded
      console.log("Graph data loaded with", graphData.nodes.length, "nodes");

      // Initial gentle force application
      const simulation = ForceGraph.current.d3Force();
      if (simulation) {
        // Start with moderate energy
        simulation.alpha(0.5).restart();
      }

      // Use just one delayed reheat at 500ms for better performance
      const timer = setTimeout(() => {
        if (ForceGraph.current) {
          const chargeForce = ForceGraph.current.d3Force("charge");
          if (chargeForce) {
            const originalStrength = chargeForce.strength();
            // Use a more reasonable strength multiplier
            chargeForce.strength(originalStrength * 1.3);

            // Reset after a delay
            setTimeout(() => {
              if (chargeForce && ForceGraph.current) {
                chargeForce.strength(originalStrength);
                ForceGraph.current.d3Force().alpha(0.1).restart();
              }
            }, 500);
          }
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [graphData]);

  // Reheat force graph when container size changes
  useEffect(() => {
    if (containerRef.current && graphData.nodes.length > 0) {
      // Create a ResizeObserver to detect container size changes
      const resizeObserver = new ResizeObserver((entries) => {
        console.log("Container size changed, updating graph");

        if (ForceGraph.current) {
          // Update width and height
          ForceGraph.current.width(containerRef.current?.clientWidth || 800);
          ForceGraph.current.height(containerRef.current?.clientHeight || 600);

          // After a small delay, reheat the simulation
          setTimeout(() => {
            if (ForceGraph.current) {
              const simulation = ForceGraph.current.d3Force();
              if (simulation) {
                simulation.alpha(0.3).restart();
              }
            }
          }, 200);
        }
      });

      // Start observing the container
      resizeObserver.observe(containerRef.current);

      // Clean up
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [graphData.nodes.length]);

  // Handle sign out function
  const handleSignOut = () => {
    // Clear selected model state
    setHasSelectedModel(false);

    // Clear API keys from localStorage
    Object.keys(localStorage)
      .filter((key) => key.startsWith("llm_api_key_"))
      .forEach((key) => localStorage.removeItem(key));

    // Clear other related localStorage items
    localStorage.removeItem("llm_provider");
    localStorage.removeItem("selected_model");
    localStorage.removeItem("has_selected_model");

    // Set the URL back to the root without parameters
    window.location.href = window.location.pathname;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Keyboard shortcuts handler */}
      <KeyboardShortcuts
        onZoomIn={() => handleZoom("in")}
        onZoomOut={() => handleZoom("out")}
        onReset={resetZoom}
        onToggleMode={toggleInteractionMode}
        onToggleLock={toggleGraphLock}
        onToggleHelp={toggleHelp}
      />
      {/* Search and Controls */}
      <div className="flex flex-col gap-3 p-4 pb-2 md:flex-row md:items-center">
        <div className="relative flex-grow">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onClick={() => {
              loadSearchHistory();
              setShowSearchHistory(true);
            }}
            placeholder="Enter a concept to explore (e.g., quantum physics, machine learning)"
            className="w-full rounded-md border border-slate-600 bg-slate-700 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                try {
                  // Update searchQuery from input when submitting
                  setSearchQuery(inputValue);
                  await handleSearch(inputValue);
                } catch (err) {
                  console.error("Error executing search:", err);
                }
                // Close the dropdown after the search is completed
                setShowSearchHistory(false);
              }
            }}
          />

          {/* Search History Dropdown */}
          {showSearchHistory && searchHistory.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-600 bg-slate-800 shadow-lg">
              <ul className="max-h-60 overflow-auto py-1">
                {searchHistory.map((item) => (
                  <li
                    key={item.id}
                    className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-slate-700"
                    onClick={async () => {
                      // Set both input value and search query
                      setInputValue(item.query);
                      setSearchQuery(item.query);
                      // Execute the search
                      try {
                        await handleSearch(item.query);
                      } catch (err) {
                        console.error("Error executing search:", err);
                      }
                      // Close the dropdown after the search is complete
                      setShowSearchHistory(false);
                    }}
                  >
                    <span className="truncate">{item.query}</span>
                    <button
                      className="ml-2 rounded-full p-1 hover:bg-slate-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item, e);
                      }}
                      title="Remove from history"
                    >
                      <X size={16} className="text-slate-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                // Update searchQuery from input when clicking button
                setSearchQuery(inputValue);
                await handleSearch(inputValue);
                // Close the dropdown after the search is completed
                setShowSearchHistory(false);
              } catch (err) {
                console.error("Error executing search:", err);
              }
            }}
            disabled={isLoading || !inputValue.trim()}
            className={`rounded-md px-5 py-2 font-medium transition-colors ${isLoading || !inputValue.trim() ? "cursor-not-allowed bg-slate-600 text-slate-300" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            {isLoading ? "Loading..." : "Explore"}
          </button>

          {/* Provider indicator with popover */}
          <div className="relative" ref={modelSelectorRef}>
            <button
              onClick={() => setModelSwitcherOpen(!modelSwitcherOpen)}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 hover:bg-opacity-80 ${
                providerType === "openai"
                  ? "border-green-700/50 bg-green-900/20 text-green-300"
                  : providerType === "anthropic"
                    ? "border-purple-700/50 bg-purple-900/20 text-purple-300"
                    : providerType === "ollama"
                      ? "border-amber-700/50 bg-amber-900/20 text-amber-300"
                      : "border-blue-700/50 bg-blue-900/20 text-blue-300"
              }`}
              title="Click to change model"
            >
              <span className="text-sm font-medium">{selectedModel.name}</span>
              <ChevronDown
                size={14}
                className={`transition-transform ${modelSwitcherOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Model Switcher Popover */}
            {modelSwitcherOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
                <ModelSwitcher onClose={() => setModelSwitcherOpen(false)} />
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 rounded-md border border-rose-700/30 bg-rose-900/10 px-3 py-2 text-sm text-rose-300 hover:bg-rose-900/30"
            title="Sign out and clear API keys"
          >
            <LogOut size={16} className="mr-1" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Graph Controls Toolbar */}
          <div className="flex rounded-lg bg-slate-800 p-1 shadow-lg">
            {/* Zoom Controls */}
            <div className="flex border-r border-slate-600 pr-1">
              <motion.button
                whileHover={{
                  scale: 1.1,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={() => handleZoom("in")}
                className="rounded-md p-2 transition-colors hover:bg-slate-700"
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.1,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={() => handleZoom("out")}
                className="rounded-md p-2 transition-colors hover:bg-slate-700"
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </motion.button>
            </div>

            {/* Navigation Controls */}
            <div className="flex border-r border-slate-600 px-1">
              <motion.button
                whileHover={{
                  scale: 1.1,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={resetZoom}
                className="rounded-md p-2 transition-colors hover:bg-slate-700"
                title="Fit Graph to View"
              >
                <Maximize size={20} />
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.1,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={centerGraph}
                className="rounded-md p-2 transition-colors hover:bg-slate-700"
                title="Center Graph"
              >
                <Focus size={20} />
              </motion.button>

              {/* Hard reload button */}
              <motion.button
                whileHover={{
                  scale: 1.1,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={handleHardReload}
                className="rounded-md p-2 transition-colors hover:bg-slate-700"
                title="Hard Reload (Force Regeneration)"
                disabled={!searchQuery.trim() || isLoading}
              >
                <RefreshCw
                  size={20}
                  className={isLoading ? "text-slate-500" : ""}
                />
              </motion.button>

              {/* Graph reheat button - only show when graph has nodes */}
              {graphData.nodes.length > 0 && (
                <motion.button
                  whileHover={{
                    scale: 1.1,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                  onClick={() => {
                    expandGraphToFillSpace();
                  }}
                  className="rounded-md p-2 transition-colors hover:bg-slate-700"
                  title="Adjust graph layout to improve spacing"
                >
                  <GrapeIcon size={20} />
                </motion.button>
              )}
            </div>

            {/* Interaction Mode Controls */}
            <div className="flex border-r border-slate-600 px-1">
              <motion.button
                whileHover={{
                  scale: 1.1,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={toggleInteractionMode}
                className={`rounded-md p-2 transition-colors ${interactionMode === "select" ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-slate-700"}`}
                title={
                  interactionMode === "select"
                    ? "Selection Mode (Click to switch to Pan Mode)"
                    : "Pan Mode (Click to switch to Selection Mode)"
                }
              >
                {interactionMode === "select" ? (
                  <MousePointer size={20} />
                ) : (
                  <Hand size={20} />
                )}
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.1,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={toggleGraphLock}
                className={`rounded-md p-2 transition-colors ${isGraphLocked ? "bg-amber-600 hover:bg-amber-700" : "hover:bg-slate-700"}`}
                title={isGraphLocked ? "Unlock Graph" : "Lock Graph"}
              >
                {isGraphLocked ? <Lock size={20} /> : <Unlock size={20} />}
              </motion.button>
            </div>

            {/* Focus Controls */}
            <div className="flex pl-1">
              <motion.button
                whileHover={{
                  scale: 1.1,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={toggleCenterFocus}
                className={`rounded-md p-2 transition-colors ${centerFocusedNode ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-slate-700"}`}
                title={
                  centerFocusedNode
                    ? "Auto-center on selection enabled"
                    : "Auto-center on selection disabled"
                }
              >
                <Focus size={20} />
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.1,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                className="rounded-md p-2 transition-colors hover:bg-slate-700"
                title="Help"
                onClick={toggleHelp}
              >
                <HelpCircle size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mb-2 rounded-md border border-red-700 bg-red-900/50 p-2 text-red-200">
          {error}
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Graph visualization */}
        <div
          ref={containerRef}
          className="relative flex-grow overflow-hidden bg-slate-900"
        >
          {/* Graph interaction mode indicator */}
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1.5 text-sm shadow-lg backdrop-blur-sm">
            {interactionMode === "select" ? (
              <>
                <MousePointer size={16} className="text-blue-400" />
                <span>Selection Mode</span>
              </>
            ) : (
              <>
                <Hand size={16} className="text-green-400" />
                <span>Pan Mode</span>
              </>
            )}
          </div>

          {/* Graph lock indicator */}
          {isGraphLocked && (
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-amber-900/80 px-3 py-1.5 text-sm shadow-lg backdrop-blur-sm">
              <Lock size={16} className="text-amber-400" />
              <span>Graph Locked</span>
            </div>
          )}

          {isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80">
              <div className="flex flex-col items-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
                <p className="text-slate-300">Generating knowledge graph...</p>
              </div>
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <HelpCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>Enter a concept above to start exploring</p>
              </div>
            </div>
          ) : (
            <ForceGraph2D
              ref={ForceGraph}
              graphData={graphData}
              nodeLabel={(node) => node.name || node.id || ""}
              nodeRelSize={8}
              linkWidth={1.5}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleSpeed={0.005}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.name || node.id || "";
                const fontSize = 12 / globalScale;
                const nodeSize = node.val
                  ? Math.sqrt(Math.max(0, node.val || 1)) * 0.4
                  : 0.8; // Reduced to 1/10th of original size

                // Draw the main node circle
                ctx.beginPath();
                ctx.arc(
                  node.x || 0,
                  node.y || 0,
                  nodeSize,
                  0,
                  2 * Math.PI,
                  false,
                );
                ctx.fillStyle = node.color || "rgba(31, 120, 180, 0.9)"; // Default blueish color
                ctx.fill();

                // Add highlight effect for selected nodes (drawn over the base circle)
                if (selectedNode && node.id === selectedNode.id) {
                  ctx.beginPath();
                  // Use nodeSize calculated above for consistency
                  ctx.arc(
                    node.x || 0,
                    node.y || 0,
                    nodeSize + 0.2,
                    0,
                    2 * Math.PI,
                  );
                  // Make highlight more visible
                  ctx.strokeStyle = "rgba(255, 107, 107, 0.8)";
                  ctx.lineWidth = 2 / globalScale;
                  ctx.stroke();
                }

                // Display node name on hover (drawn over everything else)
                if (hoverNode === node.id) {
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillStyle = "white";

                  // Draw background for text
                  const textWidth = ctx.measureText(label).width;
                  const backgroundPadding = 2 / globalScale;
                  const bckgDimensions = [
                    textWidth + backgroundPadding * 2,
                    fontSize + backgroundPadding * 2,
                  ];

                  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                  ctx.fillRect(
                    (node.x || 0) - bckgDimensions[0] / 2,
                    (node.y || 0) -
                      nodeSize -
                      bckgDimensions[1] -
                      backgroundPadding, // Position above node
                    bckgDimensions[0],
                    bckgDimensions[1],
                  );

                  // Draw text
                  ctx.fillStyle = "white";
                  ctx.fillText(
                    label,
                    node.x || 0,
                    (node.y || 0) -
                      nodeSize -
                      bckgDimensions[1] / 2 -
                      backgroundPadding, // Center text in background
                  );
                }
              }}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              onNodeDragEnd={(node) => {
                if (node) {
                  node.fx = node.x;
                  node.fy = node.y;
                }
              }}
              cooldownTicks={100}
              d3VelocityDecay={0.3}
              d3AlphaDecay={0.01}
              onEngineStop={() => {
                // When the initial cooldown is complete, apply a reheat to ensure nodes are well-distributed
                console.log(
                  "Engine stopped - applying final positioning reheat",
                );
                setTimeout(() => {
                  if (ForceGraph.current) {
                    const chargeForce = ForceGraph.current.d3Force("charge");
                    if (chargeForce) {
                      const currentStrength = chargeForce.strength();
                      // Temporarily increase repulsion to give a final burst of energy
                      chargeForce.strength(currentStrength * 1.25);
                      setTimeout(() => {
                        if (chargeForce) {
                          chargeForce.strength(currentStrength);
                        }
                      }, 300);
                    }

                    // Restart the simulation with a small alpha
                    const simulation = ForceGraph.current.d3Force();
                    if (simulation) {
                      simulation.alpha(0.3).restart();
                    }
                  }
                }, 100);
              }}
              width={containerRef.current?.clientWidth || 800}
              height={containerRef.current?.clientHeight || 600}
            />
          )}
        </div>

        {/* Resize handle */}
        <div
          ref={resizeRef}
          className="flex w-1 cursor-col-resize items-center bg-transparent hover:bg-blue-500"
          onMouseDown={handleMouseDown}
        >
          <div className="h-16 w-1 rounded-full bg-slate-600 opacity-30 hover:opacity-80"></div>
        </div>

        {/* Right sidebar - Node details and summary */}
        <div
          className="flex h-full w-full min-w-[240px] flex-col border-l border-slate-700 bg-slate-800"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Tabs navigation */}
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => handleTabChange("explore")}
              className={`flex-1 py-3 font-medium transition-colors ${
                activeTab === "explore"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => handleTabChange("bookmarks")}
              className={`flex-1 py-3 font-medium transition-colors ${
                activeTab === "bookmarks"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Bookmarks
            </button>
            <button
              onClick={() => handleTabChange("log")}
              className={`flex-1 py-3 font-medium transition-colors ${
                activeTab === "log"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Log
            </button>
          </div>

          {activeTab === "explore" && (
            // Explore tab content
            <>
              {selectedNode ? (
                <NodeDetail
                  node={selectedNode}
                  summary={summaryText}
                  isLoading={summaryLoading}
                  detailLevel={detailLevel}
                  mainConcept={searchQuery}
                  onExpandDetail={handleExpandDetail}
                  onFocusNode={(nodeId) => {
                    // Find the node in the graph data
                    const node = graphData.nodes.find((n) => n.id === nodeId);
                    if (node) {
                      handleNodeClick(node);
                    }
                  }}
                  onExploreNode={handleExploreNode}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                  <Search size={40} className="mb-4 text-slate-500" />
                  <h3 className="text-xl font-semibold text-slate-300">
                    No node selected
                  </h3>
                  <p className="mt-2 text-slate-400">
                    Search for a topic or select a node from the graph to view
                    its details.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "bookmarks" && (
            // Bookmarks tab content
            <div className="h-full overflow-auto">
              {bookmarksLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span className="ml-3">Loading bookmarks...</span>
                </div>
              ) : bookmarkedArticles.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <Bookmark size={48} className="mb-4 text-slate-400" />
                  <h3 className="text-xl font-medium text-slate-300">
                    No bookmarks yet
                  </h3>
                  <p className="mt-2 text-slate-400">
                    Bookmark interesting articles to access them later.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {bookmarkedArticles.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="block w-full border-b border-slate-700 last:border-b-0"
                    >
                      <button
                        className="block w-full cursor-pointer px-4 py-3 text-left hover:bg-slate-700"
                        onClick={() => handleBookmarkClick(bookmark)}
                      >
                        <div className="flex items-start">
                          <Bookmark
                            size={18}
                            className="mr-2 mt-1 flex-shrink-0 fill-yellow-400 text-yellow-400"
                          />
                          <div>
                            <h3 className="font-medium text-white">
                              {bookmark.title}
                            </h3>
                            {bookmark.description && (
                              <p className="mt-1 text-sm text-slate-300">
                                {bookmark.description}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-slate-400">
                              From: {bookmark.mainConcept} •{" "}
                              {new Date(bookmark.timestamp).toLocaleString()}
                            </p>
                            <div className="mt-2 flex items-center">
                              <a
                                href={generateBookmarkLink(bookmark)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mr-3 flex items-center text-xs text-blue-400 hover:underline"
                                onClick={(e) => e.stopPropagation()} // Prevent bookmark click when clicking the link
                              >
                                <Link size={12} className="mr-1" />
                                Open in new tab
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent bookmark click
                                  copyBookmarkLink(bookmark);
                                }}
                                className="flex items-center text-xs text-slate-400 hover:text-slate-200"
                              >
                                <Share2 size={12} className="mr-1" />
                                Copy link
                              </button>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "log" && (
            // Log tab content
            <div className="h-full overflow-auto">
              {graphLogsLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span className="ml-3">Loading graph logs...</span>
                </div>
              ) : graphLogs.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <History size={48} className="mb-4 text-slate-400" />
                  <h3 className="text-xl font-medium text-slate-300">
                    No graph logs yet
                  </h3>
                  <p className="mt-2 text-slate-400">
                    Graph logs will appear here when you search for concepts.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {graphLogs.map((log) => (
                    <div
                      key={log.id}
                      className="block w-full border-b border-slate-700 last:border-b-0"
                    >
                      <div className="block w-full cursor-pointer px-4 py-3 text-left hover:bg-slate-700">
                        <div className="flex items-start">
                          <History
                            size={18}
                            className="mr-2 mt-1 flex-shrink-0 text-blue-400"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-white">
                              {log.concept}
                            </h3>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                              <span className="text-blue-300">
                                Accessed: {log.accessCount} times
                              </span>
                              <span className="text-yellow-300">
                                Bookmarks: {log.bookmarkCount}
                              </span>
                              <span className="text-slate-400">
                                Last accessed:{" "}
                                {new Date(log.lastAccessed).toLocaleString()}
                              </span>
                              <span className="text-slate-400">
                                Created:{" "}
                                {new Date(log.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="mt-3">
                              <button
                                onClick={() => {
                                  setSearchQuery(log.concept);
                                  handleSearch(log.concept, false);
                                  setActiveTab("explore");
                                }}
                                className="rounded-full bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                              >
                                Load Graph
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default KnowledgeExplorer;
