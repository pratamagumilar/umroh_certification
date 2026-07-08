import { test, expect } from '@playwright/test';
import { ApiHelper } from './helpers/api';

test.describe('Admin - Exam Management', () => {
  let api: ApiHelper;
  let examId: string;
  let questionBankId: string;
  let questionId: string;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  // ── Question Bank ────────────────────────────────────
  test.describe('Question Banks', () => {
    test('POST /api/admin/question-banks - buat bank soal', async () => {
      await api.loginAsAdmin();
      const res = await api.post('/api/admin/question-banks', {
        title: `Bank Soal Test ${Date.now()}`,
        description: 'Deskripsi bank soal untuk testing',
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('title');
      questionBankId = res.body.id;
    });

    test('GET /api/admin/question-banks - list bank soal', async () => {
      await api.loginAsAdmin();
      const res = await api.get('/api/admin/question-banks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('_count');
      }
    });

    test('POST /api/admin/question-banks - gagal tanpa title', async () => {
      await api.loginAsAdmin();
      const res = await api.post('/api/admin/question-banks', {});
      expect(res.status).toBe(400);
    });

    test('POST /api/admin/question-banks/[id]/questions - buat soal PG', async () => {
      await api.loginAsAdmin();
      const bankRes = await api.post('/api/admin/question-banks', {
        title: `Bank Soal PG ${Date.now()}`,
      });
      const bankId = bankRes.body.id;

      const res = await api.post(`/api/admin/question-banks/${bankId}/questions`, {
        type: 'PG',
        text: 'Apa ibu kota Indonesia?',
        options: JSON.stringify({ A: 'Jakarta', B: 'Surabaya', C: 'Bandung', D: 'Medan' }),
        correctAnswer: 'A',
      });
      expect(res.status).toBe(201);
      expect(res.body.question.type).toBe('PG');
      expect(res.body.question.correctAnswer).toBe('A');
      questionId = res.body.question.id;
    });

    test('POST /api/admin/question-banks/[id]/questions - buat soal ESSAY', async () => {
      await api.loginAsAdmin();
      const bankRes = await api.post('/api/admin/question-banks', {
        title: `Bank Soal Essay ${Date.now()}`,
      });
      const bankId = bankRes.body.id;

      const res = await api.post(`/api/admin/question-banks/${bankId}/questions`, {
        type: 'ESSAY',
        text: 'Jelaskan rukun umroh!',
      });
      expect(res.status).toBe(201);
      expect(res.body.question.type).toBe('ESSAY');
    });

    test('POST /api/admin/question-banks/[id]/questions - gagal PG tanpa options', async () => {
      await api.loginAsAdmin();
      const bankRes = await api.post('/api/admin/question-banks', {
        title: `Bank Soal Gagal ${Date.now()}`,
      });

      const res = await api.post(`/api/admin/question-banks/${bankRes.body.id}/questions`, {
        type: 'PG',
        text: 'Test?',
      });
      expect(res.status).toBe(400);
    });
  });

  // ── Exam CRUD ────────────────────────────────────────
  test.describe('Exam CRUD', () => {
    test('POST /api/admin/exams - buat ujian', async () => {
      await api.loginAsAdmin();
      const startTime = new Date(Date.now() + 86400000).toISOString();
      const res = await api.post('/api/admin/exams', {
        title: `Ujian Test ${Date.now()}`,
        description: 'Deskripsi ujian untuk testing',
        startTime,
        durationMinutes: 90,
      });
      expect(res.status).toBe(201);
      expect(res.body.exam).toHaveProperty('id');
      expect(res.body.exam.title).toContain('Ujian Test');
      examId = res.body.exam.id;
    });

    test('GET /api/admin/exams - list ujian', async () => {
      await api.loginAsAdmin();
      const res = await api.get('/api/admin/exams');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('_count');
      }
    });

    test('GET /api/admin/exams/[id] - detail ujian', async () => {
      await api.loginAsAdmin();
      const res = await api.get(`/api/admin/exams/${examId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('questions');
    });

    test('PUT /api/admin/exams/[id] - update ujian', async () => {
      await api.loginAsAdmin();
      const res = await api.put(`/api/admin/exams/${examId}`, {
        title: `Ujian Updated ${Date.now()}`,
        durationMinutes: 120,
      });
      expect(res.status).toBe(200);
      expect(res.body.exam.title).toContain('Ujian Updated');
    });

    test('DELETE /api/admin/exams/[id] - hapus ujian', async () => {
      await api.loginAsAdmin();
      const createRes = await api.post('/api/admin/exams', {
        title: `Ujian Dihapus ${Date.now()}`,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 60,
      });
      const idToDelete = createRes.body.exam.id;

      const res = await api.delete(`/api/admin/exams/${idToDelete}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('berhasil dihapus');
    });

    test('POST /api/admin/exams - gagal tanpa field wajib', async () => {
      await api.loginAsAdmin();
      const res = await api.post('/api/admin/exams', { title: 'Test' });
      expect(res.status).toBe(400);
    });
  });

  // ── Exam Questions Mapping ───────────────────────────
  test.describe('Exam Questions Mapping', () => {
    test('POST /api/admin/exams/[id]/questions - tambah soal ke ujian', async () => {
      await api.loginAsAdmin();

      const bankRes = await api.post('/api/admin/question-banks', {
        title: `Bank Mapping ${Date.now()}`,
      });
      const bankId = bankRes.body.id;

      const q1 = await api.post(`/api/admin/question-banks/${bankId}/questions`, {
        type: 'PG', text: 'Soal 1?',
        options: JSON.stringify({ A: 'a', B: 'b', C: 'c', D: 'd' }),
        correctAnswer: 'A',
      });
      const q2 = await api.post(`/api/admin/question-banks/${bankId}/questions`, {
        type: 'ESSAY', text: 'Soal Essay 1?',
      });

      const examRes = await api.post('/api/admin/exams', {
        title: `Ujian Mapping ${Date.now()}`,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 60,
      });
      const examId2 = examRes.body.exam.id;

      const res = await api.post(`/api/admin/exams/${examId2}/questions`, {
        questionIds: [q1.body.question.id, q2.body.question.id],
      });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('berhasil disimpan');
    });

    test('GET /api/admin/exams/[id]/questions - lihat soal ujian', async () => {
      await api.loginAsAdmin();
      const res = await api.get(`/api/admin/exams/${examId}/questions`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/admin/exams/[id]/questions - gagal dengan questionIds kosong', async () => {
      await api.loginAsAdmin();
      const res = await api.post(`/api/admin/exams/${examId}/questions`, { questionIds: [] });
      expect(res.status).toBe(400);
    });
  });
});
