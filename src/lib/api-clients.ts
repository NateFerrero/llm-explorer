import { LLMProviderType, ApiResponse, NodeObject } from './types';
import { generateText, generateTextStream } from './api/util';

// We no longer need direct API clients as we'll use the util.ts proxy

// Function to generate a prompt for knowledge graph extraction
export function generateKnowledgeGraphPrompt(concept: string): string {
  return `
    Generate a knowledge graph about "${concept}". Include:
    
    1. Main entities/concepts related to ${concept}
    2. Relationships between these entities
    3. Brief descriptions of each entity
    4. Categories/types for each entity
    
    Format the response as a JSON object with "entities" and "relations" arrays.
  `;
}

// Function to generate a prompt for node content
export function generateNodeContentPrompt(node: NodeObject, mainConcept: string): string {
  return `
    Write a detailed mini-article about "${node.name || node.id}" in the context of ${mainConcept}.
    
    Include:
    - A comprehensive explanation of what ${node.name || node.id} is
    - Its significance and importance in the field
    - Key concepts, principles, or components related to it
    - Real-world applications or examples
    - Current developments or future directions
    
    Format the response as a well-structured article with paragraphs.
    Keep the tone informative, educational, and engaging.
    Length: 300-500 words.
    
    Additional context about this topic:
    ${node.description || ''}
    ${node.categories ? `Categories: ${node.categories.join(', ')}` : ''}
  `;
}

// Function to make an API call to generate knowledge graph
export async function queryLLM(
  prompt: string, 
  modelId: string
): Promise<ApiResponse> {
  try {
    // Use the util.ts generateText function
    const response = await generateText(prompt, modelId);
    
    return {
      success: true,
      data: response.text
    };
  } catch (error) {
    console.error('Error querying LLM:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Function to generate content for a specific node using LLM
export async function generateNodeContent(
  node: NodeObject,
  mainConcept: string,
  modelId: string
): Promise<string> {
  try {
    if (typeof window === 'undefined') {
      throw new Error('Browser environment not available');
    }
    
    // Generate prompt for the node content
    const prompt = generateNodeContentPrompt(node, mainConcept);
    
    console.log(`Using model: ${modelId} for content generation`);
    
    // Use the util.ts generateText function directly
    try {
      const result = await generateText(prompt, modelId);
      return result.text;
    } catch (error) {
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    console.error('Error generating node content:', error);
    return `Failed to generate content for ${node.name || node.id}. ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
  }
}
