/**
 * Test script for the Verification Controller
 * Tests the comprehensive platform verification system
 */

const { verificationController } = require('./src/services/verification/VerificationController');

async function testVerificationController() {
  console.log('🧪 Testing Verification Controller');
  console.log('=' .repeat(50));

  try {
    // Test 1: Run Complete Verification
    console.log('\n🚀 Test 1: Running Complete Verification');
    console.log('-'.repeat(40));
    
    const verificationResult = await verificationController.runCompleteVerification();
    
    console.log('\n📊 VERIFICATION RESULTS:');
    console.log(`Overall Status: ${verificationResult.overallStatus}`);
    console.log(`Total Tests: ${verificationResult.metrics.totalTests}`);
    console.log(`Passed: ${verificationResult.metrics.passedTests}`);
    console.log(`Failed: ${verificationResult.metrics.failedTests}`);
    console.log(`Warnings: ${verificationResult.metrics.warningTests}`);
    console.log(`Execution Time: ${(verificationResult.metrics.executionTime / 1000).toFixed(2)}s`);

    // Test 2: Generate Completion Report
    console.log('\n📋 Test 2: Generating Completion Report');
    console.log('-'.repeat(40));
    
    const completionReport = await verificationController.generateCompletionReport();
    
    console.log('\n📈 COMPLETION REPORT:');
    console.log(`Overall Completion: ${completionReport.overallCompletionPercentage.toFixed(1)}%`);
    console.log(`Critical Issues: ${completionReport.criticalIssues.length}`);
    console.log(`Total Gaps: ${completionReport.gaps.length}`);
    console.log(`Completion Tasks: ${completionReport.completionTasks.length}`);
    console.log(`Estimated Completion Time: ${completionReport.estimatedCompletionTime} hours`);

    // Test 3: Identify Gaps
    console.log('\n🔍 Test 3: Identifying Platform Gaps');
    console.log('-'.repeat(40));
    
    const gaps = await verificationController.identifyGaps();
    
    console.log('\n🎯 IDENTIFIED GAPS:');
    console.log(`Total Gaps: ${gaps.length}`);
    
    const gapsBySeverity = {
      CRITICAL: gaps.filter(g => g.severity === 'CRITICAL').length,
      HIGH: gaps.filter(g => g.severity === 'HIGH').length,
      MEDIUM: gaps.filter(g => g.severity === 'MEDIUM').length,
      LOW: gaps.filter(g => g.severity === 'LOW').length
    };
    
    console.log(`Critical: ${gapsBySeverity.CRITICAL}`);
    console.log(`High: ${gapsBySeverity.HIGH}`);
    console.log(`Medium: ${gapsBySeverity.MEDIUM}`);
    console.log(`Low: ${gapsBySeverity.LOW}`);

    // Test 4: Prioritize Completions
    console.log('\n📋 Test 4: Prioritizing Completion Tasks');
    console.log('-'.repeat(40));
    
    const completionTasks = verificationController.prioritizeCompletions(gaps);
    
    console.log('\n✅ COMPLETION TASKS:');
    console.log(`Total Tasks: ${completionTasks.length}`);
    
    if (completionTasks.length > 0) {
      console.log('\nTop 5 Priority Tasks:');
      completionTasks.slice(0, 5).forEach((task, index) => {
        console.log(`${index + 1}. ${task.title} (${task.estimatedHours}h)`);
      });
    }

    // Test 5: Category Analysis
    console.log('\n📊 Test 5: Category Analysis');
    console.log('-'.repeat(40));
    
    const categories = verificationResult.categories;
    
    console.log('\n🔍 CATEGORY BREAKDOWN:');
    Object.entries(categories).forEach(([category, result]) => {
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  Status: ${result.status}`);
      console.log(`  Tests: ${result.tests.length}`);
      console.log(`  Coverage: ${result.coverage.toFixed(1)}%`);
      console.log(`  Avg Response Time: ${result.performance.averageResponseTime.toFixed(2)}ms`);
      console.log(`  Error Rate: ${result.performance.errorRate.toFixed(1)}%`);
    });

    // Test 6: Recommendations Analysis
    console.log('\n💡 Test 6: Recommendations Analysis');
    console.log('-'.repeat(40));
    
    const recommendations = verificationResult.recommendations;
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log(`Total Recommendations: ${recommendations.length}`);
    
    const recommendationsByPriority = {
      CRITICAL: recommendations.filter(r => r.priority === 'CRITICAL').length,
      HIGH: recommendations.filter(r => r.priority === 'HIGH').length,
      MEDIUM: recommendations.filter(r => r.priority === 'MEDIUM').length,
      LOW: recommendations.filter(r => r.priority === 'LOW').length
    };
    
    console.log(`Critical: ${recommendationsByPriority.CRITICAL}`);
    console.log(`High: ${recommendationsByPriority.HIGH}`);
    console.log(`Medium: ${recommendationsByPriority.MEDIUM}`);
    console.log(`Low: ${recommendationsByPriority.LOW}`);

    if (recommendations.length > 0) {
      console.log('\nTop Recommendations:');
      recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.title}`);
        console.log(`   ${rec.description}`);
        console.log(`   Estimated Effort: ${rec.estimatedEffort} hours`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 VERIFICATION CONTROLLER TEST SUMMARY');
    console.log('='.repeat(50));
    
    const successRate = (verificationResult.metrics.passedTests / verificationResult.metrics.totalTests) * 100;
    
    console.log(`✅ All tests completed successfully!`);
    console.log(`📊 Platform Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`🎯 Overall Status: ${verificationResult.overallStatus}`);
    console.log(`📋 Completion Percentage: ${completionReport.overallCompletionPercentage.toFixed(1)}%`);
    
    if (successRate >= 90) {
      console.log('🎉 EXCELLENT: Platform is in great shape!');
    } else if (successRate >= 75) {
      console.log('✅ GOOD: Platform is functional with minor issues');
    } else if (successRate >= 50) {
      console.log('⚠️  WARNING: Platform needs attention');
    } else {
      console.log('❌ CRITICAL: Platform requires major fixes');
    }

    console.log('\n🔧 Verification Controller is working correctly!');
    
    return {
      success: true,
      verificationResult,
      completionReport,
      gaps,
      completionTasks,
      recommendations
    };

  } catch (error) {
    console.error('❌ Verification Controller test failed:', error);
    console.error('Stack trace:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testVerificationController()
    .then(result => {
      if (result.success) {
        console.log('\n✅ All Verification Controller tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Verification Controller tests failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testVerificationController };