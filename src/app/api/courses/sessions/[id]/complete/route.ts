import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PESERTA") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id: sessionId } = await params;

  try {
    // Pastikan session exist dan course active & user enrolled
    const courseSession = await prisma.courseSession.findUnique({
      where: { id: sessionId },
      include: { course: true }
    });

    if (!courseSession || !courseSession.course.isActive) {
      return NextResponse.json({ message: "Sesi tidak ditemukan atau tidak aktif" }, { status: 404 });
    }

    if (courseSession.isLocked) {
      return NextResponse.json({ message: "Sesi dikunci oleh panitia" }, { status: 403 });
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: courseSession.courseId,
          userId: session.user.id
        }
      }
    });

    if (!enrollment) return NextResponse.json({ message: "Anda tidak terdaftar di course ini" }, { status: 403 });

    const progress = await prisma.sessionProgress.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId: session.user.id
        }
      },
      update: { status: "COMPLETED" },
      create: {
        sessionId,
        userId: session.user.id,
        status: "COMPLETED"
      }
    });

    return NextResponse.json({ message: "Sesi ditandai selesai!", progress });
  } catch (error) {
    return NextResponse.json({ message: "Terjadi kesalahan" }, { status: 500 });
  }
}
