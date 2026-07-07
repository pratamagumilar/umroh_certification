import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PANITIA" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const { type, materialId, masterAssignmentId, order, isLocked } = await req.json();
    
    // Prepare payload. Set mutually exclusive fields to null where appropriate
    const updateData: any = {
      order: order ? parseInt(order) : undefined,
      isLocked: isLocked
    };

    if (type === 'MATERIAL') {
      updateData.materialId = materialId;
      updateData.masterAssignmentId = null;
    } else if (type === 'ASSIGNMENT') {
      updateData.masterAssignmentId = masterAssignmentId;
      updateData.materialId = null;
    }
    
    const courseSession = await prisma.courseSession.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ message: "Sesi berhasil diupdate", session: courseSession });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PANITIA" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    await prisma.courseSession.delete({ where: { id } });
    return NextResponse.json({ message: "Sesi berhasil dihapus" });
  } catch (e) {
    return NextResponse.json({ message: "Terjadi kesalahan" }, { status: 500 });
  }
}
