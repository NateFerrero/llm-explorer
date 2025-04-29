import { NextRequest, NextResponse } from "next/server";

type GenerationRequest = {
  provider: string;
  model: string;
  prompt: string;
  stream?: boolean;
  imageUrls?: string[];
  apiKey?: string; // Allow API key to be passed from client
};

type TextGenerationResult = {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
};

export async function POST(request: NextRequest) {
  try {
    const data: GenerationRequest = await request.json();

    if (!data.provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 },
      );
    }

    if (!data.model) {
      return NextResponse.json({ error: "Model is required" }, { status: 400 });
    }

    if (!data.prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    const provider = data.provider.toLowerCase();

    switch (provider) {
      case "openai":
        return await generateOpenAI(data);
      case "anthropic":
        return await generateAnthropic(data);
      case "gemini":
        return await generateGemini(data);
      case "ollama":
        return await generateOllama(data);
      default:
        return NextResponse.json(
          { error: `Provider '${provider}' not supported` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      {
        error: `Failed to generate content: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}

async function generateOpenAI(data: GenerationRequest): Promise<NextResponse> {
  // Use the API key from the request or from environment variables
  const apiKey = data.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is required" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: data.model,
        messages: [
          {
            role: "user",
            content: data.prompt,
          },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} - ${errorData}` },
        { status: response.status },
      );
    }

    const result = await response.json();

    const generationResult: TextGenerationResult = {
      text: result.choices[0].message.content,
      usage: {
        promptTokens: result.usage.prompt_tokens,
        completionTokens: result.usage.completion_tokens,
        totalTokens: result.usage.total_tokens,
      },
      finishReason: result.choices[0].finish_reason,
    };

    return NextResponse.json(generationResult);
  } catch (error) {
    console.error("Error generating content with OpenAI:", error);
    return NextResponse.json(
      {
        error: `Failed to generate content with OpenAI: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}

async function generateAnthropic(
  data: GenerationRequest,
): Promise<NextResponse> {
  // Use the API key from the request or from environment variables
  const apiKey = data.apiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Anthropic API key is required" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: data.model,
        messages: [
          {
            role: "user",
            content: data.prompt,
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: `Anthropic API error: ${response.status} - ${errorData}` },
        { status: response.status },
      );
    }

    const result = await response.json();

    const generationResult: TextGenerationResult = {
      text: result.content[0].text,
      usage: {
        promptTokens: result.usage?.input_tokens || 0,
        completionTokens: result.usage?.output_tokens || 0,
        totalTokens:
          (result.usage?.input_tokens || 0) +
          (result.usage?.output_tokens || 0),
      },
      finishReason: result.stop_reason,
    };

    return NextResponse.json(generationResult);
  } catch (error) {
    console.error("Error generating content with Anthropic:", error);
    return NextResponse.json(
      {
        error: `Failed to generate content with Anthropic: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}

async function generateGemini(data: GenerationRequest): Promise<NextResponse> {
  // Use the API key from the request or from environment variables
  const apiKey = data.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is required" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${data.model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: data.prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: `Gemini API error: ${response.status} - ${errorData}` },
        { status: response.status },
      );
    }

    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text || "";

    const generationResult: TextGenerationResult = {
      text,
      usage: {
        promptTokens: data.prompt.length / 4, // Rough estimate
        completionTokens: text.length / 4, // Rough estimate
        totalTokens: (data.prompt.length + text.length) / 4,
      },
      finishReason: result.candidates[0].finishReason || "stop",
    };

    return NextResponse.json(generationResult);
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    return NextResponse.json(
      {
        error: `Failed to generate content with Gemini: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}

async function generateOllama(data: GenerationRequest): Promise<NextResponse> {
  try {
    // Extract actual model name from ollama-prefixed ID
    const modelName = data.model.startsWith("ollama-")
      ? data.model.substring("ollama-".length)
      : data.model;

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt: data.prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: `Ollama API error: ${response.status} - ${errorData}` },
        { status: response.status },
      );
    }

    const result = await response.json();

    const generationResult: TextGenerationResult = {
      text: result.response,
      usage: {
        promptTokens: result.prompt_eval_count || 0,
        completionTokens: result.eval_count || 0,
        totalTokens: (result.prompt_eval_count || 0) + (result.eval_count || 0),
      },
      finishReason: result.done ? "stop" : undefined,
    };

    return NextResponse.json(generationResult);
  } catch (error) {
    console.error("Error generating content with Ollama:", error);
    return NextResponse.json(
      {
        error: `Failed to generate content with Ollama: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
