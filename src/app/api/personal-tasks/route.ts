import { NextRequest, NextResponse } from "next/server";
import { TasksService } from "@/lib/tools/personal/tasks-service";

export async function GET() {
  try {
    const tasks = await TasksService.listTasks();
    return NextResponse.json({ success: true, tasks });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, title, description, dueDate, priority, category, text } = body;

    if (action === "extract") {
      if (!text) {
        return NextResponse.json({ success: false, error: "Text required for extraction" }, { status: 400 });
      }
      const extracted = TasksService.extractTasksFromText(text);
      const created = [];
      for (const item of extracted) {
        const task = await TasksService.createTask({
          title: item.title,
          description: item.description,
          dueDate: item.dueDate,
          priority: item.priority,
          category: item.category,
          sourceType: "manual",
        });
        created.push(task);
      }
      return NextResponse.json({ success: true, createdCount: created.length, tasks: created });
    }

    if (!title) {
      return NextResponse.json({ success: false, error: "Task title is required" }, { status: 400 });
    }

    const task = await TasksService.createTask({
      title,
      description,
      dueDate,
      priority,
      category,
    });

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Task ID is required" }, { status: 400 });
    }

    const updated = await TasksService.updateTask(id, updates);
    return NextResponse.json({ success: true, task: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Task ID required" }, { status: 400 });
    }

    const success = await TasksService.deleteTask(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
