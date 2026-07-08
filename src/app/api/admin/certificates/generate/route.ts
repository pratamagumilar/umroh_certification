import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateAndSaveCertificate } from '@/lib/certificateGenerator';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { userId, examId } = await req.json();

    if (!userId || !examId) {
      return NextResponse.json({ message: 'Missing userId or examId' }, { status: 400 });
    }

    const pdfUrl = await generateAndSaveCertificate(userId, examId);

    return NextResponse.json({ message: 'Sertifikat berhasil dibuat', pdfUrl });
  } catch (error: any) {
    console.error('Generate certificate error:', error);
    return NextResponse.json({ message: error.message || 'Gagal membuat sertifikat' }, { status: 500 });
  }
}
