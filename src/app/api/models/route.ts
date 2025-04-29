import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider")?.toLowerCase();
  const apiKey = searchParams.get("apiKey");

  if (!provider) {
    return NextResponse.json(
      { error: "Provider parameter is required" },
      { status: 400 },
    );
  }

  try {
    // Handle different providers
    switch (provider) {
      case "anthropic":
        return await fetchAnthropicModels(apiKey);
      case "openai":
        return await fetchOpenAIModels(apiKey);
      case "gemini":
        return await fetchGeminiModels(apiKey);
      case "ollama":
        return await fetchOllamaModels();
      default:
        return NextResponse.json(
          { error: `Provider '${provider}' not supported` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error(`Error fetching models for provider ${provider}:`, error);
    return NextResponse.json(
      {
        error: `Failed to fetch models: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}

async function fetchAnthropicModels(apiKey?: string | null) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is required for Anthropic" },
      { status: 400 },
    );
  }

  try {
    console.log(
      "Fetching Anthropic models with API key:",
      apiKey.substring(0, 5) + "...",
    );

    const response = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });

    console.log("Anthropic API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return NextResponse.json(
        { error: `Anthropic API error: ${response.status} - ${errorText}` },
        { status: response.status },
      );
    }

    const responseText = await response.text();
    console.log("Anthropic API raw response:", responseText);

    // Try to parse the JSON response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Anthropic API response:", parseError);
      return NextResponse.json(
        { error: "Failed to parse Anthropic API response" },
        { status: 500 },
      );
    }

    // Check the structure of the data
    console.log("Parsed data keys:", Object.keys(data));

    // Handle the case where models is not an array
    if (!data || !data.models) {
      console.error("Anthropic API response missing models array:", data);

      // Define some default Claude models
      const defaultClaudeModels = [
        {
          id: "claude-3-opus-20240229",
          name: "Claude 3 Opus",
          provider: "Anthropic",
          description:
            "Anthropic's most powerful model with exceptional intelligence",
          capabilities: [
            "Knowledge Graph Generation",
            "Detailed Explanations",
            "Reasoning",
          ],
        },
        {
          id: "claude-3-sonnet-20240229",
          name: "Claude 3 Sonnet",
          provider: "Anthropic",
          description:
            "Balanced Claude model with strong intelligence at faster speeds",
          capabilities: [
            "Knowledge Graph Generation",
            "Detailed Explanations",
            "Reasoning",
          ],
        },
        {
          id: "claude-3-haiku-20240307",
          name: "Claude 3 Haiku",
          provider: "Anthropic",
          description:
            "Fastest, most compact Claude model for high-volume tasks",
          capabilities: [
            "Knowledge Graph Generation",
            "Detailed Explanations",
            "Reasoning",
          ],
        },
        {
          id: "claude-2.1",
          name: "Claude 2.1",
          provider: "Anthropic",
          description:
            "Previous generation Claude model for general purpose use",
          capabilities: [
            "Knowledge Graph Generation",
            "Detailed Explanations",
            "Reasoning",
          ],
        },
      ];

      return NextResponse.json({
        models: defaultClaudeModels,
        note: "Using default Claude models due to API structure mismatch",
      });
    }

    // If data.models is not an array, handle that case
    if (!Array.isArray(data.models)) {
      console.error(
        "Anthropic API response 'models' is not an array:",
        data.models,
      );
      return NextResponse.json(
        {
          error:
            "Unexpected response format from Anthropic API: 'models' is not an array",
        },
        { status: 500 },
      );
    }

    const models = data.models.map((model: any) => ({
      id: model.id,
      name: model.id.includes("claude") ? `Claude (${model.id})` : model.id,
      provider: "Anthropic",
      description:
        "Anthropic's Claude model with strong reasoning and conversation abilities",
      capabilities: [
        "Knowledge Graph Generation",
        "Detailed Explanations",
        "Reasoning",
      ],
    }));

    return NextResponse.json({ models });
  } catch (error) {
    console.error("Error fetching Anthropic models:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch Anthropic models: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}

async function fetchOpenAIModels(apiKey?: string | null) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is required for OpenAI" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} - ${errorText}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Filter for more recent models
    const relevantModels = data.data
      .filter(
        (model: any) =>
          model.id.includes("gpt-4") || model.id.includes("gpt-3.5"),
      )
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        provider: "OpenAI",
        description:
          "OpenAI's advanced language model with reasoning capabilities",
        capabilities: [
          "Knowledge Graph Generation",
          "Detailed Explanations",
          "Reasoning",
        ],
      }));

    return NextResponse.json({ models: relevantModels });
  } catch (error) {
    console.error("Error fetching OpenAI models:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch OpenAI models: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}

async function fetchGeminiModels(apiKey?: string | null) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is required for Gemini" },
      { status: 400 },
    );
  }

  // For Gemini, we'll just return the predefined models since their API
  // doesn't have a straightforward models endpoint like the others
  const geminiModels = [
    {
      id: "gemini-pro",
      name: "Gemini Pro",
      provider: "Google",
      description:
        "Google's versatile model optimized for text, code, and reasoning tasks",
      capabilities: ["Code Generation", "Detailed Explanations", "Reasoning"],
    },
    {
      id: "gemini-pro-vision",
      name: "Gemini Pro Vision",
      provider: "Google",
      description: "Gemini model with image understanding capabilities",
      capabilities: [
        "Image Understanding",
        "Detailed Explanations",
        "Reasoning",
      ],
    },
  ];

  // Validate the API key by making a simple request
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Gemini API error: ${response.status} - ${errorText}` },
        { status: response.status },
      );
    }

    return NextResponse.json({ models: geminiModels });
  } catch (error) {
    console.error("Error validating Gemini API key:", error);
    return NextResponse.json(
      {
        error: `Failed to validate Gemini API key: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}

async function fetchOllamaModels() {
  try {
    const response = await fetch("http://localhost:11434/api/tags", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Ollama API error: ${response.status} - ${errorText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    const ollamaModels = data.models.map((model: any) => {
      // Prepare display name (often nicer without ':latest')
      let displayName = model.name;
      if (displayName.endsWith(":latest")) {
        displayName = displayName.substring(
          0,
          displayName.lastIndexOf(":latest"),
        );
      }
      // Capitalize first letter for display name
      displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

      return {
        id: `ollama-${model.name}`,
        name: displayName,
        provider: "Ollama",
        description: `Locally hosted ${model.name} model running on your own hardware`,
        capabilities: ["Local Execution", "Privacy", "Fast Response"],
      };
    });

    return NextResponse.json({ models: ollamaModels });
  } catch (error) {
    console.error("Error fetching Ollama models:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch Ollama models: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
