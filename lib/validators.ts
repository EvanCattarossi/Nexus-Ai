import { z } from "zod";

export const ProjectStatus = z.enum(["planning", "active", "paused", "done"]);
export const TaskStatus = z.enum(["todo", "in_progress", "blocked", "review", "done"]);
export const TaskPriority = z.enum(["low", "medium", "high", "urgent"]);
export const MemoryScope = z.enum(["global", "project"]);
export const MemoryType = z.enum(["fact", "decision", "note"]);

export const createProjectSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens only"),
  description: z.string().optional(),
  status: ProjectStatus.default("planning"),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: ProjectStatus.optional(),
});

export const createTaskSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: TaskStatus.default("todo"),
  priority: TaskPriority.default("medium"),
  assignedAgent: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

// Defined independently rather than via createTaskSchema.partial(): Zod applies
// a field's .default() before its .optional() check when the two are composed
// through .partial(), so an omitted field would silently be reset to its default
// instead of being left untouched — breaking partial-update semantics.
export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  assignedAgent: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

export const createMemorySchema = z.object({
  scope: MemoryScope.default("project"),
  projectId: z.string().optional(),
  type: MemoryType.default("note"),
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});
