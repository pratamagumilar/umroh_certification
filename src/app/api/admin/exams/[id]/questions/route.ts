import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Mendapatkan soal-soal yang terhubung dengan ujian ini
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const examQuestions = await prisma.examQuestion.findMany({
      where: { examId },
      include: {
        question: true,
      },
      orderBy: { id: 'asc' }, // bisa diganti order
    });

    // Extract questions
    const questions = examQuestions.map(eq => ({
      ...eq.question,
      mappingId: eq.id, // Untuk keperluan hapus mapping kalau perlu
    }));

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Fetch exam questions error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// Menerima array questionIds dan menambahkan relasi soal ke ujian.
// Endpoint ini tidak menghapus mapping lama agar soal dari bank soal tidak bisa dihapus manual dari kelola ujian.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { questionIds } = body as { questionIds: string[] };

    if (!Array.isArray(questionIds)) {
      return NextResponse.json({ message: 'questionIds harus berupa array' }, { status: 400 });
    }

    const uniqueQuestionIds = Array.from(new Set(questionIds.filter((qId) => typeof qId === 'string' && qId.trim() !== '')));

    if (uniqueQuestionIds.length === 0) {
      return NextResponse.json({ message: 'Pilih minimal satu soal dari bank soal' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const existingMappings = await tx.examQuestion.findMany({
        where: {
          examId,
          questionId: { in: uniqueQuestionIds },
        },
        select: { questionId: true },
      });

      const existingQuestionIds = new Set(existingMappings.map((mapping) => mapping.questionId));
      const dataToInsert = uniqueQuestionIds.filter((qId) => !existingQuestionIds.has(qId)).map((qId) => ({
        examId,
        questionId: qId,
      }));

      if (dataToInsert.length > 0) {
        await tx.examQuestion.createMany({
          data: dataToInsert,
        });
      }
    });

    return NextResponse.json({ message: 'Soal berhasil disimpan ke ujian' });
  } catch (error) {
    console.error('Map questions to exam error:', error);
    return NextResponse.json({ message: 'Gagal memetakan soal' }, { status: 500 });
  }
}
