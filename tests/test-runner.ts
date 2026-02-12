/**
 * 자동화된 테스트 러너
 * 
 * 실행: npx tsx src/tests/test-runner.ts
 */

import { testCases } from './test-cases';
import { validateTestResult, TestResult } from './validators';
import { simulateAllStrategies, findBestRefinancingOption } from '../lib/services/simulation-service';
import * as fs from 'fs';
import * as path from 'path';

// 색상 출력 헬퍼
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 개별 테스트 실행
 */
async function runSingleTest(testCase: any): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // 시뮬레이션 실행
    const bestSimulation = findBestRefinancingOption(
      testCase.currentDebt,
      testCase.loanProducts,
      testCase.hasSalaryTransfer
    );

    if (!bestSimulation) {
      return validateTestResult(
        testCase,
        { success: false, error: '적합한 대출 상품이 없습니다.' },
        Date.now() - startTime
      );
    }

    const bestProduct = {
      bankName: bestSimulation.recommendedProduct.bankName,
      productName: bestSimulation.recommendedProduct.productName,
      baseRate: bestSimulation.newRate,
      additionalRate: 0,
      salaryTransferDiscount: 0,
      userOtherDiscount: 0,
    };

    const strategyResult = simulateAllStrategies(
      testCase.currentDebt,
      bestProduct,
      testCase.hasSalaryTransfer
    );

    const result = {
      success: true,
      bestStrategy: strategyResult.bestStrategy.strategyType,
      strategies: strategyResult.strategies,
      recommendedProduct: bestSimulation.recommendedProduct,
      newRate: bestSimulation.newRate,
      currentRate: testCase.currentDebt.interestRate,
    };

    return validateTestResult(testCase, result, Date.now() - startTime);

  } catch (error) {
    return validateTestResult(
      testCase,
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      Date.now() - startTime
    );
  }
}

/**
 * 모든 테스트 실행
 */
async function runAllTests() {
  log('\n' + '='.repeat(80), 'bright');
  log('🧪 대환대출 시뮬레이터 자동 테스트 시작', 'cyan');
  log('='.repeat(80) + '\n', 'bright');

  const results: TestResult[] = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const testCase of testCases) {
    log(`\n📌 [${testCase.id}] ${testCase.name}`, 'blue');
    log(`   설명: ${testCase.description}`, 'reset');
    log(`   카테고리: ${testCase.category}`, 'reset');

    const result = await runSingleTest(testCase);
    results.push(result);

    if (result.passed) {
      passedCount++;
      log(`   ✅ PASSED (${result.executionTime}ms)`, 'green');
    } else {
      failedCount++;
      log(`   ❌ FAILED (${result.executionTime}ms)`, 'red');
      result.errors.forEach(error => log(`      ${error}`, 'red'));
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => log(`      ${warning}`, 'yellow'));
    }
  }

  // ============================================
  // 결과 요약
  // ============================================
  log('\n' + '='.repeat(80), 'bright');
  log('📊 테스트 결과 요약', 'cyan');
  log('='.repeat(80), 'bright');
  log(`총 테스트: ${results.length}개`, 'reset');
  log(`✅ 성공: ${passedCount}개`, 'green');
  log(`❌ 실패: ${failedCount}개`, 'red');
  log(`성공률: ${((passedCount / results.length) * 100).toFixed(1)}%\n`, 'bright');

  // ============================================
  // 카테고리별 통계
  // ============================================
  const categoryStats: Record<string, { passed: number; total: number }> = {};
  results.forEach(r => {
    const testCase = testCases.find(tc => tc.id === r.testId)!;
    if (!categoryStats[testCase.category]) {
      categoryStats[testCase.category] = { passed: 0, total: 0 };
    }
    categoryStats[testCase.category].total++;
    if (r.passed) categoryStats[testCase.category].passed++;
  });

  log('카테고리별 통계:', 'cyan');
  Object.entries(categoryStats).forEach(([category, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(0);
    log(`  ${category}: ${stats.passed}/${stats.total} (${rate}%)`, 'reset');
  });

  // ============================================
  // 실패한 테스트 상세
  // ============================================
  const failedResults = results.filter(r => !r.passed);
  if (failedResults.length > 0) {
    log('\n' + '='.repeat(80), 'bright');
    log('🔍 실패한 테스트 상세', 'red');
    log('='.repeat(80) + '\n', 'bright');

    failedResults.forEach(result => {
      log(`[${result.testId}] ${result.testName}`, 'red');
      result.errors.forEach(error => log(`  ${error}`, 'red'));
      log('', 'reset');
    });
  }

  // ============================================
  // JSON 파일로 저장
  // ============================================
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const outputDir = path.join(__dirname, 'test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `test-result-${timestamp}.json`);
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      successRate: ((passedCount / results.length) * 100).toFixed(2) + '%',
    },
    categoryStats,
    results,
  };

  fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2), 'utf-8');
  log(`\n💾 결과 저장: ${outputPath}`, 'green');

  // ============================================
  // 종료 코드
  // ============================================
  process.exit(failedCount > 0 ? 1 : 0);
}

// 실행
runAllTests().catch(error => {
  log(`\n💥 치명적 오류: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});