# Prisma + Supabase PostgreSQL Performance Guide

> **Target:** Umroh Certification Platform  
> **Database:** Supabase PostgreSQL (managed)  
> **ORM:** Prisma 6.x  
> **Date:** July 2026

---

## Daftar Isi

1. [Connection Management](#1-connection-management)
2. [Prisma Client Setup (Optimized)](#2-prisma-client-setup-optimized)
3. [Supabase + pgBouncer Configuration](#3-supabase--pgbouncer-configuration)
4. [Indexing Strategy](#4-indexing-strategy)
5. [Query Optimization Patterns](#5-query-optimization-patterns)
6. [N+1 Query Fixes](#6-n1-query-fixes)
7. [Pagination & Large Result Sets](#7-pagination--large-result-sets)
8. [Transaction Best Practices](#8-transaction-best-practices)
9. [Monitoring & Debugging](#9-monitoring--debugging)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Connection Management

### Prinsip Utama

**JANGAN membuat dan menghancurkan koneksi berulang kali.** Prisma sudah menggunakan connection pool secara internal. Setiap `new PrismaClient()` membuka koneksi pool baru ke database. Di environment serverless (Next.js API Routes), ini bisa menyebabkan:

- **Connection exhaustion** — terlalu banyak koneksi dibuka ke Supabase
- **Latency spike** — overhead koneksi baru tiap request
- **Supabase rate limiting** — pool connection limit Supabase (biasanya 20-60 koneksi tergantung plan)

### Current State Analysis

✅ **Baik:** Proyek sudah menggunakan singleton pattern di `src/lib/prisma.ts`:

```ts
// src/lib/prisma.ts — CURRENT (sudah benar, tapi masih bisa ditingkatkan)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

✅ **Baik:** Tidak ada `$disconnect()` yang dipanggil secara eksplisit di route manapun — Prisma mengelola pool sendiri.

✅ **Baik:** Tidak ada `new PrismaClient()` instansiasi kedua di kode manapun.

### Masalah yang Perlu Diperbaiki

🔴 **Critical: Tidak ada connection timeout / pool size limit**
Tanpa batasan eksplisit, saat traffic tinggi (banyak user ujian serentak), Prisma bisa membuka terlalu banyak koneksi ke Supabase, melebihi limit pool, dan menyebabkan error `too many connections`.

🔴 **Critical: Development mode logging di semua environment**
`log: ["query"]` di development bisa membanjiri console dan memperlambat response saat debugging. Harus dinonaktifkan di production.

---

## 2. Prisma Client Setup (Optimized)

### Rekomendasi Final untuk `src/lib/prisma.ts`

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Supabase connection pool limit (tergantung plan)
// Free: 20, Pro: 60, Team: 100+
const SUPABASE_MAX_CONNECTIONS = 15; // Jaga di bawah limit supaya ada ruang untuk query langsung

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"] // Hanya warning & error, jangan query (terlalu verbose)
        : ["error"], // Production: hanya error

    // Connection pool — KRITIS untuk Supabase
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },

    // ⚠️ Prisma 6.x: connection_limit diatur via connection string Supabase,
    // bukan di sini. Lihat bagian 3 (pgBouncer).
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Mengapa Ini Penting

| Setting            | Tanpa Optimasi                                   | Dengan Optimasi                        |
| ------------------ | ------------------------------------------------ | -------------------------------------- |
| `log`              | `["query"]` di dev → ribuan line log per request | `["warn", "error"]` → log ringan       |
| Connection pool    | Tidak terbatas → risk connection exhaustion      | Terkontrol via pgBouncer config        |
| Cold start latency | ~200-500ms                                       | ~50-150ms (dengan prepared statements) |

---

## 3. Supabase + pgBouncer Configuration

### 3.1 Apa itu pgBouncer?

Supabase menggunakan **pgBouncer** sebagai connection pooler eksternal. pgBouncer duduk di antara aplikasi dan PostgreSQL, mengelola pool koneksi agar PostgreSQL tidak kewalahan.

### 3.2 Connection String untuk pgBouncer (Transaction Mode)

Supabase menyediakan **dua** connection string:

| Mode                        | Port   | Kegunaan                                                                   |
| --------------------------- | ------ | -------------------------------------------------------------------------- |
| **Session** (default)       | `5432` | Persistent connections, cocok untuk long-lived apps                        |
| **Transaction** (pgBouncer) | `6543` | **Gunakan ini untuk Prisma!** Pool per-transaction, ideal untuk serverless |

### 3.3 `.env` Setup yang Direkomendasikan

```bash
# .env.example (UPDATE)

# SUPABASE DATABASE
# Untuk Prisma migrations & prisma studio (session mode)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=15&pool_timeout=20&schema=public"

# Untuk Prisma migrate (butuh session mode, bukan transaction)
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?schema=public"

# JWT
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 3.4 Parameter Connection String Penting

| Parameter                  | Nilai Rekomendasi | Keterangan                                     |
| -------------------------- | ----------------- | ---------------------------------------------- |
| `pgbouncer=true`           | **Wajib**         | Aktifkan pgBouncer transaction mode            |
| `connection_limit=15`      | 15-20             | Di bawah limit pool Supabase (20 free, 60 pro) |
| `pool_timeout=20`          | 20 detik          | Timeout menunggu connection dari pool          |
| `schema=public`            | public            | Explicit schema (best practice)                |
| `statement_cache_size=100` | 100               | Cache prepared statements (Prisma 6+)          |

### 3.5 Prisma Schema Datasource Final

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"] // Enable jika pakai @prisma/adapter-pg
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Port 6543 (pgBouncer transaction mode)
  directUrl = env("DIRECT_URL")     // Port 5432 (session mode, hanya untuk migrate)
}
```

### 3.6 Verifikasi pgBouncer Aktif

```bash
# Cek apakah pgBouncer berjalan
psql "$DIRECT_URL" -c "SHOW pool_mode;"
# Harus mengembalikan: transaction
```

---

## 4. Indexing Strategy

### 4.1 Index yang HARUS Ditambahkan

Berdasarkan audit seluruh route API, berikut index yang wajib ada untuk performa query:

```sql
-- ============================================
-- MIGRASI: Index untuk performa query
-- ============================================

-- User queries (paling sering difilter)
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");
CREATE INDEX IF NOT EXISTS "User_role_isActive_idx" ON "User"("role", "isActive");

-- Exam queries (listing, filter, sort)
CREATE INDEX IF NOT EXISTS "Exam_isActive_idx" ON "Exam"("isActive");
CREATE INDEX IF NOT EXISTS "Exam_startTime_idx" ON "Exam"("startTime");

-- Exam results (grading, certificates, dashboard)
CREATE INDEX IF NOT EXISTS "ExamResult_finalStatus_idx" ON "ExamResult"("finalStatus");
CREATE INDEX IF NOT EXISTS "ExamResult_userId_examId_idx" ON "ExamResult"("userId", "examId");

-- Exam answers (pengawas grading: cari yang belum dinilai)
CREATE INDEX IF NOT EXISTS "ExamAnswer_score_idx" ON "ExamAnswer"("score");
CREATE INDEX IF NOT EXISTS "ExamAnswer_userId_questionId_idx" ON "ExamAnswer"("userId", "questionId");

-- Assignment grading (panitia grading)
CREATE INDEX IF NOT EXISTS "AssignmentSubmission_status_idx" ON "AssignmentSubmission"("status");
CREATE INDEX IF NOT EXISTS "AssignmentSubmission_userId_idx" ON "AssignmentSubmission"("userId");

-- Course & enrollment (dashboard, listing peserta)
CREATE INDEX IF NOT EXISTS "Course_isActive_idx" ON "Course"("isActive");
CREATE INDEX IF NOT EXISTS "CourseEnrollment_status_idx" ON "CourseEnrollment"("status");
CREATE INDEX IF NOT EXISTS "CourseEnrollment_userId_courseId_idx" ON "CourseEnrollment"("userId", "courseId");

-- Session progress (tracking pembelajaran)
CREATE INDEX IF NOT EXISTS "SessionProgress_userId_idx" ON "SessionProgress"("userId");

-- Certificate lookup
CREATE INDEX IF NOT EXISTS "Certificate_userId_idx" ON "Certificate"("userId");

-- Grade adjustments
CREATE INDEX IF NOT EXISTS "GradeAdjustment_userId_idx" ON "GradeAdjustment"("userId");
CREATE INDEX IF NOT EXISTS "GradeAdjustment_courseId_idx" ON "GradeAdjustment"("courseId");
```

### 4.2 Unique Constraints yang Hilang (Data Integrity)

```sql
-- Mencegah duplikat jawaban per soal per user
CREATE UNIQUE INDEX IF NOT EXISTS "ExamAnswer_userId_questionId_key" ON "ExamAnswer"("userId", "questionId");

-- Mencegah duplikat sertifikat
CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_userId_examId_key" ON "Certificate"("userId", "examId");

-- Mencegah duplikat nilai
CREATE UNIQUE INDEX IF NOT EXISTS "AssignmentGrade_submissionId_key" ON "AssignmentGrade"("submissionId");
```

### 4.3 Prisma Schema Update (Tambahkan ke schema)

```prisma
// prisma/schema.prisma — tambahkan ini ke masing-masing model

model User {
  // ... existing fields ...

  @@index([role])
  @@index([isActive])
  @@index([role, isActive])
}

model Exam {
  // ... existing fields ...

  @@index([isActive])
  @@index([startTime])
}

model ExamResult {
  // ... existing fields ...

  @@index([finalStatus])
  @@index([userId, examId])
}

model ExamAnswer {
  // ... existing fields ...

  @@index([score])
  @@index([userId, questionId])
  @@unique([userId, questionId])
}

model AssignmentSubmission {
  // ... existing fields ...

  @@index([status])
  @@index([userId])
}

model Course {
  // ... existing fields ...

  @@index([isActive])
}

model CourseEnrollment {
  // ... existing fields ...

  @@index([status])
  @@index([userId, courseId])
}

model SessionProgress {
  // ... existing fields ...

  @@index([userId])
}

model Certificate {
  // ... existing fields ...

  @@index([userId])
  @@unique([userId, examId])
}

model GradeAdjustment {
  // ... existing fields ...

  @@index([userId])
  @@index([courseId])
}

model AssignmentGrade {
  // ... existing fields ...

  @@unique([submissionId])
}
```

---

## 5. Query Optimization Patterns

### 5.1 Gunakan `select` Bukan `include`

`include` mengambil **semua** field dari relasi, termasuk yang tidak dibutuhkan. Gunakan `select` untuk ambil hanya field yang diperlukan.

```ts
// ❌ BURUK: Mengambil semua field user termasuk password hash
const exam = await prisma.exam.findUnique({
  where: { id: examId },
  include: {
    questions: { include: { question: true } },
    supervisors: { include: { user: true } },
  },
});

// ✅ BAIK: Hanya field yang dibutuhkan
const exam = await prisma.exam.findUnique({
  where: { id: examId },
  select: {
    id: true,
    title: true,
    durationMinutes: true,
    passingGrade: true,
    questions: {
      select: {
        question: {
          select: {
            id: true,
            type: true,
            text: true,
            options: true,
            // ⚠️ JANGAN include correctAnswer untuk participant!
          },
        },
      },
    },
    supervisors: {
      select: {
        user: {
          select: { id: true, name: true },
        },
      },
    },
  },
});
```

### 5.2 Gunakan `_count` untuk Hitung Total (Tanpa Fetch Data)

```ts
// ❌ BURUK: Fetch semua data hanya untuk dapat count
const users = await prisma.user.findMany({ where: { role: "PESERTA" } });
const total = users.length;

// ✅ BAIK: Gunakan _count
const total = await prisma.user.count({ where: { role: "PESERTA" } });
```

### 5.3 Dashboard Query — Hindari Banyak Query Terpisah

```ts
// ❌ BURUK: 5+ query terpisah untuk dashboard
const totalUsers = await prisma.user.count();
const totalExams = await prisma.exam.count();
const totalCourses = await prisma.course.count();
const totalCertificates = await prisma.certificate.count();
const totalResults = await prisma.examResult.count();

// ✅ BAIK: Gunakan Promise.all untuk parallel execution
const [totalUsers, totalExams, totalCourses, totalCertificates, totalResults] =
  await Promise.all([
    prisma.user.count(),
    prisma.exam.count(),
    prisma.course.count({ where: { isActive: true } }),
    prisma.certificate.count(),
    prisma.examResult.count(),
  ]);

// ✅ LEBIH BAIK: Gunakan $transaction untuk satu round-trip
const [totalUsers, totalExams, totalCourses, totalCertificates, totalResults] =
  await prisma.$transaction([
    prisma.user.count(),
    prisma.exam.count(),
    prisma.course.count({ where: { isActive: true } }),
    prisma.certificate.count(),
    prisma.examResult.count(),
  ]);
```

### 5.4 Gunakan `findFirst` + `where` Bukan `findMany` + `[0]`

```ts
// ❌ BURUK
const user = (await prisma.user.findMany({ where: { email } }))[0];

// ✅ BAIK
const user = await prisma.user.findUnique({ where: { email } });
```

---

## 6. N+1 Query Fixes

### Pola N+1 #1: Query di Dalam Loop

**Lokasi:** `src/app/api/pengawas/grading/` (grading route)

```ts
// ❌ BURUK: N+1 query — 1 query untuk list questions + N query untuk jawaban
const questions = await prisma.examQuestion.findMany({
  where: { examId },
  include: { question: true },
});

for (const q of questions) {
  const answers = await prisma.examAnswer.findMany({
    where: { questionId: q.questionId },
    include: { user: { select: { name: true } } },
  });
  // ... process
}

// ✅ BAIK: Single query dengan nested include
const questionsWithAnswers = await prisma.examQuestion.findMany({
  where: { examId },
  select: {
    question: true,
    exam: {
      select: {
        examAnswers: {
          where: { score: null }, // hanya yang belum dinilai
          select: {
            id: true,
            answer: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    },
  },
});
```

### Pola N+1 #2: Loop untuk Mendapatkan Relasi

**Lokasi:** `src/app/api/admin/results/`

```ts
// ❌ BURUK: N+1 untuk dapatkan nama user per result
const results = await prisma.examResult.findMany({ where: { examId } });
const enriched = [];
for (const r of results) {
  const user = await prisma.user.findUnique({ where: { id: r.userId } });
  enriched.push({ ...r, userName: user.name });
}

// ✅ BAIK: Single query dengan include
const results = await prisma.examResult.findMany({
  where: { examId },
  include: {
    user: { select: { id: true, name: true, email: true } },
  },
});
```

### Pola N+1 #3: Mapping ID untuk Multi-Query

```ts
// ❌ BURUK
const userIds = submissions.map((s) => s.userId);
const users = await prisma.user.findMany({
  where: { id: { in: userIds } },
});

// ✅ BAIK (jika dari awal query pakai include)
const submissions = await prisma.assignmentSubmission.findMany({
  where: { status: "SUBMITTED" },
  include: {
    user: { select: { id: true, name: true } },
    session: {
      select: {
        masterAssignment: { select: { title: true, maxScore: true } },
      },
    },
    grades: {
      select: { score: true, feedback: true },
    },
  },
});
```

---

## 7. Pagination & Large Result Sets

### 7.1 Setiap `findMany` HARUS Punya Pagination

```ts
// ❌ BURUK: Ambil SEMUA user (bisa ribuan)
const users = await prisma.user.findMany({ where: { role: "PESERTA" } });

// ✅ BAIK: Pagination dengan take/skip
const users = await prisma.user.findMany({
  where: { role: "PESERTA" },
  take: 20,
  skip: 0,
  orderBy: { createdAt: "desc" },
});

// ✅ LEBIH BAIK: Cursor-based pagination (lebih stabil di dataset besar)
const users = await prisma.user.findMany({
  where: { role: "PESERTA" },
  take: 20,
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0, // Skip cursor itself
  orderBy: { id: "desc" },
});
```

### 7.2 Endpoint Pagination Standard

```ts
// src/app/api/users/route.ts — PATTERN STANDAR
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // Max 100
  const search = searchParams.get("search") || "";

  const where = {
    role: "PESERTA" as const,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return Response.json({
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

---

## 8. Transaction Best Practices

### 8.1 Gunakan Interactive Transaction untuk Operasi Multi-Step

```ts
// ✅ BAIK: Interactive transaction — rollback otomatis jika gagal
await prisma.$transaction(async (tx) => {
  const result = await tx.examResult.create({
    data: { userId, examId, pgScore, essayScore, finalStatus },
  });

  if (finalStatus === "LULUS") {
    await tx.certificate.create({
      data: { userId, examId, pdfUrl },
    });
  }

  return result;
});
```

### 8.2 Batch Transaction untuk Bulk Operations

```ts
// ✅ BAIK: Gunakan createMany dari pada loop create
await prisma.examQuestion.createMany({
  data: questionIds.map((questionId) => ({ examId, questionId })),
  skipDuplicates: true,
});
```

### 8.3 Perhatian: `$transaction([])` vs Interactive `$transaction(callback)`

| Tipe                                  | Use Case                                           | Isolation                    |
| ------------------------------------- | -------------------------------------------------- | ---------------------------- |
| `$transaction([q1, q2])`              | Query paralel yang tidak bergantung satu sama lain | Read-only batch              |
| `$transaction(async (tx) => { ... })` | Multi-step dengan dependency dan conditional logic | Full ACID, rollback on error |

---

## 9. Monitoring & Debugging

### 9.1 Cek Supabase Connection Pool Usage

```sql
-- Jalankan di Supabase SQL Editor untuk monitor koneksi
SELECT
  count(*) as total_connections,
  state
FROM pg_stat_activity
WHERE datname = 'postgres'
GROUP BY state;
```

### 9.2 Prisma Query Timing (Development Only)

```ts
// src/lib/prisma.ts — Tambahkan timing middleware untuk debugging
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Middleware untuk tracking slow queries (aktifkan di development)
if (process.env.NODE_ENV === "development") {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;

    if (duration > 500) {
      console.warn(
        `⚠️ SLOW QUERY [${duration}ms]: ${params.model}.${params.action}`,
      );
    }

    return result;
  });
}
```

### 9.3 Supabase Dashboard Metrics

Pantau di Supabase Dashboard → Database → **Statistics**:

- **Active connections** — harus di bawah pool limit (15-20 untuk free plan)
- **CPU usage** — lonjakan saat banyak user ujian serentak
- **Disk IO** — tinggi berarti butuh indexing lebih baik

### 9.4 Prisma Studio (Dev Only)

```bash
# Jangan gunakan di production! Hanya untuk local development
npx prisma studio
```

---

## 10. Implementation Checklist

### Phase 1: Connection & Config (Immediate)

- [x] Update `src/lib/prisma.ts` — log level changed to `["warn", "error"]`
- [x] Update `.env.example` — added pgBouncer connection string template
- [x] Ubah log level dari `["query"]` ke `["warn", "error"]` di development ✅
- [x] **`.env` fix applied** ✅ — `DATABASE_URL` now uses port `6543` with `?pgbouncer=true&connection_limit=15&pool_timeout=20`, `DIRECT_URL` on port `5432`
- [x] **`prisma/schema.prisma` datasource** — `directUrl` already set ✅

### Phase 2: Indexing (Schema Ready, Migration Pending)

- [x] Update `prisma/schema.prisma` dengan `@@index` declarations — **15+ index added** ✅
- [x] Unique constraints di schema: `ExamAnswer(userId,questionId)`, `Certificate(userId,examId)`, `AssignmentGrade(submissionId)` ✅
- [x] **Run migration** ✅ — `20260709044419_add_performance_indexes` applied successfully
- [x] **Verifikasi index** — migration created all 15+ indexes and 3 unique constraints ✅

### Phase 3: Query Optimization ✅ (Completed)

| File                                             | Status     | Fix Applied                                                                  |
| ------------------------------------------------ | ---------- | ---------------------------------------------------------------------------- |
| `src/app/api/admin/users/route.ts`               | 🟢 Fixed   | ✅ Pagination: `take/skip` + `$transaction` count                            |
| `src/app/api/admin/users/import/route.ts`        | 🟢 Fixed   | ✅ Batch: `createMany` + single email lookup via `findMany({in})`            |
| `src/app/api/admin/exams/route.ts`               | 🟡 Partial | Existing `take`, could use `select` instead of `include`                     |
| `src/app/api/admin/results/route.ts`             | 🟢 Fixed   | ✅ Pagination: `take/skip` + `$transaction` count                            |
| `src/app/api/admin/courses/route.ts`             | 🟢 Fixed   | ✅ Pagination: `take/skip` + `$transaction` count                            |
| `src/app/api/pengawas/grading/[examId]/route.ts` | 🟢 Fixed   | ✅ N+1: `groupBy` single query replaces per-user loop                        |
| `src/app/api/pengawas/dashboard/route.ts`        | 🟢 OK      | Already uses `Promise.all`                                                   |
| `src/app/api/pengawas/exams/route.ts`            | 🟡 Partial | Existing pagination, `include` → `select` still recommended                  |
| `src/app/api/panitia/courses/route.ts`           | 🟢 Fixed   | ✅ Pagination: `take/skip` + `$transaction` count                            |
| `src/app/api/panitia/materials/route.ts`         | 🟡 Mixed   | Some endpoints use `take: 100`, others don't                                 |
| `src/app/api/courses/route.ts`                   | 🟢 Fixed   | ✅ Pagination: `take/skip` + `$transaction` count, replaced include → select |
| `src/app/api/dashboard/route.ts`                 | 🟢 Fixed   | ✅ Sequential awaits → `Promise.all`, replaced include → select              |
| `src/app/api/exams/active/route.ts`              | 🟡 Partial | Has `take` but inconsistent                                                  |
| `src/app/api/profile/route.ts`                   | 🟢 OK      | Single record, no issues                                                     |

- [x] Fix N+1: `pengawas/grading/[examId]/route.ts` — `groupBy` + Map replaces loop
- [x] Fix N+1: `admin/results/route.ts` — already used include, added pagination
- [x] Fix N+1: `admin/users/import/route.ts` — `createMany` batch + deduplication
- [x] Fix sequential awaits: `dashboard/route.ts` — `Promise.all`
- [x] Pagination added: `admin/users`, `admin/courses`, `admin/results`, `panitia/courses`, `courses`
- [ ] Ganti `include` → `select` di query berat: `admin/exams`, `pengawas/exams` (not critical, can defer)

### Phase 4: Schema Fixes ✅

- [x] Fix `GradeAdjustment` — `adminId` → `User` (`@relation("GradeAdmin")`), `courseId` → `Course` ✅
- [x] Fix `Course.createdById` — `@relation("CourseCreator")` ke `User` ✅
- [ ] Tambahkan role enum PostgreSQL atau constraint (nice-to-have, not critical)
- [ ] Generate squash migration (mismatch: CourseSession vs old SessionAssignment — needs assessment)

### Phase 5: Monitoring

- [ ] Setup Supabase Database monitoring alerts
- [x] Tambahkan slow query logging middleware (`prisma.$use`) di development ✅
- [ ] Monitor active connections saat peak load
- [ ] Profile query dengan `EXPLAIN ANALYZE` untuk query kompleks

---

## Appendix A: Supabase Plan Limits

| Plan | Max Connections    | Included Bandwidth | CPU    |
| ---- | ------------------ | ------------------ | ------ |
| Free | 20 (via pgBouncer) | 2 GB               | Shared |
| Pro  | 60 (via pgBouncer) | 50 GB              | 2-core |
| Team | 100+               | 100 GB+            | 4-core |

**Rekomendasi `connection_limit` berdasarkan plan:**

- Free: `connection_limit=15` (sisakan 5 untuk Dashboard/SQL Editor)
- Pro: `connection_limit=50` (sisakan 10 untuk operasional)
- Team: `connection_limit=90`

---

## Appendix B: Common Prisma + Supabase Pitfalls

| Pitfall                         | Symptom                                                        | Solution                                                        |
| ------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------- |
| Connection exhaustion           | `Timed out fetching a new connection from the connection pool` | Kurangi `connection_limit`, pastikan pakai singleton            |
| pgBouncer not enabled           | Error `prepared statement "X" already exists`                  | Tambahkan `?pgbouncer=true` ke connection string                |
| Migration fails with pgBouncer  | Migration commands timeout                                     | Gunakan `DIRECT_URL` (port 5432) untuk migration                |
| Too many PrismaClient instances | Memory leak, banyak idle connections di Supabase               | Pastikan singleton global, jangan `new PrismaClient()` di route |
| Large result sets               | Timeout, OOM di server                                         | Tambahkan pagination, gunakan `select`, batasi `take` max 100   |
| N+1 di grading page             | Halaman lambat saat banyak peserta                             | Gunakan nested `include`/`select`, hindari loop query           |

---

## Appendix C: Startup Checklist untuk Production

Sebelum deployment ke production:

```bash
# 1. Generate Prisma client dengan konfigurasi production
npx prisma generate

# 2. Jalankan semua migration di production
npx prisma migrate deploy

# 3. Verifikasi index
npx prisma db execute --stdin <<< "
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
"

# 4. Cek connection pool (dari Supabase Dashboard)
# Pastikan active connections < connection_limit

# 5. Build project
npm run build
```

---

> **Dokumen ini adalah living document.**  
> Update setiap kali ada perubahan skema database, peningkatan traffic, atau penambahan fitur baru.
