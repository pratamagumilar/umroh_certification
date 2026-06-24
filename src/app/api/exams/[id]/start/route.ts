import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam || !exam.isActive) {
      return NextResponse.json({ message: 'Ujian tidak aktif atau tidak ditemukan' }, { status: 404 });
    }

    // Cek apakah sudah pernah absen
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_examId: {
          userId: user.id,
          examId: examId
        }
      }
    });

    if (!existingAttendance) {
      // Catat absensi jika belum pernah
      await prisma.attendance.create({
        data: {
          userId: user.id,
          examId: examId,
        }
      });
    }

    return NextResponse.json({ message: 'Ujian berhasil dimulai' });
  } catch (error) {
    console.error('Start exam error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
