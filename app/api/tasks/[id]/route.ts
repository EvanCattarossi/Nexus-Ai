import { NextRequest, NextResponse } from "next/server";
import { updateTask, deleteTask } from "@/lib/services/tasks";
import { updateTaskSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const task = await updateTask(id, parsed.data);
  return NextResponse.json({ data: task });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await deleteTask(id);
  return NextResponse.json({ data: { id } });
}
