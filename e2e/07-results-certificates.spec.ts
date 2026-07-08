import { test, expect } from '@playwright/test';
import { ApiHelper } from './helpers/api';

test.describe('Admin - Results, Certificates & Grade Adjustments', () => {
  let api: ApiHelper;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  test.describe('Exam Results', () => {
    test('GET /api/admin/results - list semua hasil ujian', async () => {
      await api.loginAsAdmin();
      const res = await api.get('/api/admin/results');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('user');
        expect(res.body[0]).toHaveProperty('exam');
        expect(res.body[0]).toHaveProperty('finalStatus');
      }
    });

    test('GET /api/admin/results?examId=xxx - filter by exam', async () => {
      await api.loginAsAdmin();
      const res = await api.get('/api/admin/results?examId=dummy-id');
      expect(res.status).toBe(200);
    });

    test('PUT /api/admin/results/[id] - update hasil ujian', async () => {
      await api.loginAsAdmin();
      const res = await api.put('/api/admin/results/nonexistent-id', {
        pgScore: 80,
        essayScore: 75,
        finalStatus: 'LULUS',
      });
      expect([200, 404]).toContain(res.status);
    });
  });

  test.describe('Certificates', () => {
    test('GET /api/admin/certificates - list sertifikat', async () => {
      await api.loginAsAdmin();
      const res = await api.get('/api/admin/certificates');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/admin/certificates/generate - generate manual sertifikat', async () => {
      await api.loginAsAdmin();
      const res = await api.post('/api/admin/certificates/generate', {
        userId: 'nonexistent',
        examId: 'nonexistent',
      });
      expect(res.status).toBe(500);
      expect(res.body.message).toBeTruthy();
    });
  });

  test.describe('Grade Adjustments', () => {
    test('POST /api/admin/grade-adjustments - buat penyesuaian nilai', async () => {
      await api.loginAsAdmin();
      const res = await api.post('/api/admin/grade-adjustments', {
        userId: 'some-user-id',
        courseId: 'some-course-id',
        originalScore: 70,
        adjustedScore: 80,
        reason: 'Kesalahan input nilai',
      });
      expect(res.status).toBe(201);
      expect(res.body.adjustment).toHaveProperty('originalScore');
      expect(res.body.adjustment.adjustedScore).toBe(80);
    });

    test('POST /api/admin/grade-adjustments - gagal parameter tidak lengkap', async () => {
      await api.loginAsAdmin();
      const res = await api.post('/api/admin/grade-adjustments', {
        userId: 'some-user-id',
      });
      expect(res.status).toBe(400);
    });
  });

  test.describe('Panitia Courses', () => {
    test('GET /api/panitia/courses - list courses sebagai panitia', async () => {
      await api.loginAsPanitia();
      const res = await api.get('/api/panitia/courses');
      expect(res.status).toBe(200);
    });

    test('PATCH /api/panitia/materials/[id] - update material', async () => {
      await api.loginAsAdmin();
      const matRes = await api.post('/api/admin/materials', {
        title: `Material Panitia ${Date.now()}`,
        pdfUrl: 'https://example.com/doc.pdf',
      });
      const matId = matRes.body.material?.id;

      if (matId) {
        await api.loginAsPanitia();
        const res = await api.patch(`/api/panitia/materials/${matId}`, {
          title: 'Updated by Panitia',
        });
        expect(res.status).toBe(200);
      }
    });
  });
});
