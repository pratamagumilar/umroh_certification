import { test, expect } from '@playwright/test';
import { ApiHelper } from './helpers/api';

test.describe('Participant - Profile, Exams & Courses', () => {
  let api: ApiHelper;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  // ── Profile ──────────────────────────────────────────
  test.describe('Profile', () => {
    test('GET /api/profile - ambil profil', async () => {
      await api.loginAsPeserta();
      const res = await api.get('/api/profile');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email');
      expect(res.body.role).toBe('PESERTA');
    });

    test('PUT /api/profile - update profil', async () => {
      await api.loginAsPeserta();
      const res = await api.put('/api/profile', {
        name: 'Peserta Updated',
        phone: '081234567890',
      });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Peserta Updated');
    });

    test('PUT /api/profile - gagal tanpa nama', async () => {
      await api.loginAsPeserta();
      const res = await api.put('/api/profile', { phone: '081234567890' });
      expect(res.status).toBe(400);
    });
  });

  // ── Participating Exams ──────────────────────────────
  test.describe('Participating in Exams', () => {
    test('GET /api/exams/active - list ujian aktif', async () => {
      await api.loginAsPeserta();
      const res = await api.get('/api/exams/active');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/exams/[id]/start - mulai ujian (absensi)', async () => {
      await api.loginAsAdmin();

      const startTime = new Date(Date.now() - 3600000).toISOString();
      const examRes = await api.post('/api/admin/exams', {
        title: `Ujian Aktif ${Date.now()}`,
        startTime,
        durationMinutes: 120,
      });
      const activeExamId = examRes.body.exam.id;

      const bankRes = await api.post('/api/admin/question-banks', {
        title: `Bank Soal Ujian ${Date.now()}`,
      });
      const bankId = bankRes.body.id;

      const qRes = await api.post(`/api/admin/question-banks/${bankId}/questions`, {
        type: 'PG', text: 'Test?',
        options: JSON.stringify({ A: 'a', B: 'b', C: 'c', D: 'd' }),
        correctAnswer: 'A',
      });

      await api.post(`/api/admin/exams/${activeExamId}/questions`, {
        questionIds: [qRes.body.question.id],
      });

      await api.loginAsPeserta();
      const res = await api.post(`/api/exams/${activeExamId}/start`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('berhasil dimulai');
    });

    test('GET /api/exams/[id]/take - ambil soal ujian', async () => {
      await api.loginAsAdmin();

      const startTime = new Date(Date.now() - 3600000).toISOString();
      const examRes = await api.post('/api/admin/exams', {
        title: `Ujian Take ${Date.now()}`,
        startTime,
        durationMinutes: 120,
      });
      const examId = examRes.body.exam.id;

      const bankRes = await api.post('/api/admin/question-banks', {
        title: `Bank Take ${Date.now()}`,
      });
      const qRes = await api.post(`/api/admin/question-banks/${bankRes.body.id}/questions`, {
        type: 'PG', text: 'Test Take?',
        options: JSON.stringify({ A: 'a', B: 'b', C: 'c', D: 'd' }),
        correctAnswer: 'A',
      });
      await api.post(`/api/admin/exams/${examId}/questions`, {
        questionIds: [qRes.body.question.id],
      });

      await api.loginAsPeserta();
      await api.post(`/api/exams/${examId}/start`);

      const res = await api.get(`/api/exams/${examId}/take`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('exam');
      expect(res.body).toHaveProperty('questions');
      expect(Array.isArray(res.body.questions)).toBe(true);
    });

    test('POST /api/exams/[id]/take - submit jawaban ujian', async () => {
      await api.loginAsAdmin();

      const startTime = new Date(Date.now() - 3600000).toISOString();
      const examRes = await api.post('/api/admin/exams', {
        title: `Ujian Submit ${Date.now()}`,
        startTime,
        durationMinutes: 120,
        passingGrade: 70,
      });
      const examId = examRes.body.exam.id;

      const bankRes = await api.post('/api/admin/question-banks', {
        title: `Bank Submit ${Date.now()}`,
      });
      const qRes = await api.post(`/api/admin/question-banks/${bankRes.body.id}/questions`, {
        type: 'PG', text: 'Test Submit?',
        options: JSON.stringify({ A: 'a', B: 'b', C: 'c', D: 'd' }),
        correctAnswer: 'A',
      });
      await api.post(`/api/admin/exams/${examId}/questions`, {
        questionIds: [qRes.body.question.id],
      });

      await api.loginAsPeserta();
      await api.post(`/api/exams/${examId}/start`);

      const answers: Record<string, string> = {};
      answers[qRes.body.question.id] = 'A';
      const res = await api.post(`/api/exams/${examId}/take`, { answers });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('finalStatus');
    });

    test('POST /api/exams/[id]/start - gagal start ujian yang tidak aktif', async () => {
      await api.loginAsAdmin();
      const examRes = await api.post('/api/admin/exams', {
        title: `Ujian Nonaktif ${Date.now()}`,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 60,
        isActive: false,
      });
      const examId = examRes.body.exam.id;

      await api.loginAsPeserta();
      const res = await api.post(`/api/exams/${examId}/start`);
      expect(res.status).toBe(404);
    });
  });

  // ── Courses for Participants ─────────────────────────
  test.describe('Courses for Participants', () => {
    test('GET /api/courses - list courses', async () => {
      await api.loginAsPeserta();
      const res = await api.get('/api/courses');
      expect(res.status).toBe(200);
    });

    test('GET /api/courses/[id] - detail course', async () => {
      await api.loginAsAdmin();
      const courseRes = await api.post('/api/admin/courses', {
        title: `Course Peserta ${Date.now()}`,
      });
      const courseId = courseRes.body.course.id;

      await api.loginAsPeserta();
      const res = await api.get(`/api/courses/${courseId}`);
      expect(res.status).toBe(200);
    });
  });
});
