import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PENGAWAS") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { submissionId } = await params;

  try {
    const { score, feedback } = await req.json();
    if (score === undefined || score === null) {
      return NextResponse.json({ message: "Nilai harus diisi" }, { status: 400 });
    }

    const parsedScore = parseFloat(score);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      return NextResponse.json({ message: "Nilai harus di antara 0 - 100" }, { status: 400 });
    }

    // Mulai transaction untuk insert grade dan update status submission
    const result = await prisma.$transaction(async (tx) => {
      const grade = await tx.assignmentGrade.create({
        data: {
          submissionId,
          graderId: session.user.id,
          score: parsedScore,
          feedback: feedback || null
        }
      });

      const submission = await tx.assignmentSubmission.update({
        where: { id: submissionId },
        data: { status: "GRADED" }
      });

      return { grade, submission };
    });

    return NextResponse.json({ message: "Tugas berhasil dinilai!", result });
  } catch (error) {
    console.error("Grading assignment error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan" }, { status: 500 });
  }
}
