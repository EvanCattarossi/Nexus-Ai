import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { loadAgentDefinition } from "../lib/agents/loadAgentDefinition";

const prisma = new PrismaClient();

async function main() {
  const agentDef = loadAgentDefinition(
    path.join(process.cwd(), "agents/PROJECT_MANAGER.md")
  );

  await prisma.agent.upsert({
    where: { name: agentDef.name },
    update: { systemPrompt: agentDef.systemPrompt, model: agentDef.model },
    create: {
      name: agentDef.name,
      role: "Project and task manager",
      systemPrompt: agentDef.systemPrompt,
      model: agentDef.model,
      isActive: true,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
