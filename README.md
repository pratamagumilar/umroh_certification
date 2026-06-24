# Portal Sertifikasi Umroh - Dokumentasi Proyek

Dokumen ini berisi informasi mengenai teknologi yang digunakan (*Tech Stack*), arsitektur role/hak akses, serta daftar fitur yang akan dibangun secara bertahap. Panduan ini berguna sebagai pengingat (*roadmap*) pengembangan proyek.

## 🛠 Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| Bahasa | [TypeScript](https://www.typescriptlang.org/) |
| UI Components | [Material UI (MUI)](https://mui.com/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Database | SQLite (development) |
| ORM | [Prisma](https://www.prisma.io/) |
| Autentikasi | [NextAuth.js](https://next-auth.js.org/) — Credentials Provider |
| Keamanan | `bcrypt` untuk hashing password |

---

## 👥 Arsitektur Role (3 POV)

Aplikasi ini memiliki **3 role** dengan hak akses yang berbeda. Setiap akun hanya memiliki **1 role**. Tidak ada registrasi mandiri — semua akun dibuatkan oleh **Admin**.

| Role | Deskripsi |
|---|---|
| **ADMIN** | Pengelola sistem. Membuat akun user, mengelola ujian & soal, bulk import Excel, monitoring hasil, menerbitkan sertifikat. |
| **PENGAWAS** | Pengawas & penilai ujian. Mengawasi pelaksanaan ujian, menilai jawaban esai, melihat rekapitulasi. |
| **PESERTA** | Jamaah calon tersertifikasi. Mengerjakan ujian, melihat hasil, download sertifikat. |

### Struktur Halaman per Role

```
/login                    → Semua role (masuk ke dashboard masing-masing)

/admin/dashboard          → Dashboard Admin
/admin/users              → Kelola User (Peserta & Pengawas)
/admin/exams              → Kelola Ujian
/admin/exams/[id]/questions → Kelola Soal per Ujian
/admin/results            → Monitoring Hasil Ujian
/admin/certificates       → Kelola Sertifikat

/pengawas/dashboard       → Dashboard Pengawas
/pengawas/exams           → Daftar Ujian yang Diawasi
/pengawas/grading         → Penilaian Jawaban Esai
/pengawas/results         → Rekapitulasi Hasil

/dashboard                → Dashboard Peserta
/profile                  → Profil & Upload Foto (opsional)
/exams                    → Daftar Ujian Tersedia
/exams/[id]               → Halaman Mengerjakan Ujian
/results                  → Hasil Ujian
/certificates             → Download Sertifikat
```

---

## 🎯 Roadmap Fitur

Pengembangan dilakukan bertahap per POV. Prioritas: **Admin → Peserta → Pengawas**.

---

### 🔴 FASE 1: Admin (Prioritas Utama)

#### 1.1 Autentikasi & Routing
- [x] Halaman Login (shared untuk semua role)
- [x] Session & JWT via NextAuth
- [x] Middleware proteksi route berdasarkan role
- [x] Auto-redirect setelah login ke dashboard sesuai role

#### 1.2 Admin Dashboard
- [x] Halaman overview: jumlah peserta, pengawas, ujian aktif, statistik kelulusan

#### 1.3 Kelola User (Peserta & Pengawas)
- [x] Tabel daftar semua user (dengan filter role)
- [x] Form tambah user baru (nama, email, password, role)
- [x] Edit & hapus user
- [x] **Bulk import user dari file Excel (.xlsx)**

#### Fase 1.7: Refactoring Master Soal (Bank Soal) 🟢 SELESAI
- [x] Schema: Pisahkan `Question` dari `Exam`, buat tabel `QuestionBank` & mapping `ExamQuestion`.
- [x] API: Buat CRUD `/api/admin/question-banks` dan pindahkan API kelola soal ke bank.
- [x] API: Mapping `ExamQuestion` saat assign soal ke ujian.
- [x] UI: Menu "Bank Soal" di sidebar admin.
- [x] UI: Halaman kelola Bank Soal (List, Create, Update, Delete).
- [x] UI: Detail Bank Soal (Kelola Daftar Soal, Import Excel).
- [x] UI: Refactor halaman Detail Ujian agar langsung memilih Bank Soal (semua soal otomatis masuk ke ujian).

#### 1.4 Kelola Ujian
- [x] Tabel daftar ujian
- [x] Form buat ujian baru (judul, deskripsi, waktu mulai, durasi)
- [x] Edit & hapus ujian
- [x] Toggle aktif/nonaktif ujian (`isActive`)

#### 1.5 Kelola Soal (per Ujian)
- [x] Tabel daftar soal dalam satu ujian
- [x] Form tambah soal Pilihan Ganda (teks soal, opsi A/B/C/D, kunci jawaban)
- [x] Form tambah soal Esai (teks soal)
- [x] Edit & hapus soal
- [x] **Bulk import soal dari file Excel (.xlsx)**

#### 1.6 Monitoring Hasil
- [x] Tabel rekapitulasi hasil ujian semua peserta
- [x] Detail jawaban per peserta
- [x] Update status kelulusan (`LULUS` / `TIDAK_LULUS`)

#### 1.7 Kelola Sertifikat
- [x] Generate PDF sertifikat untuk peserta yang lulus
- [x] Daftar sertifikat yang sudah diterbitkan

---

### 🟡 FASE 2: Peserta (Setelah Admin Selesai) 🟢 SELESAI

#### 2.1 Dashboard Peserta
- [x] Overview: ujian mendatang, status hasil, sertifikat tersedia

#### 2.2 Profil
- [x] Upload foto profil (opsional)
- [x] Edit nama / info dasar

#### 2.3 Pelaksanaan Ujian
- [x] Daftar ujian yang tersedia/aktif
- [x] Absensi kehadiran sebelum mulai ujian
- [x] Antarmuka mengerjakan soal (PG + Esai) dengan timer countdown
- [x] Submit jawaban

#### 2.4 Hasil & Sertifikat
- [x] Lihat skor dan status kelulusan
- [x] Download sertifikat (jika lulus)

---

### 🟢 FASE 3: Pengawas (Setelah Peserta Selesai)

#### 3.1 Dashboard Pengawas
- [x] Overview: ujian yang perlu diawasi, esai yang perlu dinilai

#### 3.2 Pengawasan Ujian
- [x] Monitoring kehadiran peserta secara real-time
- [x] Lihat daftar peserta per ujian

#### 3.3 Penilaian Esai
- [x] Daftar jawaban esai yang belum dinilai
- [x] Form penilaian (beri skor per jawaban esai)

#### 3.4 Rekapitulasi
- [x] Lihat hasil ujian peserta yang diawasi

---

## 📝 Catatan Penting

- **Tidak ada registrasi publik.** Semua akun (Peserta, Pengawas) dibuatkan oleh Admin.
- **1 akun = 1 role.** Tidak ada multi-role per akun.
- **Bulk import Excel** tersedia untuk data user dan soal ujian.
- **Saat ini fokus di FASE 1 (Admin).**

---
*Terakhir diupdate: 23 Juni 2026*
