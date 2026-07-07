import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        sessions: {
          include: {
            material: true,
            masterAssignment: true,
            submissions: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                grades: { include: { grader: { select: { name: true } } } }
              }
            }
          }
        }
      }
    });

    if (!course) return NextResponse.json({ message: "Course tidak ditemukan" }, { status: 404 });

    // Format output to be a flat list of submissions with session/assignment context
    const subs = course.sessions.flatMap(session => 
      (session.submissions || []).map(sub => ({
        ...sub,
        sessionTitle: session.material?.title || session.masterAssignment?.title || 'Sesi Tanpa Judul',
        assignmentTitle: session.masterAssignment?.title || 'Tugas',
        assignmentId: session.masterAssignment?.id || 'unknown',
        maxScore: session.masterAssignment?.maxScore || 100
      }))
    );

    return NextResponse.json(subs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Terjadi kesalahan saat memuat data" }, { status: 500 });
  }
}
