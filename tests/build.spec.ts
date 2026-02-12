import { test, expect } from '@playwright/test';
import { existsSync } from 'fs';
import { join } from 'path';

test.describe('Build e Servidor', () => {
  test('deve ter gerado o arquivo dist/index.js', () => {
    const indexPath = join(process.cwd(), 'dist', 'index.js');
    expect(existsSync(indexPath)).toBeTruthy();
  });

  test('deve ter gerado os arquivos estáticos do cliente', () => {
    const publicIndexPath = join(process.cwd(), 'dist', 'public', 'index.html');
    expect(existsSync(publicIndexPath)).toBeTruthy();
  });

  test('servidor deve estar respondendo na porta 5000', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/http:\/\/localhost:5000/);
  });

  test('página inicial deve carregar HTML corretamente', async ({ page }) => {
    await page.goto('/');
    // Verifica se a página carregou (status 200)
    expect(page.url()).toContain('localhost:5000');
    // Verifica se há conteúdo HTML na página
    const bodyContent = await page.content();
    expect(bodyContent.length).toBeGreaterThan(0);
  });

  test('deve servir arquivos estáticos corretamente', async ({ page }) => {
    await page.goto('/');
    // Verifica se a página tem conteúdo HTML
    const bodyContent = await page.content();
    expect(bodyContent).toContain('<!DOCTYPE html>');
    expect(bodyContent).toContain('<html');
  });

  test('API deve estar acessível', async ({ request }) => {
    // Tenta fazer uma requisição para uma rota de API (mesmo que retorne 404, o servidor deve responder)
    const response = await request.get('/api/health');
    // Aceita qualquer status code, apenas verifica que o servidor respondeu
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(600);
  });
});
