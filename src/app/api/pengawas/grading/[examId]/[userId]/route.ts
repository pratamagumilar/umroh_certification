import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ examId: string; userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PENGAWAS") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { examId, userId } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { title: true, passingGrade: true }
    });

    const participant = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });

    if (!exam || !participant) {
      return NextResponse.json({ message: "Data tidak ditemukan" }, { status: 404 });
    }

    // Ambil jawaban esai untuk user dan exam ini
    const essayAnswers = await prisma.examAnswer.findMany({
      where: {
        userId,
        question: {
          type: "ESSAY",
          exams: { some: { examId } }
        }
      },
      include: {
        question: { select: { text: true } }
      }
    });

    return NextResponse.json({
      exam,
      participant,
      essayAnswers
    });

  } catch (error) {
    console.error("Fetch essay answers error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ examId: string; userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PENGAWAS") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { examId, userId } = await params;
    const body = await req.json();
    const { grades } = body as { grades: Record<string, number> }; // { answerId: score }

    if (!grades || Object.keys(grades).length === 0) {
      return NextResponse.json({ message: "Tidak ada nilai yang disubmit" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) return NextResponse.json({ message: "Ujian tidak ditemukan" }, { status: 404 });

    const examResult = await prisma.examResult.findUnique({
      where: { userId_examId: { userId, examId } }
    });

    if (!examResult) return NextResponse.json({ message: "Hasil ujian tidak ditemukan" }, { status: 404 });

    // Gunakan transaction agar aman
    await prisma.$transaction(async (tx) => {
      let totalEssayScore = 0;

      // Update skor tiap jawaban
      for (const [answerId, score] of Object.entries(grades)) {
        await tx.examAnswer.update({
          where: { id: answerId },
          data: { score }
        });
        totalEssayScore += score;
      }

      // Ambil nilai essay sebelumnya jika ada (misal sebagian sudah dinilai)
      // Namun untuk amannya, kita hitung ulang total score semua jawaban essay user ini untuk exam ini
      const allEssayAnswers = await tx.examAnswer.findMany({
        where: {
          userId,
          question: {
            type: "ESSAY",
            exams: { some: { examId } }
          }
        }
      });

      const finalEssayScore = allEssayAnswers.reduce((sum, ans) => sum + (ans.score || 0), 0);
      
      // Karena sebelumnya total PG itu aslinya persentase (di take exam route.ts),
      // kita harus menentukan apakah final score adalah rata-rata atau penjumlahan.
      // Misal: pgScore max 100, essayScore max 100 (kalo di rata2), atau total = pg + essay / 2.
      // Demi kesederhanaan MVP: (pgScore + finalEssayScore) / 2
      // Aturan scoring idealnya didefinisikan secara matang, kita asumsikan bobot 50:50.
      const finalScore = (examResult.pgScore + finalEssayScore) / 2;
      const finalStatus = finalScore >= exam.passingGrade ? "LULUS" : "TIDAK_LULUS";

      // Update Result
      await tx.examResult.update({
        where: { id: examResult.id },
        data: {
          essayScore: finalEssayScore,
          finalStatus
        }
      });
    });

    return NextResponse.json({ message: "Penilaian berhasil disimpan" });
  } catch (error) {
    console.error("Submit grading error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server saat menyimpan nilai" },
      { status: 500 }
    );
  }
}
