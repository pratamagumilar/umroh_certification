import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PESERTA") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  // Pastikan user terdaftar di course ini
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      courseId_userId: {
        courseId: id,
        userId: session.user.id
      }
    }
  });

  if (!enrollment) return NextResponse.json({ message: "Anda tidak terdaftar di course ini" }, { status: 403 });

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      sessions: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          material: true,
          masterAssignment: true,
          progresses: {
            where: { userId: session.user.id }
          },
          submissions: {
            where: { userId: session.user.id },
            include: { grades: true }
          }
        }
      },
      courseExams: {
        include: {
          exam: true
        }
      }
    }
  });

  if (!course) return NextResponse.json({ message: "Course tidak ditemukan" }, { status: 404 });

  // Cari apakah ada grade adjustment
  const adjustment = await prisma.gradeAdjustment.findFirst({
    where: { courseId: id, userId: session.user.id }
  });

  return NextResponse.json({ course, adjustment });
}
