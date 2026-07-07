import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'PANITIA')) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const courseId = resolvedParams.id;
    const body = await request.json();

    if (!body.updates || !Array.isArray(body.updates)) {
      return NextResponse.json({ message: "Invalid payload format" }, { status: 400 });
    }

    // Execute bulk update using transaction
    const updatePromises = body.updates.map((update: { id: string; order: number }) => 
      prisma.courseSession.update({
        where: { id: update.id, courseId },
        data: { order: update.order }
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ message: "Reorder success" });
  } catch (error: any) {
    console.error("Reorder session error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
