import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PESERTA") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id: sessionId } = await params;

    const { answer } = await req.json();
    if (!answer) return NextResponse.json({ message: "Jawaban tidak boleh kosong" }, { status: 400 });

    // Pastikan session exist dan bertipe assignment
    const courseSession = await prisma.courseSession.findUnique({
      where: { id: sessionId },
      include: { masterAssignment: true }
    });

    if (!courseSession || !courseSession.isActive || courseSession.isLocked || !courseSession.masterAssignmentId) {
      return NextResponse.json({ message: "Tugas tidak dapat diakses atau dikunci" }, { status: 403 });
    }

    // Pastikan tidak double submit / update jika sudah dinilai
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: session.user.id
        }
      }
    });

    if (existingSubmission && existingSubmission.status === "GRADED") {
      return NextResponse.json({ message: "Tugas sudah dinilai dan tidak bisa diubah" }, { status: 400 });
    }

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId: session.user.id
        }
      },
      update: {
        answer,
        status: "SUBMITTED",
        updatedAt: new Date()
      },
      create: {
        sessionId,
        userId: session.user.id,
        answer,
        status: "SUBMITTED"
      }
    });

    return NextResponse.json({ message: "Tugas berhasil dikumpulkan!", submission }, { status: 201 });
  } catch (error) {
    console.error("Submit assignment error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan" }, { status: 500 });
  }
}
