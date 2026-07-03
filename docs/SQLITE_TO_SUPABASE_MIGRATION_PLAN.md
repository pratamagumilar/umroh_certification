# Rencana Migrasi SQLite ke Supabase PostgreSQL

Dokumen ini adalah panduan eksekusi untuk agent/engineer lain. Jangan langsung menjalankan migrasi tanpa konfirmasi data dari user/client.

---

## 1. Purpose and Scope

Tujuan dokumen ini adalah memindahkan database aplikasi dari SQLite lokal ke Supabase PostgreSQL.

Scope migrasi:

- Mengubah Prisma datasource dari SQLite ke PostgreSQL.
- Membuat baseline migration baru untuk PostgreSQL.
- Mengatur environment variable database untuk lokal dan production.
- Menyiapkan strategi migrasi data dari `prisma/dev.db` bila data perlu dipertahankan.
- Menyiapkan checklist deployment ke aaPanel/VPS dengan Supabase sebagai managed database.

Catatan penting: migrasi SQLite ke PostgreSQL **bukan hanya mengganti `DATABASE_URL`**. Prisma schema harus memakai `provider = "postgresql"`, lalu migration PostgreSQL baru harus dibuat/diterapkan.

---

## 2. Current State Discovered from Code

Berdasarkan inspeksi project:

- Framework: Next.js App Router `16.2.9`.
- React: `19.2.4`.
- Auth: `next-auth` `^4.24.14`.
- Prisma: `@prisma/client` dan `prisma` `^5.22.0`.
- Database saat ini: SQLite.
- File database lokal ada di `prisma/dev.db`.
- Belum ditemukan folder `prisma/migrations/**`; berarti belum ada migration history formal di repo.
- Prisma schema saat ini:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

- `src/lib/prisma.ts` saat ini membuat Prisma Client dengan query logging aktif tanpa syarat:

```ts
new PrismaClient({
  log: ["query"],
});
```

Ini sebaiknya digate hanya untuk development agar production log tidak terlalu noisy dan tidak berisiko membocorkan pola query.

---

## 3. Target Architecture

Target arsitektur:

- Aplikasi tetap menggunakan Next.js + NextAuth + Prisma.
- Supabase hanya dipakai sebagai **managed PostgreSQL database**.
- Aplikasi tidak menggunakan Supabase Auth, Storage, Realtime, Edge Functions, atau Row Level Security sebagai boundary utama aplikasi.
- Runtime aplikasi di VPS/aaPanel terhubung ke Supabase via connection string PostgreSQL.
- Migration Prisma dijalankan melalui connection direct/non-pooler bila diperlukan.

Rekomendasi koneksi:

- `DATABASE_URL`: runtime connection. Untuk production/serverless-like atau koneksi terbatas, boleh memakai Supabase pooler connection.
- `DIRECT_URL`: direct PostgreSQL connection untuk Prisma migrate/introspection bila pooler tidak cocok untuk migration.

Prisma 5.22 mendukung `directUrl` pada datasource, sehingga dapat digunakan seperti:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## 4. Non-goals / Fitur Supabase yang Tidak Dipakai

Jangan implementasikan hal berikut dalam migrasi ini:

- Supabase Auth.
- Supabase Storage.
- Supabase Realtime.
- Supabase Edge Functions.
- Perubahan sistem login dari NextAuth ke Supabase Auth.
- RLS sebagai mekanisme authorization aplikasi.
- Refactor domain model di luar kebutuhan kompatibilitas PostgreSQL.

---

## 5. Prerequisites dari User/Client

Sebelum eksekusi, minta user/client menyediakan:

1. Akun dan project Supabase yang sudah dibuat.
2. Password database Supabase.
3. Region Supabase yang dipilih.
4. Connection string berikut dari Supabase Dashboard:
   - Direct connection PostgreSQL.
   - Pooler connection, jika ingin digunakan untuk runtime.
5. Keputusan data:
   - **Option A:** reset/no data migration; mulai database PostgreSQL kosong.
   - **Option B:** data dari `prisma/dev.db` harus dimigrasikan.
6. URL production aplikasi untuk `NEXTAUTH_URL`.
7. Secret production untuk `NEXTAUTH_SECRET`.
8. Akses aaPanel/VPS dan lokasi deployment aplikasi.

---

## 6. Step-by-step Implementation Plan

### Phase 1 — Backup dan Persiapan

1. Pastikan working tree bersih.
2. Backup file SQLite lokal:

```bash
cp prisma/dev.db prisma/dev.db.backup-before-supabase
```

3. Backup `.env` lokal secara aman. Jangan commit file `.env`.
4. Konfirmasi apakah data SQLite perlu dipertahankan.

### Phase 2 — Update Prisma Datasource

1. Edit `prisma/schema.prisma`.
2. Ubah provider dari SQLite ke PostgreSQL.
3. Tambahkan `directUrl` bila memakai connection pooler untuk runtime.

Target:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Jika tidak memakai pooler dan hanya memakai direct connection, `directUrl` bisa dihilangkan. Namun untuk Supabase, disarankan tetap menyiapkan `DIRECT_URL` agar migration lebih aman.

### Phase 3 — Review Schema Compatibility

Schema saat ini mayoritas kompatibel dengan PostgreSQL:

- `String @id @default(uuid())` kompatibel.
- `DateTime @default(now())` kompatibel.
- `Boolean`, `Float`, `Int`, relasi, cascade, dan unique constraint kompatibel.
- Field `options String?` masih menyimpan JSON sebagai string. Tidak wajib diubah ke `Json` dalam migrasi ini agar scope tetap kecil.

Hal yang perlu dicek saat migration:

- Nama tabel/kolom hasil Prisma sesuai ekspektasi.
- Constraint unique tetap dibuat:
  - `User.email`
  - `ExamSupervisor(userId, examId)`
  - `ExamQuestion(examId, questionId)`
  - `Attendance(userId, examId)`
  - `ExamResult(userId, examId)`
- Foreign key cascade tetap aktif.

### Phase 4 — Generate Migration PostgreSQL Baru

Karena belum ada folder `prisma/migrations/**`, buat migration awal PostgreSQL dari schema saat ini.

Untuk local/dev:

```bash
npx prisma generate
npx prisma migrate dev --name init_postgresql
```

Untuk production/Supabase, jangan pakai `db push` sebagai proses utama. Gunakan:

```bash
npx prisma migrate deploy
```

### Phase 5 — Update Prisma Client Logging

Edit `src/lib/prisma.ts` agar query logging hanya aktif di development.

Contoh target:

```ts
new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query"] : [],
});
```

Tujuan:

- Mengurangi noise log production.
- Mengurangi risiko informasi sensitif di log.
- Menjaga performa production.

### Phase 6 — Migration Data, Bila Diperlukan

Pilih salah satu strategi di bagian 11.

### Phase 7 — Verification

Jalankan checklist verifikasi di bagian 13 sebelum deploy production.

---

## 7. Exact Files Expected to Change

Agent implementasi hanya diharapkan mengubah/menambah file berikut:

1. `prisma/schema.prisma`
   - Ubah datasource dari SQLite ke PostgreSQL.
   - Tambahkan `directUrl` jika dipakai.

2. `prisma/migrations/<timestamp>_init_postgresql/migration.sql`
   - File baru hasil `npx prisma migrate dev --name init_postgresql`.

3. `src/lib/prisma.ts`
   - Gate query logging hanya untuk development.

4. `.env.example` jika belum ada atau perlu didokumentasikan.
   - Jangan commit `.env` yang berisi secret.

5. File deployment/env di server aaPanel, jika ada di luar repo.
   - Perubahan ini tidak harus dicommit.

Jangan ubah fitur aplikasi, UI, auth flow, atau model domain kecuali ditemukan error kompatibilitas yang wajib diperbaiki.

---

## 8. Prisma Schema Changes

Dari:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Menjadi rekomendasi Supabase:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Jika hanya memakai direct connection:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Namun untuk Supabase, lebih fleksibel memakai `DATABASE_URL` untuk runtime dan `DIRECT_URL` untuk migration.

---

## 9. Environment Variables

Minimal environment variable yang harus tersedia:

```env
# Runtime DB connection. Bisa memakai Supabase pooler.
DATABASE_URL="postgresql://..."

# Direct DB connection untuk Prisma migrate. Disarankan jika DATABASE_URL memakai pooler.
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="generate-secret-yang-kuat"
NEXTAUTH_URL="https://domain-production.com"
```

Catatan:

- Jangan commit `.env` asli.
- Untuk lokal, `NEXTAUTH_URL` biasanya `http://localhost:3000`.
- Untuk production, `NEXTAUTH_URL` harus sama dengan domain final aplikasi.
- `NEXTAUTH_SECRET` harus stabil di production; jangan berubah antar-deploy.
- Supabase pooler connection biasanya cocok untuk runtime, tetapi migration sering lebih aman memakai direct connection via `DIRECT_URL`.

---

## 10. Supabase Setup Checklist

Di Supabase Dashboard:

- [ ] Buat project Supabase.
- [ ] Simpan database password di password manager.
- [ ] Ambil connection string direct PostgreSQL.
- [ ] Ambil connection string pooler jika akan digunakan untuk runtime.
- [ ] Pastikan SSL requirement mengikuti connection string Supabase.
- [ ] Jangan aktifkan Supabase Auth untuk aplikasi ini.
- [ ] Jangan membuat bucket Storage untuk scope migrasi ini.
- [ ] Jangan bergantung pada Realtime/RLS untuk authorization aplikasi.
- [ ] Pastikan IP/VPS dapat melakukan koneksi outbound ke Supabase.
- [ ] Siapkan backup policy Supabase sesuai kebutuhan client.

---

## 11. Migration Strategy untuk Data SQLite

### Option A — Reset / No Data Migration

Gunakan jika data di `prisma/dev.db` hanya data testing atau tidak penting.

Langkah:

1. Backup `prisma/dev.db` untuk arsip.
2. Ubah Prisma datasource ke PostgreSQL.
3. Jalankan migration ke Supabase.
4. Buat ulang user/admin seed secara manual atau melalui script seed jika tersedia.

Kelebihan:

- Paling aman dan cepat.
- Risiko transformasi data rendah.
- Cocok jika aplikasi belum production.

Kekurangan:

- Data lama tidak ikut pindah.

### Option B — Export/Import Data Jika Data Penting

Gunakan jika data di `prisma/dev.db` harus dipertahankan.

Strategi umum:

1. Backup SQLite:

```bash
cp prisma/dev.db prisma/dev.db.backup-before-export
```

2. Buat schema PostgreSQL di Supabase dengan Prisma migrate.
3. Export data dari SQLite per tabel ke CSV/JSON.
4. Import data ke PostgreSQL dengan urutan yang menghormati foreign key.

Urutan import yang disarankan berdasarkan relasi:

1. `User`
2. `Exam`
3. `QuestionBank`
4. `Question`
5. `ExamSupervisor`
6. `ExamQuestion`
7. `Attendance`
8. `ExamResult`
9. `ExamAnswer`
10. `Certificate`

Perhatian:

- Pertahankan nilai `id` lama agar foreign key tetap cocok.
- Validasi format timestamp dari SQLite agar diterima PostgreSQL.
- Pastikan boolean terkonversi benar.
- Pastikan unique constraint tidak dilanggar.
- Jika data kecil, boleh pakai script Node/Prisma khusus untuk membaca SQLite lama dan menulis ke PostgreSQL baru, tetapi script tersebut harus dibuat terpisah dan direview.
- Jangan jalankan import langsung ke production tanpa dry-run di database Supabase staging/dev.

---

## 12. Commands to Run

### Local Development

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init_postgresql
npm run dev
```

### Validasi Prisma

```bash
npx prisma validate
npx prisma generate
```

### Production Migration

Jalankan setelah environment production benar:

```bash
npx prisma migrate deploy
npm run build
npm run start
```

Jika memakai aaPanel dengan process manager/PM2, sesuaikan command start dengan konfigurasi server.

---

## 13. Verification Checklist

Sebelum dianggap selesai:

- [ ] `prisma/schema.prisma` memakai `provider = "postgresql"`.
- [ ] Migration PostgreSQL baru ada di `prisma/migrations/**`.
- [ ] `npx prisma validate` berhasil.
- [ ] `npx prisma generate` berhasil.
- [ ] `npx prisma migrate deploy` berhasil terhadap Supabase target.
- [ ] Aplikasi bisa start tanpa error koneksi database.
- [ ] Login NextAuth berhasil.
- [ ] Create/read/update data utama berhasil.
- [ ] Relasi dan cascade delete dites minimal pada data non-production.
- [ ] Unique constraint bekerja, misalnya email user tidak boleh duplikat.
- [ ] Query logging tidak aktif di production.
- [ ] `NEXTAUTH_URL` sesuai domain production.
- [ ] `NEXTAUTH_SECRET` tersedia dan stabil.

---

## 14. Deployment Checklist untuk aaPanel/VPS

Di aaPanel/VPS:

- [ ] Pastikan Node.js version kompatibel dengan Next.js 16.
- [ ] Pull/deploy kode terbaru.
- [ ] Jalankan `npm install` atau `npm ci` sesuai workflow project.
- [ ] Set environment variable production:
  - `DATABASE_URL`
  - `DIRECT_URL` jika dipakai
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - env lain yang sudah dipakai aplikasi
- [ ] Jangan upload/commit `prisma/dev.db` sebagai database production.
- [ ] Jalankan `npx prisma migrate deploy` dari server atau CI/CD yang punya akses env production.
- [ ] Jalankan `npx prisma generate` jika belum otomatis.
- [ ] Jalankan `npm run build`.
- [ ] Restart process aplikasi.
- [ ] Cek log startup.
- [ ] Cek koneksi dari VPS ke Supabase.
- [ ] Pastikan reverse proxy aaPanel mengarah ke port aplikasi yang benar.
- [ ] Pastikan HTTPS aktif agar NextAuth callback aman.

Risiko operasional aaPanel low-spec VPS:

- Jangan membuka terlalu banyak Prisma connection.
- Gunakan Supabase pooler untuk runtime jika koneksi sering habis.
- Hindari query logging production.
- Monitor memory saat `next build`.

---

## 15. Rollback Plan

Rollback tergantung fase kegagalan.

### Jika gagal sebelum production deploy

1. Revert perubahan kode terkait Prisma datasource/migration.
2. Kembalikan `.env` lokal ke SQLite.
3. Gunakan backup `prisma/dev.db.backup-before-supabase` bila perlu.

### Jika gagal setelah production deploy tapi data belum berubah signifikan

1. Stop aplikasi production.
2. Revert kode ke versi sebelum migrasi.
3. Restore env lama jika sebelumnya production memakai SQLite lokal.
4. Restart aplikasi.

### Jika data production sudah masuk ke Supabase

1. Jangan langsung drop database Supabase.
2. Export/backup data Supabase terlebih dahulu.
3. Tentukan apakah data perlu disalin balik ke SQLite atau deployment diperbaiki maju.
4. Prefer forward-fix jika masalah hanya config/koneksi/migration kecil.

Catatan: setelah aplikasi berjalan dengan PostgreSQL dan menerima data baru, rollback ke SQLite berisiko kehilangan data kecuali ada strategi reverse migration.

---

## 16. Common Pitfalls

- Mengira migrasi cukup mengganti `DATABASE_URL`; ini salah karena provider Prisma harus berubah ke `postgresql` dan migration baru harus dibuat.
- Menjalankan migration via pooler yang tidak mendukung operasi migration tertentu. Gunakan `DIRECT_URL` untuk migrate.
- Commit `.env` berisi credential Supabase.
- `NEXTAUTH_URL` tidak sesuai domain production sehingga callback/login gagal.
- `NEXTAUTH_SECRET` berubah sehingga session/token lama invalid.
- Query logging aktif di production.
- Import data tanpa menjaga urutan foreign key.
- Timestamp/boolean dari SQLite tidak terkonversi dengan benar.
- Menggunakan `db push` langsung ke production tanpa migration history.
- Mengubah Supabase Auth/RLS padahal aplikasi masih memakai NextAuth dan authorization aplikasi sendiri.

---

## 17. Handoff Checklist untuk Implementation Agent

Sebelum mulai:

- [ ] Konfirmasi ke user: Option A reset atau Option B migrasi data.
- [ ] Dapatkan connection string Supabase direct dan/atau pooler.
- [ ] Dapatkan nilai production `NEXTAUTH_URL` dan `NEXTAUTH_SECRET`.
- [ ] Backup `prisma/dev.db` dan `.env` lokal.

Saat implementasi:

- [ ] Ubah `prisma/schema.prisma` ke PostgreSQL.
- [ ] Tambahkan `directUrl` jika memakai `DIRECT_URL`.
- [ ] Buat migration `init_postgresql`.
- [ ] Gate query logging di `src/lib/prisma.ts` hanya untuk development.
- [ ] Update `.env.example` bila diperlukan.
- [ ] Jalankan validasi Prisma dan build.

Sebelum serah terima:

- [ ] Pastikan migration deploy berhasil ke Supabase.
- [ ] Pastikan login dan fitur database utama berjalan.
- [ ] Pastikan tidak ada secret tercatat di git diff.
- [ ] Dokumentasikan keputusan data migration yang dipilih.
- [ ] Catat connection mode yang dipakai: pooler/runtime dan direct/migration.
