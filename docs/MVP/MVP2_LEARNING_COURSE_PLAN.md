# MVP 2 Learning Course Plan

Dokumen ini adalah tracker utama untuk MVP 2. Jika proses implementasi berhenti, gagal, atau pindah orang, lanjutkan dari checklist yang belum dicentang.

## Overview

MVP 2 menambahkan modul pembelajaran hybrid di atas fitur ujian yang sudah ada.

Prinsip utama:

```txt
Course -> Materi PDF/Sesi -> Tugas Esai -> Penilaian -> Progress -> Moderasi Nilai
```

Update desain materi reusable:

```txt
Master Materi -> Course Material -> Tugas Esai -> Progress -> Penilaian
```

Materi PDF tidak boleh selalu dianggap milik satu course saja. MVP 2 perlu mendukung master materi yang bisa dipakai ulang di banyak course. Contoh: Course 1 memakai Materi A, B, C; Course 2 memakai Materi A dan C.

Target MVP 2:

- [x] Admin dan Panitia bisa membuat course.
- [x] Course bisa aktif/nonaktif.
- [x] Course berisi beberapa materi PDF.
- [x] Admin/Panitia bisa membuat master materi PDF reusable.
- [x] Course bisa memilih materi dari master materi.
- [x] Satu master materi bisa dipakai di banyak course.
- [x] Materi bisa dikunci/dibuka secara manual.
- [x] Peserta hanya bisa melihat course yang dienroll.
- [x] Peserta bisa membaca materi PDF dan mengumpulkan tugas esai per sesi.
- [x] Pengawas bisa menilai tugas esai materi.
- [x] Admin bisa melakukan final grade adjustment dengan alasan dan audit log.
- [x] Course bisa dimapping ke ujian existing.

Keputusan default:

- [x] Enrollment course dilakukan manual oleh Admin/Panitia.
- [x] Lock/unlock materi dilakukan manual oleh Panitia.
- [x] Materi MVP 2 hanya PDF dengan field `pdfUrl`.
- [x] `pdfUrl` disimpan di master materi, bukan diduplikasi di setiap course.
- [x] Urutan, lock/unlock, dan active/inactive materi diatur per course melalui relasi course-material.
- [x] Tugas per sesi berbentuk esai.
- [x] Pengawas menilai tugas.
- [x] Admin bisa melakukan final grade adjustment dengan alasan dan audit log.
- [x] Role baru `PANITIA` ditambahkan sebagai operator pembelajaran terbatas.

## Roles

### ADMIN

Admin tetap role tertinggi.

- [x] Bisa mengelola semua user, termasuk role `PANITIA`.
- [x] Bisa membuat, mengubah, menghapus, aktif/nonaktif course.
- [x] Bisa mengelola semua materi, enrollment, tugas, mapping ujian, dan hasil.
- [x] Bisa melihat semua submission dan nilai.
- [x] Bisa melakukan final grade adjustment dengan alasan.
- [x] Bisa menerbitkan sertifikat.

### PANITIA

Panitia adalah operator pembelajaran dan pelaksanaan kelas.

- [x] Bisa mengelola course dan materi PDF.
- [x] Bisa enroll peserta ke course.
- [x] Bisa lock/unlock sesi materi.
- [x] Bisa mapping course ke ujian atau quiz yang sudah dibuat.
- [x] Bisa mengelola bank soal dan ujian jika diberi akses MVP 2.
- [x] Tidak bisa melakukan final grade adjustment.
- [x] Tidak bisa menerbitkan sertifikat final.
- [x] Tidak bisa menghapus admin atau mengubah role admin.

### PENGAWAS

Pengawas fokus pada monitoring dan penilaian.

- [x] Bisa melihat tugas esai materi yang perlu dinilai.
- [x] Bisa memberi nilai dan feedback submission peserta.
- [x] Bisa melihat daftar course/sesi yang ditugaskan kepadanya.
- [x] Tidak bisa membuat course.
- [x] Tidak bisa membuka/mengunci sesi.
- [x] Tidak bisa melakukan grade adjustment final.

### PESERTA

Peserta adalah user pembelajaran.

- [x] Bisa melihat daftar course yang dienroll dan aktif.
- [x] Bisa membuka materi PDF yang aktif dan unlocked.
- [x] Bisa menandai materi selesai.
- [x] Bisa mengirim tugas esai per sesi.
- [x] Bisa melihat status tugas: draft/submitted/graded/revision jika nanti dibutuhkan.
- [x] Bisa melihat nilai dan feedback setelah dinilai.
- [x] Tidak bisa melihat course yang tidak dienroll.
- [x] Tidak bisa melihat sesi inactive/locked.

## Data Model Plan

Perubahan database wajib dilakukan lewat `prisma/schema.prisma` dan Prisma migration. Jangan membuat tabel manual dari Supabase Dashboard kecuali emergency dan harus disinkronkan kembali ke Prisma.

### Model Baru

- [x] `Course`
  - `id`
  - `title`
  - `description`
  - `isActive`
  - `createdById`
  - `createdAt`
  - `updatedAt`

- [x] `CourseEnrollment`
  - `id`
  - `courseId`
  - `userId`
  - `status`
  - `enrolledAt`
  - unique `courseId + userId`

- [x] `Material`
  - `id`
  - `title`
  - `description`
  - `pdfUrl`
  - `isActive`
  - `createdById`
  - `createdAt`
  - `updatedAt`
  - Catatan: ini adalah master materi reusable, bukan materi yang terikat ke satu course.

- [x] `CourseMaterial`
  - `id`
  - `courseId`
  - `materialId`
  - `order`
  - `isActive`
  - `isLocked`
  - `createdAt`
  - `updatedAt`
  - unique `courseId + materialId`
  - Catatan: relasi ini menentukan materi apa saja yang masuk ke course, urutan materi, status active/inactive per course, dan lock/unlock per course.

- [x] `CourseSession`
  - `id`
  - `courseId`
  - `title`
  - `description`
  - `pdfUrl`
  - `order`
  - `isActive`
  - `isLocked`
  - `createdAt`
  - `updatedAt`
  - Catatan refactor: model ini sudah ada di implementasi awal, tetapi untuk kebutuhan master materi reusable sebaiknya diganti/diadaptasi menjadi `CourseMaterial`. Jangan lanjut terlalu jauh dengan duplikasi `pdfUrl` di tiap course jika targetnya materi reusable.

- [x] `SessionProgress`
  - `id`
  - `sessionId`
  - `userId`
  - `status`
  - `completedAt`
  - unique `sessionId + userId`

- [x] `SessionAssignment`
  - `id`
  - `sessionId`
  - `title`
  - `prompt`
  - `maxScore`
  - `isRequired`
  - `createdAt`
  - `updatedAt`

- [x] `AssignmentSubmission`
  - `id`
  - `assignmentId`
  - `userId`
  - `answer`
  - `status`
  - `submittedAt`
  - `updatedAt`
  - unique `assignmentId + userId`

- [x] `AssignmentGrade`
  - `id`
  - `submissionId`
  - `graderId`
  - `score`
  - `feedback`
  - `gradedAt`

- [x] `CourseExam`
  - `id`
  - `courseId`
  - `examId`
  - `isRequired`
  - unique `courseId + examId`

- [x] `GradeAdjustment`
  - `id`
  - `userId`
  - `courseId`
  - `adminId`
  - `originalScore`
  - `adjustedScore`
  - `reason`
  - `createdAt`

### Model Existing Yang Perlu Diupdate

- [x] `User.role` mendukung `PANITIA`.
- [x] `User` punya relation ke course enrollment, progress, submission, grading, adjustment.
- [x] `Exam` punya relation ke `CourseExam`.
- [x] `User` punya relation ke master materi yang dibuat jika `Material.createdById` dipakai.
- [x] `Course` punya relation ke `CourseMaterial`.
- [x] `SessionProgress` dan `SessionAssignment` diputuskan ulang apakah tetap mengarah ke `CourseSession` atau pindah ke `CourseMaterial`.

## Feature Checklist

### 1. Product And Documentation

- [x] Finalkan nama menu: "Course", "Materi", "Tugas Materi", "Penilaian Materi".
- [x] Finalkan istilah role: `PANITIA`.
- [x] Finalkan apakah Panitia bisa membuat ujian atau hanya mapping ujian existing.
- [x] Finalkan lokasi penyimpanan PDF: local storage saat development, persistent folder aaPanel saat production.
- [x] Supabase Storage tidak dipakai; Supabase hanya untuk PostgreSQL database.
- [x] Dokumentasi storage dibuat di `docs/LOCAL_TO_AAPANEL_FILE_STORAGE_PLAN.md`.
- [x] Update README jika scope MVP 2 berubah.

### 2. Database And Migration

- [x] Update `prisma/schema.prisma` dengan model MVP 2.
- [x] Buat migration Prisma untuk MVP 2.
- [x] Jalankan migration ke Supabase/PostgreSQL.
- [x] Jalankan `npx prisma generate`.
- [x] Update seed untuk akun `PANITIA`.
- [x] Verifikasi table dan relation muncul di Supabase.

### 3. Role, Auth, And Middleware

- [x] Tambahkan `PANITIA` ke validasi role user.
- [x] Tambahkan redirect dashboard Panitia.
- [x] Tambahkan route protection `/panitia/:path*`.
- [x] Tambahkan akses peserta untuk `/courses`.
- [x] Pastikan Admin tetap bisa mengakses semua area admin.
- [x] Pastikan Panitia tidak bisa masuk halaman admin yang sensitif.

### 4. Admin Features

- [x] Menu Admin: Course.
- [x] Halaman list course.
- [x] Form create/edit course.
- [x] Toggle active/inactive course.
- [x] Detail course: daftar sesi materi.
- [x] Detail course: daftar peserta enrollment.
- [x] Detail course: mapping ujian existing.
- [x] Monitoring progress peserta per course.
- [x] Monitoring nilai tugas materi.
- [x] Halaman/admin action untuk grade adjustment.
- [x] Audit log adjustment terlihat di detail peserta/course.

### 5. Panitia Features

- [x] Layout dan sidebar Panitia.
- [x] Dashboard Panitia.
- [x] List course yang bisa dikelola Panitia.
- [x] Create/edit course jika diizinkan.
- [x] Tambah/edit/hapus materi PDF.
- [x] Reorder materi.
- [x] Lock/unlock sesi materi.
- [x] Active/inactive sesi materi.
- [x] Enroll/unenroll peserta ke course.
- [x] Mapping ujian existing ke course.

### 6. Peserta Features

- [x] Menu peserta: Course/Materi.
- [x] Halaman list course peserta.
- [x] Halaman detail course peserta.
- [x] Viewer/link PDF materi.
- [x] Tombol tandai materi selesai.
- [x] Form submit tugas esai per sesi.
- [x] Peserta bisa update submission sebelum dinilai jika status masih draft/submitted.
- [x] Peserta melihat feedback dan nilai setelah graded.
- [x] Peserta tidak bisa membuka sesi locked/inactive.

### 7. Pengawas Grading

- [x] Menu Pengawas: Penilaian Materi.
- [x] List submission tugas materi yang belum dinilai.
- [x] Filter berdasarkan course/sesi/peserta.
- [x] Detail submission.
- [x] Form nilai dan feedback.
- [x] Status submission berubah menjadi graded setelah dinilai.
- [x] Rekap tugas yang sudah dinilai.

### 8. Admin Grade Adjustment

- [x] Admin bisa melihat nilai asli dari Pengawas.
- [x] Admin bisa mengisi adjusted score.
- [x] Admin wajib mengisi reason.
- [x] Sistem menyimpan original score dan adjusted score.
- [x] Adjustment tidak menghapus nilai asli.
- [x] Audit adjustment ditampilkan di detail hasil.
- [x] Peserta hanya melihat nilai final, bukan seluruh catatan internal jika tidak dibutuhkan.

### 9. Course To Exam Mapping

- [x] Course bisa memiliki satu or banyak ujian existing.
- [x] Ujian tetap menggunakan `Exam`, `QuestionBank`, `ExamQuestion`, `ExamResult` existing.
- [x] Peserta hanya bisa melihat ujian course jika course enrolled dan exam active.
- [x] Course detail menampilkan status ujian peserta.
- [x] Mapping course tidak merusak akses `/exams` existing.

### 10. PDF Handling

- [x] MVP awal menyimpan `pdfUrl`.
- [x] Validasi URL/file hanya PDF.
- [x] Tentukan path upload development: `./storage/materials`.
- [x] Tentukan path upload production aaPanel: `/www/wwwroot/umroh-certification-storage/materials`.
- [x] Jangan memakai Supabase Storage untuk PDF materi.
- [x] Tambahkan `storage/` ke `.gitignore`.
- [x] Tambahkan env `STORAGE_DIR`, `FILE_BASE_PATH`, dan `MAX_UPLOAD_MB`.
- [x] Buat API upload PDF server-side.
- [x] Buat API streaming file `/api/files/[...path]`.
- [x] Pastikan PDF tidak bisa diakses peserta yang tidak enrolled jika memakai protected file route.

### 11. Master Materi Reusable

- [x] Tambahkan menu master materi untuk Admin.
- [x] Tambahkan menu master materi untuk Panitia jika Panitia diizinkan mengelola materi.
- [x] Admin/Panitia bisa membuat master materi berisi title, description, dan `pdfUrl`.
- [x] Form master materi memakai file picker/dropzone PDF, bukan input manual URL.
- [x] Form master materi menampilkan progress upload.
- [x] Setelah upload selesai, path file otomatis tersimpan ke `Material.pdfUrl`.
- [x] Admin/Panitia tidak perlu copy-paste URL PDF manual.
- [x] Admin/Panitia bisa edit master materi tanpa mengubah course mapping yang sudah ada.
- [x] Admin/Panitia bisa inactive master materi.
- [x] Admin/Panitia bisa memasang satu atau banyak master materi ke course.
- [x] Course 1 bisa memakai Materi A, B, C.
- [x] Course 2 bisa memakai Materi A, C tanpa menduplikasi data materi.
- [x] Urutan materi bisa berbeda per course.
- [x] Lock/unlock materi bisa berbeda per course.
- [x] Active/inactive materi di course bisa berbeda dari status active global master materi jika dibutuhkan.
- [x] Assignment/tugas esai tetap melekat ke materi dalam course, bukan hanya ke master materi global.
- [x] Progress peserta dihitung per course-material, bukan per master materi global.
- [x] Implementasi lama berbasis `CourseSession` dievaluasi: lanjut sebagai alias course-material atau migrasi ke `CourseMaterial`.

## API Checklist

### Admin API

- [x] `GET /api/admin/courses`
- [x] `POST /api/admin/courses`
- [x] `GET /api/admin/courses/[id]`
- [x] `PATCH /api/admin/courses/[id]`
- [x] `DELETE /api/admin/courses/[id]`
- [x] `POST /api/admin/courses/[id]/enrollments`
- [x] `DELETE /api/admin/courses/[id]/enrollments/[userId]`
- [x] `POST /api/admin/courses/[id]/exams`
- [x] `DELETE /api/admin/courses/[id]/exams/[examId]`
- [x] `POST /api/admin/grade-adjustments`
- [x] `GET /api/admin/materials`
- [x] `POST /api/admin/materials`
- [x] `GET /api/admin/materials/[id]`
- [x] `PATCH /api/admin/materials/[id]`
- [x] `DELETE /api/admin/materials/[id]`
- [x] `POST /api/admin/courses/[id]/materials`
- [x] `PATCH /api/admin/courses/[id]/materials/[courseMaterialId]`
- [x] `DELETE /api/admin/courses/[id]/materials/[courseMaterialId]`

### Panitia API

- [x] `GET /api/panitia/courses`
- [x] `POST /api/panitia/courses`
- [x] `PATCH /api/panitia/courses/[id]`
- [x] `POST /api/panitia/courses/[id]/sessions`
- [x] `PATCH /api/panitia/sessions/[id]`
- [x] `DELETE /api/panitia/sessions/[id]`
- [x] `POST /api/panitia/courses/[id]/enrollments`
- [x] `DELETE /api/panitia/courses/[id]/enrollments/[userId]`
- [x] `GET /api/panitia/materials`
- [x] `POST /api/panitia/materials`
- [x] `PATCH /api/panitia/materials/[id]`
- [x] `POST /api/panitia/courses/[id]/materials`
- [x] `PATCH /api/panitia/courses/[id]/materials/[courseMaterialId]`
- [x] `DELETE /api/panitia/courses/[id]/materials/[courseMaterialId]`

### File Storage API

- [x] `POST /api/uploads/materials` untuk upload PDF master materi oleh Admin/Panitia.
- [x] `GET /api/files/[...path]` untuk stream PDF dari `STORAGE_DIR`.
- [x] Validasi upload hanya menerima PDF.
- [x] Validasi upload memakai batas `MAX_UPLOAD_MB`.
- [x] API file streaming memakai path traversal protection.
- [x] API file streaming siap ditambah auth/enrollment check jika file perlu protected.

### Peserta API

- [x] `GET /api/courses`
- [x] `GET /api/courses/[id]`
- [x] `POST /api/courses/sessions/[id]/complete`
- [x] `POST /api/courses/assignments/[id]/submit`
- [x] `PATCH /api/courses/submissions/[id]`

### Pengawas API

- [x] `GET /api/pengawas/material-grading`
- [x] `GET /api/pengawas/material-grading/[submissionId]`
- [x] `POST /api/pengawas/material-grading/[submissionId]`

## UI Checklist

### Admin UI

- [x] Sidebar Admin menampilkan menu Course.
- [x] Sidebar Admin menampilkan menu Master Materi.
- [x] List course dengan filter active/inactive.
- [x] Dialog/form course.
- [x] Detail course dengan tab Materi, Peserta, Ujian, Progress, Nilai.
- [x] Halaman master materi dengan list, create, edit, active/inactive.
- [x] Detail course tab Materi memakai pilihan dari master materi.
- [x] Detail course tab Materi bisa tambah materi dari master tanpa upload ulang PDF.
- [x] Detail course tab Materi bisa atur urutan, lock/unlock, active/inactive per course.
- [x] Halaman grade adjustment.

### Panitia UI

- [x] Sidebar Panitia.
- [x] Dashboard Panitia.
- [x] List course.
- [x] Detail course.
- [x] Sidebar Panitia menampilkan menu Master Materi jika Panitia boleh mengelola materi.
- [x] Halaman master materi Panitia dengan list, create, edit, active/inactive.
- [x] Form materi PDF.
- [x] Form materi course berubah menjadi pilih dari master materi.
- [x] Kontrol lock/unlock.
- [x] Kontrol enrollment.

### Peserta UI

- [x] List course.
- [x] Detail course dengan progress.
- [x] Halaman materi PDF.
- [x] Peserta melihat materi berdasarkan relasi course-material, bukan semua master materi.
- [x] Form tugas esai.
- [x] Status nilai dan feedback.

### Pengawas UI

- [x] List submission materi.
- [x] Detail submission.
- [x] Form grading.
- [x] Rekap grading.

## Testing Checklist

### Auth And Role

- [x] Admin login ke `/admin/dashboard`.
- [x] Panitia login ke `/panitia/dashboard`.
- [x] Pengawas login ke `/pengawas/dashboard`.
- [x] Peserta login ke `/dashboard`.
- [x] Panitia ditolak dari halaman admin sensitif.
- [x] Peserta ditolak dari `/admin`, `/panitia`, dan `/pengawas`.

### Course Management

- [x] Admin membuat course.
- [x] Panitia membuat/mengelola course jika diizinkan.
- [x] Course inactive tidak muncul ke peserta.
- [x] Course active muncul hanya untuk peserta enrolled.
- [x] Peserta unenrolled tidak bisa akses detail course via URL langsung.

### Materi And Progress

- [x] Admin/Panitia menambahkan materi PDF.
- [x] Peserta bisa membuka materi unlocked.
- [x] Peserta tidak bisa membuka materi locked.
- [x] Peserta bisa menandai materi selesai.
- [x] Progress tersimpan dan muncul di detail course.

### Master Materi Reusable

- [x] Admin/Panitia membuat master materi A, B, C.
- [x] Course 1 bisa dipasangkan dengan materi A, B, C.
- [x] Course 2 bisa dipasangkan dengan materi A dan C.
- [x] Materi A hanya tersimpan sekali di master materi tetapi muncul di dua course.
- [x] Urutan materi A di Course 1 dan Course 2 bisa berbeda.
- [x] Lock/unlock materi A di Course 1 tidak mempengaruhi Course 2.
- [x] Peserta Course 1 melihat A, B, C sesuai enrollment dan status lock.
- [x] Peserta Course 2 melihat A, C sesuai enrollment dan status lock.
- [x] Progress peserta pada materi A di Course 1 tidak otomatis menyelesaikan materi A di Course 2 kecuali aturan produk memutuskan sebaliknya.
- [x] Tugas esai pada materi A di Course 1 tidak tercampur dengan tugas materi A di Course 2.

### Assignment And Grading

- [x] Peserta submit tugas esai.
- [x] Submission muncul di antrean Pengawas.
- [x] Pengawas memberi nilai dan feedback.
- [x] Peserta melihat nilai dan feedback.
- [x] Submission yang sudah graded tidak berubah tanpa aturan yang jelas.

### Grade Adjustment

- [x] Admin membuat grade adjustment dengan alasan.
- [x] Adjustment menyimpan nilai asli dan nilai baru.
- [x] Nilai final memakai adjusted score jika ada.
- [x] Audit log adjustment terlihat di area admin.

### Course Exam Mapping

- [x] Admin/Panitia mapping ujian existing ke course.
- [x] Peserta enrolled bisa melihat ujian course jika active.
- [x] Peserta unenrolled tidak bisa melihat ujian course.
- [x] Fitur ujian existing tetap berjalan.

### Regression

- [x] Login existing tetap berjalan.
- [x] Admin user management tetap berjalan.
- [x] Bank soal tetap berjalan.
- [x] Kelola ujian tetap berjalan.
- [x] Pengawas grading ujian existing tetap berjalan.
- [x] Sertifikat existing tetap berjalan.

## Operational Notes

- [x] Semua perubahan struktur database wajib lewat Prisma migration.
- [x] Jangan membuat/ubah/drop tabel manual dari Supabase Dashboard untuk flow normal.
- [x] Jika ada perubahan manual emergency, jalankan introspection/penyesuaian schema Prisma sebelum lanjut development.
- [x] Untuk deploy aaPanel, pastikan environment `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, dan `NEXTAUTH_URL` sudah sesuai.
- [x] Untuk Prisma + Supabase server-based deployment, gunakan Session pooler `:5432` agar tidak terkena masalah prepared statement dari transaction pooler.
- [x] Simpan password default seed hanya untuk MVP/dev; production wajib diganti.
- [x] Backup database sebelum migration besar.
- [x] Backup file production wajib mencakup `/www/wwwroot/umroh-certification-storage`, bukan hanya database Supabase.
- [x] Refactor master materi wajib memakai Prisma migration, bukan edit tabel manual di Supabase.
- [x] Sebelum migrasi `CourseSession` ke `CourseMaterial`, tentukan strategi data migration untuk data course/session yang sudah ada.
- [x] Jika `CourseSession` dipertahankan sebagai nama teknis, dokumentasikan bahwa maknanya adalah course-material mapping, bukan master materi.

## Progress Log

Gunakan bagian ini untuk mencatat checkpoint implementasi.

| Tanggal | Area | Status | Catatan |
|---|---|---|---|
| 2026-07-03 | Dokumentasi MVP 2 | Planned | Dokumen checklist dibuat sebagai referensi implementasi. |
| 2026-07-03 | Database & Schema | Done | Menambahkan model Course, Session, Assignment, Grade dll ke `schema.prisma`. Supabase PostgreSQL migration berhasil. |
| 2026-07-03 | Auth & Middleware | Done | Mengupdate Role PANITIA pada auth dan route protection di middleware. |
| 2026-07-03 | Master Materi Reusable | Done | Menambahkan model `Material`, route API `/api/admin/materials`, form upload PDF materi, dan refactor relasi course-materi. |
| 2026-07-05 | File Storage API | Done | Membuat environment variables lokal dan API upload PDF ke lokal/aaPanel. |
| 2026-07-06 | Panitia Course | Done | Memperbaiki bug pada pembuatan sesi oleh Panitia sehingga bisa sekaligus membuat/mengassign tugas (Assignment) di saat sesi dibuat. MVP 2 Selesai. |
