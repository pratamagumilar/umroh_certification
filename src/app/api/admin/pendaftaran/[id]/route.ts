import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/pendaftaran/[id]
 * Get registration detail with documents
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const pendaftaran = await prisma.pendaftaran.findUnique({
      where: { id },
      include: {
        dokumen: {
          select: {
            id: true,
            tipeDokumen: true,
            fileUrl: true,
            namaAsli: true,
            mimeType: true,
          },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!pendaftaran) {
      return NextResponse.json(
        { error: "Pendaftaran tidak ditemukan" },
        { status: 404 }
      );
    }

    // Don't expose password
    const { password, ...rest } = pendaftaran;

    return NextResponse.json(rest);
  } catch (error) {
    console.error("Error fetching pendaftaran detail:", error);
    return NextResponse.json(
      { error: "Gagal mengambil detail pendaftaran" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/pendaftaran/[id]
 * Approve or reject a registration.
 * Body: { action: "APPROVE" | "REJECT", alasanReject?: string }
 *
 * APPROVE: Creates a User (PESERTA role), links them to Pendaftaran
 * REJECT: Sets status REJECTED with reason
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { action, alasanReject } = await request.json();

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Action harus APPROVE atau REJECT" },
        { status: 400 }
      );
    }

    // Check pendaftaran exists and is in PENDING status
    const pendaftaran = await prisma.pendaftaran.findUnique({
      where: { id },
    });

    if (!pendaftaran) {
      return NextResponse.json(
        { error: "Pendaftaran tidak ditemukan" },
        { status: 404 }
      );
    }

    if (pendaftaran.status !== "PENDING") {
      return NextResponse.json(
        {
          error: `Pendaftaran sudah diproses (status: ${pendaftaran.status})`,
        },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      // Create User and link to Pendaftaran in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Generate kodePeserta: PSR-XXXX (sequential)
        const lastUser = await tx.user.findFirst({
          where: { kodePeserta: { not: null } },
          orderBy: { kodePeserta: "desc" },
          select: { kodePeserta: true },
        });

        let nextNumber = 1;
        if (lastUser?.kodePeserta) {
          const match = lastUser.kodePeserta.match(/^PSR-(\d+)$/);
          if (match) nextNumber = parseInt(match[1], 10) + 1;
        }
        const kodePeserta = `PSR-${String(nextNumber).padStart(4, "0")}`;

        // 2. Create User with kodePeserta
        const user = await tx.user.create({
          data: {
            email: pendaftaran.email,
            password: pendaftaran.password,
            name: pendaftaran.namaTanpaGelar || pendaftaran.namaGelar,
            role: "PESERTA",
            phone: pendaftaran.noHp,
            isActive: true,
            kodePeserta,
          },
        });

        // 2. Update Pendaftaran to APPROVED and link user
        const updated = await tx.pendaftaran.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedById: session.user.id,
            approvedAt: new Date(),
            userId: user.id,
          },
        });

        return { user, pendaftaran: updated };
      });

      return NextResponse.json({
        message: "Pendaftaran disetujui. User peserta berhasil dibuat.",
        userId: result.user.id,
        status: "APPROVED",
      });
    } else {
      // REJECT
      if (!alasanReject || alasanReject.trim() === "") {
        return NextResponse.json(
          { error: "Alasan penolakan wajib diisi" },
          { status: 400 }
        );
      }

      await prisma.pendaftaran.update({
        where: { id },
        data: {
          status: "REJECTED",
          alasanReject: alasanReject.trim(),
          approvedById: session.user.id,
          approvedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: "Pendaftaran ditolak.",
        status: "REJECTED",
      });
    }
  } catch (error) {
    console.error("Error processing pendaftaran:", error);
    return NextResponse.json(
      { error: "Gagal memproses pendaftaran" },
      { status: 500 }
    );
  }
}