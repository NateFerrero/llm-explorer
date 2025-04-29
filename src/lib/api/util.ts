export class AIServiceError extends Error {
  statusCode: number;
  provider: string;

  constructor(message: string, statusCode: number, provider: string) {
    super(message);
    this.name = "AIServiceError";
    this.statusCode = statusCode;
    this.provider = provider;
  }
}

export type TextGenerationResult = {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: "stop" | "length" | "content_filter";
};

// Vision-enabled Text Types
export type ContentItem =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type Message = {
  role: "user" | "assistant" | "system";
  content: ContentItem[];
};

// --- Configuration ---
// Keep track of which non-Ollama providers have actual implementations
const IMPLEMENTED_NON_OLLAMA_PROVIDERS = [
  "claude-bedrock",
  "azure-gpt-4o",
  "gemini-pro", // Re-implement Gemini support
];

const CONFIG: {
  webId: string;
  // This list can be used by UI components if needed, but API calls check IMPLEMENTED_NON_OLLAMA_PROVIDERS
  availableProviders: {
    text: string[];
    visionEnabled: string[];
  };
} = {
  webId: "680c113bec64f40013a68673",
  availableProviders: {
    // Base list - dynamically updated elsewhere if needed for UI
    text: [
      ...IMPLEMENTED_NON_OLLAMA_PROVIDERS,
      "ollama-llama3", // Keep placeholders for Ollama here if UI relies on it
      "ollama-mistral",
    ],
    visionEnabled: ["claude-bedrock", "azure-gpt-4o"], // Update if implementations change
  },
};

// --- Provider Implementations ---

// Interface remains the same
export interface TextProviderImplementation {
  generate(prompt: string): Promise<TextGenerationResult>;
  generateStream(
    prompt: string,
    onChunk: (text: string) => void,
  ): Promise<TextGenerationResult>;
}

export interface VisionTextProviderImplementation
  extends TextProviderImplementation {
  generateWithImages(
    prompt: string,
    imageUrls: string[],
  ): Promise<TextGenerationResult>;
  generateWithImagesStream(
    prompt: string,
    imageUrls: string[],
    onChunk: (text: string) => void,
  ): Promise<TextGenerationResult>;
}

// Store implementations only for non-Ollama providers that are actually implemented
const textProviderImplementations: Record<
  string,
  TextProviderImplementation | VisionTextProviderImplementation
> = {};

// Vision-enabled text provider: claude-bedrock
textProviderImplementations["claude-bedrock"] = {
  async generate(prompt: string): Promise<TextGenerationResult> {
    return proxyGenerate(prompt, "67d3d8513660678db5fe05bc", "claude-bedrock");
  },
  async generateStream(
    prompt: string,
    onChunk: (text: string) => void,
  ): Promise<TextGenerationResult> {
    return proxyGenerateStream(
      prompt,
      onChunk,
      "67d3d8513660678db5fe05bc",
      "claude-bedrock",
    );
  },
  async generateWithImages(
    prompt: string,
    imageUrls: string[],
  ): Promise<TextGenerationResult> {
    return proxyGenerateWithImages(
      prompt,
      imageUrls,
      "67d3d8513660678db5fe05bc",
      "claude-bedrock",
    );
  },
  async generateWithImagesStream(
    prompt: string,
    imageUrls: string[],
    onChunk: (text: string) => void,
  ): Promise<TextGenerationResult> {
    return proxyGenerateWithImagesStream(
      prompt,
      imageUrls,
      onChunk,
      "67d3d8513660678db5fe05bc",
      "claude-bedrock",
    );
  },
};

// Vision-enabled text provider: azure-gpt-4o
textProviderImplementations["azure-gpt-4o"] = {
  async generate(prompt: string): Promise<TextGenerationResult> {
    return proxyGenerate(prompt, "67e52e6e8e1618ee9ba4117f", "azure-gpt-4o");
  },
  async generateStream(
    prompt: string,
    onChunk: (text: string) => void,
  ): Promise<TextGenerationResult> {
    return proxyGenerateStream(
      prompt,
      onChunk,
      "67e52e6e8e1618ee9ba4117f",
      "azure-gpt-4o",
    );
  },
  async generateWithImages(
    prompt: string,
    imageUrls: string[],
  ): Promise<TextGenerationResult> {
    return proxyGenerateWithImages(
      prompt,
      imageUrls,
      "67e52e6e8e1618ee9ba4117f",
      "azure-gpt-4o",
    );
  },
  async generateWithImagesStream(
    prompt: string,
    imageUrls: string[],
    onChunk: (text: string) => void,
  ): Promise<TextGenerationResult> {
    return proxyGenerateWithImagesStream(
      prompt,
      imageUrls,
      onChunk,
      "67e52e6e8e1618ee9ba4117f",
      "azure-gpt-4o",
    );
  },
};

// Text provider: gemini-pro
textProviderImplementations["gemini-pro"] = {
  async generate(prompt: string): Promise<TextGenerationResult> {
    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem("llm_api_key_gemini");
      if (!apiKey) {
        throw new AIServiceError("Gemini API key not found", 401, "gemini-pro");
      }

      // Call Gemini API directly
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
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
                    text: prompt,
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
        const errorText = await response.text();
        throw new AIServiceError(
          `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`,
          response.status,
          "gemini-pro",
        );
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text || "";

      return {
        text,
        usage: {
          promptTokens: prompt.length / 4, // Rough estimate
          completionTokens: text.length / 4, // Rough estimate
          totalTokens: (prompt.length + text.length) / 4,
        },
        finishReason: data.candidates[0].finishReason || "stop",
      };
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      if (error instanceof AIServiceError) throw error;

      throw new AIServiceError(
        `Failed to generate text with Gemini: ${error instanceof Error ? error.message : String(error)}`,
        500,
        "gemini-pro",
      );
    }
  },

  async generateStream(
    prompt: string,
    onChunk: (text: string) => void,
  ): Promise<TextGenerationResult> {
    // For simplicity, we'll use the non-streaming version and simulate streaming
    try {
      const result = await this.generate(prompt);

      // Simulate streaming by sending the response in chunks
      const chunkSize = 10;
      const text = result.text;

      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        onChunk(chunk);
        // Small delay to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      return result;
    } catch (error) {
      console.error("Error in Gemini streaming:", error);
      if (error instanceof AIServiceError) throw error;

      throw new AIServiceError(
        `Failed to stream text from Gemini: ${error instanceof Error ? error.message : String(error)}`,
        500,
        "gemini-pro",
      );
    }
  },
};

// NOTE: No specific ollama entries needed here anymore

// --- Generic Ollama Handlers ---

// Generic function for calling Ollama generate API
async function generateWithOllama(
  prompt: string,
  modelName: string, // Actual model name like "llama3", "mistral", "qwen2.5:14b"
): Promise<TextGenerationResult> {
  console.log(`Calling Ollama generate API with model: ${modelName}`);
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName, // Pass the specific model name
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Ollama API error response: ${errorBody}`);
      throw new AIServiceError(
        `Ollama error: ${response.status} ${response.statusText} - ${errorBody}`,
        response.status,
        `ollama-${modelName}`,
      );
    }

    const data = await response.json();

    return {
      text: data.response,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      finishReason: data.done ? "stop" : undefined, // Simplified finish reason for Ollama
    };
  } catch (error) {
    console.error(
      `Failed to call Ollama generate for model ${modelName}:`,
      error,
    );
    if (error instanceof AIServiceError) throw error;
    throw new AIServiceError(
      `Failed to call Ollama: ${error instanceof Error ? error.message : String(error)}`,
      500,
      `ollama-${modelName}`,
    );
  }
}

// Generic function for calling Ollama streaming API
async function generateStreamWithOllama(
  prompt: string,
  onChunk: (text: string) => void,
  modelName: string, // Actual model name like "llama3", "mistral", "qwen2.5:14b"
): Promise<TextGenerationResult> {
  console.log(`Calling Ollama stream API with model: ${modelName}`);
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName, // Pass the specific model name
        prompt: prompt,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Ollama API streaming error response: ${errorBody}`);
      throw new AIServiceError(
        `Ollama streaming error: ${response.status} ${response.statusText} - ${errorBody}`,
        response.status,
        `ollama-${modelName}`,
      );
    }

    const reader = response.body?.getReader();
    if (!reader)
      throw new Error("Response body is null or undefined for stream");

    const decoder = new TextDecoder("utf-8");
    let fullText = "";
    let finalData: any = {}; // To store the last chunk containing usage info

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(Boolean); // Split JSON lines

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            fullText += parsed.response;
            onChunk(parsed.response);
          }
          // Store the last chunk, as it contains the final metrics
          if (parsed.done) {
            finalData = parsed;
          }
        } catch (e) {
          console.error("Error parsing Ollama stream chunk:", line, e);
        }
      }
    }

    return {
      text: fullText,
      usage: {
        promptTokens: finalData.prompt_eval_count || 0,
        completionTokens: finalData.eval_count || 0,
        totalTokens:
          (finalData.prompt_eval_count || 0) + (finalData.eval_count || 0),
      },
      finishReason: finalData.done ? "stop" : undefined,
    };
  } catch (error) {
    console.error(`Failed to stream Ollama for model ${modelName}:`, error);
    if (error instanceof AIServiceError) throw error;
    throw new AIServiceError(
      `Failed to stream from Ollama: ${error instanceof Error ? error.message : String(error)}`,
      500,
      `ollama-${modelName}`,
    );
  }
}

// --- Proxy Handlers (No change needed) ---
// Shared implementation for all LiteLLM text providers (claude, azure)
async function proxyGenerate(
  prompt: string,
  integrationId: string,
  model: string,
): Promise<TextGenerationResult> {
  const requestBody = {
    webId: CONFIG.webId,
    integrationId,
    prompt,
    stream: false,
    model,
  };

  try {
    const response = await fetch("https://proxy.getcreatr.com/v1/proxy/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new AIServiceError(
        `Proxy error: ${response.status} ${response.statusText}`,
        response.status,
        model,
      );
    }

    const data = await response.json();
    console.log(data);

    return {
      text: data.data.choices[0].message.content,
      usage: {
        promptTokens: data.data.usage.prompt_tokens,
        completionTokens: data.data.usage.completion_tokens,
        totalTokens: data.data.usage.total_tokens,
      },
      finishReason: data.data.choices[0].finish_reason,
    };
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    throw new Error(
      `Failed to call proxy: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function proxyGenerateStream(
  prompt: string,
  onChunk: (text: string) => void,
  integrationId: string,
  model: string,
): Promise<TextGenerationResult> {
  const requestBody = {
    webId: CONFIG.webId,
    integrationId,
    prompt,
    stream: true,
    model,
  };

  let fullText = "";
  let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  let finishReason;

  try {
    const response = await fetch(
      "https://proxy.getcreatr.com/v1/proxy/llm/stream",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      throw new AIServiceError(
        `Proxy streaming error: ${response.status} ${response.statusText}`,
        response.status,
        model,
      );
    }

    if (!response.body) throw new Error("Response body is null or undefined");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let isStreamActive = true;

    while (isStreamActive) {
      const { done, value } = await reader.read();

      if (done) {
        isStreamActive = false;
        continue;
      }

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        if (event.startsWith("data: ")) {
          const data = event.slice(6).trim();

          if (data === "[DONE]") {
            isStreamActive = false;
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            const chunkContent = parsed.choices[0]?.delta?.content || "";
            if (chunkContent) {
              fullText += chunkContent;
              onChunk(chunkContent);
            }

            if (parsed.choices[0]?.finish_reason) {
              finishReason = parsed.choices[0].finish_reason;
            }

            // Update usage information from the final chunk
            if (parsed.usage) {
              usage = {
                promptTokens: parsed.usage.prompt_tokens,
                completionTokens: parsed.usage.completion_tokens,
                totalTokens: parsed.usage.total_tokens,
              };
            }
          } catch (e) {
            console.error("Error parsing stream chunk:", e);
          }
        }
      }
    }

    return { text: fullText, usage, finishReason };
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    throw new Error(
      `Failed to stream from proxy: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Shared implementation for vision-enabled text providers (no change needed)
async function proxyGenerateWithImages(
  prompt: string,
  imageUrls: string[],
  integrationId: string,
  model: string,
): Promise<TextGenerationResult> {
  // Build content array with text and images for each message
  const content: ContentItem[] = [{ type: "text", text: prompt }];

  // Add each image URL to the content array
  for (const url of imageUrls) {
    content.push({
      type: "image_url",
      image_url: {
        url: url,
      },
    });
  }

  // Create the request payload exactly matching the expected format
  const requestBody = {
    model,
    webId: CONFIG.webId,
    integrationId,
    messages: [
      {
        role: "user",
        content,
      },
    ],
    stream: false,
  };

  try {
    const response = await fetch("https://proxy.getcreatr.com/v1/proxy/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new AIServiceError(
        `Vision proxy error: ${response.status} ${response.statusText}`,
        response.status,
        model,
      );
    }

    const data = await response.json();
    console.log(data);

    return {
      text: data.data.choices[0].message.content,
      usage: {
        promptTokens: data.data.usage.prompt_tokens,
        completionTokens: data.data.usage.completion_tokens,
        totalTokens: data.data.usage.total_tokens,
      },
      finishReason: data.data.choices[0].finish_reason,
    };
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    throw new Error(
      `Failed to call vision proxy: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function proxyGenerateWithImagesStream(
  prompt: string,
  imageUrls: string[],
  onChunk: (text: string) => void,
  integrationId: string,
  model: string,
): Promise<TextGenerationResult> {
  // Build content array with text and images
  const content: ContentItem[] = [{ type: "text", text: prompt }];

  // Add each image URL to the content array
  for (const url of imageUrls) {
    content.push({
      type: "image_url",
      image_url: {
        url: url,
      },
    });
  }

  // Create the request payload exactly matching the expected format
  const requestBody = {
    model,
    webId: CONFIG.webId,
    integrationId,
    messages: [
      {
        role: "user",
        content,
      },
    ],
    stream: true,
  };

  let fullText = "";
  let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  let finishReason;

  try {
    const response = await fetch(
      "https://proxy.getcreatr.com/v1/proxy/llm/stream",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      throw new AIServiceError(
        `Vision proxy streaming error: ${response.status} ${response.statusText}`,
        response.status,
        model,
      );
    }

    if (!response.body) throw new Error("Response body is null or undefined");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let isStreamActive = true;

    while (isStreamActive) {
      const { done, value } = await reader.read();

      if (done) {
        isStreamActive = false;
        continue;
      }

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        if (event.startsWith("data: ")) {
          const data = event.slice(6).trim();

          if (data === "[DONE]") {
            isStreamActive = false;
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            const chunkContent = parsed.choices[0]?.delta?.content || "";
            if (chunkContent) {
              fullText += chunkContent;
              onChunk(chunkContent);
            }

            if (parsed.choices[0]?.finish_reason) {
              finishReason = parsed.choices[0].finish_reason;
            }

            // Update usage information from the final chunk
            if (parsed.usage) {
              usage = {
                promptTokens: parsed.usage.prompt_tokens,
                completionTokens: parsed.usage.completion_tokens,
                totalTokens: parsed.usage.total_tokens,
              };
            }
          } catch (e) {
            console.error("Error parsing stream chunk:", e);
          }
        }
      }
    }

    return { text: fullText, usage, finishReason };
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    throw new Error(
      `Failed to stream from vision proxy: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// --- Core API Functions ---

/**
 * Generate text using a specific provider ID (e.g., "azure-gpt-4o", "ollama-llama3")
 */
export async function generateText(
  prompt: string,
  providerId: string,
): Promise<TextGenerationResult> {
  if (!prompt) throw new Error("Prompt is required");
  if (!providerId) throw new Error("Provider ID is required");

  try {
    if (providerId.startsWith("ollama-")) {
      const modelName = providerId.substring("ollama-".length);
      if (!modelName) {
        throw new Error(`Invalid Ollama provider ID: ${providerId}`);
      }
      return await generateWithOllama(prompt, modelName);
    } else if (IMPLEMENTED_NON_OLLAMA_PROVIDERS.includes(providerId)) {
      const implementation = textProviderImplementations[providerId];
      if (!implementation) {
        // This should ideally not happen if IMPLEMENTED_NON_OLLAMA_PROVIDERS is correct
        throw new Error(`No implementation found for provider: ${providerId}`);
      }
      return await implementation.generate(prompt);
    } else {
      // Provider is not Ollama and not in the list of implemented non-Ollama providers
      throw new Error(
        `Provider ${providerId} is not available or not implemented`,
      );
    }
  } catch (error) {
    console.error(`Error during generateText for ${providerId}:`, error);
    if (error instanceof AIServiceError) {
      // Re-throw service errors directly
      throw error;
    } else {
      // Wrap other errors
      throw new AIServiceError(
        `Error generating text: ${error instanceof Error ? error.message : String(error)}`,
        500, // Generic internal error
        providerId,
      );
    }
  }
}

/**
 * Generate text using a specific provider ID and stream the results
 */
export async function generateTextStream(
  prompt: string,
  onChunk: (text: string) => void,
  providerId: string,
): Promise<TextGenerationResult> {
  if (!prompt) throw new Error("Prompt is required");
  if (!onChunk) throw new Error("onChunk callback is required");
  if (!providerId) throw new Error("Provider ID is required");

  try {
    if (providerId.startsWith("ollama-")) {
      const modelName = providerId.substring("ollama-".length);
      if (!modelName) {
        throw new Error(`Invalid Ollama provider ID: ${providerId}`);
      }
      return await generateStreamWithOllama(prompt, onChunk, modelName);
    } else if (IMPLEMENTED_NON_OLLAMA_PROVIDERS.includes(providerId)) {
      const implementation = textProviderImplementations[providerId];
      if (!implementation) {
        throw new Error(`No implementation found for provider: ${providerId}`);
      }
      // Ensure generateStream exists on the implementation
      if (!("generateStream" in implementation)) {
        throw new Error(`Streaming not supported for provider: ${providerId}`);
      }
      return await implementation.generateStream(prompt, onChunk);
    } else {
      throw new Error(
        `Provider ${providerId} is not available or not implemented`,
      );
    }
  } catch (error) {
    console.error(`Error during generateTextStream for ${providerId}:`, error);
    if (error instanceof AIServiceError) {
      throw error;
    } else {
      throw new AIServiceError(
        `Error streaming text: ${error instanceof Error ? error.message : String(error)}`,
        500,
        providerId,
      );
    }
  }
}

// --- Vision API Functions (Leverage core text generation) ---

/**
 * Generate text using a specific vision-enabled provider ID and provide images
 */
export async function generateTextWithImages(
  prompt: string,
  imageUrls: string[],
  providerId: string,
): Promise<TextGenerationResult> {
  if (!prompt) throw new Error("Prompt is required");
  if (!imageUrls || !Array.isArray(imageUrls))
    throw new Error("Image URLs must be an array");
  if (!providerId) throw new Error("Provider ID is required");

  if (!CONFIG.availableProviders.visionEnabled.includes(providerId)) {
    throw new Error(`Provider ${providerId} does not support image inputs`);
  }

  // Find the implementation (must be Vision capable)
  const implementation = textProviderImplementations[providerId] as
    | VisionTextProviderImplementation
    | undefined;

  if (!implementation || !("generateWithImages" in implementation)) {
    throw new Error(
      `Image generation not implemented for provider: ${providerId}`,
    );
  }

  try {
    return await implementation.generateWithImages(prompt, imageUrls);
  } catch (error) {
    console.error(
      `Error during generateTextWithImages for ${providerId}:`,
      error,
    );
    if (error instanceof AIServiceError) {
      throw error;
    } else {
      throw new AIServiceError(
        `Error generating text with images: ${error instanceof Error ? error.message : String(error)}`,
        500,
        providerId,
      );
    }
  }
}

/**
 * Generate text using a specific vision-enabled provider ID, provide images, and stream the results
 */
export async function generateTextWithImagesStream(
  prompt: string,
  imageUrls: string[],
  onChunk: (text: string) => void,
  providerId: string,
): Promise<TextGenerationResult> {
  if (!prompt) throw new Error("Prompt is required");
  if (!imageUrls || !Array.isArray(imageUrls))
    throw new Error("Image URLs must be an array");
  if (!onChunk) throw new Error("onChunk callback is required");
  if (!providerId) throw new Error("Provider ID is required");

  if (!CONFIG.availableProviders.visionEnabled.includes(providerId)) {
    throw new Error(`Provider ${providerId} does not support image inputs`);
  }

  const implementation = textProviderImplementations[providerId] as
    | VisionTextProviderImplementation
    | undefined;

  if (!implementation || !("generateWithImagesStream" in implementation)) {
    throw new Error(
      `Image streaming not implemented for provider: ${providerId}`,
    );
  }

  try {
    return await implementation.generateWithImagesStream(
      prompt,
      imageUrls,
      onChunk,
    );
  } catch (error) {
    console.error(
      `Error during generateTextWithImagesStream for ${providerId}:`,
      error,
    );
    if (error instanceof AIServiceError) {
      throw error;
    } else {
      throw new AIServiceError(
        `Error streaming text with images: ${error instanceof Error ? error.message : String(error)}`,
        500,
        providerId,
      );
    }
  }
}

// --- Provider Discovery Functions ---

/**
 * Get all available text provider IDs (including dynamically detected Ollama models)
 * This is primarily for UI population.
 * @returns An array of provider IDs like ["azure-gpt-4o", "ollama-llama3", "ollama-mistral", ...]
 */
export function getTextProviders(): string[] {
  const baseProviders = [...IMPLEMENTED_NON_OLLAMA_PROVIDERS];

  // Attempt to get Ollama models synchronously if possible, or handle async
  // NOTE: This function might need to become async if Ollama check needs to be awaited here.
  // For now, assume `loadAvailableModels` in `models.ts` handles the async detection for the UI.
  // We can add placeholders if needed.
  if (!baseProviders.includes("ollama-llama3"))
    baseProviders.push("ollama-llama3");
  if (!baseProviders.includes("ollama-mistral"))
    baseProviders.push("ollama-mistral");

  // Potentially add other detected Ollama models here if needed, but might be redundant
  // if UI uses loadAvailableModels.

  return baseProviders;
}

/**
 * Get all available vision-enabled provider IDs.
 * @returns An array of provider IDs like ["claude-bedrock", "azure-gpt-4o"]
 */
export function getVisionEnabledProviders(): string[] {
  // Return providers that have a vision implementation
  return CONFIG.availableProviders.visionEnabled.filter((p) =>
    IMPLEMENTED_NON_OLLAMA_PROVIDERS.includes(p),
  );
}
