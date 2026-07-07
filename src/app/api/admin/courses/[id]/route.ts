import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { order: 'asc' },
        include: {
          material: true,
          masterAssignment: true,
          submissions: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              grades: { include: { grader: { select: { name: true } } } }
            }
          }
        }
      },
      enrollments: { include: { user: { select: { id: true, name: true, email: true } } } },
      courseExams: { include: { exam: true } }
    }
  });

  if (!course) return NextResponse.json({ message: "Course tidak ditemukan" }, { status: 404 });
  return NextResponse.json(course);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
  try {
    const { id } = await params;
    const body = await req.json();
    
    const course = await prisma.course.update({
      where: { id },
      data: body
    });
    return NextResponse.json({ message: "Course diupdate", course });
  } catch (e) {
    return NextResponse.json({ message: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
  try {
    const { id } = await params;
    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ message: "Course dihapus" });
  } catch (e) {
    return NextResponse.json({ message: "Terjadi kesalahan" }, { status: 500 });
  }
}
