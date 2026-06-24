import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PENGAWAS") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Cari semua ExamResult yang masih PENDING
    const pendingResults = await prisma.examResult.findMany({
      where: { finalStatus: "PENDING" },
      select: { examId: true, userId: true }
    });

    // Kumpulkan ID unik ujian
    const examIds = [...new Set(pendingResults.map(r => r.examId))];

    // Ambil detail ujian
    const exams = await prisma.exam.findMany({
      where: { id: { in: examIds } },
      select: {
        id: true,
        title: true,
        startTime: true,
      },
      orderBy: { startTime: 'desc' }
    });

    // Hitung berapa esai yang belum dinilai per ujian
    // (Bisa memakan resource query, tapi untuk MVP ini cukup)
    const examsWithStats = await Promise.all(exams.map(async (exam) => {
      const usersInExam = pendingResults.filter(r => r.examId === exam.id).map(r => r.userId);
      
      const pendingEssays = await prisma.examAnswer.count({
        where: {
          userId: { in: usersInExam },
          score: null,
          question: {
            type: "ESSAY",
            exams: { some: { examId: exam.id } }
          }
        }
      });

      return {
        ...exam,
        pendingEssaysCount: pendingEssays,
        pendingParticipantsCount: usersInExam.length
      };
    }));

    return NextResponse.json(examsWithStats);
  } catch (error) {
    console.error("Fetch grading exams error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
