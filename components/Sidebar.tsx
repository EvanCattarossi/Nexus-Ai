"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, Menu, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "@/components/AgentAvatar";
import { AGENT_REGISTRY, type AgentDepartment } from "@/lib/agents/registry";
import { ProjectStatusBadge } from "@/components/StatusBadge";

type SidebarProject = {
  id: string;
  slug: string;
  name: string;
  status: string;
};

const DEPARTMENT_LABEL: Record<AgentDepartment, string> = {
  direction: "Direction",
  engineering: "Ingénierie",
  design: "Design",
  growth: "Croissance",
};

const DEPARTMENTS: AgentDepartment[] = ["direction", "engineering", "design", "growth"];

export function Sidebar({ projects }: { projects: SidebarProject[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const content = (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <Link href="/" className="flex items-center gap-2 px-1" onClick={() => setOpen(false)}>
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        <span className="font-semibold tracking-tight">Nexus AI</span>
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Projets</h2>
        </div>
        <nav className="flex flex-col gap-0.5">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
              pathname === "/" ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            <FolderKanban className="size-4 shrink-0" />
            Tous les projets
          </Link>
          {projects.map((project) => {
            const href = `/projects/${project.slug}`;
            const active = pathname === href;
            return (
              <Link
                key={project.id}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                  active ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                <span className="line-clamp-1">{project.name}</span>
                <ProjectStatusBadge status={project.status} />
              </Link>
            );
          })}
          {projects.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Aucun projet pour l&apos;instant.</p>
          ) : null}
        </nav>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Organisation ({AGENT_REGISTRY.length} agents)
        </h2>
        <div className="flex flex-col gap-3">
          {DEPARTMENTS.map((dept) => (
            <div key={dept} className="flex flex-col gap-1.5">
              <span className="px-1 text-[0.7rem] font-medium text-muted-foreground">
                {DEPARTMENT_LABEL[dept]}
              </span>
              <div className="flex flex-wrap gap-1.5 px-1">
                {AGENT_REGISTRY.filter((a) => a.department === dept).map((a) => (
                  <AgentAvatar key={a.id} agent={a.id} size="sm" showStatusDot title={`${a.label} — ${a.roleFr}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b bg-background px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" />
          </span>
          <span className="font-semibold tracking-tight">Nexus AI</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex size-8 items-center justify-center rounded-md hover:bg-muted"
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r bg-background shadow-lg">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-md hover:bg-muted"
              aria-label="Fermer le menu"
            >
              <X className="size-4" />
            </button>
            {content}
          </aside>
        </div>
      ) : null}

      <aside className="hidden w-72 shrink-0 border-r lg:block">{content}</aside>
    </>
  );
}
