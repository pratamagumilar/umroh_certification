# Setup Connection String Supabase

Project Supabase **"Umroh Certification"** sudah aktif.  
Project ref: `mvrzjeovjyowctondema`

---

## Prasyarat

- Akun Supabase sudah login
- Project Supabase sudah dibuat
- Password database diketahui (jika lupa, reset di Dashboard → Database → Settings → "Reset password")

---

## Langkah 1 — Ambil Connection String

Buka halaman berikut:

```
https://supabase.com/dashboard/project/mvrzjeovjyowctondema/settings/database
```

Atau klik tombol **"Connect"** (hijau) di navbar atas dashboard.

### Direct Connection (untuk `DIRECT_URL`)

1. Klik tombol **"Connect"** di navbar atas
2. Pilih tab **"Direct"** → **"Connection string"**
3. Pilih format **URI**
4. Copy URI-nya:

```
postgresql://postgres.mvrzjeovjyowctondema:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

### Session/Transaction Pooler (untuk `DATABASE_URL`)

1. Masih di panel **"Connect"**
2. Pilih tab **"Transaction pooler"** atau **"Session pooler"**
3. Copy URI-nya (port `6543`, ada `?pgbouncer=true`):

```
postgresql://postgres.mvrzjeovjyowctondema:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

> **Penting:** Ganti `[YOUR-PASSWORD]` dengan password database yang sebenarnya.

---

## Langkah 2 — Update File `.env`

Buka file `.env` di root project, lalu isi:

```env
DATABASE_URL="postgresql://postgres.mvrzjeovjyowctondema:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.mvrzjeovjyowctondema:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="umroh-certification-secret-key-dev-2024"
NEXTAUTH_URL="http://localhost:3000"
```

> **Jangan commit file `.env` ke Git** — file ini sudah di-ignore oleh `.gitignore`.

---

## Langkah 3 — Jalankan Migration

Setelah `.env` berisi connection string yang benar:

```bash
# Validasi schema
npx prisma validate

# Generate Prisma Client
npx prisma generate

# Buat migration awal PostgreSQL (development)
npx prisma migrate dev --name init_postgresql

# Jalankan aplikasi
npm run dev
```

### Untuk Production

```bash
npx prisma migrate deploy
npm run build
npm run start
```

---

## Langkah 4 — Verifikasi

Checklist setelah migration:

- [ ] `npx prisma validate` berhasil
- [ ] `npx prisma generate` berhasil
- [ ] `npx prisma migrate dev` berhasil ke Supabase
- [ ] Aplikasi bisa start tanpa error koneksi database
- [ ] Login NextAuth berhasil
- [ ] Create/read/update data utama berhasil
- [ ] Unique constraint bekerja (email user tidak boleh duplikat)

---

## Catatan

- `DATABASE_URL` (pooler, port 6543) dipakai untuk runtime aplikasi
- `DIRECT_URL` (direct, port 5432) dipakai untuk Prisma migrate/introspection
- Jika hanya memakai direct connection tanpa pooler, kedua env bisa diisi nilai yang sama
- Untuk production, ganti `NEXTAUTH_URL` ke domain production dan `NEXTAUTH_SECRET` ke nilai yang kuat (`openssl rand -base64 32`)
