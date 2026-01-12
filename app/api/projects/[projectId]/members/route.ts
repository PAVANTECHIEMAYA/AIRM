import { NextResponse } from "next/server";
import { TeamMemberService } from "@/backend/services/teamMember.service";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const members = await TeamMemberService.getByProject(params.projectId);
  return NextResponse.json(members);
}
