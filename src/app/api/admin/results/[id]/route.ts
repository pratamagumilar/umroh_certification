import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { finalStatus } = await req.json();

    if (!['PENDING', 'LULUS', 'TIDAK_LULUS'].includes(finalStatus)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
    }

    const updated = await prisma.examResult.update({
      where: { id },
      data: { finalStatus }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update result error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
