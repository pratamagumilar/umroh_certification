import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PENGAWAS") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Ambil semua submission tugas materi yang statusnya SUBMITTED (belum dinilai)
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { status: "SUBMITTED" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      session: {
        include: { 
          course: true, 
          masterAssignment: true, 
          material: true 
        }
      }
    },
    orderBy: { submittedAt: "asc" }
  });

  return NextResponse.json(submissions);
}
