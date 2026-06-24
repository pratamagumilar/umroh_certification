import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PENGAWAS") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { examId } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { title: true }
    });

    if (!exam) {
      return NextResponse.json({ message: "Ujian tidak ditemukan" }, { status: 404 });
    }

    // Cari result ujian ini yang masih PENDING
    const pendingResults = await prisma.examResult.findMany({
      where: { examId, finalStatus: "PENDING" },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    // Hitung esai yang pending per user
    const participantsWithStats = await Promise.all(pendingResults.map(async (result) => {
      const pendingEssays = await prisma.examAnswer.count({
        where: {
          userId: result.userId,
          score: null,
          question: {
            type: "ESSAY",
            exams: { some: { examId } }
          }
        }
      });

      return {
        id: result.userId,
        name: result.user.name,
        email: result.user.email,
        pendingEssaysCount: pendingEssays,
        pgScore: result.pgScore
      };
    }));

    // Hanya tampilkan peserta yang benar-benar memiliki essay pending
    const filteredParticipants = participantsWithStats.filter(p => p.pendingEssaysCount > 0);

    return NextResponse.json({
      exam,
      participants: filteredParticipants
    });

  } catch (error) {
    console.error("Fetch grading participants error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
