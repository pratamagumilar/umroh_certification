import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: examId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    // Pastikan user sudah absen / mulai ujian
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_examId: { userId: user.id, examId }
      }
    });

    if (!attendance) {
      return NextResponse.json({ message: 'Anda belum memulai ujian ini' }, { status: 403 });
    }

    // Ambil detail ujian dan soal-soalnya tanpa correctAnswer
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            question: {
              select: {
                id: true,
                type: true,
                text: true,
                options: true,
                // correctAnswer tidak disisipkan
              }
            }
          },
          orderBy: { id: 'asc' }
        }
      }
    });

    if (!exam || !exam.isActive) {
      return NextResponse.json({ message: 'Ujian tidak ditemukan atau tidak aktif' }, { status: 404 });
    }

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        startTime: exam.startTime,
      },
      attendance: {
        scanTime: attendance.scanTime
      },
      questions: exam.questions.map(eq => eq.question)
    });
  } catch (error) {
    console.error('Fetch take exam error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: examId } = await params;
    const body = await req.json();
    const { answers } = body as { answers: Record<string, string> }; // { questionId: answerText }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });

    // Cek apakah sudah pernah submit (ExamResult sudah ada)
    const existingResult = await prisma.examResult.findUnique({
      where: { userId_examId: { userId: user.id, examId } }
    });

    if (existingResult) {
      return NextResponse.json({ message: 'Anda sudah mengumpulkan ujian ini' }, { status: 403 });
    }

    // Ambil soal ujian dengan kunci jawaban untuk grading
    const examQuestions = await prisma.examQuestion.findMany({
      where: { examId },
      include: { question: true }
    });

    let pgScore = 0;
    let totalPg = 0;

    const answerRecords: any[] = [];

    for (const eq of examQuestions) {
      const q = eq.question;
      const userAnswer = answers[q.id] || '';
      let scoreForThisQuestion = null;

      if (q.type === 'PG') {
        totalPg++;
        if (userAnswer === q.correctAnswer) {
          scoreForThisQuestion = 1; // ntar dikalkulasi persentase
        } else {
          scoreForThisQuestion = 0;
        }
      }

      answerRecords.push({
        userId: user.id,
        questionId: q.id,
        answer: userAnswer,
        score: scoreForThisQuestion
      });

      if (scoreForThisQuestion === 1) {
        pgScore += 1;
      }
    }

    // Kalkulasi skor PG (misal skala 100)
    const finalPgScore = totalPg > 0 ? (pgScore / totalPg) * 100 : 0;

    // Simpan semua ke DB dalam satu transaksi
    await prisma.$transaction(async (tx) => {
      // 1. Simpan jawaban
      if (answerRecords.length > 0) {
        await tx.examAnswer.createMany({
          data: answerRecords
        });
      }

      // 2. Simpan Result (skor PG masuk, skor Esai 0, finalStatus PENDING)
      await tx.examResult.create({
        data: {
          userId: user.id,
          examId,
          pgScore: finalPgScore,
          essayScore: 0,
          finalStatus: 'PENDING'
        }
      });
    });

    return NextResponse.json({ message: 'Ujian berhasil dikumpulkan' });
  } catch (error) {
    console.error('Submit exam error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server saat mengumpulkan ujian' }, { status: 500 });
  }
}
