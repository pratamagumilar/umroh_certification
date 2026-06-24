import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Ambil hasil ujian yang LULUS
    const passedResults = await prisma.examResult.findMany({
      where: { finalStatus: 'LULUS' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        exam: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    // Ambil sertifikat yang sudah di-generate
    const certificates = await prisma.certificate.findMany();
    const certMap = new Map();
    certificates.forEach((c: any) => certMap.set(`${c.userId}_${c.examId}`, c.pdfUrl));

    // Gabungkan data
    const data = passedResults.map((res: any) => ({
      ...res,
      hasCertificate: certMap.has(`${res.userId}_${res.examId}`),
      certificateUrl: certMap.get(`${res.userId}_${res.examId}`) || null,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fetch certificates error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
