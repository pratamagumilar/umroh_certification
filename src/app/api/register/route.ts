import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { TipeDokumen } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const REQUIRED_DOCUMENTS = [
  "PHOTO_3X4",
  "IJAZAH",
  "KTP",
  "KARTU_KELUARGA",
  "PASPOR",
  "VISA",
  "SURAT_SEHAT",
  "SURAT_PERNYATAAN",
  "BUKTI_TRANSFER",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract text fields
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 }
      );
    }

    // Check if email already registered as active user
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar sebagai peserta aktif" },
        { status: 409 }
      );
    }

    // Extract all text fields
    const fieldNames = [
      "namaGelar",
      "namaTanpaGelar",
      "tempatLahir",
      "nik",
      "jenisKelamin",
      "noHp",
      "alamatTinggal",
      "provinsi",
      "unitKerja",
      "jabatan",
      "alamatKantor",
      "pendidikanTerakhir",
      "namaUniversitas",
      "ukuranBaju",
    ];

    const textFields: Record<string, string> = {};
    const missingFields: string[] = [];

    for (const field of fieldNames) {
      const value = formData.get(field) as string;
      if (!value || value.trim() === "") {
        missingFields.push(field);
      }
      textFields[field] = value || "";
    }

    // Validate tanggalLahir
    const tanggalLahirRaw = formData.get("tanggalLahir") as string;
    if (!tanggalLahirRaw) {
      missingFields.push("tanggalLahir");
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Field wajib belum diisi",
          fields: missingFields,
        },
        { status: 400 }
      );
    }

    const tanggalLahir = new Date(tanggalLahirRaw);

    // Validasi NIK (16 digit)
    if (textFields.nik && !/^\d{16}$/.test(textFields.nik)) {
      return NextResponse.json(
        { error: "NIK harus 16 digit angka" },
        { status: 400 }
      );
    }

    // Validasi No HP
    if (
      textFields.noHp &&
      !/^(\+62|62|08)\d{8,12}$/.test(textFields.noHp.replace(/[\s-]/g, ""))
    ) {
      return NextResponse.json(
        { error: "Nomor HP tidak valid (gunakan format 08xx atau +62)" },
        { status: 400 }
      );
    }

    // Validasi tanggal lahir (tidak boleh > hari ini)
    if (tanggalLahir > new Date()) {
      return NextResponse.json(
        { error: "Tanggal lahir tidak valid" },
        { status: 400 }
      );
    }

    // Collect document files
    const documentFiles: {
      tipeDokumen: string;
      file: File;
    }[] = [];

    for (const docType of REQUIRED_DOCUMENTS) {
      const file = formData.get(`dokumen_${docType}`) as File;
      if (file && file.size > 0) {
        documentFiles.push({ tipeDokumen: docType, file });
      }
    }

    if (documentFiles.length !== REQUIRED_DOCUMENTS.length) {
      const received = documentFiles.map((d) => d.tipeDokumen);
      const missing = REQUIRED_DOCUMENTS.filter((d) => !received.includes(d));
      return NextResponse.json(
        {
          error: "Semua dokumen wajib diupload",
          missingDocuments: missing,
        },
        { status: 400 }
      );
    }

    // Validate each file
    for (const { file } of documentFiles) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Format file tidak didukung: ${file.name}. Hanya JPG, PNG, PDF yang diperbolehkan.`,
          },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File terlalu besar: ${file.name}. Maksimal 10 MB.`,
          },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Upsert Pendaftaran
    const pendaftaran = await prisma.pendaftaran.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        namaGelar: textFields.namaGelar,
        namaTanpaGelar: textFields.namaTanpaGelar,
        tempatLahir: textFields.tempatLahir,
        tanggalLahir,
        nik: textFields.nik,
        jenisKelamin: textFields.jenisKelamin,
        noHp: textFields.noHp,
        alamatTinggal: textFields.alamatTinggal,
        provinsi: textFields.provinsi,
        unitKerja: textFields.unitKerja,
        jabatan: textFields.jabatan,
        alamatKantor: textFields.alamatKantor,
        pendidikanTerakhir: textFields.pendidikanTerakhir,
        namaUniversitas: textFields.namaUniversitas,
        ukuranBaju: textFields.ukuranBaju,
        status: "PENDING",
        alasanReject: null,
        approvedById: null,
        approvedAt: null,
      },
      create: {
        email,
        password: hashedPassword,
        namaGelar: textFields.namaGelar,
        namaTanpaGelar: textFields.namaTanpaGelar,
        tempatLahir: textFields.tempatLahir,
        tanggalLahir,
        nik: textFields.nik,
        jenisKelamin: textFields.jenisKelamin,
        noHp: textFields.noHp,
        alamatTinggal: textFields.alamatTinggal,
        provinsi: textFields.provinsi,
        unitKerja: textFields.unitKerja,
        jabatan: textFields.jabatan,
        alamatKantor: textFields.alamatKantor,
        pendidikanTerakhir: textFields.pendidikanTerakhir,
        namaUniversitas: textFields.namaUniversitas,
        ukuranBaju: textFields.ukuranBaju,
      },
    });

    // Upload all documents (replace existing ones)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extensionMap: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "application/pdf": ".pdf",
    };

    for (const { tipeDokumen, file } of documentFiles) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = extensionMap[file.type] || ".bin";
      const fileName = `${pendaftaran.id}/${tipeDokumen}_${timestamp}${ext}`;

      const fileUrl = await uploadFile(
        buffer,
        "registrations",
        fileName,
        file.type
      );

      await prisma.dokumenPendaftaran.upsert({
        where: {
          pendaftaranId_tipeDokumen: {
            pendaftaranId: pendaftaran.id,
            tipeDokumen: tipeDokumen as TipeDokumen,
          },
        },
        update: {
          fileUrl,
          namaAsli: file.name,
          mimeType: file.type,
        },
        create: {
          pendaftaranId: pendaftaran.id,
          tipeDokumen: tipeDokumen as TipeDokumen,
          fileUrl,
          namaAsli: file.name,
          mimeType: file.type,
        },
      });
    }

    return NextResponse.json(
      {
        message: "Pendaftaran berhasil. Menunggu persetujuan admin.",
        id: pendaftaran.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses pendaftaran" },
      { status: 500 }
    );
  }
}