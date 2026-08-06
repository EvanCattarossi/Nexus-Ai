import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runManager } from "@/lib/agents/manager";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const projectId: string | undefined = body?.projectId;
  const instruction: string | undefined = typeof body?.instruction === "string" ? body.instruction : undefined;
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const result = await runManager(projectId, instruction);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[manager.run] failed", err);
    return NextResponse.json({ error: "Manager execution failed" }, { status: 500 });
  }
}
