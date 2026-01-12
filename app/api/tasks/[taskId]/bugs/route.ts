import { NextResponse } from "next/server";
import { TaskBugService } from "@/backend/services/taskBug.service";

export async function GET(req: Request, { params }: { params: { taskId: string } }) {
  try {
    const bugs = await TaskBugService.getByTask(params.taskId);
    return NextResponse.json(bugs);
  } catch (e) {
    console.error("GET /api/tasks/:id/bugs error", e);
    return NextResponse.json({ error: "Failed to load bugs" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { taskId: string } }) {
  const body = await req.json();
  const description = body.description;
  const reporterId = body.reporter_id ?? null;
  if (!description) return NextResponse.json({ error: "Missing description" }, { status: 400 });
  try {
    const bug = await TaskBugService.create(params.taskId, description, reporterId);

    try {
      const { TaskActivityService } = await import("@/backend/services/taskActivity.service");
      await TaskActivityService.create(params.taskId, `Bug reported`);
    } catch (e) {
      console.error("Failed to create activity for bug", e);
    }

    return NextResponse.json(bug);
  } catch (e: any) {
    console.error("POST /api/tasks/:id/bugs error", e);
    return NextResponse.json({ error: e?.message || "Failed to report bug" }, { status: 500 });
  }
}
