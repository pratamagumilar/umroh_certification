import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Parameter email diperlukan" },
      { status: 400 }
    );
  }

  // Cek di Pendaftaran (pending/rejected) dan User (approved)
  const [existingPendaftaran, existingUser] = await Promise.all([
    prisma.pendaftaran.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
  ]);

  const available = !existingPendaftaran && !existingUser;

  return NextResponse.json({ available });
}