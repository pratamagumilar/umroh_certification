import { test, expect } from '@playwright/test';
import { ApiHelper } from './helpers/api';

test.describe('Authentication & Authorization', () => {
  let api: ApiHelper;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  test('ADMIN: login sukses dan redirect ke dashboard admin', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@umroh.test');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');
    expect(page.url()).toContain('/admin/dashboard');
  });

  test('PESERTA: login sukses dan redirect ke dashboard peserta', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'peserta@umroh.test');
    await page.fill('input[name="password"]', 'peserta123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('login gagal dengan password salah', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@umroh.test');
    await page.fill('input[name="password"]', 'salahpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email atau password salah')).toBeVisible();
  });

  test('PESERTA tidak bisa akses halaman admin (redirect ke login)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'peserta@umroh.test');
    await page.fill('input[name="password"]', 'peserta123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('/admin/dashboard');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('ADMIN bisa akses endpoint /api/admin/users', async ({ request }) => {
    const api = new ApiHelper(request);
    await api.login('admin@umroh.test', 'admin123');
    const res = await api.get('/api/admin/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('PESERTA tidak bisa akses endpoint admin (401)', async ({ request }) => {
    const api = new ApiHelper(request);
    await api.login('peserta@umroh.test', 'peserta123');
    await api.expectStatus('/api/admin/users', 'GET', 401);
  });

  test('unauthenticated request ditolak (401)', async ({ request }) => {
    const api = new ApiHelper(request);
    await api.expectStatus('/api/admin/users', 'GET', 401);
  });
});
