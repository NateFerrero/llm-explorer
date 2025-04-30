"use client";

import { X } from "lucide-react";
import React, { useState } from "react";

interface HelpCenterProps {
  onClose: () => void;
}

const HelpCenter: React.FC<HelpCenterProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<"about" | "privacy">(
    "about",
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative flex h-[80vh] w-[90vw] max-w-4xl flex-col rounded-lg border border-slate-700 bg-slate-800 shadow-xl md:w-[80vw]">
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <h2 className="text-xl font-semibold text-white">
            Knowledge Explorer Help
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-full flex-col md:flex-row">
          {/* Sidebar for navigation */}
          <div className="border-b border-slate-700 bg-slate-900 p-2 md:w-1/4 md:border-b-0 md:border-r">
            <button
              onClick={() => setActiveSection("about")}
              className={`mb-1 w-full rounded-md px-4 py-2 text-left ${
                activeSection === "about"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              About Knowledge Explorer
            </button>
            <button
              onClick={() => setActiveSection("privacy")}
              className={`w-full rounded-md px-4 py-2 text-left ${
                activeSection === "privacy"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              Privacy Policy
            </button>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === "about" && (
              <div className="prose prose-invert max-w-none">
                <h3>About Knowledge Explorer</h3>
                <p>
                  Knowledge Explorer is an interactive tool that helps you
                  visualize and explore knowledge graphs generated from various
                  concepts. It uses AI to create connected networks of ideas
                  related to your search queries.
                </p>

                <h4>Key Features</h4>
                <ul>
                  <li>
                    <strong>Interactive Graph:</strong> Visualize connections
                    between concepts with an interactive force-directed graph.
                  </li>
                  <li>
                    <strong>AI-generated Content:</strong> Detailed information
                    about each concept is generated dynamically.
                  </li>
                  <li>
                    <strong>Bookmarking:</strong> Save interesting articles and
                    concepts for later reference.
                  </li>
                  <li>
                    <strong>Search History:</strong> Track your exploration
                    journey with a comprehensive search history.
                  </li>
                  <li>
                    <strong>Offline Access:</strong> Once generated, graphs and
                    content are cached locally for faster access.
                  </li>
                </ul>

                <h4>How to Use</h4>
                <ol>
                  <li>
                    Enter a concept or topic in the search bar and click
                    "Explore"
                  </li>
                  <li>
                    Click on nodes in the graph to learn more about specific
                    concepts
                  </li>
                  <li>
                    Use the toolbar to zoom, pan, and adjust the graph layout
                  </li>
                  <li>Bookmark interesting articles for future reference</li>
                  <li>Access your exploration history in the Log tab</li>
                </ol>

                <h4>Graph Controls</h4>
                <ul>
                  <li>
                    <strong>Zoom In/Out:</strong> Magnify or reduce the graph
                    view
                  </li>
                  <li>
                    <strong>Fit to View:</strong> Reset the graph to fit in the
                    viewport
                  </li>
                  <li>
                    <strong>Center:</strong> Center the graph in the viewport
                  </li>
                  <li>
                    <strong>Hard Reload:</strong> Force regeneration of the
                    current graph
                  </li>
                  <li>
                    <strong>Layout Adjustment:</strong> Optimize the spacing of
                    nodes
                  </li>
                  <li>
                    <strong>Selection/Pan Mode:</strong> Toggle between
                    selecting nodes and panning the graph
                  </li>
                  <li>
                    <strong>Lock/Unlock:</strong> Fix the graph layout in place
                    or allow it to move
                  </li>
                  <li>
                    <strong>Auto-center Selection:</strong> Automatically center
                    the graph on selected nodes
                  </li>
                </ul>
              </div>
            )}

            {activeSection === "privacy" && (
              <div className="prose prose-invert max-w-none">
                <h3>Privacy Policy</h3>
                <p>
                  This Privacy Policy explains how Knowledge Explorer collects,
                  uses, and protects your data when you use our application.
                </p>

                <h4>Data Storage</h4>
                <p>
                  Knowledge Explorer uses <strong>local browser storage</strong>{" "}
                  (IndexedDB) to store the following information:
                </p>
                <ul>
                  <li>Knowledge graphs you've generated</li>
                  <li>Generated content for concepts you've explored</li>
                  <li>Your search history</li>
                  <li>Bookmarks you've created</li>
                  <li>Your selected AI model and configuration</li>
                </ul>

                <p>
                  <strong>This data never leaves your device</strong> - it is
                  stored entirely in your browser's local storage. We do not
                  collect, transfer, or store any of this information on our
                  servers.
                </p>

                <h4>API Keys</h4>
                <p>
                  If you use OpenAI, Anthropic, or any other external API
                  provider with this application, your API keys are stored
                  securely in your browser's localStorage. These keys are only
                  used to make requests to the respective API services directly
                  from your browser.
                </p>

                <h4>Analytics and Third-Party Services</h4>
                <p>
                  Knowledge Explorer is hosted on Vercel and is subject to
                  Vercel's privacy policy and analytics. Vercel may collect
                  anonymous usage statistics such as page views and error
                  reports. For more information, please see{" "}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Vercel's Privacy Policy
                  </a>
                  .
                </p>

                <h4>AI Model Usage</h4>
                <p>
                  When you use Knowledge Explorer with an external AI service:
                </p>
                <ul>
                  <li>
                    Your search queries and interactions are sent to the
                    selected AI model provider (like OpenAI or Anthropic)
                  </li>
                  <li>
                    These providers may log and store these queries according to
                    their own privacy policies
                  </li>
                  <li>
                    We recommend reviewing the privacy policy of the AI service
                    you choose to use
                  </li>
                </ul>

                <h4>Data Clearing</h4>
                <p>You can clear all locally stored data by:</p>
                <ul>
                  <li>
                    Using your browser's developer tools to clear IndexedDB
                    storage
                  </li>
                  <li>Clearing your browser's localStorage</li>
                  <li>Using the "Sign Out" button to clear API keys</li>
                </ul>

                <h4>Contact</h4>
                <p>
                  If you have any questions or concerns about your privacy while
                  using Knowledge Explorer, please reach out to the developer
                  through the repository or project contact information.
                </p>

                <p className="mt-6 text-sm text-slate-400">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
