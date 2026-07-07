import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const { sessions } = await req.json();

  if (!Array.isArray(sessions)) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  try {
    const existingSessions = await prisma.courseSession.findMany({
      where: { courseId }
    });
    
    const existingIds = existingSessions.map(s => s.id);
    const incomingIds = sessions.filter(s => s.id && !s.id.toString().startsWith('temp-')).map(s => s.id);

    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));

    // Execute in a transaction to ensure atomic updates
    await prisma.$transaction(async (tx) => {
      // 1. Delete missing sessions
      if (idsToDelete.length > 0) {
        await tx.courseSession.deleteMany({
          where: { id: { in: idsToDelete }, courseId }
        });
      }

      // 2. Update or Create sessions
      for (const [index, s] of sessions.entries()) {
        const isNew = !s.id || s.id.toString().startsWith('temp-');
        
        if (isNew) {
          await tx.courseSession.create({
            data: {
              courseId,
              materialId: s.materialId || null,
              masterAssignmentId: s.masterAssignmentId || null,
              order: index + 1,
              isLocked: s.isLocked ?? false,
              isActive: true
            }
          });
        } else {
          await tx.courseSession.update({
            where: { id: s.id },
            data: {
              order: index + 1,
              isLocked: s.isLocked ?? false
            }
          });
        }
      }
    });

    return NextResponse.json({ message: "Sesi berhasil disinkronisasi" });
  } catch (error: any) {
    console.error("Bulk sync error:", error);
    return NextResponse.json({ message: error.message || "Terjadi kesalahan" }, { status: 500 });
  }
}
