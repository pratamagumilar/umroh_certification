import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const exams = await prisma.exam.findMany({
    include: {
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exams);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, startTime, durationMinutes } = body;

    if (!title || !startTime || !durationMinutes) {
      return NextResponse.json(
        { message: "Judul, waktu mulai, dan durasi harus diisi." },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        description: description || null,
        startTime: new Date(startTime),
        durationMinutes: parseInt(durationMinutes, 10),
      },
    });

    return NextResponse.json(
      { message: "Ujian berhasil dibuat!", exam },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create exam error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
