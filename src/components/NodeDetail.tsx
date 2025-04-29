"use client";

import {
  bookmarkArticle,
  isArticleBookmarked,
  removeBookmark,
} from "@/lib/indexeddb";
import { NodeObject } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link,
  Maximize2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

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
    const checkBookmarkStatus = async () => {
      if (node && node.id) {
        try {
          const bookmarked = await isArticleBookmarked(node.id);
          setIsBookmarked(bookmarked);
        } catch (error) {
          console.error("Error checking bookmark status:", error);
          setIsBookmarked(false);
        }
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

  const toggleBookmark = async () => {
    if (!node || !node.id || (!node.content && !summary)) return;

    setIsBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmark(node.id);
        setIsBookmarked(false);
      } else {
        // Create formatted content with proper title for bookmark
        const contentToSave = node.content || summary;
        const nodeTitle = node.name || node.id;

        // Use the object format for bookmarking
        await bookmarkArticle({
          id: node.id,
          nodeId: node.id,
          title: nodeTitle,
          content: contentToSave,
          mainConcept: mainConcept || "",
          timestamp: Date.now(),
          description: node.description || "",
        });
        setIsBookmarked(true);
      }

      // Notify parent component about bookmark change
      if (onBookmarkToggle) {
        onBookmarkToggle(!isBookmarked, node);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsBookmarkLoading(false);
    }
  };

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
    <div className="node-detail relative mb-4 rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <h2 className="mb-2 flex-1 text-xl font-semibold">{node.name}</h2>
        <div className="flex gap-2">
          {isBookmarked && (
            <div className="relative">
              <button
                onClick={copyShareableLink}
                className="text-gray-500 transition-colors hover:text-blue-500 focus:outline-none"
                title="Copy shareable link"
              >
                <Link size={20} />
              </button>
              {showShareTooltip && (
                <div className="absolute right-0 top-full z-10 mt-1 rounded bg-slate-700 px-2 py-1 text-xs text-white shadow-lg">
                  Link copied!
                </div>
              )}
            </div>
          )}
          <button
            onClick={toggleBookmark}
            disabled={isBookmarkLoading}
            className="text-gray-500 transition-colors hover:text-yellow-500 focus:outline-none"
            title={isBookmarked ? "Remove bookmark" : "Bookmark this article"}
          >
            {isBookmarked ? (
              <BookmarkCheck size={20} className="text-yellow-500" />
            ) : (
              <Bookmark size={20} />
            )}
          </button>
          <button
            onClick={handleFocusNode}
            className="text-gray-500 transition-colors hover:text-blue-500 focus:outline-none"
            title="Focus on this node in the graph"
          >
            <Maximize2 size={20} />
          </button>
          <button
            onClick={toggleExpanded}
            className="text-gray-500 transition-colors hover:text-blue-500 focus:outline-none"
            title={isExpanded ? "Collapse content" : "Expand content"}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
          <span className="ml-2 text-sm text-gray-500">Loading content...</span>
        </div>
      ) : (
        <div
          className={`transition-all duration-300 ${!isExpanded ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50" : ""}`}
          onClick={!isExpanded ? toggleExpanded : undefined}
        >
          <AnimatePresence>
            {isExpanded ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="prose prose-sm dark:prose-invert mt-2 max-w-none text-gray-700 dark:text-gray-300">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>

                {/* View main entry button */}
                <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
                  <a
                    href={getMainEntryUrl()}
                    onClick={handleViewMainEntry}
                    className="flex items-center text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink size={16} className="mr-1" />
                    View main entry for {node.name}
                  </a>
                </div>
              </motion.div>
            ) : (
              <div className="group">
                <div className="prose prose-sm dark:prose-invert mt-2 text-gray-700 dark:text-gray-300">
                  {(() => {
                    // Skip titles/headers at the beginning to get to actual content
                    const paragraphs = content
                      .split("\n\n")
                      .filter((p) => !p.trim().startsWith("#"));
                    if (paragraphs.length > 0) {
                      // Get first real paragraph of content - show it all
                      const firstPara = paragraphs[0].trim();
                      return <ReactMarkdown>{firstPara}</ReactMarkdown>;
                    } else {
                      // Fallback if no paragraphs found - show first 500 chars
                      return (
                        <ReactMarkdown>
                          {content.substring(0, 500)}
                        </ReactMarkdown>
                      );
                    }
                  })()}
                </div>

                {/* Visual indicator to expand */}
                <div className="mt-2 flex items-center justify-center text-slate-400 group-hover:text-blue-500">
                  <ChevronDown size={16} className="mr-1" />
                  <span className="text-xs">Click to read more</span>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default NodeDetail;
