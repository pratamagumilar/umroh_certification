import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
import { uploadFile } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { userId, examId } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const exam = await prisma.exam.findUnique({ where: { id: examId } });

    if (!user || !exam) {
      return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 });
    }

    // Generate PDF menggunakan jsPDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Desain Sertifikat Sederhana
    doc.setFillColor(240, 249, 255); // bg-sky-50
    doc.rect(0, 0, 297, 210, 'F');
    
    doc.setDrawColor(14, 165, 233); // border color
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190, 'S');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.text("SERTIFIKAT KELULUSAN", 148.5, 60, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Diberikan kepada:", 148.5, 90, { align: 'center' });

    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text(user.name, 148.5, 110, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(`Atas keberhasilannya menyelesaikan ujian:`, 148.5, 130, { align: 'center' });
    
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(exam.title, 148.5, 145, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 148.5, 170, { align: 'center' });

    const pdfBuffer = doc.output('arraybuffer');
    
    const fileName = `cert_${userId}_${examId}.pdf`;
    
    // Gunakan storage adapter
    const pdfUrl = await uploadFile(Buffer.from(pdfBuffer), 'certificates', fileName, 'application/pdf');

    // Upsert ke database
    const existing = await prisma.certificate.findFirst({
      where: { userId, examId }
    });

    if (existing) {
      await prisma.certificate.update({
        where: { id: existing.id },
        data: { pdfUrl }
      });
    } else {
      await prisma.certificate.create({
        data: { userId, examId, pdfUrl }
      });
    }

    return NextResponse.json({ message: 'Sertifikat berhasil dibuat', pdfUrl });
  } catch (error) {
    console.error('Generate certificate error:', error);
    return NextResponse.json({ message: 'Gagal membuat sertifikat' }, { status: 500 });
  }
}
