import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ message: 'File tidak ditemukan' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parse as 2D array
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    // Asumsi baris pertama adalah Header: [Nama, Email, Password, Role, Phone]
    const rows = data.slice(1).filter(row => row.length >= 3 && row[0] && row[1] && row[2]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'File kosong atau format salah.' }, { status: 400 });
    }

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = String(row[0] || '').trim();
      const email = String(row[1] || '').trim();
      const rawPassword = String(row[2] || '').trim();
      let role = String(row[3] || 'PESERTA').toUpperCase().trim();
      const phone = String(row[4] || '').trim();

      // Fallback validasi role
      if (!['PESERTA', 'PENGAWAS', 'ADMIN'].includes(role)) {
        role = 'PESERTA';
      }

      try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          errors.push(`Baris ${i + 2}: Email '${email}' sudah digunakan`);
          continue;
        }

        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role,
            phone: phone || null,
          }
        });
        successCount++;
      } catch (err: any) {
        errors.push(`Baris ${i + 2}: Gagal memproses data (${err.message})`);
      }
    }

    return NextResponse.json({ 
      message: `Berhasil mengimpor ${successCount} user. ${errors.length > 0 ? `(${errors.length} gagal)` : ''}`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ message: 'Gagal memproses file Excel.' }, { status: 500 });
  }
}
