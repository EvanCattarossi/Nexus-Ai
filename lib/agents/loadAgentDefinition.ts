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

// Extracts the text under a "# System Prompt" heading, up to the next
// top-level ("# ") heading. Agent files carry full documentation (Role,
// Mission, Expertise, Responsibilities, ...) alongside the prompt, so the
// executable system prompt must be scoped to that one section rather than
// the whole file body. Files with no such heading (legacy format) fall back
// to using the entire body as the prompt.
function extractSystemPromptSection(body: string): string {
  const lines = body.split("\n");
  const startIdx = lines.findIndex((line) => /^#\s+System Prompt\s*$/i.test(line.trim()));
  if (startIdx === -1) {
    return body.trim();
  }

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^#\s+\S/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  return lines.slice(startIdx + 1, endIdx).join("\n").trim();
}

// Agents are defined as a single Markdown file: YAML front-matter for config,
// the rest of the file is documentation plus a "# System Prompt" section.
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
    systemPrompt: extractSystemPromptSection(content),
  };
}
