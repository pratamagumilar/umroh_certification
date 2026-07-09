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

    // Single query: hitung essay pending per user sekaligus
    const userIds = pendingResults.map((r) => r.userId);
    const pendingEssayCounts = await prisma.examAnswer.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
        score: null,
        question: {
          type: "ESSAY",
          exams: { some: { examId } },
        },
      },
      _count: { id: true },
    });

    const countMap = new Map(
      pendingEssayCounts.map((item) => [item.userId, item._count.id])
    );

    const participantsWithStats = pendingResults.map((result) => ({
      id: result.userId,
      name: result.user.name,
      email: result.user.email,
      pendingEssaysCount: countMap.get(result.userId) ?? 0,
      pgScore: result.pgScore,
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
