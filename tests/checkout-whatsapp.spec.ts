import { test, expect } from '@playwright/test';

test.describe('Checkout simplificado por WhatsApp', () => {
  test('inclui endereco opcional e confirma o envio antes de concluir o pedido', async ({ page }) => {
    let checkoutRequests = 0;
    await page.setViewportSize({ width: 1440, height: 1000 });

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
    await expect(page.getByTestId('input-delivery-address')).toBeVisible();
    await expect(page.getByTestId('input-delivery-address')).not.toHaveAttribute('required');

    await page.getByTestId('input-name').fill('Daniele');
    await expect(page.getByTestId('button-confirm-checkout')).toBeEnabled();
    await page.getByTestId('input-delivery-address').fill(
      'Rua das Flores, 123, Centro, São Paulo - SP, 01000-000'
    );
    await page.screenshot({
      path: '.context/artifacts/checkout-whatsapp-address.png',
      fullPage: true,
    });

    const whatsappPagePromise = page.waitForEvent('popup');
    await page.getByTestId('button-confirm-checkout').click();
    const whatsappPage = await whatsappPagePromise;
    await expect.poll(() => new URL(whatsappPage.url()).searchParams.get('phone')).toBe('5511988887777');

    await expect(page.getByTestId('whatsapp-confirmation-step')).toBeVisible();
    await expect(page.getByTestId('button-reopen-whatsapp')).toBeVisible();
    expect(page.url()).toContain('/produtos');

    expect(checkoutRequests).toBe(0);
    const whatsappMessage = new URL(whatsappPage.url()).searchParams.get('text') || '';
    expect(whatsappMessage).toContain('*Novo Pedido*');
    expect(whatsappMessage).toContain('*Cliente:* Daniele');
    expect(whatsappMessage).not.toContain('*Telefone:*');
    expect(whatsappMessage).toContain(
      '*Endereço:* Rua das Flores, 123, Centro, São Paulo - SP, 01000-000'
    );
    expect(whatsappMessage).toContain('Produto Teste');
    expect(whatsappMessage).toContain('*Total: R$ 12,00*');

    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'))).toHaveLength(1);

    await page.getByTestId('button-whatsapp-sent').click();

    await expect(page.getByTestId('checkout-success-feedback')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Pedido realizado com sucesso/ })).toBeVisible();
    await expect(page.getByText(/encaminhado para nossa equipe de vendas/)).toBeVisible();
    await expect(page.getByText(/transportadora ou SEDEX/)).toBeVisible();
    await expect(page.getByText('Daniel Valente Detail Store')).toBeVisible();
    await page.screenshot({
      path: '.context/artifacts/checkout-whatsapp-success.png',
      fullPage: true,
    });
    await expect.poll(
      () => page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]').length)
    ).toBe(0);
  });
});
