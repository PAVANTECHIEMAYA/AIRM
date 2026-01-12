import { NextResponse } from "next/server";
import { ProjectService } from "@/backend/services/project.service";

/* ================= GET PROJECT ================= */
export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId;

  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID missing" },
      { status: 400 }
    );
  }

  const project = await ProjectService.getById(projectId);

  if (!project) {
    return NextResponse.json(
      { message: "Project not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(project);
}

/* ================= UPDATE PROJECT ================= */
export async function PUT(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    const body = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { message: "Project ID missing" },
        { status: 400 }
      );
    }

    const updatedProject = await ProjectService.update(
      projectId,
      body
    );

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("❌ Update project error:", error);
    return NextResponse.json(
      { message: "Failed to update project" },
      { status: 500 }
    );
  }
}
export async function PATCH(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    console.log("🔥 PATCH HIT:", params.projectId);

    const body = await req.json();
    console.log("🔥 PATCH BODY:", body);

    await ProjectService.update(params.projectId, body);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ PATCH ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
/* ================= DELETE PROJECT ================= */
export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;

    if (!projectId) {
      return NextResponse.json(
        { message: "Project ID missing" },
        { status: 400 }
      );
    }

    await ProjectService.delete(projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Delete project error:", error);
    return NextResponse.json(
      { message: "Failed to delete project" },
      { status: 500 }
    );
  }
}
