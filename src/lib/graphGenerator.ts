import { generateKnowledgeGraphPrompt, queryLLM } from "./api-clients";
import { cacheKnowledgeGraph, getCachedKnowledgeGraph } from "./indexeddb";
import { GraphData, LinkObject, NodeObject } from "./types";

// Helper function to get color based on score (0-100)
function getColorForScore(score: number): string {
  // Clamp score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, score));

  if (clampedScore <= 50) {
    // Interpolate between Red (0) and Yellow (50)
    const percentage = clampedScore / 50;
    // Start with Red (255, 0, 0), move towards Yellow (255, 255, 0)
    const green = Math.round(255 * percentage);
    return `rgb(255, ${green}, 0)`;
  } else {
    // Interpolate between Yellow (50) and Green (100)
    const percentage = (clampedScore - 50) / 50;
    // Start with Yellow (255, 255, 0), move towards Green (0, 255, 0)
    const red = Math.round(255 * (1 - percentage));
    return `rgb(${red}, 255, 0)`;
  }
}

// Function to sanitize node names by trimming whitespace and removing trailing commas
function sanitizeNodeName(name: string): string {
  // First trim whitespace, then remove any trailing commas
  return name.trim().replace(/,+$/, "");
}

export async function generateKnowledgeGraph(
  concept: string,
  modelId: string,
  skipCache: boolean = false,
  useCache: boolean = true,
): Promise<GraphData> {
  // Sanitize the main concept
  const sanitizedConcept = sanitizeNodeName(concept);

  console.log(
    `Generating knowledge graph for "${sanitizedConcept}" using model ${modelId}`,
  );

  // Skip cache if skipCache is true, otherwise check useCache
  const shouldUseCache = !skipCache && useCache;

  // Try to load from cache first if we should use cache
  if (shouldUseCache && typeof window !== "undefined") {
    try {
      const cachedGraph = await getCachedKnowledgeGraph(sanitizedConcept);
      if (cachedGraph) {
        console.log(`Using cached knowledge graph for "${sanitizedConcept}"`);

        // Ensure no residual positioning info is kept from previous visualizations
        // by creating a clean copy of the graph with initial positions reset
        const cleanGraph: GraphData = {
          nodes: cachedGraph.nodes.map((node) => ({
            ...node,
            x: undefined,
            y: undefined,
            vx: undefined,
            vy: undefined,
          })),
          links: cachedGraph.links.map((link) => ({ ...link })),
        };

        return cleanGraph;
      }
    } catch (error) {
      console.error("Error accessing cache:", error);
      // Continue with generating the graph
    }
  }

  const nodes: NodeObject[] = [];
  const links: LinkObject[] = [];

  // Add the main concept node
  const mainConceptNode: NodeObject = {
    id: sanitizedConcept,
    name: sanitizedConcept,
    val: 50, // Give main concept a decent default size value
    color: "#e91e63", // Keep main concept distinct (Pink)
    description: `Main concept: ${sanitizedConcept}`,
  };
  nodes.push(mainConceptNode);

  try {
    // 1. Generate the prompt
    const prompt = generateKnowledgeGraphPrompt(sanitizedConcept);

    // 2. Query the LLM
    const response = await queryLLM(prompt, modelId);

    if (!response.success || !response.data) {
      throw new Error(
        response.error || "LLM query failed with no specific error message.",
      );
    }

    // 3. Parse the LLM response
    const lines = response.data
      .split("\n")
      .filter((line: string) => line.trim() !== "");
    console.log(
      `Received ${lines.length} lines from LLM for graph generation.`,
    );

    lines.forEach((line: string, index: number) => {
      try {
        const parts = line.split(",");
        if (parts.length < 2) {
          console.warn(`Skipping malformed line (no comma): ${line}`);
          return; // Skip this line
        }

        const scoreStr = parts[0].trim();
        let conceptName = parts.slice(1).join(","); // Join back in case concept name had commas

        // Sanitize the concept name to remove trailing commas and whitespace
        conceptName = sanitizeNodeName(conceptName);

        const score = parseInt(scoreStr, 10);

        if (isNaN(score) || score < 0 || score > 100) {
          console.warn(
            `Skipping line with invalid score (${scoreStr}): ${line}`,
          );
          return; // Skip if score is invalid
        }

        if (!conceptName) {
          console.warn(`Skipping line with empty concept name: ${line}`);
          return; // Skip if concept name is empty
        }

        // Prevent adding duplicate nodes (case-insensitive check)
        if (
          nodes.some((n) => n.id.toLowerCase() === conceptName.toLowerCase())
        ) {
          console.warn(`Skipping duplicate concept: ${conceptName}`);
          return;
        }

        // Create node
        const newNode: NodeObject = {
          id: conceptName, // Use sanitized concept name as ID
          name: conceptName,
          val: score, // Use score for node size value
          color: getColorForScore(score), // Set color based on score
          description: `Related concept to ${sanitizedConcept} (Score: ${score})`,
        };
        nodes.push(newNode);

        // Create link from main concept
        const newLink: LinkObject = {
          source: mainConceptNode.id,
          target: newNode.id,
          value: score / 100, // Normalize score for link value (e.g., thickness/opacity)
        };
        links.push(newLink);
      } catch (parseError) {
        console.error(`Error parsing line ${index + 1}: "${line}"`, parseError);
        // Continue processing other lines
      }
    });
  } catch (error) {
    console.error(
      `Failed to generate or parse knowledge graph from LLM for concept "${sanitizedConcept}":`,
      error,
    );
    // Return a minimal graph with just the main node and an error description
    mainConceptNode.description += `\n\nError generating related concepts: ${error instanceof Error ? error.message : "Unknown error"}`;
    // Optionally, add a single error node?
    // nodes.push({ id: "error-node", name: "Error", val: 10, color: "red", description: ... });
  }

  const graphData: GraphData = { nodes, links };

  // Cache the generated graph
  if (typeof window !== "undefined") {
    try {
      await cacheKnowledgeGraph(sanitizedConcept, graphData);
    } catch (error) {
      console.error("Error caching knowledge graph:", error);
    }
  }

  console.log(
    `Generated graph with ${nodes.length} nodes and ${links.length} links.`,
  );
  return graphData;
}

// Removed generateRelatedConcepts function
// Removed getNodeColorByType function
// Removed generateSampleResources function
