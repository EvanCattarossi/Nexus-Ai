import { NextRequest, NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/services/projects";
import { createProjectSchema } from "@/lib/validators";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ data: projects });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const project = await createProject(parsed.data);
    return NextResponse.json({ data: project }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A project with this slug already exists" }, { status: 409 });
  }
}
