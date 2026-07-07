import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PANITIA" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const sessions = await prisma.courseSession.findMany({
    where: { courseId: id },
    orderBy: { order: "asc" },
    include: { material: true, masterAssignment: true }
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PANITIA" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const { type, materialId, masterAssignmentId, order, isLocked } = await req.json();
    
    if (type === 'MATERIAL' && !materialId) {
      return NextResponse.json({ message: "Material harus dipilih" }, { status: 400 });
    }
    if (type === 'ASSIGNMENT' && !masterAssignmentId) {
      return NextResponse.json({ message: "Master Data Tugas harus dipilih" }, { status: 400 });
    }

    const courseSession = await prisma.courseSession.create({
      data: {
        courseId: id,
        materialId: type === 'MATERIAL' ? materialId : null,
        masterAssignmentId: type === 'ASSIGNMENT' ? masterAssignmentId : null,
        order: order !== undefined ? parseInt(order, 10) : 0,
        isLocked: !!isLocked,
      },
      include: { material: true, masterAssignment: true }
    });

    return NextResponse.json({ message: "Sesi berhasil dibuat!", session: courseSession }, { status: 201 });
  } catch (error: any) {
    console.error("Create session error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan" }, { status: 500 });
  }
}
