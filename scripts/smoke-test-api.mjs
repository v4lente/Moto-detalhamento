#!/usr/bin/env node
/**
 * Smoke Tests para APIs Criticas
 * 
 * Uso: node scripts/smoke-test-api.mjs [--base-url=URL]
 * 
 * Testa endpoints criticos para garantir integridade durante migracao.
 */

const BASE_URL = process.argv.find(arg => arg.startsWith('--base-url='))?.split('=')[1] || 'http://localhost:5000';

const tests = [
  {
    name: 'Health Check',
    endpoint: '/api/health',
    method: 'GET',
    validate: (data) => {
      if (data.status !== 'healthy') {
        throw new Error(`Expected status "healthy", got "${data.status}"`);
      }
      return true;
    }
  },
  {
    name: 'Products List',
    endpoint: '/api/products',
    method: 'GET',
    validate: (data) => {
      if (!Array.isArray(data)) {
        throw new Error('Expected array of products');
      }
      return true;
    }
  },
  {
    name: 'Site Settings',
    endpoint: '/api/settings',
    method: 'GET',
    validate: (data) => {
      if (typeof data !== 'object' || data === null) {
        throw new Error('Expected settings object');
      }
      return true;
    }
  }
];

async function runTest(test) {
  const url = `${BASE_URL}${test.endpoint}`;
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: test.method,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    test.validate(data);
    
    return {
      name: test.name,
      status: 'PASS',
      duration,
      endpoint: test.endpoint
    };
  } catch (error) {
    return {
      name: test.name,
      status: 'FAIL',
      duration: Date.now() - startTime,
      endpoint: test.endpoint,
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           SMOKE TESTS - APIs Criticas                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nBase URL: ${BASE_URL}\n`);
  
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
    
    const icon = result.status === 'PASS' ? '✓' : '✗';
    const color = result.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${color}${icon}${reset} ${result.name}`);
    console.log(`  Endpoint: ${result.endpoint}`);
    console.log(`  Duration: ${result.duration}ms`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  }
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  console.log('────────────────────────────────────────────────────────────');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('────────────────────────────────────────────────────────────');
  
  if (failed > 0) {
    console.log('\n❌ SMOKE TESTS FAILED\n');
    process.exit(1);
  } else {
    console.log('\n✅ ALL SMOKE TESTS PASSED\n');
    process.exit(0);
  }
}

// Verifica se o servidor esta acessivel antes de rodar os testes
async function checkServerAvailable() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('Verificando disponibilidade do servidor...\n');
  
  const isAvailable = await checkServerAvailable();
  
  if (!isAvailable) {
    console.error(`❌ Servidor nao esta acessivel em ${BASE_URL}`);
    console.error('   Certifique-se de que o servidor esta rodando.\n');
    process.exit(1);
  }
  
  await runAllTests();
}

main();
