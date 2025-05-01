/**
 * Generates a prompt for creating a list-based knowledge graph
 */
export function generateListKnowledgeGraphPrompt(category: string): string {
  return `I need you to generate a list of items that belong to the category: "${category}".

What to never do: return only the main concept (we always want a list of items).
What not to do: don't add commas to the end of the lines. A comma is only used to separate the amount from the item (the item name can contain commas).
What to do:
If there are multiple interpretations of an category, use the most widely accepted interpretation. Never return a popular culture or media reference as an item if there is a more general meaning of the item. Users may specify ", movie" etc to reference the popular culture reference.

Return a list of specific items that belong to the category. Format each line as 'amount, item' where amount is a number from 0-100 indicating how popular or significant the item is within the category.

For example:
95, Yellowstone National Park
88, Grand Canyon National Park
75, Yosemite National Park

Try to come up with at least 10-20 possible list items, even if direct items are not obvious.
`;
}

/**
 * Generates a prompt for creating a concept-based knowledge graph
 */
export function generateConceptKnowledgeGraphPrompt(concept: string): string {
  return `I need you to generate a knowledge graph for the concept: "${concept}".

What to never do: return only the main concept (we always want a list of items).
What not to do: don't add commas to the end of the lines. A comma is only used to separate the amount from the item (the item name can contain commas).
What to do:
If there are multiple interpretations of an item, use the most widely accepted interpretation. Never return a popular culture or media reference as an item if there is a more general meaning of the item.

Return a list of related concepts, each on a separate line. Each line should start with a number from 0-100 indicating how closely related the concept is to the central concept, followed by a comma and then the name of the concept.

For example:
90, Neural Networks
75, Backpropagation
60, Loss Functions

Do NOT include headers, explanations, or any text other than the list of "score,concept_name" lines.
Ensure each line has exactly one comma separating the score and the concept name.

The number should represent the relevance or closeness to ${concept}, where 100 is most relevant and 0 is barely related. Provide 15-25 concepts that cover a range of relevance, from closely related (80-100) to more distantly related (30-60).

Be specific, varied, and comprehensive, covering different aspects and applications of ${concept}. Include both broader/parent concepts and narrower/specialized ones.

Try to come up with at least 10-20 possible connections, even if direct connections are not obvious.
`;
}

/**
 * Generates a prompt for creating example search queries for the word cloud
 */
export function generateExampleQueriesPrompt(): string {
  return `Generate a diverse list of 20 interesting and thought-provoking topics or questions that would be good for exploring in a knowledge graph.

Include a mix of:
- Proper nouns (people, places, things)
- Scientific concepts
- Historical events
- Abstract ideas
- Technology topics
- Cultural concepts
- Natural phenomena

Each item should have an "interestingness score" from 10-100, which represents how intriguing or engaging the topic might be for general exploration.

Format each line as 'score, topic' where score is the interestingness number.

For example:
90, Neural Networks
85, Quantum Entanglement
75, The Renaissance
65, Biodiversity
55, Solar System

ONLY return the list with no introduction or explanation. Each entry must be on a separate line with exactly one comma separating the score and the topic name.
`;
}
