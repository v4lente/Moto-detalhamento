import { test, expect } from '@playwright/test';

test.describe('API degradada (sem DATABASE_URL)', () => {
  test('health retorna unhealthy quando banco indisponível', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();

    if (response.status() === 200 && body.status === 'healthy') {
      expect(body.database).toMatch(/^(connected|no_data)$/);
      return;
    }

    expect(response.status()).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.error).toBeTruthy();
  });

  test('rotas de dados retornam erro sem crash do servidor', async ({ request }) => {
    const health = await request.get('/api/health');
    const healthBody = await health.json();

    if (health.status() === 200 && healthBody.status === 'healthy') {
      test.skip();
    }

    const endpoints = ['/api/products', '/api/settings'];
    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBeGreaterThanOrEqual(500);
      const body = await response.json();
      expect(body.error).toBeTruthy();
    }
  });

  test('endpoint agregado de variacoes exige autenticacao', async ({ request }) => {
    const response = await request.get('/api/admin/products/variation-counts');
    expect(response.status()).toBe(401);
  });
});
