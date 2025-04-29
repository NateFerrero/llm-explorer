import { AIServiceError } from "./api/util";
import { cacheArticle, getCachedArticle } from "./indexeddb";
import { NodeObject } from "./types";

// We no longer need direct API clients as we'll use the util.ts proxy

// Function to generate a prompt for knowledge graph extraction using LLM
export function generateKnowledgeGraphPrompt(concept: string): string {
  const nodeCount = 30; // Target number of related concepts
  return `
    Generate a list of concepts related to "${concept}".
    Provide ${nodeCount} related concepts.
    
    For each concept, provide a score from 0 to 100 indicating the strength of its connection to the main concept "${concept}".
    - 100 means the concept is synonymous or extremely closely related.
    - 50 means a moderate, obvious, or default connection.
    - 0 means a very tenuous or barely related connection (if any).
    
    Format each line STRICTLY as: score,concept_name
    Example:
    50,Paint
    70,Drawing
    30,Art Supplies
    90,Pastel Colors
    
    Do NOT include headers, explanations, or any text other than the list of "score,concept_name" lines.
    Ensure each line has exactly one comma separating the score and the concept name.
  `;
}

// Function to generate a prompt for node content with varying detail
export function generateNodeContentPrompt(
  node: NodeObject,
  mainConcept: string,
  detailLevel: number,
): string {
  let instructions = ``;
  let lengthGuidance = "";

  switch (detailLevel) {
    case 1:
      instructions = `Write a concise, one-paragraph summary (around 50-70 words) about "${node.name || node.id}" in the context of ${mainConcept}. Focus on the core definition and significance.`;
      lengthGuidance = "Length: 50-70 words.";
      break;
    case 2:
      instructions = `Write a short article (around 150-200 words) about "${node.name || node.id}" in the context of ${mainConcept}. Include its definition, significance, and one key aspect or principle.`;
      lengthGuidance = "Length: 150-200 words.";
      break;
    case 3:
      instructions = `Write a detailed mini-article (around 300-400 words) about "${node.name || node.id}" in the context of ${mainConcept}. Include a comprehensive explanation, its significance, key principles/components, and a real-world example.`;
      lengthGuidance = "Length: 300-400 words.";
      break;
    default: // Level 4 and above
      instructions = `Write an in-depth article (around 500-700 words, expanding further for levels > 4) about "${node.name || node.id}" in the context of ${mainConcept}. Cover its definition, significance, history (if relevant), key principles/components, multiple real-world applications/examples, current developments, and future directions. Add more depth and examples for higher detail levels (Current level: ${detailLevel}).`;
      lengthGuidance = `Length: ${500 + (detailLevel - 4) * 150}-${700 + (detailLevel - 4) * 200} words.`;
      break;
  }

  return `
    ${instructions}
    
    Format the response as a well-structured article with paragraphs.
    Keep the tone informative, educational, and engaging.
    ${lengthGuidance}
    
    IMPORTANT: Do NOT wrap paragraphs in XML-like tags such as <Paragraph 1> or </Paragraph 1>. Just write natural paragraphs separated by blank lines.
    
    Additional context about this topic:
    ${node.description || ""}
    ${node.categories ? `Categories: ${node.categories.join(", ")}` : ""}
  `;
}

// Function to make an API call to generate knowledge graph
export async function queryLLM(
  prompt: string,
  modelId: string,
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    // Get provider from modelId prefix
    let provider = "openai"; // default
    if (modelId.startsWith("claude")) {
      provider = "anthropic";
    } else if (modelId.startsWith("gemini")) {
      provider = "gemini";
    } else if (modelId.startsWith("ollama")) {
      provider = "ollama";
    }

    // Get API key from localStorage
    const apiKey = localStorage.getItem(`llm_api_key_${provider}`);

    // Use our new API endpoint
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
        model: modelId,
        prompt,
        apiKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result.text };
  } catch (error) {
    console.error("Error querying LLM:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Function to generate content for a specific node using LLM
export async function generateNodeContent(
  node: NodeObject,
  mainConcept: string,
  modelId: string,
  detailLevel: number = 1,
  useCache: boolean = true,
): Promise<string> {
  try {
    // Try to load from cache first if useCache is true
    if (useCache && typeof window !== "undefined") {
      try {
        const cachedContent = await getCachedArticle(
          `article-${node.id}-${detailLevel}-${modelId}`,
        );

        if (cachedContent && cachedContent.content) {
          console.log(
            `Using cached article for "${node.name || node.id}" at detail level ${detailLevel}`,
          );
          return cachedContent.content;
        }
      } catch (error) {
        console.error("Error accessing article cache:", error);
        // Continue with generating the content
      }
    }

    const prompt = generateNodeContentPrompt(node, mainConcept, detailLevel);
    const result = await queryLLM(prompt, modelId);

    if (!result.success || !result.data) {
      throw new Error(
        result.error || "Failed to generate content for this node",
      );
    }

    const content = result.data;

    // Cache the generated content
    if (typeof window !== "undefined") {
      try {
        await cacheArticle({
          id: `article-${node.id}-${detailLevel}-${modelId}`,
          nodeId: node.id,
          concept: mainConcept,
          title: node.name || node.id,
          content: content,
          detailLevel: detailLevel,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Error caching article:", error);
      }
    }

    return content;
  } catch (error) {
    console.error("Error generating node content:", error);
    if (error instanceof AIServiceError) {
      throw error.message;
    }
    throw error instanceof Error ? error.message : String(error);
  }
}
