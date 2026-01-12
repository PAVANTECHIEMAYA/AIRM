import { NextResponse } from "next/server";
import { ProjectRepository } from "@/backend/database/repositories/project.repo";

/* ================= GET COLUMNS ================= */
export async function GET(
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

    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }

    const columns = Array.isArray(project.columns) 
      ? project.columns 
      : JSON.parse(project.columns || "[]");

    return NextResponse.json({ columns });
  } catch (err) {
    console.error("Error fetching columns:", err);
    return NextResponse.json(
      { message: "Failed to fetch columns" },
      { status: 500 }
    );
  }
}

/* ================= ADD COLUMN ================= */
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    const { columnName, position } = await req.json();

    if (!projectId || !columnName) {
      return NextResponse.json(
        { message: "Project ID and column name required" },
        { status: 400 }
      );
    }

    const updatedProject = await ProjectRepository.addColumn(
      projectId,
      columnName,
      position
    );

    const columns = Array.isArray(updatedProject.columns) 
      ? updatedProject.columns 
      : JSON.parse(updatedProject.columns || "[]");

    return NextResponse.json({ columns });
  } catch (err) {
    console.error("Error adding column:", err);
    return NextResponse.json(
      { message: "Failed to add column" },
      { status: 500 }
    );
  }
}

/* ================= REMOVE COLUMN ================= */
export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    const { columnName } = await req.json();

    if (!projectId || !columnName) {
      return NextResponse.json(
        { message: "Project ID and column name required" },
        { status: 400 }
      );
    }

    const updatedProject = await ProjectRepository.removeColumn(
      projectId,
      columnName
    );

    const columns = Array.isArray(updatedProject.columns) 
      ? updatedProject.columns 
      : JSON.parse(updatedProject.columns || "[]");

    return NextResponse.json({ columns });
  } catch (err) {
    console.error("Error removing column:", err);
    return NextResponse.json(
      { message: "Failed to remove column" },
      { status: 500 }
    );
  }
}

/* ================= UPDATE COLUMNS (REORDER) ================= */
export async function PUT(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    const { columns } = await req.json();

    if (!projectId || !Array.isArray(columns)) {
      return NextResponse.json(
        { message: "Project ID and columns array required" },
        { status: 400 }
      );
    }

    const updatedProject = await ProjectRepository.updateColumns(
      projectId,
      columns
    );

    const updatedColumns = Array.isArray(updatedProject.columns) 
      ? updatedProject.columns 
      : JSON.parse(updatedProject.columns || "[]");

    return NextResponse.json({ columns: updatedColumns });
  } catch (err) {
    console.error("Error updating columns:", err);
    return NextResponse.json(
      { message: "Failed to update columns" },
      { status: 500 }
    );
  }
}
