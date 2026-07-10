import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/panitia/absensi/[id]
 * Soft-delete an absensi event (sets isActive = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PANITIA" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const event = await prisma.absensiEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event absensi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Soft delete: set isActive = false
    await prisma.absensiEvent.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Event absensi dihapus" });
  } catch (error) {
    console.error("Error deleting absensi event:", error);
    return NextResponse.json(
      { error: "Gagal menghapus event absensi" },
      { status: 500 }
    );
  }
}