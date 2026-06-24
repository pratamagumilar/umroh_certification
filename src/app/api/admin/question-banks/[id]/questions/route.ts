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

  const questions = await prisma.question.findMany({
    where: { bankId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(questions);
}

export async function POST(
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

    if (!type || !text) {
      return NextResponse.json(
        { message: "Tipe soal dan teks soal harus diisi." },
        { status: 400 }
      );
    }

    if (!["PG", "ESSAY"].includes(type)) {
      return NextResponse.json(
        { message: "Tipe soal harus PG atau ESSAY." },
        { status: 400 }
      );
    }

    // Validasi: PG harus punya options dan correctAnswer
    if (type === "PG" && (!options || !correctAnswer)) {
      return NextResponse.json(
        { message: "Soal PG harus memiliki opsi jawaban dan kunci jawaban." },
        { status: 400 }
      );
    }

    const question = await prisma.question.create({
      data: {
        bankId: id,
        type,
        text,
        options: type === "PG" ? (typeof options === "string" ? options : JSON.stringify(options)) : null,
        correctAnswer: type === "PG" ? correctAnswer : null,
      },
    });

    return NextResponse.json(
      { message: "Soal berhasil ditambahkan!", question },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create question error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
