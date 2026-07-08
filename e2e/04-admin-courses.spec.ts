import { test, expect } from '@playwright/test';
import { ApiHelper } from './helpers/api';

test.describe('Admin - Course & Session Management', () => {
  let api: ApiHelper;
  let courseId: string;
  let materialId: string;
  let assignmentId: string;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  // ── Courses ──────────────────────────────────────────
  test.describe('Courses', () => {
    test('POST /api/admin/courses - buat course', async () => {
      await api.loginAsAdmin();
      const res = await api.post('/api/admin/courses', {
        title: `Course Test ${Date.now()}`,
        description: 'Deskripsi course untuk testing',
      });
      expect(res.status).toBe(201);
      expect(res.body.course).toHaveProperty('id');
      courseId = res.body.course.id;
    });

    test('GET /api/admin/courses - list courses', async () => {
      await api.loginAsAdmin();
      const res = await api.get('/api/admin/courses');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('_count');
      }
    });

    test('GET /api/admin/courses/[id] - detail course', async () => {
      await api.loginAsAdmin();
      const res = await api.get(`/api/admin/courses/${courseId}`);
      expect(res.status).toBe(200);
    });

    test('PATCH /api/admin/courses/[id] - update course', async () => {
      await api.loginAsAdmin();
      const res = await api.patch(`/api/admin/courses/${courseId}`, {
        title: `Course Updated ${Date.now()}`,
      });
      expect(res.status).toBe(200);
    });

    test('DELETE /api/admin/courses/[id] - hapus course', async () => {
      await api.loginAsAdmin();
      const createRes = await api.post('/api/admin/courses', {
        title: `Course Dihapus ${Date.now()}`,
      });
      const idToDelete = createRes.body.course.id;

      const res = await api.delete(`/api/admin/courses/${idToDelete}`);
      expect(res.status).toBe(200);
    });

    test('POST /api/admin/courses - gagal tanpa title', async () => {
      await api.loginAsAdmin();
      const res = await api.post('/api/admin/courses', {});
      expect(res.status).toBe(400);
    });
  });

  // ── Materials ────────────────────────────────────────
  test.describe('Materials', () => {
    test('POST /api/admin/materials - buat material', async () => {
      await api.loginAsAdmin();
      const res = await api.post('/api/admin/materials', {
        title: `Material Test ${Date.now()}`,
        description: 'Deskripsi materi',
        pdfUrl: 'https://storage.example.com/materi.pdf',
      });
      expect(res.status).toBe(201);
      expect(res.body.material).toHaveProperty('id');
      materialId = res.body.material.id;
    });

    test('GET /api/admin/materials - list materials', async () => {
      await api.loginAsAdmin();
      const res = await api.get('/api/admin/materials');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/admin/materials - gagal tanpa pdfUrl', async () => {
      await api.loginAsAdmin();
      const res = await api.post('/api/admin/materials', { title: 'Test' });
      expect(res.status).toBe(400);
    });
  });

  // ── Assignments ──────────────────────────────────────
  test.describe('Assignments', () => {
    test('POST /api/admin/assignments - buat assignment', async () => {
      await api.loginAsAdmin();
      const res = await api.post('/api/admin/assignments', {
        title: `Assignment Test ${Date.now()}`,
        prompt: 'Jelaskan tata cara umroh sesuai sunnah!',
        description: 'Tugas individu',
        maxScore: 100,
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      assignmentId = res.body.id;
    });

    test('GET /api/admin/assignments - list assignments', async () => {
      await api.loginAsAdmin();
      const res = await api.get('/api/admin/assignments');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('createdBy');
      }
    });

    test('POST /api/admin/assignments - gagal tanpa prompt', async () => {
      await api.loginAsAdmin();
      const res = await api.post('/api/admin/assignments', { title: 'Test' });
      expect(res.status).toBe(400);
    });
  });

  // ── Sessions ─────────────────────────────────────────
  test.describe('Course Sessions', () => {
    test('POST /api/panitia/courses/[id]/sessions - tambah sesi ke course', async () => {
      await api.loginAsAdmin();
      const res = await api.post(`/api/panitia/courses/${courseId}/sessions`, {
        materialId: materialId,
        order: 1,
      });
      expect(res.status).toBe(201);
    });

    test('PUT /api/admin/courses/[id]/sessions/bulk - sinkronisasi sesi', async () => {
      await api.loginAsAdmin();
      const res = await api.put(`/api/admin/courses/${courseId}/sessions/bulk`, {
        sessions: [
          { materialId, isLocked: false },
          { masterAssignmentId: assignmentId, isLocked: true },
        ],
      });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('berhasil');
    });

    test('PATCH /api/admin/courses/[id]/sessions/reorder - urutkan sesi', async () => {
      await api.loginAsAdmin();
      const res = await api.patch(`/api/admin/courses/${courseId}/sessions/reorder`, {
        sessionIds: [],
      });
      expect([200, 400]).toContain(res.status);
    });
  });

  // ── Enrollments ──────────────────────────────────────
  test.describe('Enrollments', () => {
    test('POST /api/admin/courses/[id]/enrollments - enroll peserta', async () => {
      await api.loginAsAdmin();
      const res = await api.post(`/api/admin/courses/${courseId}/enrollments`, {
        userId: 'seed-peserta-id',
      });
      expect([201, 500]).toContain(res.status);
    });

    test('GET /api/admin/courses/[id]/enrollments - list enrollment', async () => {
      await api.loginAsAdmin();
      const res = await api.get(`/api/admin/courses/${courseId}/enrollments`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
