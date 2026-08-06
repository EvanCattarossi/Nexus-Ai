import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import * as tasks from "@/lib/services/tasks";
import * as memory from "@/lib/services/memory";
import path from "node:path";
import { loadAgentDefinition } from "@/lib/agents/loadAgentDefinition";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

const AGENT_DEF = loadAgentDefinition(
  path.join(process.cwd(), "agents/PROJECT_MANAGER.md")
);

const tools: Anthropic.Tool[] = [
  {
    name: "list_tasks",
    description:
      "List the current project's existing tasks with their status, priority and description. " +
      "Use this before deciding to create or modify tasks, to avoid duplicates.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "create_task",
    description:
      "Create a new task in the current project. Use this to decompose a brief into actionable tasks.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short, actionable task title" },
        description: { type: "string", description: "Detail of the expected deliverable" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
        dueDate: { type: "string", description: "Optional ISO 8601 date (YYYY-MM-DD)" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description:
      "Update the status or priority of an existing task in the current project. " +
      "Use `list_tasks` first to get the exact ID.",
    input_schema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        status: { type: "string", enum: ["todo", "in_progress", "blocked", "review", "done"] },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
      },
      required: ["taskId"],
    },
  },
  {
    name: "write_memory",
    description:
      "Write a memory entry (fact, decision or note) attached to the current project. " +
      "Use this to flag a blocker, record a decision, or note an important fact.",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["fact", "decision", "note"] },
        title: { type: "string" },
        content: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
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

async function executeTool(name: string, input: unknown, projectId: string): Promise<string> {
  switch (name) {
    case "list_tasks": {
      const list = await tasks.listTasksByProject(projectId);
      return JSON.stringify(
        list.map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority }))
      );
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
      return JSON.stringify({ id: t.id, title: t.title });
    }
    case "update_task": {
      const { taskId, status, priority } = input as UpdateTaskInput;
      const t = await tasks.updateTask(taskId, {
        status: status as "todo" | "in_progress" | "blocked" | "review" | "done" | undefined,
        priority: priority as "low" | "medium" | "high" | "urgent" | undefined,
      });
      return JSON.stringify({ id: t.id, status: t.status });
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
      return JSON.stringify({ id: m.id });
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

export async function runManager(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
  const agent = await prisma.agent.findUniqueOrThrow({ where: { name: "manager" } });

  const userMessage =
    `Project: "${project.name}" (slug: ${project.slug}, status: ${project.status})\n\n` +
    `Description / brief:\n${project.description ?? "(no description provided)"}\n\n` +
    `If this project has no tasks yet, decompose the brief into tasks. ` +
    `If tasks already exist, review the project's state and make the relevant ` +
    `updates and memory notes.`;

  const run = await prisma.agentRun.create({
    data: { agentId: agent.id, projectId, input: userMessage, status: "running" },
  });

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMessage }];
  let finalText = "";

  try {
    for (let i = 0; i < AGENT_DEF.maxToolIterations; i++) {
      // No `thinking` field: on claude-opus-5, omitting it runs adaptive thinking
      // by default, which is the desired behavior here (see plan notes).
      const response = await client.messages.create({
        model: AGENT_DEF.model,
        max_tokens: AGENT_DEF.maxTokens,
        system: AGENT_DEF.systemPrompt,
        tools,
        output_config: { effort: AGENT_DEF.effort as Anthropic.OutputConfig["effort"] },
        messages,
      });

      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason !== "tool_use") {
        finalText = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n");
        break;
      }

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await executeTool(block.name, block.input, projectId);
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
      }
      messages.push({ role: "user", content: toolResults });
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
