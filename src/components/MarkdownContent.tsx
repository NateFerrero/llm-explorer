import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

// Define the component props
interface MarkdownContentProps {
  content: string;
  onNodeClick?: (nodeId: string) => void;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  onNodeClick,
}) => {
  // Parse node links from markdown content
  const components = {
    a: ({ node, children, href, ...props }: any) => {
      // Check if this is a node link
      if (href && href.startsWith("node:")) {
        const nodeId = href.replace("node:", "");

        return (
          <button
            onClick={(e) => {
              e.preventDefault();
              if (onNodeClick) {
                onNodeClick(nodeId);
              }
            }}
            className="inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-sm font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50"
            {...props}
          >
            {children}
          </button>
        );
      }

      // External link
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
          {...props}
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
