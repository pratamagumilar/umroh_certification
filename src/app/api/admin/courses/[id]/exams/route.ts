import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PANITIA")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const { examId, isRequired } = await req.json();
    if (!examId) return NextResponse.json({ message: "ExamId harus diisi" }, { status: 400 });

    const courseExam = await prisma.courseExam.create({
      data: { courseId: id, examId, isRequired: isRequired !== undefined ? !!isRequired : true }
    });

    return NextResponse.json({ message: "Ujian berhasil dimapping ke Course!", courseExam }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Ujian sudah dimapping atau terjadi kesalahan" }, { status: 500 });
  }
}
