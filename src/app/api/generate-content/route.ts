import { generateNodeContentPrompt, sanitizeNodeName } from "@/lib/api-clients";
import { generateText } from "@/lib/api/util";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { node, mainConcept, modelId } = await request.json();

    if (!node || !mainConcept || !modelId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    console.log(`API route: Processing request for model: ${modelId}`);

    // Generate the prompt
    const detailLevel = 1; // Use default detail level if not provided
    const prompt = generateNodeContentPrompt(node, mainConcept, detailLevel);

    try {
      // Use the util.ts generateText function
      const result = await generateText(prompt, modelId);

      return NextResponse.json({ content: result.text });
    } catch (apiError) {
      console.error(`API Error with ${modelId}:`, apiError);

      // Create a more user-friendly error message
      let errorMessage =
        apiError instanceof Error
          ? apiError.message
          : "Unknown API error occurred";

      // Add model-specific context to the error message
      errorMessage = `Failed to generate content for ${sanitizeNodeName(node.name || node.id)}. ${errorMessage}`;

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
