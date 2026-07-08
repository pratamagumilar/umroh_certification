import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PENGAWAS") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: examId } = await params;
    const body = await req.json();
    const { userId, minutes } = body as { userId: string; minutes: number };

    if (!userId || !minutes) {
      return NextResponse.json({ message: "User ID dan tambahan waktu (minutes) wajib diisi" }, { status: 400 });
    }

    const attendance = await prisma.attendance.findUnique({
      where: { userId_examId: { userId, examId } }
    });

    if (!attendance) {
      return NextResponse.json({ message: "Sesi ujian (attendance) tidak ditemukan" }, { status: 404 });
    }

    // Untuk menambah sisa waktu (endTime = scanTime + durationMinutes)
    // Kita memajukan scanTime ke masa depan sebesar X menit.
    const newScanTime = new Date(attendance.scanTime.getTime() + (minutes * 60000));

    await prisma.attendance.update({
      where: { id: attendance.id },
      data: { scanTime: newScanTime }
    });

    return NextResponse.json({ message: `Berhasil menambahkan waktu ${minutes} menit.` });
  } catch (error) {
    console.error("Add time error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server saat menambah waktu" },
      { status: 500 }
    );
  }
}
