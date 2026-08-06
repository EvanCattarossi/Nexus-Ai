import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

async function main() {
  const systemPrompt = fs.readFileSync(
    path.join(process.cwd(), "agents/manager/system-prompt.md"),
    "utf-8"
  );

  await prisma.agent.upsert({
    where: { name: "manager" },
    update: { systemPrompt },
    create: {
      name: "manager",
      role: "Project and task manager",
      systemPrompt,
      model: "claude-opus-5",
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
