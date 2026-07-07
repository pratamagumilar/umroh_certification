# MVP 3 Enhancement & Optimization Plan

Dokumen ini adalah acuan untuk pengembangan fase selanjutnya (MVP 3) dari platform Umroh Certification, yang berfokus pada penyempurnaan UI/UX, stabilitas, pelaporan (reporting), dan fitur-fitur lanjutan setelah MVP 2 (Learning Course) selesai.

## Overview MVP 3

Jika MVP 2 fokus pada fungsi dasar (core engine) dari pembelajaran dan penugasan, MVP 3 fokus pada:
1. **User Experience (UX) & Desain**: Memastikan seluruh tampilan responsif, modern, dan bebas bug tata letak.
2. **Dashboard & Analytics**: Memberikan wawasan (insights) yang lebih baik bagi Admin dan Panitia mengenai kelulusan dan progres belajar.
3. **Advanced Learning Features**: Forum diskusi, notifikasi, atau deadline tugas.

## Feature Checklist MVP 3

### 1. UI/UX Polishing
- [ ] Refactor dan perbaiki layout tabel di mode *mobile* (responsivitas).
- [ ] Rapikan navigasi menu agar lebih konsisten di seluruh role (Peserta, Panitia, Pengawas, Admin).
- [ ] Tambahkan animasi transisi antar halaman (menggunakan framer-motion atau sejenisnya) untuk kesan modern.
- [ ] Standardisasi penggunaan *alert* dan *toast/snackbar* untuk pesan sukses atau gagal (saat ini menggunakan komponen standard yang me-reset layout sementara).

### 2. Dashboard Analytics & Reporting
- [ ] **Admin Dashboard**: Tambahkan grafik statistik kelulusan per course dan grafik jumlah peserta aktif vs tidak aktif.
- [ ] **Panitia Dashboard**: Tambahkan rekapitulasi progres harian dari peserta yang di-*enroll*-nya.
- [ ] **Pengawas Dashboard**: Tambahkan metrik SLA penilaian (misal: berapa lama rata-rata pengawas menilai tugas).
- [ ] Export Laporan nilai ke PDF/Excel (CSV) dari halaman course.

### 3. Advanced Course Features
- [ ] Set **Deadline / Tenggat Waktu** untuk tugas esai. (Tugas otomatis tidak bisa disubmit jika melewati batas waktu).
- [ ] Tambahkan kolom **Komentar/Diskusi** di bawah materi agar peserta bisa bertanya kepada pengawas/panitia.
- [ ] Notifikasi In-App & Email (misal: "Tugas Anda telah dinilai", atau "Materi baru telah dibuka").

### 4. Technical Improvements
- [ ] Optimasi Query Database (N+1 queries di list course/sesi).
- [ ] Caching strategi (menggunakan React Query / SWR / Redis) untuk mengurangi beban ke API.
- [ ] Refactor file codebase yang terlalu besar (misal: memisahkan modal/dialog menjadi komponen terpisah dari halaman utama).

## Progress Log MVP 3

| Tanggal | Area | Status | Catatan |
|---|---|---|---|
| 2026-07-06 | Perencanaan MVP 3 | Planned | MVP 3 Plan dibuat menyusul selesainya fitur-fitur utama di MVP 2. |
