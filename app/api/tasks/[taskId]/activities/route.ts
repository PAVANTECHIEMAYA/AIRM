import { NextResponse } from "next/server";
import { TaskActivityService } from "@/backend/services/taskActivity.service";

export async function GET(req: Request, { params }: { params: { taskId: string } }) {
  try {
    const acts = await TaskActivityService.getByTask(params.taskId);
    return NextResponse.json(acts);
  } catch (e) {
    console.error("GET /api/tasks/:id/activities error", e);
    return NextResponse.json({ error: "Failed to load activities" }, { status: 500 });
  }
}
