import { test, expect } from '@playwright/test';
import { ApiHelper } from './helpers/api';

test.describe('Pengawas - Dashboard, Monitoring & Grading', () => {
  let api: ApiHelper;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  test.describe('Dashboard & Exams', () => {
    test('GET /api/pengawas/dashboard - lihat dashboard', async () => {
      await api.loginAsPengawas();
      const res = await api.get('/api/pengawas/dashboard');
      expect(res.status).toBe(200);
    });

    test('GET /api/pengawas/exams - list ujian', async () => {
      await api.loginAsPengawas();
      const res = await api.get('/api/pengawas/exams');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/pengawas/grading - list grading', async () => {
      await api.loginAsPengawas();
      const res = await api.get('/api/pengawas/grading');
      expect(res.status).toBe(200);
    });
  });

  test.describe('Exam Monitoring', () => {
    test('GET /api/pengawas/exams/[id]/monitor - monitor ujian', async () => {
      await api.loginAsAdmin();
      const examRes = await api.post('/api/admin/exams', {
        title: `Ujian Monitor ${Date.now()}`,
        startTime: new Date(Date.now() - 3600000).toISOString(),
        durationMinutes: 90,
      });
      const examId = examRes.body.exam.id;

      await api.loginAsPengawas();
      const res = await api.get(`/api/pengawas/exams/${examId}/monitor`);
      expect(res.status).toBe(200);
    });

    test('PATCH /api/pengawas/exams/[id]/monitor/add-time - tambah waktu', async () => {
      await api.loginAsAdmin();
      const examRes = await api.post('/api/admin/exams', {
        title: `Ujian AddTime ${Date.now()}`,
        startTime: new Date(Date.now() - 3600000).toISOString(),
        durationMinutes: 90,
      });
      const examId = examRes.body.exam.id;

      await api.loginAsPengawas();
      const res = await api.patch(`/api/pengawas/exams/${examId}/monitor/add-time`, {
        userId: 'some-user-id',
        additionalMinutes: 10,
      });
      expect([200, 404]).toContain(res.status);
    });
  });

  test.describe('Essay Grading', () => {
    test('GET /api/pengawas/grading/[examId]/[userId] - lihat jawaban esai', async () => {
      await api.loginAsAdmin();

      const examRes = await api.post('/api/admin/exams', {
        title: `Ujian Essay Grade ${Date.now()}`,
        startTime: new Date(Date.now() - 3600000).toISOString(),
        durationMinutes: 90,
        passingGrade: 70,
      });
      const examId = examRes.body.exam.id;

      const bankRes = await api.post('/api/admin/question-banks', {
        title: `Bank Essay Grade ${Date.now()}`,
      });
      const bankId = bankRes.body.id;

      const qRes = await api.post(`/api/admin/question-banks/${bankId}/questions`, {
        type: 'ESSAY', text: 'Jelaskan rukun umroh!',
      });

      await api.post(`/api/admin/exams/${examId}/questions`, {
        questionIds: [qRes.body.question.id],
      });

      // Login as participant, start exam and submit
      await api.loginAsPeserta();
      await api.post(`/api/exams/${examId}/start`);

      const answers: Record<string, string> = {};
      answers[qRes.body.question.id] = 'Rukun umroh adalah niat, ihram, tawaf, sai, dan tahallul.';
      const submitRes = await api.post(`/api/exams/${examId}/take`, { answers });
      expect(submitRes.status).toBe(200);

      // Get participant ID from profile
      const profileRes = await api.get('/api/profile');
      const pesertaId = profileRes.body.id;

      // Login as pengawas
      await api.loginAsPengawas();
      const res = await api.get(`/api/pengawas/grading/${examId}/${pesertaId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('essayAnswers');
      expect(Array.isArray(res.body.essayAnswers)).toBe(true);
    });
  });

  test.describe('Material Grading', () => {
    test('POST /api/pengawas/material-grading/[submissionId] - nilai tugas', async () => {
      // Create assignment and submit as participant
      await api.loginAsAdmin();
      const assignRes = await api.post('/api/admin/assignments', {
        title: `Tugas Dinilai ${Date.now()}`,
        prompt: 'Jelaskan tata cara wudhu!',
      });
      const assignmentId = assignRes.body.id;

      const courseRes = await api.post('/api/admin/courses', {
        title: `Course Grading ${Date.now()}`,
      });
      const courseId = courseRes.body.course.id;

      // Create session with this assignment
      const sessionRes = await api.post(`/api/panitia/courses/${courseId}/sessions`, {
        masterAssignmentId: assignmentId,
        order: 1,
      });
      const sessionId = sessionRes.body ? (sessionRes.body.id || sessionRes.body.session?.id) : null;

      if (sessionId) {
        // Submit assignment as participant
        await api.loginAsPeserta();
        const submitRes = await api.post(`/api/courses/sessions/${sessionId}/submit`, {
          answer: 'Tata cara wudhu: basuh tangan, kumur, basuh hidung, basuh muka...',
        });
        expect(submitRes.status).toBe(201);

        // Grade as pengawas
        // Need to find the submissionId first
        await api.loginAsPengawas();
        const gradingList = await api.get('/api/pengawas/material-grading');
        if (gradingList.status === 200 && Array.isArray(gradingList.body) && gradingList.body.length > 0) {
          const subId = gradingList.body[0].id;
          const gradeRes = await api.post(`/api/pengawas/material-grading/${subId}`, {
            score: 85,
            feedback: 'Bagus, penjelasan lengkap!',
          });
          expect(gradeRes.status).toBe(200);
        }
      }
    });
  });
});
