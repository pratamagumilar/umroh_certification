import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    // Ambil semua ujian yang aktif dan belum diselesaikan oleh user
    const activeExams = await prisma.exam.findMany({
      where: {
        isActive: true,
        examResults: {
          none: { userId: user.id }
        }
      },
      orderBy: { startTime: 'asc' },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    return NextResponse.json(activeExams);
  } catch (error) {
    console.error('Fetch active exams error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
