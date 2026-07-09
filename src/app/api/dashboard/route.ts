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

    // if ADMIN, might return empty or logic for admin dashboard, but here we focus on PESERTA

    // Fetch all dashboard data in parallel
    const now = new Date();
    const [activeExams, results, certificates] = await Promise.all([
      prisma.exam.findMany({
        where: {
          isActive: true,
          examResults: {
            none: { userId: user.id },
          },
        },
        orderBy: { startTime: "asc" },
        take: 5,
      }),
      prisma.examResult.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          pgScore: true,
          essayScore: true,
          finalStatus: true,
          createdAt: true,
          exam: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.certificate.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          pdfUrl: true,
          createdAt: true,
          exam: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      activeExams,
      results,
      certificates,
    });
  } catch (error) {
    console.error('Fetch dashboard error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
