import { GoogleGenAI, FunctionDeclaration, Type, Content } from "@google/genai";
import path from "node:path";
import { prisma } from "@/lib/db";
import * as tasks from "@/lib/services/tasks";
import * as memory from "@/lib/services/memory";
import { loadAgentDefinition } from "@/lib/agents/loadAgentDefinition";
import { AGENT_REGISTRY, getAgentMeta } from "@/lib/agents/registry";
import { syncAgent } from "@/lib/agents/syncAgents";
import * as content from "@/lib/services/content";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// All 20 agents/*.md files now carry the same front-matter (see loadAgentDefinition),
// so every agent runs through this one engine instead of a bespoke file per agent
// (that's what lib/agents/manager.ts used to be — kept as a thin wrapper for compat).
// Front-matter `model` is a tier label (claude-opus-5 vs claude-sonnet-5); only the
// Gemini client is actually wired (GEMINI_API_KEY), so both tiers currently run on
// the same underlying model. Swapping the Anthropic SDK in per-tier is a documented
// next step (see README) — the @anthropic-ai/sdk dependency is already installed.
const MODEL = "gemini-2.0-flash";

const MAX_DELEGATION_DEPTH = 3;

// Base toolset every agent gets. content_creator additionally gets CONTENT_TOOLS
// (see getToolsForAgent) — kept agent-specific rather than global so the other 19
// agents' tool schemas (and prompt token budget) don't grow for a tool only one of
// them uses.
const BASE_TOOLS: FunctionDeclaration[] = [
  {
    name: "list_tasks",
    description:
      "List the current project's existing tasks with their status, priority and description. " +
      "Use this before deciding to create or modify tasks, to avoid duplicates.",
    parameters: { type: Type.OBJECT, properties: {}, required: [] },
  },
  {
    name: "create_task",
    description: "Create a new task in the current project.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short, actionable task title" },
        description: { type: Type.STRING, description: "Detail of the expected deliverable" },
        priority: { type: Type.STRING, enum: ["low", "medium", "high", "urgent"] },
        assignedAgent: { type: Type.STRING, description: "Registry id of the agent responsible (e.g. backend_developer)" },
        dueDate: { type: Type.STRING, description: "Optional ISO 8601 date (YYYY-MM-DD)" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description: "Update the status, priority or assignee of an existing task. Use `list_tasks` first to get the exact ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: { type: Type.STRING },
        status: { type: Type.STRING, enum: ["todo", "in_progress", "blocked", "review", "done"] },
        priority: { type: Type.STRING, enum: ["low", "medium", "high", "urgent"] },
        assignedAgent: { type: Type.STRING },
      },
      required: ["taskId"],
    },
  },
  {
    name: "write_memory",
    description: "Write a memory entry (fact, decision or note) attached to the current project.",
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
  {
    name: "log_activity",
    description:
      "Emit a short progress note to the live activity feed (visible in the dashboard in near real time). " +
      "Use it for meaningful checkpoints, not every micro-step.",
    parameters: {
      type: Type.OBJECT,
      properties: { message: { type: Type.STRING } },
      required: ["message"],
    },
  },
  {
    name: "delegate_to_agent",
    description:
      "Delegate a sub-instruction to another agent in the organization, by registry id. " +
      "The delegate runs synchronously with the same project context and its own tools, and its summary is " +
      "returned to you. Use this instead of doing work outside your own expertise.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        agentId: {
          type: Type.STRING,
          description: `Exact registry id of the agent to delegate to — one of: ${AGENT_REGISTRY.map((a) => a.id).join(", ")}.`,
        },
        instruction: { type: Type.STRING, description: "What the delegate should do" },
      },
      required: ["agentId", "instruction"],
    },
  },
];

const CONTENT_TOOLS: FunctionDeclaration[] = [
  {
    name: "schedule_post",
    description:
      "Create a social post in the editorial calendar (draft, or scheduled for a future date). " +
      "Never publishes immediately — publication happens from the dashboard (or automatically if mode is 'auto' " +
      "and a human hasn't disabled it), via the real Ayrshare integration.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Internal label for the calendar, not posted" },
        body: { type: Type.STRING, description: "The actual post text" },
        platforms: {
          type: Type.ARRAY,
          items: { type: Type.STRING, enum: ["tiktok", "instagram", "facebook", "linkedin"] },
        },
        scheduledAt: { type: Type.STRING, description: "Optional ISO 8601 datetime; omit to leave as a draft" },
        mode: { type: Type.STRING, enum: ["auto", "review"], description: "'review' (default) holds it for manual approval even once scheduledAt passes" },
      },
      required: ["title", "body", "platforms"],
    },
  },
];

function getToolsForAgent(agentId: string): FunctionDeclaration[] {
  return agentId === "content_creator" ? [...BASE_TOOLS, ...CONTENT_TOOLS] : BASE_TOOLS;
}

// --- Gemini -> Groq fallback ------------------------------------------------
// Gemini's free tier returns 429 (RESOURCE_EXHAUSTED) once its daily quota is
// spent, which used to crash every agent run outright. lib/llm-client.ts covers
// plain text generation, but its generateText() has no tool-calling support,
// and this loop's whole job is Gemini-style function calling (list_tasks,
// create_task, delegate_to_agent, ...). So turns are built from a
// provider-agnostic NormalizedMessage list here instead: each backend only
// has to convert one direction (normalized -> its own wire format), and on a
// retryable Gemini failure we just keep looping against Groq from that point on.

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

type NormalizedToolCall = { id: string; name: string; args: Record<string, unknown> };
type NormalizedMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; toolCalls?: NormalizedToolCall[] }
  | { role: "tool"; toolCallId: string; name: string; result: Record<string, unknown> };

type TurnResult = { text: string; toolCalls: NormalizedToolCall[] };

function isRetryableGeminiError(err: unknown): boolean {
  const status = (err as { status?: number } | undefined)?.status;
  const message = err instanceof Error ? err.message : String(err);
  return status === 429 || status === 503 || /RESOURCE_EXHAUSTED|quota/i.test(message);
}

function toGeminiContents(messages: NormalizedMessage[]): Content[] {
  const out: Content[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", parts: [{ text: m.text }] });
    } else if (m.role === "assistant") {
      const parts: NonNullable<Content["parts"]> = [];
      if (m.text) parts.push({ text: m.text });
      for (const tc of m.toolCalls ?? []) parts.push({ functionCall: { name: tc.name, args: tc.args } });
      out.push({ role: "model", parts });
    } else {
      const part = { functionResponse: { name: m.name, response: m.result } };
      const last = out[out.length - 1];
      if (last?.role === "user" && last.parts?.every((p) => "functionResponse" in p)) {
        last.parts.push(part);
      } else {
        out.push({ role: "user", parts: [part] });
      }
    }
  }
  return out;
}

async function runGeminiTurn(
  messages: NormalizedMessage[],
  systemPrompt: string,
  tools: FunctionDeclaration[],
  maxTokens: number
): Promise<TurnResult> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: toGeminiContents(messages),
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: maxTokens,
      tools: [{ functionDeclarations: tools }],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("");
  const toolCalls: NormalizedToolCall[] = parts
    .filter((p) => p.functionCall?.name)
    .map((p, i) => ({
      id: `gem_${Date.now()}_${i}`,
      name: p.functionCall!.name!,
      args: (p.functionCall!.args as Record<string, unknown>) ?? {},
    }));

  return { text, toolCalls };
}

const GEMINI_TO_JSON_SCHEMA_TYPE: Record<string, string> = {
  OBJECT: "object",
  STRING: "string",
  ARRAY: "array",
  NUMBER: "number",
  INTEGER: "integer",
  BOOLEAN: "boolean",
};

function toJsonSchema(schema: unknown): Record<string, unknown> {
  const s = schema as {
    type?: string;
    description?: string;
    enum?: string[];
    properties?: Record<string, unknown>;
    items?: unknown;
    required?: string[];
  };
  if (!s) return { type: "object", properties: {} };
  const out: Record<string, unknown> = { type: GEMINI_TO_JSON_SCHEMA_TYPE[s.type ?? "STRING"] ?? "string" };
  if (s.description) out.description = s.description;
  if (s.enum) out.enum = s.enum;
  if (s.required) out.required = s.required;
  if (s.properties) {
    out.properties = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, toJsonSchema(v)]));
  }
  if (s.items) out.items = toJsonSchema(s.items);
  return out;
}

function toGroqTools(tools: FunctionDeclaration[]) {
  return tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: toJsonSchema(t.parameters) },
  }));
}

function toGroqMessages(systemPrompt: string, messages: NormalizedMessage[]) {
  const out: Record<string, unknown>[] = [{ role: "system", content: systemPrompt }];
  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.text });
    } else if (m.role === "assistant") {
      const msg: Record<string, unknown> = { role: "assistant", content: m.text || null };
      if (m.toolCalls?.length) {
        msg.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.args) },
        }));
      }
      out.push(msg);
    } else {
      out.push({ role: "tool", tool_call_id: m.toolCallId, content: JSON.stringify(m.result) });
    }
  }
  return out;
}

async function runGroqTurn(
  messages: NormalizedMessage[],
  systemPrompt: string,
  tools: FunctionDeclaration[],
  maxTokens: number
): Promise<TurnResult> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY manquant dans l'environnement (fallback Gemini indisponible)");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: toGroqMessages(systemPrompt, messages),
      tools: toGroqTools(tools),
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`Groq error ${response.status}: ${bodyText}`);
  }

  const data = JSON.parse(bodyText);
  const message = data?.choices?.[0]?.message ?? {};
  const text: string = message.content ?? "";
  const toolCalls: NormalizedToolCall[] = (message.tool_calls ?? []).map(
    (tc: { id: string; function: { name: string; arguments: string } }) => ({
      id: tc.id,
      name: tc.function.name,
      args: tc.function.arguments ? JSON.parse(tc.function.arguments) : {},
    })
  );

  return { text, toolCalls };
}

// --- Groq -> Anthropic fallback ---------------------------------------------
// Groq's free tier (12k TPM) counts the *requested* max_tokens against the
// limit, not just tokens actually generated — so a single call can exhaust
// the per-minute budget outright. When Groq errors for any reason (429 or
// otherwise), fall back to Anthropic (Claude Haiku, paid) as the last resort,
// using the same NormalizedMessage/TurnResult contract as the other two
// providers so the tool-calling loop keeps working uninterrupted.

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string };

type AnthropicMessage = { role: "user" | "assistant"; content: AnthropicContentBlock[] };

function toAnthropicMessages(messages: NormalizedMessage[]): AnthropicMessage[] {
  const out: AnthropicMessage[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", content: [{ type: "text", text: m.text }] });
    } else if (m.role === "assistant") {
      const content: AnthropicContentBlock[] = [];
      if (m.text) content.push({ type: "text", text: m.text });
      for (const tc of m.toolCalls ?? []) content.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.args });
      out.push({ role: "assistant", content });
    } else {
      const block: AnthropicContentBlock = { type: "tool_result", tool_use_id: m.toolCallId, content: JSON.stringify(m.result) };
      const last = out[out.length - 1];
      if (last?.role === "user" && last.content.every((c) => c.type === "tool_result")) {
        last.content.push(block);
      } else {
        out.push({ role: "user", content: [block] });
      }
    }
  }
  return out;
}

function toAnthropicTools(tools: FunctionDeclaration[]) {
  return tools.map((t) => ({ name: t.name, description: t.description, input_schema: toJsonSchema(t.parameters) }));
}

async function runAnthropicTurn(
  messages: NormalizedMessage[],
  systemPrompt: string,
  tools: FunctionDeclaration[],
  maxTokens: number
): Promise<TurnResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY manquant dans l'environnement (fallback Groq indisponible)");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: toAnthropicMessages(messages),
      tools: toAnthropicTools(tools),
    }),
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`Anthropic error ${response.status}: ${bodyText}`);
  }

  const data = JSON.parse(bodyText);
  const blocks: { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }[] = data?.content ?? [];
  const text = blocks.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  const toolCalls: NormalizedToolCall[] = blocks
    .filter((b) => b.type === "tool_use")
    .map((b) => ({ id: b.id!, name: b.name!, args: b.input ?? {} }));

  return { text, toolCalls };
}

interface ExecuteContext {
  projectId: string;
  agentDbId: string;
  taskId?: string;
  workflowId?: string;
  depth: number;
}

async function log(ctx: ExecuteContext, message: string, level: "info" | "warn" | "error" = "info") {
  await prisma.activityLog.create({
    data: { agentId: ctx.agentDbId, taskId: ctx.taskId, workflowId: ctx.workflowId, projectId: ctx.projectId, message, level },
  });
}

async function executeTool(name: string, input: unknown, ctx: ExecuteContext): Promise<Record<string, unknown>> {
  switch (name) {
    case "list_tasks": {
      const list = await tasks.listTasksByProject(ctx.projectId);
      return { tasks: list.map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, assignedAgent: t.assignedAgent })) };
    }
    case "create_task": {
      const { title, description, priority, assignedAgent, dueDate } = input as {
        title: string; description?: string; priority?: string; assignedAgent?: string; dueDate?: string;
      };
      const t = await tasks.createTask({
        projectId: ctx.projectId,
        title,
        description,
        priority: (priority as "low" | "medium" | "high" | "urgent") ?? "medium",
        assignedAgent,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      await log(ctx, `Tâche créée : "${t.title}"${assignedAgent ? ` → ${getAgentMeta(assignedAgent).label}` : ""}`);
      return { id: t.id, title: t.title };
    }
    case "update_task": {
      const { taskId, status, priority, assignedAgent } = input as {
        taskId: string; status?: string; priority?: string; assignedAgent?: string;
      };
      const t = await tasks.updateTask(taskId, {
        status: status as "todo" | "in_progress" | "blocked" | "review" | "done" | undefined,
        priority: priority as "low" | "medium" | "high" | "urgent" | undefined,
        assignedAgent,
      });
      await log(ctx, `Tâche mise à jour : "${t.title}" → ${t.status}`);
      return { id: t.id, status: t.status };
    }
    case "write_memory": {
      const { type, title, content: body, tags } = input as { type: string; title: string; content: string; tags?: string[] };
      const m = await memory.createMemory({ scope: "project", projectId: ctx.projectId, type: type as "fact" | "decision" | "note", title, content: body, tags });
      await log(ctx, `Mémoire (${type}) : "${title}"`);
      return { id: m.id };
    }
    case "schedule_post": {
      const { title, body, platforms, scheduledAt, mode } = input as {
        title: string; body: string; platforms: string[]; scheduledAt?: string; mode?: "auto" | "review";
      };
      const post = await content.createContentPost({
        projectId: ctx.projectId,
        title,
        body,
        platforms: platforms as ("tiktok" | "instagram" | "facebook" | "linkedin")[],
        mode: mode ?? "review",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      });
      await log(ctx, `Post "${title}" ajouté au calendrier éditorial (${post.status}, ${post.mode})`);
      return { id: post.id, status: post.status };
    }
    case "log_activity": {
      const { message } = input as { message: string };
      await log(ctx, message);
      return { ok: true };
    }
    case "delegate_to_agent": {
      const { agentId, instruction } = input as { agentId: string; instruction: string };
      if (ctx.depth >= MAX_DELEGATION_DEPTH) {
        return { error: `Delegation depth limit (${MAX_DELEGATION_DEPTH}) reached — execute this yourself or escalate differently.` };
      }
      const meta = getAgentMeta(agentId);
      if (!meta.active) {
        return { error: `Unknown agent id "${agentId}". Valid ids: ${AGENT_REGISTRY.map((a) => a.id).join(", ")}` };
      }
      await log(ctx, `→ Délégation à ${meta.label} : ${instruction}`);
      try {
        const result = await runAgent({
          agentId: meta.id,
          projectId: ctx.projectId,
          instruction,
          taskId: ctx.taskId,
          workflowId: ctx.workflowId,
          depth: ctx.depth + 1,
        });
        return { summary: result.summary };
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export interface RunAgentInput {
  agentId: string; // registry id, e.g. "software_architect"
  projectId: string;
  instruction: string;
  taskId?: string;
  workflowId?: string;
  depth?: number;
}

export async function runAgent({ agentId, projectId, instruction, taskId, workflowId, depth = 0 }: RunAgentInput) {
  // Normalized/alias-aware lookup (case, whitespace, human labels, known filename-
  // derived aliases like "project_manager" -> "manager") — the single source of
  // truth for resolving an agent id, shared with delegate_to_agent below so a
  // caller only has to get this right in one place.
  const meta = getAgentMeta(agentId);
  if (!meta.active) throw new Error(`Unknown agent id: ${agentId}. Valid ids: ${AGENT_REGISTRY.map((a) => a.id).join(", ")}`);

  const [dbAgent, def, project] = await Promise.all([
    syncAgent(meta),
    Promise.resolve(loadAgentDefinition(path.join(process.cwd(), "agents", meta.file))),
    prisma.project.findUniqueOrThrow({ where: { id: projectId } }),
  ]);

  const ctx: ExecuteContext = { projectId, agentDbId: dbAgent.id, taskId, workflowId, depth };

  await prisma.agent.update({ where: { id: dbAgent.id }, data: { status: "running", lastActiveAt: new Date() } });
  await log(ctx, `${meta.label} démarre : ${instruction.slice(0, 200)}`);

  const userMessage =
    `Project: "${project.name}" (slug: ${project.slug}, status: ${project.status})\n\n` +
    `Description / brief:\n${project.description ?? "(no description provided)"}\n\n` +
    `Instruction:\n${instruction}\n\n` +
    `Termine toujours par un court résumé texte de ce que tu as fait — visible dans le journal d'exécution.`;

  const run = await prisma.agentRun.create({
    data: { agentId: dbAgent.id, projectId, taskId, input: userMessage, status: "running" },
  });

  const messages: NormalizedMessage[] = [{ role: "user", text: userMessage }];
  const agentTools = getToolsForAgent(meta.id);
  let finalText = "";
  let provider: "gemini" | "groq" | "anthropic" = "gemini";

  // Groq step with an Anthropic fallback on any failure (429 or otherwise) —
  // shared by both the "Gemini just failed over" and the steady-state "already
  // on Groq" branches below, so the fallback only has to be written once.
  const runGroqStep = async (): Promise<TurnResult> => {
    try {
      return await runGroqTurn(messages, def.systemPromptShort, agentTools, def.maxTokens ?? 4000);
    } catch (err) {
      provider = "anthropic";
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[executor] Groq a échoué (${message}). Bascule sur Anthropic (dernier recours)...`);
      await log(ctx, `⚠️ Groq indisponible — bascule sur Anthropic (Claude Haiku), dernier recours.`, "warn");
      return await runAnthropicTurn(messages, def.systemPromptShort, agentTools, def.maxTokens ?? 4000);
    }
  };

  try {
    for (let i = 0; i < (def.maxToolIterations ?? 6); i++) {
      let turn: TurnResult;
      if (provider === "gemini") {
        try {
          turn = await runGeminiTurn(messages, def.systemPromptShort, agentTools, def.maxTokens ?? 4000);
        } catch (err) {
          if (!isRetryableGeminiError(err)) throw err;
          provider = "groq";
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`[executor] Gemini a échoué (${message}). Bascule sur Groq...`);
          await log(ctx, `⚠️ Gemini indisponible (quota/429) — bascule sur Groq.`, "warn");
          turn = await runGroqStep();
        }
      } else if (provider === "groq") {
        turn = await runGroqStep();
      } else {
        turn = await runAnthropicTurn(messages, def.systemPromptShort, agentTools, def.maxTokens ?? 4000);
      }

      if (turn.toolCalls.length === 0) {
        finalText = turn.text;
        messages.push({ role: "assistant", text: turn.text });
        break;
      }

      messages.push({ role: "assistant", text: turn.text, toolCalls: turn.toolCalls });
      for (const call of turn.toolCalls) {
        const result = await executeTool(call.name, call.args, ctx);
        messages.push({ role: "tool", toolCallId: call.id, name: call.name, result });
      }
    }

    await prisma.agentRun.update({ where: { id: run.id }, data: { status: "success", output: finalText, finishedAt: new Date() } });
    await prisma.agent.update({ where: { id: dbAgent.id }, data: { status: "idle", lastActiveAt: new Date() } });
    await log(ctx, `${meta.label} termine [${provider}] : ${finalText.slice(0, 300) || "(pas de résumé)"}`);

    return { runId: run.id, summary: finalText, provider };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.agentRun.update({ where: { id: run.id }, data: { status: "error", output: message, finishedAt: new Date() } });
    await prisma.agent.update({ where: { id: dbAgent.id }, data: { status: "error", lastActiveAt: new Date() } });
    await log(ctx, `${meta.label} erreur : ${message}`, "error");
    throw err;
  }
}
