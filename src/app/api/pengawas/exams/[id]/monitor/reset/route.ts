import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PENGAWAS") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: examId } = await params;
    const body = await req.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json({ message: "User ID wajib diisi" }, { status: 400 });
    }

    // Gunakan transaction untuk memastikan integritas data
    await prisma.$transaction(async (tx) => {
      // 1. Hapus ExamResult (jika ada)
      await tx.examResult.deleteMany({
        where: { examId, userId }
      });

      // 2. Hapus Certificate (jika ada)
      await tx.certificate.deleteMany({
        where: { examId, userId }
      });

      // 3. Hapus Attendance
      await tx.attendance.deleteMany({
        where: { examId, userId }
      });

      // 4. Hapus ExamAnswer
      // Karena ExamAnswer tidak punya examId langsung, kita cek lewat relasi questions
      await tx.examAnswer.deleteMany({
        where: {
          userId,
          question: {
            exams: { some: { examId } }
          }
        }
      });
    });

    return NextResponse.json({ message: "Sesi ujian berhasil direset untuk peserta ini." });
  } catch (error) {
    console.error("Reset session error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server saat mereset sesi" },
      { status: 500 }
    );
  }
}
