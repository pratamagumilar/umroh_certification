import { APIRequestContext, expect } from '@playwright/test';

export class ApiHelper {
  constructor(private request: APIRequestContext) {}

  async login(email: string, password: string) {
    const res = await this.request.post('/api/auth/callback/credentials', {
      data: { email, password, csrfToken: 'test' },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res;
  }

  async loginAsAdmin() {
    return this.login('admin@umroh.test', 'admin123');
  }

  async loginAsPengawas() {
    return this.login('pengawas@umroh.test', 'pengawas123');
  }

  async loginAsPeserta() {
    return this.login('peserta@umroh.test', 'peserta123');
  }

  async loginAsPanitia() {
    return this.login('panitia@umroh.test', 'panitia123');
  }

  async get(path: string) {
    const res = await this.request.get(path);
    return { status: res.status(), body: await res.json() };
  }

  async post(path: string, data?: Record<string, unknown>) {
    const res = await this.request.post(path, { data });
    return { status: res.status(), body: await res.json() };
  }

  async put(path: string, data?: Record<string, unknown>) {
    const res = await this.request.put(path, { data });
    return { status: res.status(), body: await res.json() };
  }

  async patch(path: string, data?: Record<string, unknown>) {
    const res = await this.request.patch(path, { data });
    return { status: res.status(), body: await res.json() };
  }

  async delete(path: string) {
    const res = await this.request.delete(path);
    return { status: res.status(), body: await res.json() };
  }

  async expectStatus(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', expectedStatus: number, data?: Record<string, unknown>) {
    let res: { status: number; body: any };
    switch (method) {
      case 'GET': res = await this.get(path); break;
      case 'POST': res = await this.post(path, data); break;
      case 'PUT': res = await this.put(path, data); break;
      case 'PATCH': res = await this.patch(path, data); break;
      case 'DELETE': res = await this.delete(path); break;
    }
    expect(res.status).toBe(expectedStatus);
    return res;
  }
}
