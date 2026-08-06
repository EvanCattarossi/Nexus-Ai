import { GoogleGenAI, FunctionDeclaration, Type, Content } from "@google/genai";
import { prisma } from "@/lib/db";
import * as tasks from "@/lib/services/tasks";
import * as memory from "@/lib/services/memory";
import path from "node:path";
import { loadAgentDefinition } from "@/lib/agents/loadAgentDefinition";

// Initialisation du client Google Gemini avec la clé d'environnement
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const AGENT_DEF = loadAgentDefinition(
  path.join(process.cwd(), "agents/PROJECT_MANAGER.md")
);

// Configuration des outils (tools) au format attendu par Gemini
const tools: FunctionDeclaration[] = [
  {
    name: "list_tasks",
    description:
      "List the current project's existing tasks with their status, priority and description. " +
      "Use this before deciding to create or modify tasks, to avoid duplicates.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "create_task",
    description:
      "Create a new task in the current project. Use this to decompose a brief into actionable tasks.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short, actionable task title" },
        description: { type: Type.STRING, description: "Detail of the expected deliverable" },
        priority: { type: Type.STRING, enum: ["low", "medium", "high", "urgent"] },
        dueDate: { type: Type.STRING, description: "Optional ISO 8601 date (YYYY-MM-DD)" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description:
      "Update the status or priority of an existing task in the current project. " +
      "Use `list_tasks` first to get the exact ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: { type: Type.STRING },
        status: { type: Type.STRING, enum: ["todo", "in_progress", "blocked", "review", "done"] },
        priority: { type: Type.STRING, enum: ["low", "medium", "high", "urgent"] },
      },
      required: ["taskId"],
    },
  },
  {
    name: "write_memory",
    description:
      "Write a memory entry (fact, decision or note) attached to the current project. " +
      "Use this to flag a blocker, record a decision, or note an important fact.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ["fact", "decision", "note"] },
        title: { type: Type.STRING },
        content: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["type", "title", "content"],
    },
  },
];

interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
}

interface UpdateTaskInput {
  taskId: string;
  status?: string;
  priority?: string;
}

interface WriteMemoryInput {
  type: string;
  title: string;
  content: string;
  tags?: string[];
}

async function executeTool(name: string, input: unknown, projectId: string): Promise<Record<string, unknown>> {
  switch (name) {
    case "list_tasks": {
      const list = await tasks.listTasksByProject(projectId);
      return {
        tasks: list.map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority }))
      };
    }
    case "create_task": {
      const { title, description, priority, dueDate } = input as CreateTaskInput;
      const t = await tasks.createTask({
        projectId,
        title,
        description,
        priority: (priority as "low" | "medium" | "high" | "urgent") ?? "medium",
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      return { id: t.id, title: t.title };
    }
    case "update_task": {
      const { taskId, status, priority } = input as UpdateTaskInput;
      const t = await tasks.updateTask(taskId, {
        status: status as "todo" | "in_progress" | "blocked" | "review" | "done" | undefined,
        priority: priority as "low" | "medium" | "high" | "urgent" | undefined,
      });
      return { id: t.id, status: t.status };
    }
    case "write_memory": {
      const { type, title, content, tags } = input as WriteMemoryInput;
      const m = await memory.createMemory({
        scope: "project",
        projectId,
        type: type as "fact" | "decision" | "note",
        title,
        content,
        tags,
      });
      return { id: m.id };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export async function runManager(projectId: string, instruction?: string) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
  const agent = await prisma.agent.findUniqueOrThrow({ where: { name: "manager" } });

  const userMessage =
    `Project: "${project.name}" (slug: ${project.slug}, status: ${project.status})\n\n` +
    `Description / brief:\n${project.description ?? "(no description provided)"}\n\n` +
    (instruction?.trim()
      ? `Specific instruction from the requester for this run:\n${instruction.trim()}\n\n`
      : "") +
    `If this project has no tasks yet, decompose the brief into tasks. ` +
    `If tasks already exist, review the project's state and make the relevant ` +
    `updates and memory notes.`;

  const run = await prisma.agentRun.create({
    data: { agentId: agent.id, projectId, input: userMessage, status: "running" },
  });

  const contents: Content[] = [{ role: "user", parts: [{ text: userMessage }] }];
  let finalText = "";

  try {
    for (let i = 0; i < (AGENT_DEF.maxToolIterations ?? 5); i++) {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents,
        config: {
          systemInstruction: AGENT_DEF.systemPrompt,
          maxOutputTokens: AGENT_DEF.maxTokens ?? 2048,
          tools: [{ functionDeclarations: tools }],
        },
      });

      const candidate = response.candidates?.[0];
      if (!candidate || !candidate.content) break;

      contents.push(candidate.content);

      // Détecter si le modèle demande l'exécution d'un outil
      const functionCalls = candidate.content.parts?.filter((p) => p.functionCall);

      if (!functionCalls || functionCalls.length === 0) {
        finalText = response.text ?? "";
        break;
      }

      // Exécuter les fonctions requises et renvoyer les réponses au modèle
      const functionResponses = [];
      for (const part of functionCalls) {
        const call = part.functionCall!;
        if (!call.name) continue;
        const result = await executeTool(call.name, call.args, projectId);
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: result,
          },
        });
      }

      contents.push({ role: "user", parts: functionResponses });
    }

    await prisma.agentRun.update({
      where: { id: run.id },
      data: { status: "success", output: finalText, finishedAt: new Date() },
    });

    return { runId: run.id, summary: finalText };
  } catch (err) {
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "error",
        output: err instanceof Error ? err.message : String(err),
        finishedAt: new Date(),
      },
    });
    throw err;
  }
}