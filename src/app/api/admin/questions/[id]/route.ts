import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { type, text, options, correctAnswer } = body;

    const updateData: Record<string, unknown> = {};
    if (type !== undefined) updateData.type = type;
    if (text !== undefined) updateData.text = text;
    if (options !== undefined) {
      updateData.options = typeof options === "string" ? options : JSON.stringify(options);
    }
    if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;

    const question = await prisma.question.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: "Soal berhasil diupdate!", question });
  } catch (error) {
    console.error("Update question error:", error);
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
    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ message: "Soal berhasil dihapus!" });
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
