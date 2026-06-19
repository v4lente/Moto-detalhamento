import { test, expect } from '@playwright/test';

test.describe('Admin request budget', () => {
  test('dashboard nao dispara chamadas de variacoes de produtos', async ({ page }) => {
    const variationRequests: string[] = [];

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-admin', username: 'admin@example.com' }),
      });
    });

    page.on('request', (request) => {
      if (request.url().includes('/variations')) {
        variationRequests.push(request.url());
      }
    });

    await page.goto('/admin');
    await expect(page.getByTestId('tab-dashboard')).toBeVisible();
    await page.waitForTimeout(500);

    expect(variationRequests).toEqual([]);
  });
});
