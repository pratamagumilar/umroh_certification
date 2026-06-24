import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const bank = await prisma.questionBank.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!bank) {
      return NextResponse.json({ message: 'Bank soal tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(bank);
  } catch (error) {
    console.error('Fetch question bank error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

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

    const { title, description } = await req.json();

    const updatedBank = await prisma.questionBank.update({
      where: { id },
      data: { title, description },
    });

    return NextResponse.json(updatedBank);
  } catch (error) {
    console.error('Update question bank error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await prisma.questionBank.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Bank soal berhasil dihapus' });
  } catch (error) {
    console.error('Delete question bank error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
