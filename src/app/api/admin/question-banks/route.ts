import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const banks = await prisma.questionBank.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    return NextResponse.json(banks);
  } catch (error) {
    console.error('Fetch question banks error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { title, description } = await req.json();

    if (!title) {
      return NextResponse.json({ message: 'Judul Bank Soal wajib diisi' }, { status: 400 });
    }

    const newBank = await prisma.questionBank.create({
      data: {
        title,
        description,
      },
    });

    return NextResponse.json(newBank, { status: 201 });
  } catch (error) {
    console.error('Create question bank error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
