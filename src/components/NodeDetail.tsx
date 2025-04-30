"use client";

import {
  bookmarkArticle,
  isArticleBookmarked,
  removeBookmark,
} from "@/lib/indexeddb";
import { NodeObject } from "@/lib/types";
import { ExternalLink } from "lucide-react";
import { marked } from "marked";
import React, { useCallback, useEffect, useState } from "react";
import MarkdownContent from "./MarkdownContent";

interface NodeDetailProps {
  node: NodeObject;
  summary: string;
  isLoading: boolean;
  detailLevel: number;
  mainConcept: string;
  onExpandDetail?: () => void;
  onFocusNode?: (nodeId: string) => void;
  onExploreNode?: (node: NodeObject) => void;
  onBookmarkToggle?: (isBookmarked: boolean, node?: NodeObject) => void;
}

// Define the code component props interface
interface CodeComponentProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

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

const NodeDetail: React.FC<NodeDetailProps> = ({
  node,
  summary,
  isLoading,
  detailLevel,
  mainConcept,
  onExpandDetail,
  onFocusNode,
  onExploreNode,
  onBookmarkToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [html, setHtml] = useState("");
  const [relatedNodes, setRelatedNodes] = useState<string[]>([]);

  // Check if this is a main entry or a subnode
  const isMainEntry = node.id === mainConcept || node.isMainEntry === true;

  // Debug information to understand what content is available
  useEffect(() => {
    console.log("NodeDetail props:", {
      nodeId: node?.id,
      nodeName: node?.name,
      detailLevel,
      hasNodeContent: !!node?.content,
      nodeContentLength: node?.content?.length || 0,
      hasSummary: !!summary,
      summaryLength: summary?.length || 0,
      contentToUse: node?.content || summary || "",
    });
  }, [node, summary, detailLevel]);

  useEffect(() => {
    if (summary) {
      const parsed = marked.parse(summary);
      setHtml(parsed);

      // Extract links from markdown
      const regex = /\[([^\]]+)\]\(node:([^)]+)\)/g;
      const matches = [...summary.matchAll(regex)];
      const linkedNodes = matches.map((match) => match[2]);
      setRelatedNodes(linkedNodes);
    }
  }, [summary]);

  // Check if the node is bookmarked
  useEffect(() => {
    if (!node || !node.id) return;

    const checkBookmarkStatus = async () => {
      try {
        const isMarked = await isArticleBookmarked(node.id);
        setIsBookmarked(isMarked);
      } catch (error) {
        console.error("Error checking bookmark status:", error);
      }
    };

    checkBookmarkStatus();
  }, [node?.id]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleFocusNode = () => {
    onFocusNode && onFocusNode(node.id);
  };

  const handleToggleBookmark = useCallback(async () => {
    if (!node || !node.id || (!node.content && !summary)) return;

    setIsBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmark(node.id);
        setIsBookmarked(false);
        if (onBookmarkToggle) {
          onBookmarkToggle(false, node);
        }
      } else {
        // Create formatted content with proper title for bookmark
        const contentToSave = node.content || summary;
        const nodeTitle = node.name || node.id;

        // Determine the correct mainConcept based on whether this is a main entry
        // If it's a main entry, use the node's own id as the mainConcept
        const bookmarkMainConcept = isMainEntry ? node.id : mainConcept || "";

        // Create a description that indicates if this is a main concept or related node
        let bookmarkDescription = node.description || "";

        // If this is a related node (not a main entry), add context information
        if (!isMainEntry && mainConcept) {
          bookmarkDescription = `Related concept to ${mainConcept}${bookmarkDescription ? ` - ${bookmarkDescription}` : ""}`;
        }

        // Use the object format for bookmarking
        await bookmarkArticle({
          id: node.id,
          nodeId: node.id,
          title: nodeTitle,
          content: contentToSave,
          mainConcept: bookmarkMainConcept,
          timestamp: Date.now(),
          description: bookmarkDescription,
        });
        setIsBookmarked(true);
        if (onBookmarkToggle) {
          onBookmarkToggle(true, node);
        }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsBookmarkLoading(false);
    }
  }, [node, summary, isBookmarked, onBookmarkToggle, mainConcept, isMainEntry]);

  // Generate a shareable link for the current node
  const generateShareableLink = (): string => {
    const baseUrl = window.location.origin + window.location.pathname;
    const searchParam = encodeURIComponent(mainConcept || "");
    const nodeParam = encodeURIComponent(node.id);
    return `${baseUrl}?q=${searchParam}&node=${nodeParam}`;
  };

  // Copy shareable link to clipboard
  const copyShareableLink = () => {
    const link = generateShareableLink();
    navigator.clipboard.writeText(link).then(
      () => {
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      },
      (err) => {
        console.error("Could not copy link: ", err);
      },
    );
  };

  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      onExpandDetail && onExpandDetail();
    }
  };

  // Near the top of the file, update imports
  const handleViewMainEntry = (e: React.MouseEvent) => {
    // Only prevent default behavior for left clicks (primary mouse button)
    // This allows right-click and middle-click to work normally
    if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (onExploreNode && node) {
        onExploreNode(node);
      }
    }
  };

  // Create a function to generate the URL for the main entry
  const getMainEntryUrl = () => {
    // Get the base URL
    const baseUrl = window.location.origin + window.location.pathname;

    // Add query parameters for the node name
    const nodeName = encodeURIComponent(node.name || node.id);
    return `${baseUrl}?q=${nodeName}&explorerTab=explore`;
  };

  // Only render if we have content
  if (!node) {
    return null;
  }

  // Use node.content or summary prop if provided, and clean it up
  const content = cleanContent(node.content || summary);

  if (!content && !isLoading) {
    return null;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-2 flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3">
        <h2 className="text-lg font-medium text-white">
          {node.name || node.id}
        </h2>
        <button
          onClick={handleToggleBookmark}
          disabled={isBookmarkLoading}
          className={`rounded-full p-1.5 transition-colors ${
            isBookmarked
              ? "text-yellow-400 hover:bg-slate-700"
              : "text-slate-400 hover:bg-slate-700 hover:text-white"
          }`}
          title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          {isBookmarkLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-transparent"></div>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={isBookmarked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isBookmarked ? "fill-yellow-400" : ""}
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          )}
        </button>
      </div>

      {/* If this is a subnode and not a main entry, show a button to view it as main concept */}
      {!isMainEntry && (
        <div className="mb-2 rounded-md bg-blue-900/20 px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span>
              Viewing <strong>{node.name || node.id}</strong> in the context of{" "}
              <strong>{mainConcept}</strong>
            </span>
            <button
              onClick={() => onExploreNode(node)}
              className="ml-2 flex items-center rounded-md bg-blue-700 px-2 py-1 text-xs font-medium text-white hover:bg-blue-600"
            >
              <ExternalLink size={14} className="mr-1" />
              View main entry
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-slate-400">
            Generating content for {node.name || node.id}...
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 py-2">
          <MarkdownContent
            content={summary}
            onNodeClick={(nodeId) => {
              onFocusNode(nodeId);
            }}
          />

          {detailLevel < 3 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={onExpandDetail}
                className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
              >
                Expand details
              </button>
            </div>
          )}

          {relatedNodes.length > 0 && (
            <div className="mb-4 mt-8">
              <h3 className="mb-2 font-medium text-slate-300">
                Related Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedNodes.map((nodeId) => (
                  <button
                    key={nodeId}
                    onClick={() => onFocusNode(nodeId)}
                    className="flex items-center rounded-full bg-slate-700 px-3 py-1.5 text-xs hover:bg-slate-600"
                  >
                    {nodeId}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-1"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NodeDetail;
