// Node and Graph Types for Visualization
export interface NodeObject {
  id: string;
  name?: string;
  val?: number;
  color?: string;
  description?: string;
  categories?: string[];
  connections?: string[];
  group?: string;
  type?: string;
  resources?: {
    title: string;
    url: string;
  }[];
  // Content properties
  content?: string;
  mainConcept?: string;
  // Force graph properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
  isMainEntry?: boolean;
}

export interface LinkObject {
  source: string;
  target: string;
  value?: number;
  label?: string;
  color?: string;
}

export interface GraphData {
  nodes: NodeObject[];
  links: LinkObject[];
}

// API Types
export type LLMProviderType = "openai" | "anthropic" | "gemini";

// Model types
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Knowledge Graph Types
export interface KnowledgeEntity {
  name: string;
  type: string;
  description?: string;
}

export interface KnowledgeRelation {
  source: string;
  target: string;
  type: string;
  description?: string;
}

export interface KnowledgeGraph {
  entities: KnowledgeEntity[];
  relations: KnowledgeRelation[];
}

// Bookmark Types
export interface BookmarkedArticle {
  id: string;
  nodeId: string;
  title: string;
  description?: string;
  content: string;
  mainConcept: string;
  timestamp: number;
  imageUrl?: string;
}
