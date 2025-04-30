/**
 * Generates a prompt for creating a knowledge graph around a central concept
 */
export function generateKnowledgeGraphPrompt(concept: string): string {
  return `I need you to generate a knowledge graph for the category or concept: "${concept}".

What to never do: return only the main concept.

What to do:
If there are multiple interpretations of an item, use the most widely accepted interpretation. Never return a popular culture or media reference as an item if there is a more general meaning of the item. Users may specify ", movie" etc to reference the popular culture reference.
Always return a list of items with the specific format of lines of 'amount, item' where amount is a number from 0-100 indicating how popular the item is within the category or how closely related the concept is to the central concept.

There are two situations: (1) === OR === (2)
(1) this is a category that defines a list of items matching the category, return a list of items, in the format of lines of 'amount, item' where amount is a number from 0-100 indicating how popular the item is within the category.

Try to come up with at least 10-20 possible list items, even if direct items are not obvious.

=== OR ===

(2) or this is a concept, in that case please return a list of related concepts, each on a separate line. Each line should start with a number from 0-100 indicating how closely related the concept is to the central concept, followed by a comma and then the name of the concept.

For example:
90, Neural Networks
75, Backpropagation
60, Loss Functions

The number should represent the relevance or closeness to ${concept}, where 100 is most relevant and 0 is barely related. Provide 15-25 concepts that cover a range of relevance, from closely related (80-100) to more distantly related (30-60).

Be specific, varied, and comprehensive, covering different aspects and applications of ${concept}. Include both broader/parent concepts and narrower/specialized ones.

Try to come up with at least 10-20 possible connections, even if direct connections are not obvious.
`;
}
