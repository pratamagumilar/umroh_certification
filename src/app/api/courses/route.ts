import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PESERTA") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Hanya ambil course yang aktif dan peserta terdaftar (enrollment)
  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      userId: session.user.id,
      course: { isActive: true }
    },
    include: {
      course: {
        include: {
          sessions: {
            where: { isActive: true },
            select: { id: true }
          }
        }
      }
    }
  });

  const courses = enrollments.map(e => e.course);
  return NextResponse.json(courses);
}
