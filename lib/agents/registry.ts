// Static metadata for Nexus AI's 20-agent organization (see agents/*.md).
// Only "manager" is currently wired to an execution loop (lib/agents/manager.ts);
// the rest are documented roles, kept here so the UI can render a full org
// roster with consistent avatars ahead of them being wired up.

export type AgentDepartment = "direction" | "engineering" | "design" | "growth";

export interface AgentMeta {
  /** Matches the `Agent.name` column for wired agents (e.g. "manager"). */
  id: string;
  label: string;
  roleFr: string;
  department: AgentDepartment;
  /** Source definition file under agents/. */
  file: string;
  active: boolean;
  accent: {
    bg: string;
    text: string;
    ring: string;
  };
}

const DEPARTMENT_ACCENT: Record<AgentDepartment, AgentMeta["accent"]> = {
  direction: { bg: "bg-violet-500/15", text: "text-violet-600 dark:text-violet-400", ring: "ring-violet-500/30" },
  engineering: { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/30" },
  design: { bg: "bg-pink-500/15", text: "text-pink-600 dark:text-pink-400", ring: "ring-pink-500/30" },
  growth: { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/30" },
};

function agent(
  id: string,
  label: string,
  roleFr: string,
  department: AgentDepartment,
  file: string,
  active = false
): AgentMeta {
  return { id, label, roleFr, department, file, active, accent: DEPARTMENT_ACCENT[department] };
}

export const AGENT_REGISTRY: AgentMeta[] = [
  agent("manager", "Manager", "Chef de projet IA", "direction", "PROJECT_MANAGER.md", true),
  agent("ceo", "CEO", "Vision & priorités", "direction", "CEO.md"),
  agent("product_manager", "Product Manager", "Roadmap produit", "direction", "PRODUCT_MANAGER.md"),
  agent("business_analyst", "Business Analyst", "Analyse business", "direction", "BUSINESS_ANALYST.md"),
  agent("finance_analyst", "Finance Analyst", "Analyse financière", "direction", "FINANCE_ANALYST.md"),

  agent("software_architect", "Software Architect", "Architecture technique", "engineering", "SOFTWARE_ARCHITECT.md"),
  agent("backend_developer", "Backend Developer", "Développement backend", "engineering", "BACKEND_DEVELOPER.md"),
  agent("frontend_developer", "Frontend Developer", "Développement frontend", "engineering", "FRONTEND_DEVELOPER.md"),
  agent("mobile_developer", "Mobile Developer", "Développement mobile", "engineering", "MOBILE_DEVELOPER.md"),
  agent("ai_engineer", "AI Engineer", "Agents & LLM", "engineering", "AI_ENGINEER.md"),
  agent("database_engineer", "Database Engineer", "Données & stockage", "engineering", "DATABASE_ENGINEER.md"),
  agent("devops_engineer", "DevOps Engineer", "Infra & déploiement", "engineering", "DEVOPS_ENGINEER.md"),
  agent("qa_engineer", "QA Engineer", "Qualité & tests", "engineering", "QA_ENGINEER.md"),
  agent("security_engineer", "Security Engineer", "Sécurité", "engineering", "SECURITY_ENGINEER.md"),

  agent("ux_ui_designer", "UX/UI Designer", "Design produit", "design", "UX_UI_DESIGNER.md"),

  agent("marketing_manager", "Marketing Manager", "Stratégie marketing", "growth", "MARKETING_MANAGER.md"),
  agent("sales_manager", "Sales Manager", "Ventes", "growth", "SALES_MANAGER.md"),
  agent("content_creator", "Content Creator", "Contenu", "growth", "CONTENT_CREATOR.md"),
  agent("community_manager", "Community Manager", "Communauté", "growth", "COMMUNITY_MANAGER.md"),
  agent("customer_support", "Customer Support", "Support client", "growth", "CUSTOMER_SUPPORT.md"),
];

const BY_ID = new Map(AGENT_REGISTRY.map((a) => [a.id, a]));

function normalize(nameOrId: string): string {
  return nameOrId.trim().toLowerCase().replace(/\s+/g, "_");
}

/** Looks up an agent by its registry id, DB `Agent.name`, or a human label. Falls back to a neutral default for unknown values (e.g. a task's freeform `assignedAgent` text). */
export function getAgentMeta(nameOrId: string | null | undefined): AgentMeta {
  if (!nameOrId) return UNKNOWN_AGENT;
  const key = normalize(nameOrId);
  return (
    BY_ID.get(key) ??
    AGENT_REGISTRY.find((a) => normalize(a.label) === key) ?? {
      ...UNKNOWN_AGENT,
      id: nameOrId,
      label: nameOrId,
    }
  );
}

export const UNKNOWN_AGENT: AgentMeta = agent("unknown", "Agent", "Rôle non défini", "direction", "", false);
