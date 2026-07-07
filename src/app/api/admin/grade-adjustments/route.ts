import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, courseId, originalScore, adjustedScore, reason } = await req.json();

    if (!userId || !courseId || originalScore === undefined || adjustedScore === undefined || !reason) {
      return NextResponse.json({ message: "Parameter tidak lengkap" }, { status: 400 });
    }

    const parsedOriginal = parseFloat(originalScore);
    const parsedAdjusted = parseFloat(adjustedScore);

    if (isNaN(parsedOriginal) || isNaN(parsedAdjusted)) {
      return NextResponse.json({ message: "Nilai tidak valid" }, { status: 400 });
    }

    const adjustment = await prisma.gradeAdjustment.create({
      data: {
        userId,
        courseId,
        adminId: session.user.id,
        originalScore: parsedOriginal,
        adjustedScore: parsedAdjusted,
        reason
      }
    });

    return NextResponse.json({ message: "Grade adjustment disimpan!", adjustment }, { status: 201 });
  } catch (error) {
    console.error("Grade adjustment error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan" }, { status: 500 });
  }
}
