import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/panitia/absensi/record?eventId=xxx
 * List all attendance records for an event
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

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId query parameter wajib diisi" },
        { status: 400 }
      );
    }

    const records = await prisma.absensiRecord.findMany({
      where: { eventId },
      include: {
        user: {
          select: { name: true, kodePeserta: true, email: true },
        },
      },
      orderBy: { scanTime: "desc" },
    });

    return NextResponse.json(
      records.map((r) => ({
        id: r.id,
        participant: r.user,
        method: r.method,
        scanTime: r.scanTime.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching absensi records:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data absensi" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/panitia/absensi/record
 * Record attendance for a participant.
 * Body: { eventId, kodePeserta, method }
 * method: "QR_SCAN" | "MANUAL"
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

    const { eventId, kodePeserta, method } = await request.json();

    if (!eventId || !kodePeserta) {
      return NextResponse.json(
        { error: "eventId dan kodePeserta wajib diisi" },
        { status: 400 }
      );
    }

    // Find the event
    const event = await prisma.absensiEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || !event.isActive) {
      return NextResponse.json(
        { error: "Event absensi tidak ditemukan atau sudah tidak aktif" },
        { status: 404 }
      );
    }

    // Find user by kodePeserta
    const user = await prisma.user.findUnique({
      where: { kodePeserta: kodePeserta },
      select: { id: true, name: true, kodePeserta: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Peserta tidak ditemukan. Pastikan kode peserta valid.",
          kodePeserta,
        },
        { status: 404 }
      );
    }

    // Check if already recorded
    const existing = await prisma.absensiRecord.findUnique({
      where: {
        eventId_userId: { eventId, userId: user.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Peserta sudah tercatat hadir pada event ini",
          participant: {
            name: user.name,
            kodePeserta: user.kodePeserta,
            scanTime: existing.scanTime.toISOString(),
            method: existing.method,
          },
        },
        { status: 409 }
      );
    }

    // Record attendance
    const record = await prisma.absensiRecord.create({
      data: {
        eventId,
        userId: user.id,
        method: method || "MANUAL",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Absensi berhasil dicatat",
        record: {
          id: record.id,
          participant: {
            name: user.name,
            kodePeserta: user.kodePeserta,
            email: user.email,
          },
          method: record.method,
          scanTime: record.scanTime.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording attendance:", error);
    return NextResponse.json(
      { error: "Gagal mencatat absensi" },
      { status: 500 }
    );
  }
}