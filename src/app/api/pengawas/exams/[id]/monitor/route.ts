import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PENGAWAS") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: examId } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { title: true, isActive: true }
    });

    if (!exam) {
      return NextResponse.json({ message: "Ujian tidak ditemukan" }, { status: 404 });
    }

    // Ambil data attendance (peserta yang sudah mulai) beserta hasil ujiannya jika ada
    const attendances = await prisma.attendance.findMany({
      where: { examId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        exam: {
          select: {
            examResults: {
              where: {
                // unfortunately Prisma doesn't easily allow filtering include based on parent relation inside include without nested findMany logic inside JS. 
                // Wait, it's easier to just fetch ExamResults separately or fetch Users and include attendance and examResults.
              }
            }
          }
        }
      },
      orderBy: { scanTime: 'desc' }
    });

    // Karena relasi langsung antar model, lebih baik query dari User yang punya attendance di exam ini
    const participants = await prisma.user.findMany({
      where: {
        attendances: {
          some: { examId }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        attendances: {
          where: { examId },
          select: { scanTime: true }
        },
        examResults: {
          where: { examId },
          select: { finalStatus: true, pgScore: true, essayScore: true }
        }
      }
    });

    // Formatting data untuk frontend
    const formattedData = participants.map(p => {
      const attendance = p.attendances[0];
      const result = p.examResults.length > 0 ? p.examResults[0] : null;

      let status = "Mengerjakan";
      if (result) {
        status = result.finalStatus === "PENDING" ? "Menunggu Nilai Esai" : "Selesai";
      }

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        scanTime: attendance.scanTime,
        status: status,
        pgScore: result ? result.pgScore : null,
        totalScore: result ? result.pgScore + result.essayScore : null,
      };
    });

    // Sort by scanTime descending
    formattedData.sort((a, b) => new Date(b.scanTime).getTime() - new Date(a.scanTime).getTime());

    return NextResponse.json({
      exam,
      participants: formattedData
    });

  } catch (error) {
    console.error("Monitor exam error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
