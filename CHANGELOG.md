# Changelog

Catatan perubahan penting selama pengembangan Portal Sertifikasi Umroh.

## 3 Juli 2026

### Kelola Ujian dan Bank Soal

- Menghapus aksi hapus manual per soal dari halaman detail Kelola Ujian.
- Soal yang sudah dipilih dari Bank Soal tidak bisa dikurangi satu per satu dari halaman Kelola Ujian.
- Endpoint pemetaan soal ujian sekarang bersifat tambah saja:
  - tidak menghapus mapping soal lama,
  - menolak payload kosong,
  - mengabaikan soal yang sudah terhubung agar tidak terjadi duplikasi.
- Pemilihan Bank Soal tetap memasukkan seluruh soal dari bank yang dipilih ke jadwal ujian.

