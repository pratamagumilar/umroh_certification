# Portal Sertifikasi Umroh - Dokumentasi Proyek

Dokumen ini merangkum baseline produk, arsitektur role, status MVP yang sudah dikerjakan, dan arah MVP berikutnya. README ini berfungsi sebagai peta ringkas, sedangkan rincian eksekusi tiap fase ada di dokumen per-MVP.

## 🛠 Tech Stack

| Kategori      | Teknologi                                                       |
| ------------- | --------------------------------------------------------------- |
| Framework     | [Next.js](https://nextjs.org/) (App Router)                     |
| Bahasa        | [TypeScript](https://www.typescriptlang.org/)                   |
| UI Components | [Material UI (MUI)](https://mui.com/)                           |
| Styling       | [Tailwind CSS](https://tailwindcss.com/)                        |
| Database      | PostgreSQL (utama), SQLite legacy untuk development lama        |
| ORM           | [Prisma](https://www.prisma.io/)                                |
| Autentikasi   | [NextAuth.js](https://next-auth.js.org/) — Credentials Provider |
| Keamanan      | `bcrypt` untuk hashing password                                 |
| Storage File  | Local storage / server filesystem                               |

---

## 👥 Arsitektur Role (4 POV)

Aplikasi saat ini memiliki **4 role** aktif dengan hak akses berbeda. Setiap akun hanya memiliki **1 role**.

| Role         | Deskripsi                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **ADMIN**    | Pengelola sistem. Mengelola user, ujian, bank soal, hasil, sertifikat, course, dan approval operasional.                 |
| **PANITIA**  | Operator pembelajaran dan operasional lapangan. Mengelola course, materi, enrollment, dan workflow pelaksanaan tertentu. |
| **PENGAWAS** | Pengawas & penilai. Mengawasi ujian, menilai jawaban esai, dan memonitor tugas materi.                                   |
| **PESERTA**  | Pengguna utama sistem. Mengikuti course, mengerjakan ujian, melihat hasil, dan mengakses sertifikat.                     |

### Struktur Halaman Utama per Role

```
/login                         → Semua role

/admin/dashboard               → Dashboard Admin
/admin/users                   → Kelola User
/admin/exams                   → Kelola Ujian
/admin/question-banks          → Kelola Bank Soal
/admin/results                 → Monitoring Hasil
/admin/certificates            → Kelola Sertifikat
/admin/courses                 → Kelola Course
/admin/assignments             → Kelola Master Tugas

/panitia/dashboard             → Dashboard Panitia
/panitia/courses               → Operasional Course
/panitia/materials             → Master Materi

/pengawas/dashboard            → Dashboard Pengawas
/pengawas/exams                → Pengawasan Ujian
/pengawas/grading              → Grading Ujian Esai
/pengawas/material-grading     → Grading Tugas Materi

/dashboard                     → Dashboard Peserta
/profile                       → Profil Peserta
/courses                       → Daftar Course Peserta
/exams                         → Daftar Ujian
```

---

## 🎯 Status MVP

## MVP 1 — Core Certification Platform ✅

Fokus MVP 1 adalah fondasi sistem sertifikasi dan ujian.

Sudah tercakup:

- autentikasi, session, middleware role-based, dan redirect dashboard;
- dashboard dasar untuk admin, pengawas, dan peserta;
- kelola user oleh admin, termasuk bulk import user;
- kelola bank soal dan pemetaan soal ke ujian;
- kelola ujian, monitoring hasil, dan status kelulusan;
- pelaksanaan ujian peserta dengan attendance dan timer;
- grading esai oleh pengawas;
- generate dan distribusi sertifikat.

## MVP 2 — Learning Course ✅

Fokus MVP 2 adalah modul pembelajaran hybrid di atas mesin ujian yang sudah ada.

Sudah tercakup:

- role `PANITIA`;
- course dan enrollment peserta;
- master materi reusable;
- mapping materi ke course;
- progress pembelajaran peserta;
- tugas esai per sesi;
- grading tugas materi oleh pengawas;
- grade adjustment oleh admin;
- mapping course ke ujian existing.

Dokumen acuan:

- [docs/MVP/MVP2_LEARNING_COURSE_PLAN.md](docs/MVP/MVP2_LEARNING_COURSE_PLAN.md)

## MVP 3 — Enhancement & Optimization ✅ Sebagian Besar Selesai

Fokus MVP 3 adalah UX, analytics, operational refinement, dan fitur lanjutan pasca MVP 2.

Sudah tercakup:

- revamp UI/UX lintas role;
- dashboard analytics utama;
- penguatan fitur tugas mandiri;
- optimasi teknis query dan refactor komponen besar;
- otomatisasi sertifikat dan template dinamis;
- live exam monitoring, reset sesi, dan penambahan waktu.

Masih tercatat sebagai backlog pada plan MVP 3:

- deadline tugas;
- komentar/diskusi materi;
- notifikasi in-app dan email.

Dokumen acuan:

- [docs/MVP/MVP3_ENHANCEMENT_PLAN.md](docs/MVP/MVP3_ENHANCEMENT_PLAN.md)

## MVP 4 — Registration, Kartu Peserta, dan Absensi QR 🔄 Planned

Fokus MVP 4 adalah memperluas lifecycle peserta dari pendaftaran sampai absensi lapangan.

Target utama:

- registrasi mandiri peserta;
- akun baru tetap menunggu approval admin;
- kartu peserta dengan QR dan kode peserta khusus;
- absensi oleh panitia melalui scan QR atau input kode manual.

Dokumen acuan:

- [docs/MVP/MVP4_REGISTRATION_CARD_ATTENDANCE_PLAN.md](docs/MVP/MVP4_REGISTRATION_CARD_ATTENDANCE_PLAN.md)

---

## 📌 Catatan Produk Saat Ini

- Saat ini login masih berbasis akun yang aktif di sistem.
- Pembuatan user publik belum menjadi flow aktif production dan direncanakan di MVP 4.
- **1 akun = 1 role** tetap menjadi aturan dasar.
- Bulk import Excel tersedia untuk user dan soal ujian.
- Bank soal menjadi sumber utama soal ujian.
- Sertifikat dan file pendukung memakai storage lokal/server filesystem sesuai environment.

---

## 📚 Dokumen Penting

- [docs/MVP/MVP2_LEARNING_COURSE_PLAN.md](docs/MVP/MVP2_LEARNING_COURSE_PLAN.md)
- [docs/MVP/MVP3_ENHANCEMENT_PLAN.md](docs/MVP/MVP3_ENHANCEMENT_PLAN.md)
- [docs/MVP/MVP4_REGISTRATION_CARD_ATTENDANCE_PLAN.md](docs/MVP/MVP4_REGISTRATION_CARD_ATTENDANCE_PLAN.md)
- [docs/TESTING_NOTES.md](docs/TESTING_NOTES.md)
- [docs/PERFORMANCE_REVIEW.md](docs/PERFORMANCE_REVIEW.md)
- [docs/LOCAL_TO_AAPANEL_FILE_STORAGE_PLAN.md](docs/LOCAL_TO_AAPANEL_FILE_STORAGE_PLAN.md)

---

_Terakhir diupdate: 9 Juli 2026_
