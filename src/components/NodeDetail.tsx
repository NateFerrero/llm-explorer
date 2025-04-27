"use client";

import React from "react";
import { NodeObject } from "@/lib/types";
import SummaryPanel from "./SummaryPanel";
import { ExternalLink, Tag, Focus } from "lucide-react";
import { motion } from "framer-motion";
interface NodeDetailProps {
  node: NodeObject;
  summary: string;
  isLoading: boolean;
  onFocusNode?: (nodeId: string) => void;
}
const NodeDetail: React.FC<NodeDetailProps> = ({
  node,
  summary,
  isLoading,
  onFocusNode
}) => {
  return <div className="space-y-4" data-unique-id="f3b7c2f9-3c8a-4e69-baf7-4239d21a6b50" data-loc="20:9-20:36" data-file-name="components/NodeDetail.tsx">
      <div className="border-b border-slate-700 pb-4" data-unique-id="1eafd6f4-3943-4677-82ee-df105001aef1" data-loc="21:6-21:54" data-file-name="components/NodeDetail.tsx">
        <h2 className="text-xl font-bold mb-2" data-unique-id="5ae35ff7-b974-4a6a-a47c-4c055c20772e" data-loc="22:8-22:47" data-file-name="components/NodeDetail.tsx">{node.id}</h2>
        
        <div className="flex flex-wrap gap-2 mb-3" data-unique-id="f50295e2-d8f6-4736-935a-3b836ba72927" data-loc="24:8-24:51" data-file-name="components/NodeDetail.tsx">
          {node.categories?.map((category, index) => <span key={index} className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full flex items-center" data-unique-id="4f299438-aa02-4dd0-a3e6-3f13bab33ff5" data-loc="25:53-25:161" data-file-name="components/NodeDetail.tsx">
              <Tag size={12} className="mr-1" />
              {category}
            </span>)}
        </div>
        
        {node.description && <p className="text-slate-300 text-sm" data-unique-id="f561bc4b-b4db-41db-b955-18786f895811" data-loc="31:29-31:67" data-file-name="components/NodeDetail.tsx">{node.description}</p>}
      </div>
      
      <SummaryPanel node={node} summary={summary} isLoading={isLoading} onRefresh={onFocusNode ? () => onFocusNode(node.id) : undefined} />
      
      {node.connections && node.connections.length > 0 && <div className="border-t border-slate-700 pt-4" data-unique-id="7c1955e5-7d0d-4c49-af69-34b79d3b3ff1" data-loc="36:58-36:106" data-file-name="components/NodeDetail.tsx">
          <h3 className="text-sm font-medium text-slate-400 mb-2" data-unique-id="93cfcbd5-d849-4367-ba26-dd795fcfe196" data-loc="37:10-37:66" data-file-name="components/NodeDetail.tsx">Connected Concepts</h3>
          <ul className="grid grid-cols-1 gap-2" data-unique-id="75921081-92f2-4d96-900e-6c046983d2ff" data-loc="38:10-38:49" data-file-name="components/NodeDetail.tsx">
            {node.connections.map((connection, index) => <li key={index} className="text-sm" data-unique-id="d47ea767-368b-40fe-9268-d3c2e180f313" data-loc="39:57-39:93" data-file-name="components/NodeDetail.tsx">
                <motion.button whileHover={{
            scale: 1.02
          }} whileTap={{
            scale: 0.98
          }} className="w-full text-left bg-slate-700/50 hover:bg-slate-700 p-2 rounded-md flex items-center justify-between group transition-colors" onClick={() => onFocusNode && onFocusNode(connection)} data-unique-id="55e368f4-712f-4c9d-bd39-70d4d71b0576" data-loc="40:16-44:205" data-file-name="components/NodeDetail.tsx">
                  <span className="text-blue-300" data-unique-id="d61cac8b-38b4-4c84-bcc5-9504cc802fbc" data-loc="45:18-45:50" data-file-name="components/NodeDetail.tsx">{connection}</span>
                  <span className="text-slate-400 group-hover:text-blue-300 flex items-center gap-1" data-unique-id="4b4f93ce-1fe5-4a54-98f6-14c22692118b" data-loc="46:18-46:101" data-file-name="components/NodeDetail.tsx">
                    <Focus size={14} data-unique-id={`c0ad7f90-c133-4ae7-8a2d-59412320812f_${index}`} data-loc="47:20-47:39" data-file-name="components/NodeDetail.tsx" />
                    <span className="text-xs" data-unique-id="c5abd069-5c01-4c4c-9148-96ffa5124b19" data-loc="48:20-48:46" data-file-name="components/NodeDetail.tsx">Focus</span>
                  </span>
                </motion.button>
              </li>)}
          </ul>
        </div>}
      
      {node.resources && node.resources.length > 0 && <div className="border-t border-slate-700 pt-4" data-unique-id="101b22ce-d2fe-4671-9959-f2911550e306" data-loc="55:54-55:102" data-file-name="components/NodeDetail.tsx">
          <h3 className="text-sm font-medium text-slate-400 mb-2" data-unique-id="cef7295a-78d1-4267-b80e-cb1182a0fa75" data-loc="56:10-56:66" data-file-name="components/NodeDetail.tsx">Related Resources</h3>
          <ul className="space-y-2" data-unique-id="370d2159-37d5-4f2d-a666-0468dd390d1c" data-loc="57:10-57:36" data-file-name="components/NodeDetail.tsx">
            {node.resources.map((resource, index) => <li key={index} className="text-sm" data-unique-id="c8b9e8e6-1f48-443f-bf23-a7f39c412dff" data-loc="58:53-58:89" data-file-name="components/NodeDetail.tsx">
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center" data-unique-id="add9f691-9f93-4404-9bff-23691d7b5864" data-loc="59:16-59:145" data-file-name="components/NodeDetail.tsx">
                  <span data-unique-id="09f92a0f-6535-449a-b8f0-2785a35c2bd7" data-loc="60:18-60:24" data-file-name="components/NodeDetail.tsx">{resource.title}</span>
                  <ExternalLink size={14} className="ml-1" data-unique-id={`0a95df37-8896-4a57-9de4-bc19af90b139_${index}`} data-loc="61:18-61:61" data-file-name="components/NodeDetail.tsx" />
                </a>
              </li>)}
          </ul>
        </div>}
    </div>;
};
export default NodeDetail;