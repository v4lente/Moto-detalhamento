import { test, expect } from '@playwright/test';

test.describe('Checkout simplificado por WhatsApp', () => {
  test('envia pedido anonimo direto para o WhatsApp sem chamar checkout backend', async ({ page }) => {
    let checkoutRequests = 0;

    await page.route('**/api/settings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          whatsappNumber: '55 (11) 98888-7777',
          siteName: 'Daniel Valente',
        }),
      });
    });

    await page.route('**/api/customer/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await page.route('**/api/stripe/config', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Stripe not configured' }),
      });
    });

    await page.route('**/api/products**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/checkout', async (route) => {
      checkoutRequests += 1;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'backend checkout should not be called' }),
      });
    });

    await page.route('https://wa.me/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><html><body>WhatsApp</body></html>',
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem(
        'cart',
        JSON.stringify([
          {
            id: 1,
            name: 'Produto Teste',
            image: '/placeholder.png',
            price: 12,
            quantity: 1,
            inStock: true,
          },
        ])
      );
    });

    await page.goto('/produtos');
    await page.getByRole('button', { name: '1' }).click();
    await page.getByRole('button', { name: /Finalizar pelo WhatsApp/ }).click();

    await expect(page.getByTestId('input-name')).toBeVisible();
    await expect(page.getByTestId('input-phone')).toHaveCount(0);
    await expect(page.getByTestId('input-email')).toHaveCount(0);
    await expect(page.getByTestId('link-customer-login')).toHaveCount(0);

    await page.getByTestId('input-name').fill('Daniele');
    await page.getByTestId('button-confirm-checkout').click();

    await page.waitForURL(/https:\/\/wa\.me\/5511988887777/);

    expect(checkoutRequests).toBe(0);
    expect(decodeURIComponent(page.url())).toContain('*Novo Pedido*');
    expect(decodeURIComponent(page.url())).toContain('*Cliente:* Daniele');
    expect(decodeURIComponent(page.url())).not.toContain('*Telefone:*');
    expect(decodeURIComponent(page.url())).toContain('Produto Teste');
    expect(decodeURIComponent(page.url())).toContain('*Total: R$ 12,00*');
  });
});
