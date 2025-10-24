#!/usr/bin/env node
/**
 * Automated Test Runner - Basic Connectivity & Build Verification
 * This script performs automated checks before manual testing
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://185.136.159.142:8080',
  timeout: 5000
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

// Helper Functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, fn) {
  results.total++;
  process.stdout.write(`  Testing: ${name}... `);
  try {
    const result = fn();
    if (result === true || result === undefined) {
      log('✅ PASS', 'green');
      results.passed++;
      return true;
    } else {
      log('❌ FAIL', 'red');
      results.failed++;
      results.errors.push({ test: name, error: result });
      return false;
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
    results.failed++;
    results.errors.push({ test: name, error: error.message });
    return false;
  }
}

function checkUrl(url, description) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, (res) => {
      resolve({
        success: res.statusCode >= 200 && res.statusCode < 400,
        status: res.statusCode,
        message: `${description} returned ${res.statusCode}`
      });
    });
    
    request.on('error', (error) => {
      resolve({
        success: false,
        status: 0,
        message: `${description} error: ${error.message}`
      });
    });
    
    request.setTimeout(CONFIG.timeout, () => {
      request.destroy();
      resolve({
        success: false,
        status: 0,
        message: `${description} timeout`
      });
    });
  });
}

async function runTests() {
  log('\n' + '='.repeat(70), 'cyan');
  log('  AUTOMATED TEST SUITE - PRE-MANUAL TESTING VERIFICATION', 'bright');
  log('='.repeat(70) + '\n', 'cyan');

  // Test Suite 1: File System & Build Verification
  log('📁 Test Suite 1: File System & Build Verification', 'blue');
  log('-'.repeat(70), 'cyan');

  test('package.json exists', () => {
    return fs.existsSync(path.join(__dirname, 'package.json'));
  });

  test('tsconfig.json exists', () => {
    return fs.existsSync(path.join(__dirname, 'tsconfig.json'));
  });

  test('vite.config.ts exists', () => {
    return fs.existsSync(path.join(__dirname, 'vite.config.ts'));
  });

  test('src directory exists', () => {
    return fs.existsSync(path.join(__dirname, 'src'));
  });

  test('node_modules exists', () => {
    const exists = fs.existsSync(path.join(__dirname, 'node_modules'));
    if (!exists) {
      log('    ⚠️  Run: npm install', 'yellow');
      results.warnings++;
    }
    return exists;
  });

  // Test Suite 2: TypeScript Compilation
  log('\n📝 Test Suite 2: TypeScript Compilation', 'blue');
  log('-'.repeat(70), 'cyan');

  test('TypeScript compilation (dry run)', () => {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe', timeout: 30000 });
      return true;
    } catch (error) {
      return `TypeScript errors exist (this may be okay if warnings only)`;
    }
  });

  // Test Suite 3: Build Process
  log('\n🔨 Test Suite 3: Build Process', 'blue');
  log('-'.repeat(70), 'cyan');

  test('Production build succeeds', () => {
    try {
      execSync('npm run build', { stdio: 'pipe', timeout: 60000 });
      return true;
    } catch (error) {
      return `Build failed: ${error.message}`;
    }
  });

  test('dist directory created', () => {
    return fs.existsSync(path.join(__dirname, 'dist'));
  });

  test('dist/index.html exists', () => {
    return fs.existsSync(path.join(__dirname, 'dist', 'index.html'));
  });

  // Test Suite 4: Network Connectivity
  log('\n🌐 Test Suite 4: Network Connectivity', 'blue');
  log('-'.repeat(70), 'cyan');

  const backendCheck = await checkUrl(`${CONFIG.backendUrl}/docs`, 'Backend API');
  test('Backend API is accessible', () => {
    if (backendCheck.success) {
      return true;
    } else {
      log(`    ⚠️  ${backendCheck.message}`, 'yellow');
      results.warnings++;
      return `Backend may not be running`;
    }
  });

  const frontendCheck = await checkUrl(CONFIG.frontendUrl, 'Frontend Dev Server');
  test('Frontend dev server is running', () => {
    if (frontendCheck.success) {
      return true;
    } else {
      log(`    ⚠️  ${frontendCheck.message}`, 'yellow');
      log('    💡 Run: npm run dev', 'yellow');
      results.warnings++;
      return `Frontend not running - start with 'npm run dev'`;
    }
  });

  // Test Suite 5: Critical Files Check
  log('\n📄 Test Suite 5: Critical Component Files', 'blue');
  log('-'.repeat(70), 'cyan');

  const criticalFiles = [
    'src/App.tsx',
    'src/main.tsx',
    'src/pages/Dashboard.tsx',
    'src/pages/Brokers.tsx',
    'src/pages/Users.tsx',
    'src/components/BrokerModal.tsx',
    'src/components/GroupModal.tsx',
    'src/components/RoleModal.tsx',
    'src/services/api.ts',
    'src/contexts/AuthContext.tsx'
  ];

  criticalFiles.forEach(file => {
    test(`${file} exists`, () => {
      return fs.existsSync(path.join(__dirname, file));
    });
  });

  // Test Suite 6: Configuration Files
  log('\n⚙️  Test Suite 6: Configuration Validation', 'blue');
  log('-'.repeat(70), 'cyan');

  test('Tailwind config exists', () => {
    return fs.existsSync(path.join(__dirname, 'tailwind.config.js'));
  });

  test('PostCSS config exists', () => {
    return fs.existsSync(path.join(__dirname, 'postcss.config.js'));
  });

  test('Vite proxy configured', () => {
    const viteConfig = fs.readFileSync(path.join(__dirname, 'vite.config.ts'), 'utf8');
    return viteConfig.includes('proxy');
  });

  // Test Results Summary
  log('\n' + '='.repeat(70), 'cyan');
  log('  TEST RESULTS SUMMARY', 'bright');
  log('='.repeat(70), 'cyan');

  const passRate = ((results.passed / results.total) * 100).toFixed(2);
  
  log(`\n  Total Tests:     ${results.total}`);
  log(`  ✅ Passed:       ${results.passed}`, 'green');
  log(`  ❌ Failed:       ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
  log(`  ⚠️  Warnings:     ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'reset');
  log(`  📊 Pass Rate:    ${passRate}%\n`, passRate >= 80 ? 'green' : 'yellow');

  if (results.errors.length > 0) {
    log('❌ Failed Tests:', 'red');
    results.errors.forEach((error, index) => {
      log(`   ${index + 1}. ${error.test}`, 'yellow');
      log(`      ${error.error}`, 'reset');
    });
    log('');
  }

  // Final Recommendations
  log('='.repeat(70), 'cyan');
  log('  RECOMMENDATIONS', 'bright');
  log('='.repeat(70) + '\n', 'cyan');

  if (results.failed === 0 && results.warnings === 0) {
    log('  ✅ All automated checks passed!', 'green');
    log('  ✅ Build is ready for manual testing', 'green');
    log('  📋 Proceed with COMPREHENSIVE_TESTING_CHECKLIST.md\n', 'cyan');
  } else if (results.failed === 0 && results.warnings > 0) {
    log('  ⚠️  All tests passed with warnings', 'yellow');
    log('  ⚠️  Review warnings before manual testing', 'yellow');
    log('  📋 Can proceed with manual testing checklist\n', 'cyan');
  } else {
    log('  ❌ Some tests failed', 'red');
    log('  ❌ Fix failing tests before manual testing', 'red');
    log('  💡 Review error messages above\n', 'yellow');
  }

  log('Next Steps:', 'bright');
  if (frontendCheck.success) {
    log(`  1. Open browser: ${CONFIG.frontendUrl}`, 'cyan');
  } else {
    log(`  1. Start dev server: npm run dev`, 'yellow');
  }
  log(`  2. Open: COMPREHENSIVE_TESTING_CHECKLIST.md`, 'cyan');
  log(`  3. Begin manual testing`, 'cyan');
  log(`  4. Document results in the checklist\n`, 'cyan');

  log('='.repeat(70) + '\n', 'cyan');

  // Exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test runner error: ${error.message}\n`, 'red');
  process.exit(1);
});
