import { NextResponse } from "next/server";
import { TaskCommentService } from "@/backend/services/taskComment.service";

export async function GET(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const comments = await TaskCommentService.getByTask(params.taskId);
    return NextResponse.json(comments ?? []);
  } catch (err) {
    console.error("COMMENTS API ERROR:", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const body = await req.json();
    const text = body.text;
    const authorId = body.author_id ?? null;

    if (!text) {
      return NextResponse.json(
        { error: "Missing text" },
        { status: 400 }
      );
    }

    const comment = await TaskCommentService.create(
      params.taskId,
      text,
      authorId
    );

    return NextResponse.json(comment);
  } catch (err) {
    console.error("CREATE COMMENT ERROR:", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
