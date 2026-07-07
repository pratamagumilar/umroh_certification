import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, userId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PANITIA")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id, userId } = await params;

  try {
    await prisma.courseEnrollment.deleteMany({
      where: { courseId: id, userId }
    });
    return NextResponse.json({ message: "Peserta berhasil dikeluarkan" });
  } catch (error) {
    return NextResponse.json({ message: "Terjadi kesalahan" }, { status: 500 });
  }
}
