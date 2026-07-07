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

    // Total Esai (Tugas) Belum Dinilai MVP 2/3: AssignmentSubmission
    const pendingEssaysCount = await prisma.assignmentSubmission.count({
      where: {
        status: 'SUBMITTED'
      }
    });

    // SLA: Rata-rata waktu penilaian (gradedAt - submittedAt) dalam jam
    const grades = await prisma.assignmentGrade.findMany({
      where: { graderId: session.user.id },
      select: {
        gradedAt: true,
        submission: {
          select: { submittedAt: true }
        }
      }
    });

    let totalHours = 0;
    grades.forEach(g => {
      const diffMs = g.gradedAt.getTime() - g.submission.submittedAt.getTime();
      totalHours += diffMs / (1000 * 60 * 60);
    });
    
    const averageSlaHours = grades.length > 0 ? (totalHours / grades.length).toFixed(1) : '0.0';

    return NextResponse.json({
      activeExamsCount,
      completedExamsCount,
      pendingEssaysCount,
      averageSlaHours
    });
  } catch (error) {
    console.error("Dashboard pengawas error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
