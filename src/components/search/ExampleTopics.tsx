"use client";

import { queryLLM } from "@/lib/api-clients";
import { generateExampleQueriesPrompt } from "@/lib/prompts";
import { useApiStore } from "@/lib/stores/apiStore";
import { useEffect, useState } from "react";

interface ExampleTopic {
  score: number;
  name: string;
}

interface ExampleTopicsProps {
  onTopicClick: (topic: string) => void;
}

export const ExampleTopics: React.FC<ExampleTopicsProps> = ({
  onTopicClick,
}) => {
  const [topics, setTopics] = useState<ExampleTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedModel } = useApiStore();

  useEffect(() => {
    // Generate example topics
    const generateExampleTopics = async () => {
      setIsLoading(true);
      try {
        const prompt = generateExampleQueriesPrompt();
        const result = await queryLLM(prompt, selectedModel.id);

        if (result.success && result.data) {
          // Parse the response into topics
          const parsedTopics = result.data
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line) => {
              const [scoreStr, ...nameParts] = line.split(",");
              const score = parseInt(scoreStr.trim(), 10);
              const name = nameParts.join(",").trim();
              return { score, name };
            })
            .filter((topic) => !isNaN(topic.score) && topic.name)
            .sort(() => Math.random() - 0.5) // Randomize the order
            .slice(0, 20); // Limit to 20 topics

          setTopics(parsedTopics);
        } else {
          // Fallback to default topics if LLM call fails
          setTopics([
            { score: 95, name: "Quantum Physics" },
            { score: 90, name: "Ancient Rome" },
            { score: 85, name: "Artificial Intelligence" },
            { score: 82, name: "Climate Change" },
            { score: 78, name: "Leonardo da Vinci" },
            { score: 75, name: "Black Holes" },
            { score: 73, name: "Renaissance Art" },
            { score: 70, name: "DNA" },
            { score: 68, name: "The French Revolution" },
            { score: 65, name: "Human Consciousness" },
            { score: 60, name: "Blockchain Technology" },
            { score: 58, name: "Biodiversity" },
            { score: 55, name: "Game Theory" },
            { score: 52, name: "Ancient Egypt" },
            { score: 50, name: "Sustainable Energy" },
            { score: 48, name: "Neuroscience" },
            { score: 45, name: "World War II" },
            { score: 42, name: "Poetry" },
            { score: 40, name: "Cryptocurrency" },
            { score: 38, name: "The Internet" },
          ]);
        }
      } catch (error) {
        console.error("Error generating example topics:", error);
        // Fallback to default topics
        setTopics([
          { score: 95, name: "Quantum Physics" },
          { score: 90, name: "Ancient Rome" },
          { score: 85, name: "Artificial Intelligence" },
          { score: 80, name: "Climate Change" },
          { score: 75, name: "Leonardo da Vinci" },
          { score: 70, name: "Black Holes" },
          { score: 65, name: "Renaissance Art" },
          { score: 60, name: "DNA" },
          { score: 55, name: "The French Revolution" },
          { score: 50, name: "Human Consciousness" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    generateExampleTopics();
  }, [selectedModel.id]);

  // Calculate font size based on score
  const getFontSize = (score: number) => {
    const min = 14; // Minimum font size
    const max = 28; // Maximum font size
    return min + (max - min) * (score / 100);
  };

  // Get a color based on score
  const getColor = (score: number) => {
    // Color gradient from blue to purple based on score
    const hue = 210 + (score / 100) * 60; // 210 (blue) to 270 (purple)
    return `hsl(${hue}, 70%, 65%)`;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-slate-400">Loading example topics...</div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <h2 className="mb-8 text-center text-2xl font-bold text-white">
        Explore Knowledge Topics
      </h2>
      <p className="mb-6 text-center text-slate-300">
        Click on any topic to generate a knowledge graph and begin your
        exploration
      </p>

      <div className="flex flex-wrap justify-center gap-3 gap-y-6">
        {topics.map((topic, index) => (
          <button
            key={index}
            onClick={() => onTopicClick(topic.name)}
            className="hover:shadow-glow transform rounded-full px-4 py-2 transition-all duration-200 hover:scale-110"
            style={{
              fontSize: `${getFontSize(topic.score)}px`,
              color: getColor(topic.score),
              backgroundColor: "rgba(30, 41, 59, 0.5)",
            }}
          >
            {topic.name}
          </button>
        ))}
      </div>
    </div>
  );
};
