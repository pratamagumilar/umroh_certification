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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    
    // Asumsi baris pertama adalah Header: [Nama, Email, Password, Role, Phone]
    const rows = data.slice(1).filter(row => row.length >= 3 && row[0] && row[1] && row[2]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'File kosong atau format salah.' }, { status: 400 });
    }

    // Validasi & normalisasi rows
    const validRows = rows
      .map((row, idx) => {
        const name = String(row[0] || "").trim();
        const email = String(row[1] || "").trim().toLowerCase();
        const rawPassword = String(row[2] || "").trim();
        let role = String(row[3] || "PESERTA").toUpperCase().trim();
        const phone = String(row[4] || "").trim();

        if (!["PESERTA", "PENGAWAS", "ADMIN", "PANITIA"].includes(role)) {
          role = "PESERTA";
        }

        return { rowIndex: idx + 2, name, email, rawPassword, role, phone };
      })
      .filter((r) => r.name && r.email && r.rawPassword);

    if (validRows.length === 0) {
      return NextResponse.json(
        { message: "Tidak ada data valid yang bisa diimpor." },
        { status: 400 }
      );
    }

    // Cek email duplikat dalam file + database sekaligus
    const emails = validRows.map((r) => r.email);
    const emailSet = new Set<string>();
    const duplicateInFile: string[] = [];

    for (const email of emails) {
      if (emailSet.has(email)) duplicateInFile.push(email);
      emailSet.add(email);
    }

    const existingUsers = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });
    const existingEmails = new Set(existingUsers.map((u) => u.email));

    const errors: string[] = [];
    const toCreate: {
      name: string;
      email: string;
      password: string;
      role: string;
      phone: string | null;
    }[] = [];

    for (const row of validRows) {
      if (duplicateInFile.includes(row.email)) {
        errors.push(`Baris ${row.rowIndex}: Email '${row.email}' duplikat dalam file`);
        continue;
      }
      if (existingEmails.has(row.email)) {
        errors.push(
          `Baris ${row.rowIndex}: Email '${row.email}' sudah terdaftar`
        );
        continue;
      }
      const hashedPassword = await bcrypt.hash(row.rawPassword, 10);
      toCreate.push({
        name: row.name,
        email: row.email,
        password: hashedPassword,
        role: row.role,
        phone: row.phone || null,
      });
    }

    // Batch insert
    let successCount = 0;
    if (toCreate.length > 0) {
      try {
        const result = await prisma.user.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
        successCount = result.count;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json(
          { message: `Gagal batch insert: ${message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: `Berhasil mengimpor ${successCount} user. ${errors.length > 0 ? `(${errors.length} gagal)` : ""}`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    console.error("Import error:", error);
    return NextResponse.json({ message: "Gagal memproses file Excel." }, { status: 500 });
  }
}
