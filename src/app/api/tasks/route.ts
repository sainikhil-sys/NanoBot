import { NextRequest, NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";
import { ExecutionEngine } from "@/lib/orchestration/execution-engine";
import { validateTaskInput } from "@/lib/orchestration/task-validator";

export async function GET() {
  try {
    const tasks = await DbService.listTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedInput = validateTaskInput(body);
    const task = await ExecutionEngine.submitAndExecute(validatedInput);

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create task" },
      { status: 400 }
    );
  }
}
