import { NextRequest, NextResponse } from "next/server";
import { listTasksByProject, createTask } from "@/lib/services/tasks";
import { createTaskSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId query param is required" }, { status: 400 });
  }
  const tasks = await listTasksByProject(projectId);
  return NextResponse.json({ data: tasks });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const task = await createTask(parsed.data);
  return NextResponse.json({ data: task }, { status: 201 });
}
