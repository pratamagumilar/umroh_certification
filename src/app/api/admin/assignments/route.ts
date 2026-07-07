import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'PANITIA')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const assignments = await prisma.masterAssignment.findMany({
      where: active ? { isActive: active === 'true' } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { courseSessions: true } }
      }
    });

    return NextResponse.json(assignments);
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'PANITIA')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, prompt, description, maxScore } = body;

    if (!title || !prompt) {
      return NextResponse.json({ message: 'Title and prompt are required' }, { status: 400 });
    }

    const newAssignment = await prisma.masterAssignment.create({
      data: {
        title,
        description,
        prompt,
        maxScore: maxScore ? parseFloat(maxScore) : 100,
        createdById: session.user.id
      }
    });

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
