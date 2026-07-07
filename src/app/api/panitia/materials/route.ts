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
  const activeOnly = searchParams.get("active") === "true";

  try {
    const materials = await prisma.material.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { courseSessions: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Fetch materials error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PANITIA" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, pdfUrl } = await req.json();
    if (!title || !pdfUrl) {
      return NextResponse.json({ message: "Judul dan PDF URL harus diisi" }, { status: 400 });
    }

    if (!session.user?.email) {
      return NextResponse.json({ message: "Email tidak valid" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!dbUser) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
    }

    const material = await prisma.material.create({
      data: {
        title,
        description: description || null,
        pdfUrl,
        createdById: dbUser.id
      }
    });

    return NextResponse.json({ message: "Master materi berhasil dibuat!", material }, { status: 201 });
  } catch (error) {
    console.error("Create material error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
