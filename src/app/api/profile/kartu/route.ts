import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profile/kartu
 * Returns kartu peserta data for the currently logged-in PESERTA user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PESERTA") {
      return NextResponse.json(
        { error: "Hanya peserta yang dapat mengakses kartu peserta" },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Get user with pendaftaran data for complete kartu info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        kodePeserta: true,
        photoUrl: true,
        pendaftaran: {
          select: {
            namaGelar: true,
            tempatLahir: true,
            tanggalLahir: true,
            unitKerja: true,
            jabatan: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      kodePeserta: user.kodePeserta,
      photoUrl: user.photoUrl,
      namaGelar: user.pendaftaran?.namaGelar ?? user.name,
      tempatLahir: user.pendaftaran?.tempatLahir ?? "",
      tanggalLahir: user.pendaftaran?.tanggalLahir?.toISOString() ?? "",
      unitKerja: user.pendaftaran?.unitKerja ?? "",
      jabatan: user.pendaftaran?.jabatan ?? "",
    });
  } catch (error) {
    console.error("Error fetching kartu peserta:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kartu peserta" },
      { status: 500 }
    );
  }
}