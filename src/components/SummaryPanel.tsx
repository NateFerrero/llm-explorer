"use client";

import React from "react";
import { NodeObject } from "@/lib/types";
import { Book, RefreshCw, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
interface SummaryPanelProps {
  node: NodeObject | null;
  summary: string;
  isLoading: boolean;
  onRefresh?: () => void;
}
const SummaryPanel: React.FC<SummaryPanelProps> = ({
  node,
  summary,
  isLoading,
  onRefresh
}) => {
  if (!node) {
    return null;
  }
  return <div className="p-4 bg-slate-800 rounded-lg" data-unique-id="f2e72c0f-96a5-442c-9445-d9e10879094a" data-loc="22:9-22:54" data-file-name="components/SummaryPanel.tsx">
      <div className="flex items-center justify-between mb-3" data-unique-id="f99d72bb-e5ff-4f1e-9c7f-d905b2564f5d" data-loc="23:6-23:62" data-file-name="components/SummaryPanel.tsx">
        <div className="flex items-center gap-2" data-unique-id="73b46ead-a31b-4ec1-9362-d141404be8a9" data-loc="24:8-24:49" data-file-name="components/SummaryPanel.tsx">
          <Book size={18} />
          <h3 className="text-lg font-medium" data-unique-id="25d24102-81f9-44a4-b0eb-026cd489863c" data-loc="26:10-26:46" data-file-name="components/SummaryPanel.tsx">AI-Generated Article</h3>
        </div>
        
        {onRefresh && <motion.button whileHover={{
        scale: 1.05
      }} whileTap={{
        scale: 0.95
      }} onClick={onRefresh} disabled={isLoading} className="p-1.5 rounded-full hover:bg-slate-700 transition-colors" title="Regenerate content" data-unique-id="f9f14687-c114-4ba2-a490-ecb2f97fe62a" data-loc="29:22-33:145" data-file-name="components/SummaryPanel.tsx">
            <RefreshCw size={16} className={isLoading ? "animate-spin text-slate-500" : "text-slate-300"} />
          </motion.button>}
      </div>
      
      {isLoading ? <div className="flex flex-col items-center py-6" data-unique-id="39e66d68-4cbf-4685-94f0-323fc0829b58" data-loc="38:19-38:68" data-file-name="components/SummaryPanel.tsx">
          <div className="animate-pulse flex flex-col w-full space-y-4" data-unique-id="630de136-f637-4632-bd2e-a4ef205bec75" data-loc="39:10-39:72" data-file-name="components/SummaryPanel.tsx">
            <div className="h-4 bg-slate-700 rounded w-3/4" data-unique-id="6481b32a-c5dd-4c5f-ad07-71435ff98616" data-loc="40:12-40:60" data-file-name="components/SummaryPanel.tsx"></div>
            <div className="space-y-2" data-unique-id="34d89c11-bc1e-46a2-98ba-bfad58af512c" data-loc="41:12-41:39" data-file-name="components/SummaryPanel.tsx">
              <div className="h-3 bg-slate-700 rounded" data-unique-id="d44abe4e-63c5-468c-b2d1-4f89fd3a1fae" data-loc="42:14-42:56" data-file-name="components/SummaryPanel.tsx"></div>
              <div className="h-3 bg-slate-700 rounded w-5/6" data-unique-id="aeed548f-1c56-43c4-b047-5a53c6f826fd" data-loc="43:14-43:62" data-file-name="components/SummaryPanel.tsx"></div>
              <div className="h-3 bg-slate-700 rounded w-4/6" data-unique-id="8d6e5828-91a1-4f30-83b4-e7f21c4d36ef" data-loc="44:14-44:62" data-file-name="components/SummaryPanel.tsx"></div>
            </div>
            <div className="space-y-2" data-unique-id="253cdea4-18dd-4306-b365-0cd075d52c5f" data-loc="46:12-46:39" data-file-name="components/SummaryPanel.tsx">
              <div className="h-3 bg-slate-700 rounded" data-unique-id="725d5d4a-dc2a-4fb9-8b0b-3a85cb3210bf" data-loc="47:14-47:56" data-file-name="components/SummaryPanel.tsx"></div>
              <div className="h-3 bg-slate-700 rounded w-5/6" data-unique-id="4f8a1085-3e30-4eff-9195-39151174ca7e" data-loc="48:14-48:62" data-file-name="components/SummaryPanel.tsx"></div>
              <div className="h-3 bg-slate-700 rounded w-3/4" data-unique-id="1f7a56eb-3186-484a-a7eb-f61d11d49b1c" data-loc="49:14-49:62" data-file-name="components/SummaryPanel.tsx"></div>
            </div>
            <div className="space-y-2" data-unique-id="dbc690ba-0986-4e14-9f22-ba81d7204a00" data-loc="51:12-51:39" data-file-name="components/SummaryPanel.tsx">
              <div className="h-3 bg-slate-700 rounded w-2/3" data-unique-id="6ffa23c5-e344-4705-ae1f-9dfa37bd4c0b" data-loc="52:14-52:62" data-file-name="components/SummaryPanel.tsx"></div>
              <div className="h-3 bg-slate-700 rounded w-3/4" data-unique-id="73a1a7ef-778d-4d80-a7ee-0f8f4dfccb35" data-loc="53:14-53:62" data-file-name="components/SummaryPanel.tsx"></div>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-4" data-unique-id="0f9ff030-a083-4dc2-8083-105c282ced99" data-loc="56:10-56:53" data-file-name="components/SummaryPanel.tsx">Generating content with AI...</p>
        </div> : summary.includes('Failed to generate content') || summary.includes('Error') ? <div className="bg-red-900/20 border border-red-700/50 rounded-md p-4 text-red-200" data-unique-id="bae86ebd-4d01-4721-917b-9d51dbb93077" data-loc="57:95-57:179" data-file-name="components/SummaryPanel.tsx">
          <div className="flex items-center gap-2 mb-3" data-unique-id="de92fdd3-0b6a-4e4b-afd5-b541e5383e16" data-loc="58:10-58:56" data-file-name="components/SummaryPanel.tsx">
            <AlertCircle size={18} className="text-red-400" />
            <h3 className="text-lg font-medium text-red-300" data-unique-id="45d15580-5183-46b3-8416-3e7fd6773d77" data-loc="60:12-60:61" data-file-name="components/SummaryPanel.tsx">Error</h3>
          </div>
          <p className="text-sm" data-unique-id="95168718-95a0-43df-bbe5-ec1160fd580c" data-loc="62:10-62:33" data-file-name="components/SummaryPanel.tsx">{summary}</p>
          <div className="mt-4 text-xs text-red-300/80" data-unique-id="fae1a789-6b56-4e5f-b0f5-c959177490bf" data-loc="63:10-63:56" data-file-name="components/SummaryPanel.tsx">
            <p data-unique-id="a1443404-b681-424e-b6b3-0fa1cbae0009" data-loc="64:12-64:15" data-file-name="components/SummaryPanel.tsx">Possible solutions:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1" data-unique-id="967d5cfe-c026-48ef-9a7d-e4e8fe6d3112" data-loc="65:12-65:58" data-file-name="components/SummaryPanel.tsx">
              <li data-unique-id="639da2d0-14ea-460c-b758-12a262917580" data-loc="66:14-66:18" data-file-name="components/SummaryPanel.tsx">Check that your API key is correct for the selected provider</li>
              <li data-unique-id="062abfde-9ae6-4038-97b5-c71183186bf7" data-loc="67:14-67:18" data-file-name="components/SummaryPanel.tsx">Try switching to a different AI model using the model selector next to the Explore button</li>
              <li data-unique-id="69d013a8-1f1a-47b4-9118-326e4ddd8596" data-loc="68:14-68:18" data-file-name="components/SummaryPanel.tsx">Make sure you have sufficient credits/quota with your provider</li>
              <li data-unique-id="895d36f2-885f-4938-b0fc-c955617dc718" data-loc="69:14-69:18" data-file-name="components/SummaryPanel.tsx">Try again in a few moments</li>
            </ul>
          </div>
        </div> : <div className="text-slate-300 text-sm space-y-3 max-h-[400px] overflow-y-auto pr-2 detail-panel" data-unique-id="53d5dd20-715a-423f-8954-9a16f38b47ff" data-loc="72:17-72:115" data-file-name="components/SummaryPanel.tsx">
          {summary.split('\n\n').map((paragraph, i) => {
        // Handle markdown headings
        if (paragraph.trim().startsWith('# ')) {
          return <h2 key={i} className="text-xl font-bold text-blue-300" data-unique-id="69a5e425-efc2-40a2-8519-d787ceb4d0c4" data-loc="76:17-76:73" data-file-name="components/SummaryPanel.tsx">
                  {paragraph.trim().replace(/^# /, '')}
                </h2>;
        } else if (paragraph.trim().startsWith('## ')) {
          return <h3 key={i} className="text-lg font-semibold text-blue-200" data-unique-id="eba715e9-8f77-451f-9baa-6cbfd08a9f40" data-loc="80:17-80:77" data-file-name="components/SummaryPanel.tsx">
                  {paragraph.trim().replace(/^## /, '')}
                </h3>;
        } else if (paragraph.trim().startsWith('- ')) {
          // Handle bullet points
          return <ul key={i} className="list-disc pl-5 space-y-1" data-unique-id="af277595-1ec5-410a-87eb-c6d3a20ca0d3" data-loc="85:17-85:66" data-file-name="components/SummaryPanel.tsx">
                  {paragraph.split('\n').map((item, j) => <li key={`${i}-${j}`} className="leading-relaxed" data-unique-id="e8f3c8d7-4a70-4a7d-a41b-7700e897305f" data-loc="86:58-86:108" data-file-name="components/SummaryPanel.tsx">
                      {item.trim().replace(/^- /, '')}
                    </li>)}
                </ul>;
        } else if (paragraph.trim().startsWith('*')) {
          // Handle italic text
          return <p key={i} className="leading-relaxed italic text-slate-400" data-unique-id="64b84112-0fcc-415a-aec5-793cad24daf8" data-loc="92:17-92:78" data-file-name="components/SummaryPanel.tsx">
                  {paragraph.trim().replace(/^\*|\*$/g, '')}
                </p>;
        } else if (paragraph.trim()) {
          // Regular paragraphs
          return <p key={i} className="leading-relaxed" data-unique-id="b99a7436-a136-4d52-8582-b362632d7c0d" data-loc="97:17-97:56" data-file-name="components/SummaryPanel.tsx">
                  {paragraph}
                </p>;
        }
        return null;
      })}
        </div>}
    </div>;
};
export default SummaryPanel;