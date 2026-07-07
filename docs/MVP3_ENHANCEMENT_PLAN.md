# MVP 3 Enhancement & Optimization Plan

Dokumen ini adalah acuan untuk pengembangan fase selanjutnya (MVP 3) dari platform Umroh Certification, yang berfokus pada penyempurnaan UI/UX, stabilitas, pelaporan (reporting), dan fitur-fitur lanjutan setelah MVP 2 (Learning Course) selesai.

## Overview MVP 3

Jika MVP 2 fokus pada fungsi dasar (core engine) dari pembelajaran dan penugasan, MVP 3 fokus pada:
1. **User Experience (UX) & Desain**: Memastikan seluruh tampilan responsif, modern, dan bebas bug tata letak.
2. **Dashboard & Analytics**: Memberikan wawasan (insights) yang lebih baik bagi Admin dan Panitia mengenai kelulusan dan progres belajar.
3. **Advanced Learning Features**: Forum diskusi, notifikasi, atau deadline tugas.
4. **Fitur Tugas Mandiri**: Memperkuat fitur Tugas esai agar setara dengan Materi — dengan title, deskripsi yang bisa dibaca peserta, dan bisa disisipkan ke Course secara fleksibel.

---

## Feature Checklist MVP 3

### 1. UI/UX Polishing
- [x] Revamp UI/UX Peserta: Sidebar, Dashboard, Courses page dengan tema Emerald premium.
- [x] Revamp UI/UX Admin: Sidebar premium, glassmorphism header (dihapus, profil pindah ke sidebar), dashboard dengan gradient banner.
- [x] Revamp UI/UX Pengawas: Sidebar premium, dashboard dengan banner Amber/Gold, metric cards modern.
- [x] Refactor dan perbaiki layout tabel di mode *mobile* (responsivitas).
- [x] Rapikan navigasi menu agar lebih konsisten di seluruh role (Peserta, Panitia, Pengawas, Admin).
- [x] Tambahkan animasi transisi antar halaman (menggunakan framer-motion atau sejenisnya) untuk kesan modern.
- [x] Standardisasi penggunaan *alert* dan *toast/snackbar* untuk pesan sukses atau gagal (saat ini menggunakan komponen standard yang me-reset layout sementara).

### 2. Dashboard Analytics & Reporting
- [x] **Admin Dashboard**: Tambahkan grafik statistik kelulusan per course dan grafik jumlah peserta aktif vs tidak aktif.
- [x] **Panitia Dashboard**: Tambahkan rekapitulasi progres harian dari peserta yang di-*enroll*-nya.
- [x] **Pengawas Dashboard**: Tambahkan metrik SLA penilaian (misal: berapa lama rata-rata pengawas menilai tugas).
- [x] Export Laporan nilai ke PDF/Excel (CSV) dari halaman course.

### 3. Advanced Course Features
- [ ] Set **Deadline / Tenggat Waktu** untuk tugas esai. (Tugas otomatis tidak bisa disubmit jika melewati batas waktu).
- [ ] Tambahkan kolom **Komentar/Diskusi** di bawah materi agar peserta bisa bertanya kepada pengawas/panitia.
- [ ] Notifikasi In-App & Email (misal: "Tugas Anda telah dinilai", atau "Materi baru telah dibuka").

### 4. Fitur Tugas Mandiri (Standalone Essay Assignment)

Fitur **Tugas** adalah tipe sesi yang **setara dengan Materi** dan bisa disisipkan ke dalam Course pada urutan apapun. Tugas ini berupa **esai** yang harus dikerjakan peserta.

#### Apa yang Sudah Ada (dari MVP 2)

Infrastruktur dasar sudah terbangun di MVP 2:

| Komponen | Status | Lokasi File | Catatan |
|---|---|---|---|
| Schema `MasterAssignment` | ✅ Ada | `prisma/schema.prisma` | Model memiliki `title`, `prompt`, `maxScore`. `CourseSession` bisa menunjuk ke `masterAssignmentId`. |
| CRUD Master Tugas (Admin) | ✅ Ada | `src/app/admin/assignments/page.tsx`, `src/app/api/admin/assignments/route.ts` | Admin bisa buat, edit, hapus master tugas. |
| Sisipkan Tugas ke Course (Panitia) | ✅ Ada | `src/app/panitia/courses/[id]/page.tsx`, `src/app/api/panitia/courses/[id]/sessions/route.ts` | Panitia bisa menambahkan sesi bertipe `masterAssignment` ke course. |
| Submit Tugas (Peserta API) | ✅ Ada | `src/app/api/courses/sessions/[id]/submit/route.ts` | Peserta bisa submit jawaban esai. Validasi: tidak bisa submit jika locked/graded. |
| Tampilan Tugas (Peserta UI) | ✅ Ada | `src/app/(participant)/courses/[id]/page.tsx` | Peserta bisa lihat `prompt`, tulis jawaban, dan submit. Juga bisa lihat nilai dan feedback setelah di-grading. |
| Penilaian Tugas (Pengawas) | ✅ Ada | `src/app/pengawas/material-grading/page.tsx` | Pengawas bisa menilai tugas yang sudah disubmit. |

#### Yang Perlu Ditambahkan / Diperbaiki

Berikut item yang belum ada atau belum optimal untuk menjadikan Tugas benar-benar *first-class*:

- [x] **Schema — Tambah field `description`**: Tambahkan field `description` (String, opsional) ke model `MasterAssignment` di `prisma/schema.prisma`. Field ini berisi deskripsi/instruksi panjang yang bisa dibaca peserta sebelum mengerjakan tugas. `prompt` tetap ada sebagai pertanyaan inti esai, `description` berfungsi sebagai konteks/penjelasan tambahan.
  ```prisma
  model MasterAssignment {
    // existing fields...
    description String?    // << TAMBAH INI
    // ...
  }
  ```
  Setelah ditambahkan, jalankan: `npx prisma migrate dev --name add_assignment_description`

- [x] **Admin UI — Form CRUD**: Update form di `src/app/admin/assignments/page.tsx` agar menampilkan field **Deskripsi** (textarea) selain Title dan Prompt. Label di UI: Title = "Judul Tugas", Description = "Deskripsi & Instruksi (untuk peserta)", Prompt = "Pertanyaan Esai".

- [x] **Admin API — CRUD**: Update `src/app/api/admin/assignments/route.ts` (POST) agar menerima dan menyimpan `description`.

- [x] **Peserta UI — Tampilan Deskripsi**: Update `src/app/(participant)/courses/[id]/page.tsx` bagian "Assignment Viewer" (sekitar line 404-494) agar menampilkan `masterAssignment.description` sebagai blok teks yang bisa dibaca peserta **sebelum** bagian prompt dan form jawaban. Saat ini hanya menampilkan `prompt`.

- [x] **Peserta API — Include Description**: Pastikan API `src/app/api/courses/[id]/route.ts` meng-include field `description` saat query `masterAssignment` di dalam `sessions`. (Note: sudah otomatis karena include masterAssignment: true)

- [x] **Admin Course Detail — Tampilan Tugas**: Update `src/app/admin/courses/[id]/page.tsx` di komponen `SortableSessionItem` agar menampilkan `description` dari tugas (saat ini hanya menampilkan `material.title`, untuk tugas cukup tampilkan title + badge "Tugas Esai").

- [x] **Admin/Panitia Course Detail — Dropdown Tugas**: Menambahkan fitur dropdown untuk memilih antara Master Materi dan Master Tugas di halaman Detail Course saat akan menambahkan sesi baru, serta memperkecil ukuran font agar muat lebih banyak item.

### 5. Technical Improvements
- [x] Optimasi Query Database (N+1 queries di list course/sesi). Memindahkan fetch `submissions` dan `grades` dari page payload ke endpoint `submissions` khusus.
- [x] Caching strategi (menggunakan SWR) untuk mengurangi beban ke API dan sinkronisasi status UI yang lebih baik pada file `page.tsx` Admin & Panitia.
- [x] Refactor file codebase yang terlalu besar. Memisahkan form Session, Enroll, Map Exam, dan Grade Moderation menjadi komponen modal di `src/components/modals/`.

### 6. Sertifikat Otomatis & Template Dinamis
Fitur ini bertujuan untuk mengotomatisasi penerbitan sertifikat bagi peserta yang lulus ujian (status: `LULUS`) dengan menggunakan template desain yang elegan. Sertifikat tersebut dapat langsung diakses dan diunduh oleh peserta dari *dashboard* mereka.

**Step-by-step Pengerjaan:**
- [ ] **Refactoring Modul Sertifikat (`src/lib/certificateGenerator.ts`)**
  Memisahkan logika `jsPDF` dari *route handler* ke *helper/service* independen agar bisa dipanggil (reusable) dari API mana pun.
- [ ] **Desain Template jsPDF Premium**
  Meningkatkan desain sertifikat dengan border, elemen grafis, tipografi (font) yang elegan, stempel/logo (opsional jika aset tersedia), serta memposisikan nama peserta, judul ujian, dan tanggal secara presisi.
- [ ] **Otomatisasi Penerbitan pada Auto-Grading (PG)**
  Meng-update API `POST /api/exams/[id]/take` agar: 
  - Setelah ujian selesai dan dihitung skor akhir PG-nya, jika status final adalah `LULUS`, langsung panggil fungsi `generateCertificate` di _background_.
- [ ] **Otomatisasi Penerbitan pada Manual-Grading (Esai)**
  Meng-update API `POST /api/pengawas/grading/[examId]/[userId]` agar:
  - Setelah pengawas memasukkan nilai esai, skor akhir dikalkulasi. Jika hasilnya `LULUS`, langsung panggil fungsi `generateCertificate`.
- [ ] **UI Download Sertifikat di Dashboard Peserta**
  Memperbarui halaman `src/app/(participant)/dashboard/page.tsx`:
  - Menampilkan sertifikat yang sudah diterbitkan pada *tab* atau *card* khusus.
  - Menyediakan tombol "Unduh Sertifikat" yang terhubung langsung ke URL sertifikat PDF.
- [ ] **Sinkronisasi Otomatis**
  Memastikan setiap *re-generate* atau pembuatan awal langsung terunggah ke sistem *storage* lokal atau Supabase (melalui `lib/storage.ts`) dan meng-*update* database tabel `Certificate`.

---

## Progress Log MVP 3

| Tanggal | Area | Status | Catatan |
|---|---|---|---|
| 2026-07-07 | Fitur Tugas Mandiri | Done | Schema database, API admin, form tugas, dan UI peserta sudah mendukung rendering masterAssignment description. |
| 2026-07-07 | UI/UX Revamp | Done | Revamp UI/UX untuk mode Peserta, Admin, dan Pengawas (sidebar, dashboard, glassmorphism). |
| 2026-07-06 | Perencanaan MVP 3 | Planned | MVP 3 Plan dibuat menyusul selesainya fitur-fitur utama di MVP 2. |
