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

    const { id } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        durationMinutes: true,
        isActive: true,
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!exam || !exam.isActive) {
      return NextResponse.json({ message: 'Ujian tidak ditemukan atau tidak aktif' }, { status: 404 });
    }

    // Check if user already took the exam
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) {
      const existingResult = await prisma.examResult.findFirst({
        where: { userId: user.id, examId: id }
      });
      if (existingResult) {
        return NextResponse.json({ message: 'Anda sudah mengerjakan ujian ini' }, { status: 403 });
      }
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Fetch exam preparation error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
