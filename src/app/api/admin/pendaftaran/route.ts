import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * GET /api/admin/pendaftaran
 * List all registrations with optional status filter and search
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const isPanitia = session.user.role === "PANITIA";

    if (!isAdmin && !isPanitia) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { namaGelar: { contains: search, mode: "insensitive" } },
        { namaTanpaGelar: { contains: search, mode: "insensitive" } },
        { nik: { contains: search } },
        { noHp: { contains: search } },
      ];
    }

    const [pendaftaran, total] = await Promise.all([
      prisma.pendaftaran.findMany({
        where: where as Prisma.PendaftaranWhereInput,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          namaGelar: true,
          namaTanpaGelar: true,
          tempatLahir: true,
          nik: true,
          noHp: true,
          unitKerja: true,
          status: true,
          createdAt: true,
          approvedAt: true,
          approvedBy: {
            select: { id: true, name: true },
          },
          _count: {
            select: { dokumen: true },
          },
        },
      }),
      prisma.pendaftaran.count({ where: where as Prisma.PendaftaranWhereInput }),
    ]);

    return NextResponse.json({
      data: pendaftaran,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching pendaftaran:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pendaftaran" },
      { status: 500 }
    );
  }
}