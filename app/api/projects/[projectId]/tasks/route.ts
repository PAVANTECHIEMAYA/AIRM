import { NextResponse } from "next/server";
import { TaskService } from "@/backend/services/task.service";
import { TaskAssigneeService } from "@/backend/services/taskAssignee.service";

/* ================= GET TASKS ================= */
export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const tasks = await TaskService.getByProject(params.projectId);
    // attach assignees for each task
    for (const t of tasks) {
      try {
        const assignees = await TaskAssigneeService.getByTask(t.id);
        t.assignees = assignees.map((a: any) => a.id);
        t.assignee = assignees.map((a: any) => a.name).join(', ');
      } catch (e) {
        // ignore per-task failures
        t.assignees = [];
        t.assignee = t.assignee || "";
      }
    }
    return NextResponse.json(tasks);
  } catch (err) {
    console.error("GET TASKS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load tasks" },
      { status: 500 }
    );
  }
}

/* ================= CREATE TASK ================= */
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const body = await req.json();
    console.log("[API] Create task request for project:", params.projectId, body);

    const task = await TaskService.create({
      project_id: params.projectId,
      title: body.title,
      status: body.status || "Todo",
      priority: body.priority ?? "low",
      estimate: body.estimate ?? undefined,
      assignee_id: body.assignee_id ?? null,
      due_date: body.due_date ?? null,
      description: body.description ?? null,
      labels: Array.isArray(body.labels) ? body.labels : [],
    });

    // if assignee_ids were provided, persist them
    if (body.assignee_ids !== undefined) {
      await TaskAssigneeService.setForTask(task.id, Array.isArray(body.assignee_ids) ? body.assignee_ids : []);
    }

    // Get the task with assignee name joined
    const taskWithAssignee = await TaskService.getById(task.id);
    const assignees = await TaskAssigneeService.getByTask(task.id);
    taskWithAssignee.assignees = assignees.map((a: any) => a.id);
    taskWithAssignee.assignee = assignees.map((a: any) => a.name).join(', ');

    return NextResponse.json(taskWithAssignee, { status: 201 });
  } catch (err) {
    console.error("CREATE TASK ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
