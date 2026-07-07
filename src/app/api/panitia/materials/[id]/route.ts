import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PANITIA" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { title, description, pdfUrl, isActive } = await req.json();
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (pdfUrl !== undefined) updateData.pdfUrl = pdfUrl;
    if (isActive !== undefined) updateData.isActive = !!isActive;

    const material = await prisma.material.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ message: "Materi berhasil diupdate", material });
  } catch (error) {
    console.error("Update material error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
