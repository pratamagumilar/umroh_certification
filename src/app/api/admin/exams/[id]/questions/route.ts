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

// Menerima array questionIds dan menghubungkannya ke ujian
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

    // Gunakan transaction: hapus mapping lama, buat mapping baru
    // Atau bisa hanya append (tergantung kebutuhan, di sini kita replace saja)
    await prisma.$transaction(async (tx) => {
      await tx.examQuestion.deleteMany({
        where: { examId },
      });

      const dataToInsert = questionIds.map((qId) => ({
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
