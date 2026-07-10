-- CreateEnum
CREATE TYPE "TipeDokumen" AS ENUM ('PHOTO_3X4', 'IJAZAH', 'KTP', 'KARTU_KELUARGA', 'PASPOR', 'VISA', 'SURAT_SEHAT', 'SURAT_PERNYATAAN', 'BUKTI_TRANSFER');

-- CreateTable
CREATE TABLE "Pendaftaran" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "namaGelar" TEXT NOT NULL,
    "namaTanpaGelar" TEXT NOT NULL,
    "tempatLahir" TEXT NOT NULL,
    "tanggalLahir" TIMESTAMP(3) NOT NULL,
    "nik" TEXT NOT NULL,
    "jenisKelamin" TEXT NOT NULL,
    "noHp" TEXT NOT NULL,
    "alamatTinggal" TEXT NOT NULL,
    "provinsi" TEXT NOT NULL,
    "unitKerja" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "alamatKantor" TEXT NOT NULL,
    "pendidikanTerakhir" TEXT NOT NULL,
    "namaUniversitas" TEXT NOT NULL,
    "ukuranBaju" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "alasanReject" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pendaftaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DokumenPendaftaran" (
    "id" TEXT NOT NULL,
    "pendaftaranId" TEXT NOT NULL,
    "tipeDokumen" "TipeDokumen" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "namaAsli" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DokumenPendaftaran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pendaftaran_email_key" ON "Pendaftaran"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pendaftaran_userId_key" ON "Pendaftaran"("userId");

-- CreateIndex
CREATE INDEX "Pendaftaran_status_idx" ON "Pendaftaran"("status");

-- CreateIndex
CREATE INDEX "Pendaftaran_email_idx" ON "Pendaftaran"("email");

-- CreateIndex
CREATE INDEX "DokumenPendaftaran_pendaftaranId_idx" ON "DokumenPendaftaran"("pendaftaranId");

-- CreateIndex
CREATE UNIQUE INDEX "DokumenPendaftaran_pendaftaranId_tipeDokumen_key" ON "DokumenPendaftaran"("pendaftaranId", "tipeDokumen");

-- AddForeignKey
ALTER TABLE "Pendaftaran" ADD CONSTRAINT "Pendaftaran_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftaran" ADD CONSTRAINT "Pendaftaran_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DokumenPendaftaran" ADD CONSTRAINT "DokumenPendaftaran_pendaftaranId_fkey" FOREIGN KEY ("pendaftaranId") REFERENCES "Pendaftaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;
