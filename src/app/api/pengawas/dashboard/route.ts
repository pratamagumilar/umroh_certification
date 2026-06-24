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
    // Ujian Aktif
    const activeExamsCount = await prisma.exam.count({
      where: { isActive: true },
    });

    // Ujian Selesai (Tidak aktif)
    const completedExamsCount = await prisma.exam.count({
      where: { isActive: false },
    });

    // Total Esai Belum Dinilai
    // Esai yang disubmit (ada di ExamAnswer), tipe pertanyaannya ESSAY, dan score-nya masih null
    const pendingEssaysCount = await prisma.examAnswer.count({
      where: {
        score: null,
        question: {
          type: 'ESSAY'
        }
      }
    });

    return NextResponse.json({
      activeExamsCount,
      completedExamsCount,
      pendingEssaysCount,
    });
  } catch (error) {
    console.error("Dashboard pengawas error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
