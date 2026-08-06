import fs from "node:fs";
import matter from "gray-matter";

export interface AgentDefinition {
  name: string;
  model: string;
  maxTokens: number;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  maxToolIterations: number;
  systemPrompt: string;
}

// Agents are defined as a single Markdown file: YAML front-matter for config,
// the rest of the file is the system prompt verbatim.
export function loadAgentDefinition(filePath: string): AgentDefinition {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  for (const field of ["name", "model", "maxTokens", "effort", "maxToolIterations"]) {
    if (data[field] === undefined) {
      throw new Error(`Agent definition ${filePath} is missing front-matter field "${field}"`);
    }
  }

  return {
    name: data.name,
    model: data.model,
    maxTokens: data.maxTokens,
    effort: data.effort,
    maxToolIterations: data.maxToolIterations,
    systemPrompt: content.trim(),
  };
}
