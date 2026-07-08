import { jsPDF } from 'jspdf';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/storage';

/**
 * Generates a premium PDF certificate and saves it to storage and database.
 * @param userId ID of the user who passed the exam
 * @param examId ID of the exam
 * @returns The public URL or relative path of the generated PDF certificate
 */
export async function generateAndSaveCertificate(userId: string, examId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const exam = await prisma.exam.findUnique({ where: { id: examId } });

  if (!user || !exam) {
    throw new Error('Data user atau exam tidak ditemukan');
  }

  // Generate PDF menggunakan jsPDF (A4 Landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const centerX = width / 2;

  // Background
  doc.setFillColor(252, 253, 255); // Sangat soft blue/white
  doc.rect(0, 0, width, height, 'F');

  // Outer Gold Border
  doc.setDrawColor(212, 175, 55); // Gold
  doc.setLineWidth(3);
  doc.rect(10, 10, width - 20, height - 20, 'S');

  // Inner Emerald Border
  doc.setDrawColor(16, 185, 129); // Emerald-500
  doc.setLineWidth(1);
  doc.rect(13, 13, width - 26, height - 26, 'S');

  // Ornamen Sudut (Simulasi dengan kotak/garis)
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(2);
  // Kiri Atas
  doc.line(15, 15, 35, 15);
  doc.line(15, 15, 15, 35);
  // Kanan Atas
  doc.line(width - 15, 15, width - 35, 15);
  doc.line(width - 15, 15, width - 15, 35);
  // Kiri Bawah
  doc.line(15, height - 15, 35, height - 15);
  doc.line(15, height - 15, 15, height - 35);
  // Kanan Bawah
  doc.line(width - 15, height - 15, width - 35, height - 15);
  doc.line(width - 15, height - 15, width - 15, height - 35);

  // Header
  doc.setTextColor(16, 185, 129); // Emerald-500
  doc.setFontSize(42);
  doc.setFont("helvetica", "bold");
  doc.text("SERTIFIKAT KELULUSAN", centerX, 60, { align: 'center' });

  // Subtitle
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFontSize(16);
  doc.setFont("helvetica", "italic");
  doc.text("Dengan bangga diberikan kepada:", centerX, 85, { align: 'center' });

  // Nama Peserta
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text(user.name.toUpperCase(), centerX, 105, { align: 'center' });

  // Garis bawah nama
  doc.setDrawColor(212, 175, 55); // Gold
  doc.setLineWidth(1);
  const textWidth = doc.getTextWidth(user.name.toUpperCase());
  doc.line(centerX - (textWidth / 2) - 10, 110, centerX + (textWidth / 2) + 10, 110);

  // Keterangan Kelulusan
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("Atas keberhasilannya menyelesaikan program sertifikasi:", centerX, 125, { align: 'center' });
  
  // Nama Ujian / Course
  doc.setTextColor(16, 185, 129); // Emerald-500
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(exam.title, centerX, 140, { align: 'center' });

  // Tanggal & Tanda Tangan
  const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  
  // Posisi Tanda Tangan (Bawah Tengah)
  doc.text(`Diterbitkan pada: ${dateStr}`, centerX, 170, { align: 'center' });
  
  // Garis Tanda tangan Panitia
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(centerX - 40, 190, centerX + 40, 190);
  doc.setFontSize(12);
  doc.text("Penyelenggara Sertifikasi Umroh", centerX, 195, { align: 'center' });

  const pdfBuffer = doc.output('arraybuffer');
  const fileName = `cert_${userId}_${examId}.pdf`;
  
  // Gunakan storage adapter (local atau supabase)
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

  return pdfUrl;
}
