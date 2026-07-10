# MVP 4 Registration, Kartu Peserta, dan Absensi QR Plan

Dokumen ini adalah acuan resmi untuk MVP 4. Fokus fase ini adalah memperluas lifecycle peserta dari yang semula dibuat manual oleh admin menjadi dapat mendaftar sendiri, tetapi tetap **tidak langsung aktif** sampai melalui proses approval oleh admin. Di fase yang sama, sistem juga menambahkan **kartu peserta**, **kode peserta khusus**, serta **absensi oleh panitia** menggunakan QR code atau input kode manual.

Dokumen ini disusun untuk executor implementasi berikutnya. Gunakan dokumen ini sebagai sumber kebenaran utama untuk scope, urutan kerja, aturan bisnis, dan acceptance criteria.

Dokumen ini juga bersifat **living document**. Scope MVP 4 boleh bertumbuh seiring masuknya ide baru dari PM / System Architect, selama setiap penambahan dicatat dengan jelas dan tidak langsung mencampur ide mentah dengan item implementasi yang sudah disepakati.

## Tracker Implementasi MVP 4

Gunakan checklist ini sebagai ringkasan progres lintas fase. Checklist detail per fase ada di bagian bawah.

- [x] Phase 0 — Alignment & Discovery selesai
- [x] Phase 1 — Registrasi dan Approval selesai
- [x] Phase 2 — Kartu Peserta dan Kode Khusus selesai
- [x] Phase 3 — Absensi Panitia selesai
- [ ] Phase 4 — Rekap, Audit, dan Hardening selesai
- [ ] Acceptance criteria MVP 4 terpenuhi
- [ ] UAT minimum lulus
- [ ] Open decisions sudah ditutup PM / Architect

## Cara Pakai Dokumen Ini Saat Scope Bertumbuh

Gunakan aturan berikut saat ide baru masuk satu per satu:

- ide baru **jangan langsung** dimasukkan ke checklist implementasi fase aktif sebelum disetujui;
- setiap ide baru masuk dulu ke bagian **Inbox Ide / Scope Tambahan**;
- setelah disetujui PM / Architect, ide dipindahkan ke salah satu bagian: `In Scope MVP 4`, `Candidate Next Phase`, atau `Out of Scope`;
- jika ide baru mengubah alur inti, update juga bagian `Aturan Bisnis`, `Open Decisions`, dan `Acceptance Criteria`;
- checklist fase hanya berisi item yang sudah siap dieksekusi executor;
- setiap perubahan besar scope dicatat di `Log Perubahan Scope`.

## Inbox Ide / Scope Tambahan

Bagian ini disediakan untuk menampung ide baru sebelum diputuskan apakah masuk MVP 4 atau tidak.

- [ ] Ide tambahan 01 — belum diisi
- [ ] Ide tambahan 02 — belum diisi
- [ ] Ide tambahan 03 — belum diisi
- [ ] Ide tambahan 04 — belum diisi
- [ ] Ide tambahan 05 — belum diisi

## Log Perubahan Scope

Gunakan format ini setiap kali ada penambahan arah baru.

- [x] 2026-07-09 (v1) — Draft awal MVP 4 dibuat untuk registrasi, kartu peserta, dan absensi QR/manual.
- [x] 2026-07-09 (v2) — Detail form registrasi dari Google Form referensi dimasukkan. Model data finalised (`Pendaftaran` + `DokumenPendaftaran`). Multi-step wizard 6 langkah disepakati. Open decisions ditutup.
- [ ] Tambahkan log perubahan berikutnya di sini.

---

## 1. Ringkasan Eksekutif

### Tujuan MVP 4

MVP 4 menambahkan tiga kapabilitas operasional penting:

1. **Registrasi Mandiri Peserta**
   - Calon peserta dapat membuat akun sendiri.
   - Akun baru tidak langsung bisa login penuh sebagai peserta aktif.
   - Aktivasi tetap dikendalikan oleh admin melalui proses approval.

2. **Kartu Peserta**
   - Setiap peserta memiliki kartu peserta digital yang dapat ditampilkan, diunduh, atau dicetak.
   - Kartu peserta memuat identitas utama, QR code, dan kode peserta khusus yang bisa dibaca manusia.

3. **Absensi Panitia via QR / Kode Manual**
   - Panitia dapat melakukan absensi peserta dengan memindai QR pada kartu peserta.
   - Jika QR sulit dipindai atau ada kendala teknis, panitia dapat memasukkan kode peserta secara manual.

### Nilai Bisnis

- Mengurangi ketergantungan pada pembuatan akun manual sepenuhnya oleh admin.
- Mempercepat proses check-in dan absensi pada kegiatan lapangan.
- Menyediakan identitas peserta yang konsisten dan mudah diverifikasi.
- Menambah kesiapan sistem untuk pelaksanaan kegiatan sertifikasi yang lebih besar.

### Outcome yang Diharapkan

Setelah MVP 4 selesai:

- calon peserta dapat mendaftar sendiri;
- admin dapat memproses approval akun baru;
- peserta aktif memiliki kartu peserta;
- panitia dapat menandai kehadiran peserta dari QR atau kode manual;
- sistem memiliki jejak audit absensi yang lebih baik.

---

## 2. Baseline Produk Saat Ini

### Yang Sudah Selesai Sebelum MVP 4

#### MVP 1

- autentikasi berbasis role;
- manajemen user oleh admin;
- manajemen bank soal dan ujian;
- pelaksanaan ujian peserta;
- pengawasan dan grading oleh pengawas;
- hasil ujian;
- sertifikat otomatis.

#### MVP 2

- role `PANITIA`;
- course pembelajaran;
- master materi reusable;
- enrollment peserta ke course;
- sesi materi dan tugas esai;
- grading tugas materi;
- mapping course ke ujian.

#### MVP 3

- revamp UI/UX lintas role;
- analytics dan reporting utama;
- penguatan fitur tugas mandiri;
- otomatisasi sertifikat;
- live exam monitoring, reset sesi, dan penambahan waktu ujian.

### Kondisi Sistem Saat Ini yang Relevan untuk MVP 4

- login peserta saat ini memakai validasi `isActive`;
- user saat ini dibuat dari sisi admin;
- attendance yang ada saat ini masih terikat ke konteks ujian;
- belum ada konsep kartu peserta;
- belum ada kode peserta khusus;
- belum ada flow scan QR oleh panitia untuk absensi operasional umum.

---

## 3. Scope MVP 4

### In Scope

#### A. Registrasi Mandiri Peserta

- halaman registrasi publik untuk calon peserta;
- submit data registrasi dasar;
- status akun awal adalah pending / belum aktif;
- admin dapat melihat daftar pendaftar baru;
- admin dapat menyetujui atau menolak registrasi;
- hanya user yang disetujui yang dapat memakai sistem sebagai peserta aktif.

#### B. Kartu Peserta

- sistem menghasilkan kartu peserta untuk user peserta yang valid;
- kartu menampilkan identitas utama;
- kartu menampilkan QR code;
- kartu menampilkan kode peserta khusus secara jelas;
- kartu bisa dipakai sebagai identitas operasional absensi.

#### C. Absensi oleh Panitia

- panitia dapat membuka halaman absensi;
- panitia dapat memindai QR peserta;
- panitia dapat memasukkan kode peserta manual;
- sistem menandai kehadiran peserta;
- sistem mencegah absensi ganda tanpa penanganan khusus;
- sistem menyimpan waktu scan/input dan actor panitia.

### Out of Scope

Item berikut tidak masuk MVP 4 kecuali diputuskan ulang:

- pembayaran pendaftaran;
- approval multi-level selain admin;
- notifikasi WhatsApp;
- check-in offline penuh tanpa koneksi;
- NFC / barcode selain QR;
- integrasi printer kartu fisik otomatis;
- absensi berbasis GPS atau face recognition;
- redesign total alur exam attendance yang sudah ada;
- registrasi untuk role selain `PESERTA`.

### Candidate Tambahan yang Belum Diputuskan

Gunakan bagian ini untuk ide yang terasa relevan, tetapi belum disahkan masuk MVP 4 aktif.

- [ ] Belum ada candidate tambahan yang disahkan.

---

## 4. Role dan Tanggung Jawab

### ADMIN

Admin bertanggung jawab pada:

- melihat daftar registrasi baru;
- memverifikasi data pendaftar;
- menyetujui atau menolak pendaftaran;
- mengaktifkan atau membatalkan akses peserta;
- memonitor data kartu peserta;
- melihat rekap absensi.

### PANITIA

Panitia bertanggung jawab pada:

- mencari peserta saat kegiatan berlangsung;
- memindai QR pada kartu peserta;
- menginput kode peserta manual bila scan gagal;
- melihat status berhasil / gagal / duplikat;
- menangani kasus operasional di lapangan sesuai SOP.

### PESERTA

Peserta bertanggung jawab pada:

- mendaftar dengan data yang benar;
- menunggu approval admin;
- mengakses kartu peserta setelah akun aktif;
- menunjukkan QR atau kode peserta saat absensi.

### PENGAWAS

Tidak menjadi role utama pada MVP 4, kecuali bila nanti dibutuhkan akses read-only terhadap data kehadiran tertentu.

---

## 5. Product Flow Utama

## 5.1 Flow Registrasi Peserta

1. Calon peserta membuka halaman registrasi publik.
2. Calon peserta mengisi data wajib.
3. Sistem memvalidasi kelengkapan dan duplikasi data.
4. Sistem membuat akun dalam status belum aktif / pending approval.
5. Sistem menampilkan pesan bahwa akun sedang menunggu persetujuan admin.
6. Admin melihat daftar registrasi masuk.
7. Admin meninjau data.
8. Admin memilih aksi approve atau reject.
9. Jika approve, peserta menjadi aktif dan dapat login.
10. Jika reject, status tersimpan dan peserta tidak dapat login sebagai user aktif.

## 5.2 Flow Kartu Peserta

1. Peserta telah berstatus aktif.
2. Sistem memastikan peserta memiliki kode peserta unik.
3. Sistem menghasilkan QR berdasarkan payload yang disepakati.
4. Sistem menampilkan kartu peserta pada area peserta.
5. Kartu dapat diunduh atau dicetak jika fitur output disediakan pada implementasi.

## 5.3 Flow Absensi via QR

1. Panitia membuka halaman scan absensi.
2. Panitia memindai QR peserta.
3. Sistem menerjemahkan payload QR ke identitas peserta.
4. Sistem memvalidasi bahwa peserta valid dan boleh diabsen.
5. Sistem membuat catatan absensi bila belum ada catatan untuk konteks yang sama.
6. Sistem menampilkan status sukses atau duplikat.

## 5.4 Flow Absensi via Kode Manual

1. Panitia membuka form input manual.
2. Panitia memasukkan kode peserta.
3. Sistem mencari peserta berdasarkan kode.
4. Sistem menampilkan identitas ringkas untuk konfirmasi.
5. Panitia menekan tombol konfirmasi absensi.
6. Sistem menyimpan absensi dan menampilkan hasil.

---

## 6. Aturan Bisnis Wajib

### 6.1 Aturan Registrasi

- Registrasi publik hanya untuk role `PESERTA`.
- Akun hasil registrasi publik tidak boleh langsung aktif.
- Email harus unik.
- Data wajib minimal harus mencakup nama, email, password, dan nomor telepon jika diputuskan wajib.
- Status approval harus dapat dibaca jelas oleh admin.
- Peserta yang belum disetujui tidak boleh login sebagai user aktif.
- Penolakan harus punya jejak alasan jika dianggap perlu secara operasional.

### 6.2 Aturan Kode Peserta

- Setiap peserta aktif harus memiliki kode peserta unik.
- Kode peserta harus mudah dibaca manusia dan cukup pendek untuk fallback manual.
- Kode peserta tidak boleh bentrok antar peserta.
- Kode peserta sebaiknya stabil dan tidak sering berubah.
- Jika ada kebutuhan regenerasi, harus tercatat audit-nya.

### 6.3 Aturan Kartu Peserta

Kartu peserta minimal memuat:

- nama peserta;
- identitas program/sertifikasi;
- foto peserta jika tersedia;
- QR code;
- kode peserta khusus;
- informasi tambahan yang diputuskan tim produk.

### 6.4 Aturan Absensi

- Satu peserta tidak boleh tercatat hadir dua kali pada konteks absensi yang sama.
- Scan QR dan input kode manual harus menghasilkan catatan absensi yang sama secara domain.
- Sistem harus memberi respons jelas bila peserta sudah pernah diabsen.
- Panitia yang melakukan scan/input harus terekam.
- Waktu absensi harus terekam.
- Jika dibutuhkan koreksi, mekanisme override atau pembatalan harus dibatasi role dan tercatat.

---

## 7. Keputusan Domain yang Harus Dipatuhi Executor

Executor tidak boleh mulai coding tanpa menyelaraskan keputusan domain berikut dengan PM/System Architect.

### 7.1 Status Akun

Ada dua opsi pendekatan:

#### Opsi A — Gunakan `isActive` sebagai gate utama

Kelebihan:

- perubahan kecil terhadap auth saat ini;
- cepat untuk implementasi awal.

Konsekuensi:

- pending approval dan nonaktif biasa akan berbagi makna yang mirip;
- audit status registrasi menjadi kurang eksplisit.

#### Opsi B — Tambahkan status registrasi terpisah

Contoh status:

- `PENDING_APPROVAL`
- `APPROVED`
- `REJECTED`
- `SUSPENDED` bila nanti dibutuhkan

Kelebihan:

- lebih jelas secara bisnis;
- lebih baik untuk audit dan reporting.

Konsekuensi:

- butuh penyesuaian skema, API, dan auth lebih banyak.

### Rekomendasi Arsitektural

Untuk jangka menengah, **status registrasi terpisah lebih sehat** dibanding hanya mengandalkan `isActive`, tetapi keputusan final tetap ditentukan PM.

### 7.2 Domain Absensi

Executor harus memastikan konteks absensi yang dipakai pada MVP 4.

Pilihan domain:

1. **Absensi Event/Kegiatan**
   - paling cocok untuk kartu peserta lapangan;
   - independen dari ujian.

2. **Absensi Course Session**
   - cocok bila kehadiran dikaitkan ke sesi pembelajaran tertentu.

3. **Absensi Exam Existing**
   - cepat secara reuse, tetapi berisiko mencampur domain ujian dengan check-in event umum.

### Rekomendasi Arsitektural

Untuk kebutuhan kartu peserta seperti contoh yang diberikan, **lebih aman memakai domain absensi event/kegiatan atau sesi tersendiri**, bukan menumpuk makna ke model attendance ujian yang sudah ada.

---

## 8. Dampak Data Model

Bagian ini adalah panduan perubahan domain. Nama model final dapat berubah saat desain teknis dirinci, tetapi intent bisnisnya tidak boleh hilang.

### 8.1 Entitas Registrasi / Approval

Minimal sistem harus memiliki representasi untuk:

- data pendaftaran publik;
- status approval;
- waktu pengajuan;
- actor admin yang memutuskan;
- alasan reject jika ada.

### 8.2 Entitas Kartu Peserta

Minimal sistem harus memiliki representasi untuk:

- peserta pemilik kartu;
- kode peserta unik;
- payload QR;
- status aktif/nonaktif kartu jika diperlukan;
- waktu penerbitan atau regenerasi.

### 8.3 Entitas Absensi Baru

Minimal sistem harus memiliki representasi untuk:

- peserta yang diabsen;
- konteks absensi;
- metode absensi (`QR` atau `MANUAL_CODE`);
- waktu absensi;
- panitia yang mencatat;
- status hasil bila ingin menyimpan duplicate/failed attempts;
- catatan opsional.

### 8.4 Audit Log

Jika MVP 4 ingin operasionalnya kuat, siapkan audit untuk:

- approve/reject registrasi;
- regenerate kode peserta;
- koreksi atau pembatalan absensi.

---

## 9. Area Sistem yang Terdampak

Executor harus menginventaris area berikut sebelum implementasi:

### Auth dan Login

- public registration page;
- validasi akun pending vs aktif;
- messaging saat akun belum disetujui.

### Admin

- daftar registrasi baru;
- detail registrasi;
- approve/reject action;
- pemantauan kartu peserta;
- rekap absensi.

### Peserta

- form registrasi;
- status approval;
- halaman kartu peserta;
- tampilan QR dan kode peserta.

### Panitia

- halaman scan QR;
- halaman input kode manual;
- feedback cepat saat absensi berhasil/gagal/duplikat.

### Storage / Rendering

- kebutuhan asset untuk tampilan kartu;
- generator QR;
- kemungkinan reuse generator PDF/image yang sudah ada.

---

## 10. Form Registrasi Multi-Step (Google Form Style)

Registrasi publik menggunakan **multi-step wizard 6 langkah** dengan MUI Stepper. Setiap step memiliki validasi mandiri sebelum user dapat melanjutkan ke step berikutnya.

### Referensi Google Form

Form ini didesain mengacu pada Google Form pendaftaran sertifikasi yang sesungguhnya:
https://docs.google.com/forms/d/e/1FAIpQLSd3wyxumIJFTX6kFcu7eJRogL3jfg4LfVBwOliKlaObRyaZ6Q/viewform

### Struktur 6 Step

| Step  | Judul        | Fields                                                                                                                                                                                                                     | Validasi Per-Step                                                                                |
| ----- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **1** | Akun         | Email, Password, Konfirmasi Password                                                                                                                                                                                       | Email unik (async check via API), password min 8 karakter, konfirmasi cocok                      |
| **2** | Data Diri    | Nama Lengkap dengan Gelar, Nama Lengkap Tanpa Gelar, Tempat Lahir, Tanggal Lahir (date picker), NIK (KTP), Jenis Kelamin (radio L/P), Email (read-only dari step 1), Nomor HP (WA), Alamat Lengkap, Provinsi (input bebas) | Semua required, NIK 16 digit numerik, No HP valid (08xx / +62), tgl lahir tidak boleh > hari ini |
| **3** | Data Kerja   | Unit Kerja / Utusan, Jabatan pada Unit Kerja, Alamat Kantor                                                                                                                                                                | Semua required                                                                                   |
| **4** | Pendidikan   | Pendidikan Terakhir (radio: S1/S2/S3/Other + input manual jika Other), Nama Universitas / Perguruan Tinggi                                                                                                                 | Semua required, jika Other wajib isi field manual                                                |
| **5** | Perlengkapan | Ukuran Baju (radio button dengan SVG icon visual: S, M, L, XL, XXL, XXXL, XXXXL, Lainnya + input manual)                                                                                                                   | Required, jika Lainnya wajib isi field manual                                                    |
| **6** | Dokumen      | 9 file upload: Photo 3x4 (latar merah), Ijazah Terakhir (min S1), KTP, Kartu Keluarga, Paspor, Visa, Surat Keterangan Sehat, Surat Pernyataan tidak sedang menjalani hukuman disiplin, Bukti Transfer/Pembayaran           | Semua required, max 10 MB/file, format JPG/PNG/PDF, preview thumbnail setelah upload             |

### Perilaku Stepper

```
┌──────────────────────────────────────────────┐
│  ●━━━●━━━○━━━○━━━○━━━○                      │  ← MUI Stepper horizontal
│  Akun > Data Diri > Kerja > Pendidikan > ...  │
├──────────────────────────────────────────────┤
│                                              │
│  [Form fields untuk step aktif]              │
│                                              │
│  [← Kembali]              [Lanjut →]        │
└──────────────────────────────────────────────┘
```

- Stepper menunjukkan progress dengan ikon ceklis untuk step yang sudah tervalidasi.
- Klik step sebelumnya di stepper diperbolehkan untuk navigasi mundur (data tidak hilang karena disimpan di state).
- Tombol "Kembali" kembali ke step sebelumnya.
- Tombol "Lanjut" → validasi semua field di step saat ini → jika lolos, pindah ke step berikutnya.
- Di step terakhir (Dokumen), tombol berubah menjadi "Submit Pendaftaran".
- Invalid fields ditandai dengan border merah + pesan error inline di bawah field.
- Step yang belum lengkap tidak bisa diklik di stepper.

### Re-registrasi (Upsert)

Jika calon peserta mendaftar lagi dengan email yang sama (misal untuk update dokumen):

- Data sebelumnya ditampilkan **pre-filled** di semua field.
- User bisa edit field apapun.
- Upload dokumen baru akan **replace** dokumen lama.
- Status pendaftaran di-reset ke `PENDING` menunggu approval ulang.
- Endpoint menggunakan **upsert by email**.

---

## 11. Data Model Final (Concrete)

### Model `Pendaftaran`

```prisma
model Pendaftaran {
  id              String    @id @default(uuid())
  email           String    @unique
  password        String    // bcrypt hashed

  // Step 2: Data Diri
  namaGelar       String
  namaTanpaGelar  String
  tempatLahir     String
  tanggalLahir    DateTime
  nik             String
  jenisKelamin    String    // LAKI_LAKI | PEREMPUAN
  noHp            String
  alamatTinggal   String
  provinsi        String    // input bebas

  // Step 3: Data Kerja
  unitKerja       String
  jabatan         String
  alamatKantor    String

  // Step 4: Pendidikan
  pendidikanTerakhir String  // S1 | S2 | S3 | OTHER
  namaUniversitas    String

  // Step 5: Perlengkapan
  ukuranBaju      String    // S | M | L | XL | XXL | XXXL | XXXXL | OTHER

  // Status
  status          String    @default("PENDING") // PENDING | APPROVED | REJECTED
  alasanReject    String?
  approvedById    String?
  approvedAt      DateTime?

  // Link ke User setelah approved
  userId          String?   @unique

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  approvedBy      User?              @relation(fields: [approvedById], references: [id])
  user            User?              @relation(fields: [userId], references: [id])
  dokumen         DokumenPendaftaran[]

  @@index([status])
  @@index([email])
}
```

### Model `DokumenPendaftaran`

```prisma
model DokumenPendaftaran {
  id             String       @id @default(uuid())
  pendaftaranId  String
  tipeDokumen    TipeDokumen  // enum di Prisma level
  fileUrl        String       // URL ke Supabase Storage
  namaAsli       String       // original filename
  mimeType       String
  createdAt      DateTime     @default(now())

  pendaftaran    Pendaftaran  @relation(fields: [pendaftaranId], references: [id], onDelete: Cascade)

  @@unique([pendaftaranId, tipeDokumen])  // satu pendaftaran hanya boleh 1 file per tipe
  @@index([pendaftaranId])
}

enum TipeDokumen {
  PHOTO_3X4
  IJAZAH
  KTP
  KARTU_KELUARGA
  PASPOR
  VISA
  SURAT_SEHAT
  SURAT_PERNYATAAN
  BUKTI_TRANSFER
}
```

### Perubahan di Model `User`

```prisma
model User {
  // ... existing fields tetap ...

  pendaftaran Pendaftaran? // link balik ke pendaftaran (opsional)
}
```

### Relasi Antar Model

```
Pendaftaran ──1:N──> DokumenPendaftaran
Pendaftaran ──1:1──> User (setelah approved)
Pendaftaran ──N:1──> User (approvedBy, admin yang approve)
```

---

## 12. Open Decisions — Status Final

Keputusan yang sudah disepakati:

- [x] **Status registrasi** — Pakai status terpisah (`PENDING`, `APPROVED`, `REJECTED`) di model `Pendaftaran`. Tidak hanya mengandalkan `isActive`.
- [x] **Password** — User set password sendiri saat registrasi (Step 1).
- [x] **Ukuran baju** — Radio button dengan SVG icon visual per ukuran (S-XXXXL + Lainnya).
- [x] **Provinsi** — Input text bebas (tidak dropdown).
- [x] **Re-registrasi** — Bisa daftar ulang dengan email sama. Data pre-filled, dokumen di-replace, status reset ke PENDING.
- [x] **Field wajib registrasi** — Semua field di 6 step wajib diisi (16 field teks + 9 file upload).
- [x] **Kartu peserta** — Hanya untuk user `PESERTA` yang sudah `APPROVED`.
- [x] **Absensi** — Memakai entitas baru di luar attendance ujian yang sudah ada.
- [x] **Alasan reject** — Wajib diisi oleh admin saat reject.

---

## 13. Endpoint API MVP 4

| Method   | Route                                  | Deskripsi                                                                                                                        | Role    |
| -------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `POST`   | `/api/register`                        | Submit/re-submit pendaftaran (upsert by email). Body: semua field teks + 9 file (multipart/form-data). Return: data pendaftaran. | PUBLIC  |
| `GET`    | `/api/register/check-email?email=`     | Cek apakah email sudah terdaftar di `Pendaftaran` atau `User`. Return: `{ available: boolean }`.                                 | PUBLIC  |
| `GET`    | `/api/admin/pendaftaran`               | List semua pendaftar dengan pagination (`take/skip`), filter by `status`. Return: `{ data, pagination }`.                        | ADMIN   |
| `GET`    | `/api/admin/pendaftaran/[id]`          | Detail pendaftar + semua dokumen (URL download).                                                                                 | ADMIN   |
| `PUT`    | `/api/admin/pendaftaran/[id]/approve`  | Approve pendaftaran → buat `User` dengan role `PESERTA` + `isActive: true`. Return: user baru.                                   | ADMIN   |
| `PUT`    | `/api/admin/pendaftaran/[id]/reject`   | Reject pendaftaran + `alasanReject`. Body: `{ alasan: string }`.                                                                 | ADMIN   |
| `GET`    | `/api/panitia/absensi`                 | List semua event absensi (filter `isActive: true`). Return array `AbsensiEvent[]` dengan `_count.attendances`.                   | PANITIA |
| `POST`   | `/api/panitia/absensi`                 | Buat event absensi baru. Body: `{ title, description? }`. Auto-generate `kodeAbsen`. Return `AbsensiEvent`.                      | PANITIA |
| `DELETE` | `/api/panitia/absensi/[id]`            | Soft-delete event (set `isActive = false`).                                                                                      | PANITIA |
| `GET`    | `/api/panitia/absensi/record?eventId=` | List semua record kehadiran untuk event tertentu. Return array `AbsensiRecord[]` dengan data peserta (name, kodePeserta, email). | PANITIA |
| `POST`   | `/api/panitia/absensi/record`          | Catat kehadiran via kode peserta manual. Body: `{ eventId, kodePeserta, method }`. Return 409 jika sudah hadir.                  | PANITIA |

---

## 14. Breakdown Tahapan Implementasi untuk Executor

## Phase 0 — Alignment & Discovery

Tujuan:

- menyepakati domain dan scope final.

Checklist:

- [ ] Finalkan istilah status registrasi.
- [ ] Finalkan format kode peserta.
- [ ] Finalkan payload QR.
- [ ] Finalkan domain absensi yang dipakai.
- [ ] Finalkan field wajib saat registrasi.
- [ ] Finalkan data yang ditampilkan di kartu peserta.

Deliverable:

- [ ] Technical design note singkat tersedia.
- [ ] Keputusan domain tertulis tersedia sebelum migration dan coding.

## Phase 1 — Registrasi dan Approval

Tujuan:

- menghadirkan alur daftar mandiri peserta dengan approval admin.

Checklist:

- [ ] Siapkan halaman registrasi publik.
- [ ] Siapkan endpoint submit registrasi.
- [ ] Siapkan validasi duplikasi data.
- [ ] Siapkan status pending.
- [ ] Siapkan daftar registrasi di admin.
- [ ] Siapkan aksi approve/reject.
- [ ] Siapkan guard login untuk akun yang belum approved.

Deliverable:

- [ ] Registrasi publik berjalan end-to-end.
- [ ] Admin bisa memproses pendaftar baru.
- [ ] Peserta approved bisa login.

## Phase 2 — Kartu Peserta dan Kode Khusus

Tujuan:

- menghadirkan identitas peserta operasional.

Checklist:

- [ ] Siapkan aturan pembentukan kode peserta.
- [ ] Siapkan penyimpanan kode peserta.
- [ ] Siapkan generator QR.
- [ ] Siapkan halaman kartu peserta.
- [ ] Siapkan tampilan data kartu.
- [ ] Siapkan opsi unduh/cetak jika diputuskan masuk phase ini.

Deliverable:

- [ ] Peserta aktif memiliki kartu peserta.
- [ ] Kartu menampilkan QR dan kode manual.

## Phase 3 — Absensi Panitia

Tujuan:

- menghadirkan flow kehadiran lapangan yang cepat dan aman.

Checklist:

- [x] Siapkan data model `AbsensiEvent` + `AbsensiRecord`
- [x] Siapkan API GET/POST `/api/panitia/absensi` (list + create event)
- [x] Siapkan API GET/POST `/api/panitia/absensi/record` (list records + scan manual)
- [x] Siapkan API DELETE `/api/panitia/absensi/[id]` (soft-delete event)
- [x] Siapkan halaman `/panitia/absensi` (list event, create, delete)
- [x] Siapkan dialog scan/manual entry dengan daftar hadir live
- [x] Siapkan proteksi duplicate attendance (constraint + 409 response)
- [x] Siapkan pencatatan actor panitia (`createdById`) dan timestamp (`scanTime`)
- [x] Siapkan feedback UI untuk sukses/gagal/duplikat (Snackbar)
- [x] Siapkan sidebar menu "Absensi" di PanitiaSidebar

Deliverable:

- [x] Panitia bisa membuat event absensi dengan kode unik.
- [x] Panitia bisa mencatat kehadiran via kode peserta manual.
- [x] Duplikat absensi dicegah dengan respons 409.
- [x] Daftar hadir real-time ditampilkan di dialog scan.
- [x] Event bisa di-soft-delete (isActive = false).
- [x] Sistem menyimpan jejak absensi dengan benar.

## Phase 4 — Rekap, Audit, dan Hardening

Tujuan:

- memastikan fitur siap dipakai operasional.

Checklist:

- [ ] Siapkan tabel rekap absensi.
- [ ] Siapkan filter pencarian peserta.
- [ ] Siapkan audit log utama.
- [ ] Siapkan SOP koreksi data.
- [ ] Siapkan uji skenario lapangan.
- [ ] Siapkan seed/demo data bila diperlukan.

Deliverable:

- [ ] MVP 4 siap UAT.
- [ ] Proses operasional terdokumentasi.

---

## 15. Acceptance Criteria

### 15.1 Registrasi

- [ ] Peserta baru dapat mendaftar tanpa campur tangan admin di awal.
- [ ] Akun baru tidak langsung aktif.
- [ ] Admin dapat melihat pendaftar baru.
- [ ] Admin dapat approve dan reject.
- [ ] Akun yang belum disetujui tidak dapat login penuh.

### 15.2 Kartu Peserta

- [ ] Peserta aktif memiliki kartu peserta.
- [ ] Kartu peserta memuat QR code dan kode khusus.
- [ ] Kode peserta terbaca jelas oleh manusia.
- [ ] QR mengarah ke payload yang bisa dipakai untuk absensi.

### 15.3 Absensi

- [ ] Panitia dapat menandai kehadiran via QR.
- [ ] Panitia dapat menandai kehadiran via kode manual.
- [ ] Duplicate attendance terdeteksi.
- [ ] Identitas panitia pencatat tersimpan.
- [ ] Timestamp absensi tersimpan.

### 15.4 Operasional

- [ ] Admin dapat memonitor data registrasi dan absensi.
- [ ] Alur utama bisa dijalankan tanpa intervensi database manual.
- [ ] Skenario error umum memiliki pesan yang jelas di UI.

---

## 16. UAT Scenario Minimum

### Skenario Registrasi

- [ ] Peserta mendaftar dengan email baru.
- [ ] Sistem menyimpan akun sebagai pending.
- [ ] Peserta mencoba login sebelum disetujui dan ditolak dengan pesan yang tepat.
- [ ] Admin menyetujui peserta.
- [ ] Peserta berhasil login.

### Skenario Kartu Peserta

- [ ] Peserta aktif membuka halaman kartu.
- [ ] QR tampil.
- [ ] Kode peserta tampil.
- [ ] Data identitas pada kartu sesuai dengan profil peserta.

### Skenario Absensi QR

- [ ] Panitia scan QR peserta.
- [ ] Sistem menandai hadir.
- [ ] Scan kedua pada konteks yang sama menghasilkan status duplikat.

### Skenario Absensi Manual

- [ ] Panitia memasukkan kode peserta.
- [ ] Sistem menemukan peserta yang benar.
- [ ] Panitia mengonfirmasi absensi.
- [ ] Sistem menyimpan kehadiran.

### Skenario Error

- [ ] Kode peserta tidak ditemukan.
- [ ] QR tidak valid.
- [ ] Panitia tanpa hak akses mencoba membuka halaman absensi.
- [ ] Peserta yang belum approved mencoba mengakses area aktif.

---

## 17. Risiko dan Mitigasi

### Risiko Produk

- status approval membingungkan bila hanya memakai `isActive`;
- duplicate attendance bila definisi konteks absensi tidak jelas;
- user experience buruk bila QR sulit dipindai;
- bentrok data bila kode peserta tidak benar-benar unik.

### Mitigasi

- definisikan domain dan status secara eksplisit sebelum coding;
- tambahkan fallback kode manual;
- gunakan format kode yang pendek dan mudah dibaca;
- siapkan indeks dan constraint unik di database.

---

## 18. Open Decisions untuk PM / Architect

Sebelum implementation freeze, keputusan berikut harus ditutup:

- [ ] Putuskan apakah approval memakai `isActive` saja atau status registrasi terpisah.
- [ ] Putuskan apakah kartu peserta hanya untuk user `PESERTA` aktif.
- [ ] Putuskan apakah foto peserta wajib untuk kartu.
- [ ] Putuskan apakah kartu harus bisa diunduh sebagai PDF, gambar, atau cukup view halaman.
- [ ] Putuskan apakah absensi MVP 4 memakai entitas baru di luar attendance ujian.
- [ ] Putuskan apakah panitia boleh membatalkan absensi yang salah scan.
- [ ] Putuskan apakah alasan reject registrasi wajib diisi.
- [ ] Putuskan apakah kode peserta perlu format tertentu, misalnya angkatan + nomor urut.
- [ ] Putuskan apakah satu peserta bisa punya lebih dari satu konteks absensi pada hari berbeda.
- [ ] Putuskan apakah dibutuhkan export rekap absensi pada MVP 4 atau ditunda ke fase berikutnya.

---

## 19. Referensi Baseline

Dokumen ini harus dibaca bersama:

- `README.md`
- `docs/MVP/MVP2_LEARNING_COURSE_PLAN.md`
- `docs/MVP/MVP3_ENHANCEMENT_PLAN.md`
- `docs/TESTING_NOTES.md`
- `docs/PERFORMANCE_REVIEW.md`

Area teknis yang relevan sebagai baseline saat implementasi:

- `prisma/schema.prisma`
- `src/lib/auth.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `src/lib/certificateGenerator.ts`
- `src/lib/storage.ts`
- area `src/app/panitia`
- area `src/app/(participant)`

---

## 20. Status Dokumen

- Status: Draft siap eksekusi setelah keputusan domain ditutup.
- Tanggal: 9 Juli 2026.
- Pemilik arah produk: PM / System Architect.
- Pengguna dokumen: Executor implementasi berikutnya.

## 21. Template Saat Ide Baru Masuk

Salin template ini ke bagian `Inbox Ide / Scope Tambahan` saat ada ide baru:

```md
- [ ] Nama ide:
  - Tujuan bisnis:
  - Role terdampak:
  - Masuk kategori: In Scope MVP 4 / Candidate Next Phase / Out of Scope
  - Perlu ubah data model: Ya / Tidak
  - Perlu keputusan PM/Architect: Ya / Tidak
  - Catatan:
```
