import Image from "next/image";
import { cn } from "@/lib/utils";
import { getAgentMeta } from "@/lib/agents/registry";

const SIZE_PX: Record<"xs" | "sm" | "md" | "lg", number> = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
};

export function AgentAvatar({
  agent,
  size = "md",
  showStatusDot = false,
  title,
  className,
}: {
  /** Registry id, DB agent name, or freeform label (e.g. `Task.assignedAgent`). */
  agent: string;
  size?: "xs" | "sm" | "md" | "lg";
  /** Small dot indicating whether this agent is wired to an execution loop. */
  showStatusDot?: boolean;
  title?: string;
  className?: string;
}) {
  const meta = getAgentMeta(agent);
  const px = SIZE_PX[size];
  const src = `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(meta.id || meta.label)}&radius=50`;

  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: px, height: px }}
      title={title ?? `${meta.label} — ${meta.roleFr}`}
    >
      <span className={cn("flex h-full w-full items-center justify-center overflow-hidden rounded-full ring-1", meta.accent.bg, meta.accent.ring)}>
        <Image src={src} alt={meta.label} width={px} height={px} unoptimized className="h-full w-full" />
      </span>
      {showStatusDot ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background",
            meta.active ? "bg-emerald-500" : "bg-muted-foreground/40",
            size === "xs" ? "h-2 w-2" : "h-2.5 w-2.5"
          )}
          title={meta.active ? "Agent actif" : "Pas encore câblé"}
        />
      ) : null}
    </span>
  );
}
