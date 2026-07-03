# Performance Review

Scope audited: `package.json`, `next.config.ts`, `src/app`, `src/components`, `src/app/api`, `src/lib`, and `prisma`.

Note: `AGENTS.md` asks to read `node_modules/next/dist/docs/` before writing Next.js code. That directory was not present in this workspace, so this review is based on the checked-in project files and observed Next.js 16/App Router usage. No application code was modified.

## Summary

The highest performance risks are API endpoints that do unbounded Prisma reads and N+1 query loops, plus page-level client components that fetch data after hydration and render large tables/lists entirely in the browser. The app is small enough for MVP data, but several routes will degrade sharply as participants, results, questions, and certificates grow.

Most fixes are minimal: add pagination and tighter `select`s, replace per-row Prisma counts/updates with grouped or batched queries, add schema indexes for common filters/orderings, and move read-only pages back toward Server Components or server-loaded data where practical.

## Findings

### Critical: Grading endpoints perform N+1 Prisma queries and unbounded scans

References: `src/app/api/pengawas/grading/route.ts:14`, `src/app/api/pengawas/grading/route.ts:23`, `src/app/api/pengawas/grading/route.ts:35`, `src/app/api/pengawas/grading/route.ts:38`, `src/app/api/pengawas/grading/[examId]/route.ts:28`, `src/app/api/pengawas/grading/[examId]/route.ts:36`, `src/app/api/pengawas/grading/[examId]/route.ts:37`

Why it hurts: `/api/pengawas/grading` first loads every pending result, then fetches exams, then runs one `examAnswer.count` per exam. `/api/pengawas/grading/[examId]` loads every pending participant, then runs one count per participant. With many exams or participants this becomes 1 + N database round trips and repeated relation filtering through `question.exams`. The code itself notes the resource issue at `src/app/api/pengawas/grading/route.ts:33`.

Minimal fixes: Add pagination or limits to pending-result lists. Replace per-exam/per-user counts with a single grouped query where possible, or fetch pending essay answer rows once with `select: { userId, question: { select: ... } }` and aggregate in memory for the page. Add supporting indexes listed below, especially on `ExamResult.finalStatus`, `ExamResult.examId`, `ExamAnswer.userId`, `ExamAnswer.score`, `Question.type`, and relation join columns.

Verification commands: `npm run lint`, `npm run build`, and enable query timing with Prisma logging in development while calling `/api/pengawas/grading` and `/api/pengawas/grading/:examId` against seeded large data.

### Critical: Admin and monitoring APIs return unpaginated datasets and large relational payloads

References: `src/app/api/admin/users/route.ts:16`, `src/app/api/admin/results/route.ts:16`, `src/app/api/admin/certificates/route.ts:14`, `src/app/api/admin/certificates/route.ts:24`, `src/app/api/pengawas/exams/[id]/monitor/route.ts:49`, `src/app/api/admin/question-banks/[id]/route.ts:17`, `src/app/api/admin/exams/[id]/route.ts:17`, `src/app/api/exams/[id]/take/route.ts:39`, `src/app/api/exams/[id]/take/route.ts:63`

Why it hurts: These endpoints return all users, results, passed results, certificates, participants, bank questions, exam questions, or exam-taking questions in one response. As data grows, route latency, memory use, JSON serialization time, network payload size, and browser render time grow linearly. The certificates route also loads all certificates into memory and maps them in JS at `src/app/api/admin/certificates/route.ts:24` to `src/app/api/admin/certificates/route.ts:33`.

Minimal fixes: Add `page`/`limit` query parameters with `take` and `skip` or cursor pagination. Return `{ items, total, page, pageSize }`. Use `select` rather than broad `include` for list views. For certificates, query only certificates matching the displayed result keys or include certificate existence through a relation/model change instead of loading every certificate.

Verification commands: `npm run build`, then profile response sizes with browser Network tools or `curl -w '%{time_total} %{size_download}\n'` for the affected routes using large seed data.

### High: Common Prisma filters and sort keys are missing indexes

References: `prisma/schema.prisma:10`, `prisma/schema.prisma:29`, `prisma/schema.prisma:69`, `prisma/schema.prisma:95`, `prisma/schema.prisma:119`, `prisma/schema.prisma:135`, existing unique-only indexes at `prisma/schema.prisma:56`, `prisma/schema.prisma:92`, `prisma/schema.prisma:116`, `prisma/schema.prisma:132`

Why it hurts: The schema has unique constraints but no non-unique indexes for frequent queries. Routes filter/order by `role`, `createdAt`, `isActive`, `startTime`, `finalStatus`, `examId`, `userId`, `score`, and `type`. Without indexes, database work trends toward full scans and sort work as rows grow.

Minimal fixes: Add targeted indexes such as `User(role, createdAt)`, `Exam(isActive, startTime)`, `ExamResult(finalStatus, createdAt)`, `ExamResult(examId, finalStatus)`, `ExamAnswer(userId, score)`, `Question(bankId, createdAt)`, `Question(type)`, and `Certificate(userId, examId)`. Re-check against actual query plans before adding too many indexes.

Verification commands: `npx prisma validate`, `npx prisma migrate dev --create-only`, and compare query plans/timings before and after with representative data.

### High: Exam-taking page re-renders the full question list every second

References: `src/app/(participant)/exams/[id]/take/page.tsx:40`, `src/app/(participant)/exams/[id]/take/page.tsx:66`, `src/app/(participant)/exams/[id]/take/page.tsx:69`, `src/app/(participant)/exams/[id]/take/page.tsx:83`, `src/app/(participant)/exams/[id]/take/page.tsx:147`, `src/app/(participant)/exams/[id]/take/page.tsx:187`

Why it hurts: `timeLeft` lives in the same component that renders every question card. The interval updates state every second, causing the whole exam page and every question row to re-render each tick. This becomes visibly expensive for large exams, especially with MUI `Card`, `Paper`, `Radio`, and multiline `TextField` trees.

Minimal fixes: Move the timer into a small child component that only renders the sticky timer and calls `onExpire`. Keep the question list in a sibling component that only re-renders on answer changes. For very large exams, paginate questions or render one question at a time.

Verification commands: Use React DevTools Profiler while taking an exam with 100+ questions, then confirm only the timer component commits once per second after the refactor.

### High: Broad client components and client-side fetching delay first useful render

References: client markers in `src/app/(participant)/dashboard/page.tsx:1`, `src/app/(participant)/exams/page.tsx:1`, `src/app/(participant)/exams/[id]/page.tsx:1`, `src/app/(participant)/exams/[id]/take/page.tsx:1`, `src/app/(participant)/profile/page.tsx:1`, `src/app/admin/users/page.tsx:1`, `src/app/admin/results/page.tsx:1`, `src/app/admin/certificates/page.tsx:1`, `src/app/pengawas/exams/[id]/monitor/page.tsx:1`; client fetch examples at `src/app/(participant)/dashboard/page.tsx:45`, `src/app/admin/results/page.tsx:46`, `src/app/admin/certificates/page.tsx:35`

Why it hurts: Many pages ship JavaScript, hydrate, show a spinner, then fetch their primary data from API routes. This adds an extra network round trip versus server-rendered data, increases hydration work, and worsens perceived performance. The issue compounds because these pages import MUI tables/cards/icons and then render potentially large lists after hydration.

Minimal fixes: Convert read-heavy pages to Server Components where they do not need browser-only state, or split them into a Server Component for data loading plus small Client Components for dialogs/forms. Keep client components for interactive controls only.

Verification commands: `npm run build` and inspect the Next build route output/client bundle sizes. Use Lighthouse or Web Vitals before/after on dashboard, results, users, and certificates pages.

### Medium: Polling monitor route repeatedly runs expensive full-list queries

References: `src/app/pengawas/exams/[id]/monitor/page.tsx:50`, `src/app/pengawas/exams/[id]/monitor/page.tsx:53`, `src/app/pengawas/exams/[id]/monitor/page.tsx:54`, `src/app/api/pengawas/exams/[id]/monitor/route.ts:28`, `src/app/api/pengawas/exams/[id]/monitor/route.ts:49`, `src/app/api/pengawas/exams/[id]/monitor/route.ts:91`

Why it hurts: The monitor page calls the endpoint every 10 seconds. The endpoint performs an unused attendance query at `src/app/api/pengawas/exams/[id]/monitor/route.ts:28` to `src/app/api/pengawas/exams/[id]/monitor/route.ts:46`, then performs another participant query and sorts in JS. Multiple supervisors can multiply this load.

Minimal fixes: Remove the unused `attendances` query. Add pagination or return only changed rows since a cursor/timestamp. Sort in the database using attendance scan time if possible. Consider a longer interval, manual refresh, or SSE/websocket only if real-time monitoring is required.

Verification commands: Call the route with Prisma query logging enabled and confirm one optimized query path per poll. Use browser Network panel to confirm polling stops on unmount and payload size stays bounded.

### Medium: Excel import routes process entire files synchronously and do per-row database work

References: `src/app/api/admin/users/import/route.ts:21`, `src/app/api/admin/users/import/route.ts:27`, `src/app/api/admin/users/import/route.ts:39`, `src/app/api/admin/users/import/route.ts:53`, `src/app/api/admin/users/import/route.ts:59`, `src/app/api/admin/users/import/route.ts:60`, `src/app/api/admin/question-banks/[id]/questions/import/route.ts:25`, `src/app/api/admin/question-banks/[id]/questions/import/route.ts:29`, `src/app/api/admin/question-banks/[id]/questions/import/route.ts:38`, `src/app/api/admin/question-banks/[id]/questions/import/route.ts:73`

Why it hurts: Both import endpoints read and parse full Excel files in memory. User import additionally does `findUnique`, `bcrypt.hash`, and `create` sequentially for every row. Question import sequentially creates every question. Large files can tie up a serverless function or Node worker, increase memory pressure, and cause timeouts.

Minimal fixes: Enforce file size and row count limits. For questions, validate rows then use `createMany` in chunks. For users, prefetch existing emails with one `findMany`, hash with controlled concurrency, then `createMany` in chunks or move imports to a background job.

Verification commands: Test imports with 1k, 5k, and 10k rows; record request duration and memory. Run `npm run lint` after changes.

### Medium: Prisma query logging is enabled for every environment where the singleton is constructed

References: `src/lib/prisma.ts:5`, `src/lib/prisma.ts:7`, `src/lib/prisma.ts:8`

Why it hurts: `log: ["query"]` logs every Prisma query. In production this can add I/O overhead, increase log volume/cost, expose sensitive query details, and make hot API paths slower under load.

Minimal fixes: Gate query logging to development, for example only set `log: ["query"]` when `NODE_ENV !== "production"`, or use environment-driven log levels.

Verification commands: `npm run build` and exercise API routes with `NODE_ENV=production` to confirm queries are no longer logged.

### Medium: Heavy dependencies are loaded into client/admin surfaces

References: dependencies in `package.json:12` to `package.json:25`; MUI and icon imports across `src/app/(participant)/layout.tsx:4` to `src/app/(participant)/layout.tsx:11`, `src/app/admin/users/page.tsx:4` to `src/app/admin/users/page.tsx:12`, `src/app/admin/results/page.tsx:4` to `src/app/admin/results/page.tsx:9`; server-only Excel imports at `src/app/api/admin/users/import/route.ts:6` and `src/app/api/admin/question-banks/[id]/questions/import/route.ts:5`

Why it hurts: MUI and many icon modules are used throughout client pages, increasing JavaScript parse/execute and hydration costs. `xlsx` is server-only in the audited code, which is good, but it is still a large dependency for route handlers. `jspdf` exists in `package.json:20` but was not found in `src`, so it may be unused bundle/dependency weight.

Minimal fixes: Keep icons as direct path imports, audit unused dependencies such as `jspdf`, and use bundle analysis before removing anything. Prefer Server Components for pages that mainly display MUI-styled read-only data so less page logic ships to the browser.

Verification commands: Add/run a bundle analyzer if available, or inspect `.next` output after `npm run build`. Run `npm ls jspdf` and search usage before removing dependencies.

### Low: Hydration risk from browser-local date/time formatting in client-rendered lists

References: `src/app/(participant)/dashboard/page.tsx:106`, `src/app/pengawas/exams/[id]/monitor/page.tsx:131`

Why it hurts: These specific pages are client components, so current hydration mismatch risk is limited. If they are converted to Server Components, locale/timezone formatting can produce different strings between server and browser. It can also add repeated render work for large lists.

Minimal fixes: Format dates on the server with a fixed locale/timezone, or isolate client-only date formatting into small components with stable inputs. For large tables, precompute formatted values in the API/server loader.

Verification commands: Run pages in production build with server rendering enabled after any Server Component conversion and watch for hydration warnings in the browser console.

## Verification Commands

Run these after fixes, depending on what changed:

```bash
npm run lint
npm run build
npx prisma validate
npx prisma migrate dev --create-only
```

For route performance checks, use representative large seed data and measure both response time and payload size:

```bash
curl -w '%{time_total} %{size_download}\n' -o /tmp/route.json 'http://localhost:3000/api/admin/results'
curl -w '%{time_total} %{size_download}\n' -o /tmp/route.json 'http://localhost:3000/api/pengawas/grading'
```

## Follow-Up Checklist

- Add pagination to admin users, admin results, certificates, monitor participants, question-bank questions, exam questions, and exam-taking payloads where product flow allows it.
- Replace N+1 grading counts with grouped/batched query logic.
- Remove the unused attendance query in the monitor API.
- Add Prisma indexes for the actual filter/order patterns, then validate query plans.
- Split the exam timer from the full question list to avoid whole-page re-renders every second.
- Convert read-heavy client pages to Server Components plus small interactive islands.
- Add row/file-size limits and chunking/background handling for Excel imports.
- Gate Prisma query logging to development.
- Run bundle analysis and remove unused dependencies only after confirming no usage.
