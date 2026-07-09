import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PESERTA") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

  const where = {
    userId: session.user.id,
    course: { isActive: true },
  };

  const [enrollments, total] = await prisma.$transaction([
    prisma.courseEnrollment.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { enrolledAt: "desc" },
      select: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            isActive: true,
            createdAt: true,
            _count: { select: { sessions: true, enrollments: true } },
          },
        },
      },
    }),
    prisma.courseEnrollment.count({ where }),
  ]);

  const courses = enrollments.map((e) => e.course);
  return NextResponse.json({
    data: courses,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
