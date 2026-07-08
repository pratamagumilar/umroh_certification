import { test as setup, expect } from '@playwright/test';

setup.describe('Global Setup - Seed Test Data', () => {
  setup('ensure test users exist via seed API', async ({ request }) => {
    const res = await request.post('/api/auth/callback/credentials', {
      data: { email: 'admin@umroh.test', password: 'admin123', csrfToken: 'test' },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    expect(res.ok()).toBeTruthy();
  });
});
