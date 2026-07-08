import { test, expect } from '@playwright/test';
import { ApiHelper } from './helpers/api';

test.describe('Admin - User Management', () => {
  let api: ApiHelper;
  let createdUserId: string;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  test('GET /api/admin/users - list semua users', async () => {
    await api.loginAsAdmin();
    const res = await api.get('/api/admin/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('email');
      expect(res.body[0]).toHaveProperty('role');
    }
  });

  test('GET /api/admin/users?role=PESERTA - filter by role', async () => {
    await api.loginAsAdmin();
    const res = await api.get('/api/admin/users?role=PESERTA');
    expect(res.status).toBe(200);
    for (const user of res.body) {
      expect(user.role).toBe('PESERTA');
    }
  });

  test('POST /api/admin/users - buat user baru', async () => {
    await api.loginAsAdmin();
    const email = `testuser_${Date.now()}@umroh.test`;
    const res = await api.post('/api/admin/users', {
      name: 'Test User',
      email,
      password: 'test123',
      role: 'PESERTA',
      phone: '08123456789',
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe('PESERTA');
    createdUserId = res.body.user.id;
  });

  test('POST /api/admin/users - gagal duplikat email', async () => {
    await api.loginAsAdmin();
    const res = await api.post('/api/admin/users', {
      name: 'Admin',
      email: 'admin@umroh.test',
      password: 'admin123',
      role: 'ADMIN',
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('sudah terdaftar');
  });

  test('POST /api/admin/users - gagal tanpa field wajib', async () => {
    await api.loginAsAdmin();
    const res = await api.post('/api/admin/users', { name: 'Test' });
    expect(res.status).toBe(400);
  });

  test('POST /api/admin/users - gagal role tidak valid', async () => {
    await api.loginAsAdmin();
    const res = await api.post('/api/admin/users', {
      name: 'Test',
      email: 'test@test.com',
      password: 'test123',
      role: 'SUPERADMIN',
    });
    expect(res.status).toBe(400);
  });
});
