import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PANITIA")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId: id },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  return NextResponse.json(enrollments);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PANITIA")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ message: "UserId harus diisi" }, { status: 400 });

    const enrollment = await prisma.courseEnrollment.create({
      data: { courseId: id, userId }
    });

    return NextResponse.json({ message: "Peserta berhasil dienroll!", enrollment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Peserta sudah terdaftar atau terjadi kesalahan" }, { status: 500 });
  }
}
