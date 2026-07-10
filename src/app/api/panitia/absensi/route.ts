import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/panitia/absensi
 * List all absensi events
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PANITIA" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const events = await prisma.absensiEvent.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        kodeAbsen: true,
        createdAt: true,
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching absensi events:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data absensi" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/panitia/absensi
 * Create a new absensi event
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PANITIA" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Judul absensi wajib diisi" },
        { status: 400 }
      );
    }

    // Generate kodeAbsen: random 6-char uppercase
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let kodeAbsen = "";
    for (let i = 0; i < 6; i++) {
      kodeAbsen += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const event = await prisma.absensiEvent.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        kodeAbsen,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating absensi event:", error);
    return NextResponse.json(
      { error: "Gagal membuat event absensi" },
      { status: 500 }
    );
  }
}