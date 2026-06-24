import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      questions: {
        include: { question: true },
        orderBy: { id: "asc" },
      },
      _count: { select: { questions: true, attendances: true } },
    },
  });

  if (!exam) {
    return NextResponse.json({ message: "Ujian tidak ditemukan." }, { status: 404 });
  }

  // Flatten the ExamQuestion mapping so it looks like an array of Question objects
  // but we also keep the mapping ID if needed
  const mappedExam = {
    ...exam,
    questions: exam.questions.map((eq) => ({
      ...eq.question,
      mappingId: eq.id,
    })),
  };

  return NextResponse.json(mappedExam);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, startTime, durationMinutes, isActive } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (durationMinutes !== undefined) updateData.durationMinutes = parseInt(durationMinutes, 10);
    if (isActive !== undefined) updateData.isActive = isActive;

    const exam = await prisma.exam.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: "Ujian berhasil diupdate!", exam });
  } catch (error) {
    console.error("Update exam error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.exam.delete({ where: { id } });
    return NextResponse.json({ message: "Ujian berhasil dihapus!" });
  } catch (error) {
    console.error("Delete exam error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
