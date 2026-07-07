# Local Development to aaPanel File Storage Plan

Dokumen ini adalah panduan eksekusi untuk agent/engineer lain saat mengimplementasikan upload file PDF materi selama development dan saat production di aaPanel.

## 1. Tujuan

Keputusan arsitektur:

- Supabase hanya dipakai untuk database PostgreSQL.
- Supabase Storage tidak dipakai untuk file PDF materi.
- Saat development, file disimpan di folder lokal project.
- Saat production, file disimpan di persistent folder server aaPanel.
- Database hanya menyimpan path file, bukan isi file.

Target utama: flow development tetap jalan sekarang, tapi saat production cukup mengganti environment storage ke folder aaPanel tanpa mengubah struktur database.

## 2. Arsitektur File Storage

### Development

```txt
Next.js App
  -> upload file PDF
  -> simpan ke ./storage/materials/YYYY/MM/uuid.pdf
  -> database simpan path relatif file
```

Contoh path fisik lokal:

```txt
./storage/materials/2026/07/a1b2c3.pdf
```

Contoh nilai yang disimpan di database:

```txt
/materials/2026/07/a1b2c3.pdf
```

### Production aaPanel

```txt
Next.js App
  -> upload file PDF
  -> simpan ke /www/wwwroot/umroh-certification-storage/materials/YYYY/MM/uuid.pdf
  -> database simpan path relatif file
```

Contoh path fisik production:

```txt
/www/wwwroot/umroh-certification-storage/materials/2026/07/a1b2c3.pdf
```

Contoh nilai database tetap sama:

```txt
/materials/2026/07/a1b2c3.pdf
```

Jangan menyimpan path absolut server ke database. Simpan path relatif supaya portable antara local dan production.

## 3. Environment Variables

Tambahkan env berikut untuk local development:

```env
STORAGE_DIR="./storage"
FILE_BASE_PATH="/api/files"
MAX_UPLOAD_MB="20"
```

Untuk production aaPanel:

```env
STORAGE_DIR="/www/wwwroot/umroh-certification-storage"
FILE_BASE_PATH="/api/files"
MAX_UPLOAD_MB="20"
```

Penjelasan:

- `STORAGE_DIR`: lokasi fisik root file upload.
- `FILE_BASE_PATH`: endpoint akses file dari browser.
- `MAX_UPLOAD_MB`: batas ukuran upload PDF.

Jangan hardcode path storage di source code.

## 4. Git Ignore

Tambahkan folder storage lokal ke `.gitignore`:

```gitignore
storage/
```

Tujuan:

- PDF upload local tidak masuk repository.
- File user-generated tidak bercampur dengan source code.
- Ukuran repo tetap kecil.

## 5. Upload Flow

Alur upload master materi:

```txt
Admin/Panitia buka form Master Materi
  -> isi title dan description
  -> pilih file PDF
  -> request POST ke API upload
  -> API validasi auth dan role
  -> API validasi file PDF dan size
  -> API simpan file ke STORAGE_DIR
  -> API return file path relatif
  -> app simpan path ke Material.pdfUrl
```

Field database tetap:

```txt
Material.pdfUrl
```

Tidak perlu ubah schema database khusus untuk storage.

## 6. Download / View Flow

Untuk MVP, file diakses via API route:

```txt
GET /api/files/materials/YYYY/MM/uuid.pdf
```

API membaca file dari:

```txt
STORAGE_DIR/materials/YYYY/MM/uuid.pdf
```

Lalu stream response dengan header:

```http
Content-Type: application/pdf
Content-Disposition: inline
```

Keuntungan:

- Development dan production memakai flow yang sama.
- Tidak perlu konfigurasi Nginx khusus di awal.
- Nanti bisa ditambah proteksi login/enrollment sebelum file di-stream.

## 7. Validasi Upload

API upload wajib melakukan validasi:

- User harus login.
- Role harus `ADMIN` atau `PANITIA`.
- File wajib PDF.
- MIME type harus `application/pdf`.
- Extension wajib `.pdf`.
- Ukuran maksimal default `20MB`.
- Nama file tidak memakai nama asli upload user.
- File disimpan dengan UUID.

Format penyimpanan:

```txt
materials/YYYY/MM/{uuid}.pdf
```

Contoh:

```txt
materials/2026/07/550e8400-e29b-41d4-a716-446655440000.pdf
```

## 8. Replace File

Jika Admin/Panitia mengganti file PDF:

1. Upload file baru.
2. Update `Material.pdfUrl` ke path baru.
3. Hapus file lama jika tidak dipakai.
4. Jika hapus file lama gagal, jangan gagalkan update database.
5. Catat error ke log.

Catatan penting: jika master materi yang sama dipakai banyak course, replace file akan mempengaruhi semua course yang memakai master materi tersebut. Jika ingin materi course tertentu punya file berbeda, buat master materi baru.

## 9. Production Setup di aaPanel

Saat deploy production, lakukan langkah berikut.

### 9.1 Buat Folder Storage

```bash
mkdir -p /www/wwwroot/umroh-certification-storage/materials
```

### 9.2 Set Permission Folder

Folder harus bisa ditulis oleh process Node.js/PM2 yang menjalankan app.

Contoh umum:

```bash
chown -R www:www /www/wwwroot/umroh-certification-storage
chmod -R 755 /www/wwwroot/umroh-certification-storage
```

Catatan:

- User/group bisa berbeda tergantung setup aaPanel.
- Pastikan user yang menjalankan Next.js punya akses write.
- Jika upload gagal dengan `EACCES`, masalah biasanya permission folder.

### 9.3 Set Env Production

Di environment production:

```env
STORAGE_DIR="/www/wwwroot/umroh-certification-storage"
FILE_BASE_PATH="/api/files"
MAX_UPLOAD_MB="20"
```

### 9.4 Restart Aplikasi

Restart service Next.js/PM2 setelah env berubah.

## 10. Backup File Production

Karena file tidak disimpan di Supabase, backup wajib mencakup dua hal:

```txt
1. Database Supabase PostgreSQL
2. Folder /www/wwwroot/umroh-certification-storage
```

Minimal backup:

- `pg_dump` database Supabase.
- Archive folder storage aaPanel.
- Backup `.env` production secara aman, tidak di repo.

Contoh strategi backup:

```txt
Daily:
- pg_dump database
- tar/zip folder storage
- simpan ke lokasi backup terpisah
```

Jika hanya database yang di-backup tanpa folder storage, data materi akan punya `pdfUrl` tetapi file PDF-nya hilang.

## 11. Migration dari Development ke Production

Jika file local development perlu dibawa ke production:

1. Compress folder local:

```txt
./storage/materials
```

2. Upload archive ke server aaPanel.
3. Extract ke:

```txt
/www/wwwroot/umroh-certification-storage/materials
```

4. Pastikan struktur path tetap sama.

Contoh database local menyimpan:

```txt
/materials/2026/07/a.pdf
```

Maka file production harus tersedia di:

```txt
/www/wwwroot/umroh-certification-storage/materials/2026/07/a.pdf
```

Jangan mengubah path relatif jika database sudah berisi data.

## 12. Implementation Checklist untuk Agent

- [x] Tambahkan env `STORAGE_DIR`, `FILE_BASE_PATH`, `MAX_UPLOAD_MB`.
- [x] Tambahkan `storage/` ke `.gitignore`.
- [x] Buat helper server-side untuk resolve storage path.
- [x] Buat API upload PDF.
- [x] Buat API file streaming `/api/files/[...path]`.
- [x] Update form Master Materi dari text field URL menjadi file picker.
- [x] Simpan hasil upload ke `Material.pdfUrl`.
- [x] Validasi role `ADMIN` dan `PANITIA`.
- [x] Validasi file PDF dan size maksimal.
- [x] Test upload local.
- [x] Test buka PDF local.
- [x] Dokumentasikan setup folder aaPanel di deployment notes.
- [x] Pastikan production env mengarah ke storage aaPanel.

## 13. Testing Checklist

- [x] Admin bisa upload PDF master materi.
- [x] Panitia bisa upload PDF jika diizinkan.
- [x] File non-PDF ditolak.
- [x] File lebih dari `MAX_UPLOAD_MB` ditolak.
- [x] File tersimpan di `./storage` saat development.
- [x] Database menyimpan path relatif file.
- [x] Peserta bisa membuka PDF.
- [x] File tetap bisa dibuka setelah app restart.
- [x] Replace file berhasil.
- [x] File lama tidak memutus materi lain.
- [x] Production path bisa diganti hanya lewat env.

## 14. Risiko

- File local bisa hilang jika folder `storage/` dihapus manual.
- Production wajib punya backup folder storage.
- Jika deploy ulang menghapus folder app, jangan taruh storage di dalam folder source production.
- Jika file public via API tanpa authorization, link bisa dibagikan.
- Jika butuh proteksi akses, API file harus cek login/enrollment sebelum stream PDF.
- Jika master materi yang sama dipakai banyak course, replace file berdampak ke semua course terkait.

## 15. Rekomendasi Final

Untuk MVP:

```txt
Development:
./storage/materials

Production aaPanel:
/www/wwwroot/umroh-certification-storage/materials

Access:
GET /api/files/materials/...
```

Gunakan API route dulu agar development dan production konsisten. Jika nanti traffic file PDF besar, baru optimasi dengan Nginx static serving atau protected download strategy.
