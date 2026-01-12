import { NextResponse } from "next/server";
import { TaskService } from "@/backend/services/task.service";
import { TaskActivityService } from "@/backend/services/taskActivity.service";
import { TaskAssigneeService } from "@/backend/services/taskAssignee.service";

export async function PUT(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const body = await req.json();

    // handle assignee_ids separately (many-to-many)
    const assigneeIds = body.assignee_ids;
    if (assigneeIds !== undefined) {
      // persist assignees (will accept empty array to clear)
      await TaskAssigneeService.setForTask(params.taskId, Array.isArray(assigneeIds) ? assigneeIds : []);
    }

    // Filter out null/undefined values to avoid 500 errors
    const updates: any = {};
    for (const key in body) {
      if (key === 'assignee_ids') continue; // already handled
      if (body[key] !== null && body[key] !== undefined && body[key] !== "") {
        updates[key] = body[key];
      }
    }

    // If there are updates, apply them
    if (Object.keys(updates).length > 0) {
      await TaskService.update(params.taskId, updates);
    }

    // Get the updated task
    const task = await TaskService.getById(params.taskId);

    // attach assignees list (ids + names)
    const assignees = await TaskAssigneeService.getByTask(params.taskId);
    task.assignees = assignees.map((a: any) => a.id);
    task.assignee = assignees.map((a: any) => a.name).join(', ');

    // record activity for important changes
    try {
      if (body.assignee_id) {
        await TaskActivityService.create(params.taskId, `Assigned to ${body.assignee_id}`);
      }
      if (body.description) {
        await TaskActivityService.create(params.taskId, `Updated description`);
      }
      if (body.title) {
        await TaskActivityService.create(params.taskId, `Updated title`);
      }
    } catch (e) {
      console.error("Failed to record activity", e);
    }

    return NextResponse.json(task);
  } catch (e: any) {
    console.error("PUT /api/tasks/:id error", e);
    return NextResponse.json({ error: e?.message || "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  // Delete the task via backend service
  await TaskService.delete(params.taskId);

  return NextResponse.json({ success: true });
}
