import { NextRequest, NextResponse } from "next/server";
import { listMemory, createMemory } from "@/lib/services/memory";
import { createMemorySchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined;
  const scope = req.nextUrl.searchParams.get("scope") ?? undefined;
  const memories = await listMemory({ projectId, scope });
  return NextResponse.json({ data: memories });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createMemorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const memory = await createMemory(parsed.data);
  return NextResponse.json({ data: memory }, { status: 201 });
}
