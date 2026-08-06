import { prisma } from "@/lib/db";
import { createProjectSchema, updateProjectSchema } from "@/lib/validators";
import { z } from "zod";

export async function listProjects() {
  return prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { tasks: true } } },
  });
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    include: {
      tasks: { orderBy: { createdAt: "asc" } },
      memories: { orderBy: { createdAt: "desc" } },
      runs: { orderBy: { startedAt: "desc" }, take: 10 },
    },
  });
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { createdAt: "asc" } },
      memories: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createProject(input: z.input<typeof createProjectSchema>) {
  const data = createProjectSchema.parse(input);
  return prisma.project.create({ data });
}

export async function updateProject(id: string, input: z.infer<typeof updateProjectSchema>) {
  const data = updateProjectSchema.parse(input);
  return prisma.project.update({ where: { id }, data });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}
