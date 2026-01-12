import { NextResponse } from "next/server";
import { ProjectService } from "@/backend/services/project.service";

export async function GET() {
  const projects = await ProjectService.getAll();
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const body = await req.json();
  console.log("📨 POST /api/projects - Received body:", {
    name: body.name,
    templateId: body.templateId,
    templatePhasesCount: body.templatePhases?.length,
    templatePhasesData: body.templatePhases,
  });
  const project = await ProjectService.create(body);
  return NextResponse.json(project);
}
