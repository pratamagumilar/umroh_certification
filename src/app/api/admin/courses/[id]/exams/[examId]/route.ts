import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, examId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PANITIA")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id, examId } = await params;

  try {
    await prisma.courseExam.deleteMany({
      where: { courseId: id, examId }
    });
    return NextResponse.json({ message: "Ujian berhasil dihapus dari Course" });
  } catch (error) {
    return NextResponse.json({ message: "Terjadi kesalahan" }, { status: 500 });
  }
}
