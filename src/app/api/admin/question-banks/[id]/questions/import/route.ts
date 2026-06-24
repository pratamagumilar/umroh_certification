import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";

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
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "File tidak ditemukan." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet) as any[];

    if (data.length === 0) {
      return NextResponse.json({ message: "File Excel kosong." }, { status: 400 });
    }

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const type = row["Tipe"] || row["tipe"] || row["TYPE"];
      const text = row["Soal"] || row["soal"] || row["TEXT"];

      if (!type || !text) {
        errors.push(`Baris ${i + 2}: Tipe Soal dan Teks Soal wajib diisi.`);
        continue;
      }

      const upperType = String(type).trim().toUpperCase();
      if (!["PG", "ESSAY"].includes(upperType)) {
        errors.push(`Baris ${i + 2}: Tipe Soal harus PG atau ESSAY.`);
        continue;
      }

      let options = null;
      let correctAnswer = null;

      if (upperType === "PG") {
        const optA = row["Opsi A"] || row["A"];
        const optB = row["Opsi B"] || row["B"];
        const optC = row["Opsi C"] || row["C"];
        const optD = row["Opsi D"] || row["D"];
        const correct = row["Jawaban"] || row["Kunci"] || row["correctAnswer"];

        if (!optA || !optB || !optC || !optD || !correct) {
          errors.push(`Baris ${i + 2}: Soal PG harus memiliki Opsi A, B, C, D dan Kunci Jawaban.`);
          continue;
        }

        options = JSON.stringify({ A: optA, B: optB, C: optC, D: optD });
        correctAnswer = String(correct).trim().toUpperCase();
      }

      await prisma.question.create({
        data: {
          bankId: id,
          type: upperType,
          text: String(text).trim(),
          options,
          correctAnswer,
        },
      });

      successCount++;
    }

    return NextResponse.json({
      message: `Berhasil import ${successCount} soal.`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import questions error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
