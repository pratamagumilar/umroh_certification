import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { uploadFile } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'PANITIA')) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: "File tidak ditemukan" }, { status: 400 });
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ message: "File harus berupa PDF" }, { status: 400 });
    }

    const maxMb = parseInt(process.env.MAX_UPLOAD_MB || '20', 10);
    const maxBytes = maxMb * 1024 * 1024;
    
    if (file.size > maxBytes) {
      return NextResponse.json({ message: `Ukuran file maksimal ${maxMb}MB` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uuid = crypto.randomUUID();
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const fileName = `${year}/${month}/${uuid}.pdf`;
    
    // Gunakan storage adapter
    const finalPath = await uploadFile(buffer, 'materials', fileName, 'application/pdf');

    return NextResponse.json({ 
      message: "Upload berhasil", 
      path: finalPath 
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
