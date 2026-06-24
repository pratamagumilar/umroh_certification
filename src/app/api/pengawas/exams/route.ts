import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PENGAWAS") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const exams = await prisma.exam.findMany({
      include: {
        _count: {
          select: { attendances: true }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("Fetch exams error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
