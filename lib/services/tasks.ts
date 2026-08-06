import { prisma } from "@/lib/db";
import { createTaskSchema, updateTaskSchema } from "@/lib/validators";
import { z } from "zod";

export async function listTasksByProject(projectId: string) {
  return prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createTask(input: z.input<typeof createTaskSchema>) {
  const data = createTaskSchema.parse(input);
  return prisma.task.create({ data });
}

export async function updateTask(id: string, input: z.infer<typeof updateTaskSchema>) {
  const data = updateTaskSchema.parse(input);
  return prisma.task.update({ where: { id }, data });
}

export async function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } });
}
