import type { AgentRun } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  running: "secondary",
  success: "default",
  error: "destructive",
};

export function AgentRunLog({ runs }: { runs: AgentRun[] }) {
  if (runs.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Aucune exécution pour l&apos;instant.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {runs.map((run) => (
        <div key={run.id} className="rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant={STATUS_VARIANT[run.status] ?? "outline"}>{run.status}</Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(run.startedAt).toLocaleString("fr-FR")}
            </span>
          </div>
          {run.output ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{run.output}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
