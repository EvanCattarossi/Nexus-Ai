"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Task } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PriorityBadge } from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLUMNS: { status: string; label: string }[] = [
  { status: "todo", label: "À faire" },
  { status: "in_progress", label: "En cours" },
  { status: "blocked", label: "Bloqué" },
  { status: "review", label: "À valider" },
  { status: "done", label: "Terminé" },
];

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  const router = useRouter();

  async function updateStatus(taskId: string, status: string) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Impossible de mettre à jour la tâche");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.status);
        return (
          <div key={column.status} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-medium text-muted-foreground">{column.label}</h3>
              <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {columnTasks.map((task) => (
                <Card key={task.id} className="gap-2 py-3">
                  <CardHeader className="px-3">
                    <CardTitle className="text-sm font-medium leading-snug">
                      {task.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 px-3">
                    {task.description ? (
                      <p className="line-clamp-3 text-xs text-muted-foreground">
                        {task.description}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between gap-2">
                      <PriorityBadge priority={task.priority} />
                      <Select
                        value={task.status}
                        onValueChange={(value) => value && updateStatus(task.id, value)}
                      >
                        <SelectTrigger size="sm" className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLUMNS.map((c) => (
                            <SelectItem key={c.status} value={c.status}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {columnTasks.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Vide
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
