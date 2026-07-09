import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PANITIA" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

  const [courses, total] = await prisma.$transaction([
    prisma.course.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { sessions: true, enrollments: true } } },
    }),
    prisma.course.count(),
  ]);

  return NextResponse.json({
    data: courses,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PANITIA" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description } = await req.json();
    if (!title) return NextResponse.json({ message: "Judul harus diisi." }, { status: 400 });

    const course = await prisma.course.create({
      data: { title, description: description || null, createdById: session.user.id },
    });
    return NextResponse.json({ message: "Course berhasil dibuat!", course }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
