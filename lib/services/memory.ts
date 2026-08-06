import { prisma } from "@/lib/db";
import { createMemorySchema } from "@/lib/validators";
import { z } from "zod";

export async function listMemory(filter: { projectId?: string; scope?: string }) {
  return prisma.memory.findMany({
    where: {
      ...(filter.projectId ? { projectId: filter.projectId } : {}),
      ...(filter.scope ? { scope: filter.scope } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createMemory(input: z.input<typeof createMemorySchema>) {
  const data = createMemorySchema.parse(input);
  return prisma.memory.create({
    data: {
      scope: data.scope,
      projectId: data.projectId,
      type: data.type,
      title: data.title,
      content: data.content,
      tags: data.tags ? JSON.stringify(data.tags) : null,
    },
  });
}

export async function deleteMemory(id: string) {
  return prisma.memory.delete({ where: { id } });
}

export function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
