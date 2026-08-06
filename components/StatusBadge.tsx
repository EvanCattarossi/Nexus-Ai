import { Badge } from "@/components/ui/badge";

const PROJECT_STATUS_LABEL: Record<string, string> = {
  planning: "Planification",
  active: "Actif",
  paused: "En pause",
  done: "Terminé",
};

const TASK_STATUS_LABEL: Record<string, string> = {
  todo: "À faire",
  in_progress: "En cours",
  blocked: "Bloqué",
  review: "À valider",
  done: "Terminé",
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

const VARIANT_BY_STATUS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  planning: "outline",
  active: "default",
  paused: "secondary",
  done: "secondary",
  todo: "outline",
  in_progress: "default",
  blocked: "destructive",
  review: "secondary",
  low: "outline",
  medium: "secondary",
  high: "default",
  urgent: "destructive",
};

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANT_BY_STATUS[status] ?? "outline"}>
      {PROJECT_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANT_BY_STATUS[status] ?? "outline"}>
      {TASK_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant={VARIANT_BY_STATUS[priority] ?? "outline"}>
      {PRIORITY_LABEL[priority] ?? priority}
    </Badge>
  );
}
