/**
 * Generates a prompt for creating a knowledge graph around a central concept
 */
export function generateKnowledgeGraphPrompt(concept: string): string {
  return `I need you to generate a knowledge graph for the concept: "${concept}".

Please return a list of related concepts, each on a separate line. Each line should start with a number from 0-100 indicating how closely related the concept is to the central concept, followed by a comma and then the name of the concept.

For example:
90, Neural Networks
75, Backpropagation
60, Loss Functions

The number should represent the relevance or closeness to ${concept}, where 100 is most relevant and 0 is barely related. Provide 15-25 concepts that cover a range of relevance, from closely related (80-100) to more distantly related (30-60).

Be specific, varied, and comprehensive, covering different aspects and applications of ${concept}. Include both broader/parent concepts and narrower/specialized ones.`;
}
