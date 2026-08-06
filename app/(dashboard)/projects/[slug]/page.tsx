import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { RunManagerButton } from "@/components/RunManagerButton";
import { ProjectStatusSelect } from "@/components/ProjectStatusSelect";
import { TaskBoard } from "@/components/TaskBoard";
import { MemoryPanel } from "@/components/MemoryPanel";
import { AgentRunLog } from "@/components/AgentRunLog";

type Params = { params: Promise<{ slug: string }> };

export default async function ProjectDetailPage({ params }: Params) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      tasks: { orderBy: { createdAt: "asc" } },
      memories: { orderBy: { createdAt: "desc" } },
      runs: { orderBy: { startedAt: "desc" }, take: 10 },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          {project.description ? (
            <p className="mt-1 max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">
              {project.description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <ProjectStatusSelect projectId={project.id} status={project.status} />
          <RunManagerButton projectId={project.id} />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Tâches</h2>
        <TaskBoard tasks={project.tasks} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Mémoire</h2>
        <MemoryPanel memories={project.memories} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Journal d&apos;exécution</h2>
        <AgentRunLog runs={project.runs} />
      </section>
    </div>
  );
}
