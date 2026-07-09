import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const where = examId ? { examId } : {};

    const [results, total] = await prisma.$transaction([
      prisma.examResult.findMany({
        where,
        select: {
          id: true,
          pgScore: true,
          essayScore: true,
          finalStatus: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, email: true },
          },
          exam: {
            select: { id: true, title: true, passingGrade: true },
          },
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.examResult.count({ where }),
    ]);

    return NextResponse.json({
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch results error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
