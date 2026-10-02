import { NextResponse } from "next/server";
import { WorkflowStore } from "@/lib/workflows/store";

export async function GET() {
  const jobs = WorkflowStore.listDeadLetters().filter((j) => !j.resolvedAt);
  return NextResponse.json({ deadLetters: jobs });
}
