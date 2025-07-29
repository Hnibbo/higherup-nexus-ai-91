#!/usr/bin/env node

/**
 * Complete Platform Verification Runner
 * Executes comprehensive verification of the HigherUp.ai platform
 */

import { VerificationController } from './src/services/verification/VerificationController.js';

async function runCompleteVerification() {
  console.log('🚀 HigherUp.ai Platform - Complete Verification');
  console.log('================================================');
  console.log('Starting comprehensive platform verification...\n');

  try {
    const verificationController = new VerificationController();
    
    // Run complete verification
    console.log('📋 Phase 1: Running Complete Verification');
    console.log('==========================================');
    const verificationResult = await verificationController.runCompleteVerification();
    
    console.log('\n📊 Phase 2: Generating Completion Report');
    console.log('=========================================');
    const completionReport = await verificationController.generateCompletionReport();
    
    // Display final results
    console.log('\n🎯 FINAL VERIFICATION RESULTS');
    console.log('=============================');
    console.log(`Overall Status: ${getStatusEmoji(verificationResult.overallStatus)} ${verificationResult.overallStatus}`);
    console.log(`Platform Readiness: ${completionReport.overallReadiness}%`);
    console.log(`Critical Issues: ${completionReport.criticalIssues}`);
    console.log(`Total Tests: ${verificationResult.metrics.totalTests}`);
    console.log(`✅ Passed: ${verificationResult.metrics.passedTests}`);
    console.log(`❌ Failed: ${verificationResult.metrics.failedTests}`);
    console.log(`⚠️ Warnings: ${verificationResult.metrics.warningTests}`);
    console.log(`⏱️ Execution Time: ${(verificationResult.metrics.executionTime / 1000).toFixed(2)}s`);
    
    // Category breakdown
    console.log('\n📊 CATEGORY BREAKDOWN');
    console.log('=====================');
    console.log(`🔧 Services: ${getStatusEmoji(verificationResult.categories.services.status)} ${verificationResult.categories.services.status} (${verificationResult.categories.services.coverage}% coverage)`);
    console.log(`🗄️ Database: ${getStatusEmoji(verificationResult.categories.database.status)} ${verificationResult.categories.database.status} (${verificationResult.categories.database.coverage}% coverage)`);
    console.log(`🎨 Frontend: ${getStatusEmoji(verificationResult.categories.frontend.status)} ${verificationResult.categories.frontend.status} (${verificationResult.categories.frontend.coverage}% coverage)`);
    console.log(`🌐 API: ${getStatusEmoji(verificationResult.categories.api.status)} ${verificationResult.categories.api.status} (${verificationResult.categories.api.coverage}% coverage)`);
    console.log(`🔗 Integrations: ${getStatusEmoji(verificationResult.categories.integrations.status)} ${verificationResult.categories.integrations.status} (${verificationResult.categories.integrations.coverage}% coverage)`);
    
    // Recommendations
    if (verificationResult.recommendations.length > 0) {
      console.log('\n💡 TOP RECOMMENDATIONS');
      console.log('======================');
      verificationResult.recommendations.slice(0, 5).forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.severity}] ${rec.title}`);
        console.log(`   ${rec.description}`);
        console.log(`   Estimated effort: ${rec.estimatedEffort} hours\n`);
      });
    }
    
    // Market readiness assessment
    console.log('\n🚀 MARKET READINESS ASSESSMENT');
    console.log('==============================');
    
    if (completionReport.overallReadiness >= 95) {
      console.log('🎉 PLATFORM IS READY FOR MARKET DOMINATION!');
      console.log('✅ All critical systems operational');
      console.log('✅ High-quality implementation detected');
      console.log('✅ Production deployment recommended');
      console.log('✅ Ready to compete with industry leaders');
    } else if (completionReport.overallReadiness >= 85) {
      console.log('🟡 PLATFORM IS NEARLY READY FOR LAUNCH');
      console.log('✅ Core functionality implemented');
      console.log('⚠️ Minor improvements recommended');
      console.log('✅ Can proceed with soft launch');
      console.log(`📋 ${completionReport.completionTasks.length} completion tasks identified`);
    } else if (completionReport.overallReadiness >= 70) {
      console.log('🟠 PLATFORM NEEDS ADDITIONAL WORK');
      console.log('⚠️ Core functionality present but incomplete');
      console.log('❌ Critical issues need resolution');
      console.log('📋 Significant development work required');
      console.log(`⏱️ Estimated completion time: ${completionReport.estimatedCompletionTime} hours`);
    } else {
      console.log('🔴 PLATFORM REQUIRES MAJOR DEVELOPMENT');
      console.log('❌ Significant gaps in implementation');
      console.log('❌ Not ready for production deployment');
      console.log('📋 Extensive development work required');
      console.log(`⏱️ Estimated completion time: ${completionReport.estimatedCompletionTime} hours`);
    }
    
    // Next steps
    console.log('\n📋 NEXT STEPS');
    console.log('=============');
    
    if (completionReport.criticalIssues > 0) {
      console.log(`1. 🔴 Address ${completionReport.criticalIssues} critical issues immediately`);
      console.log('2. 🟡 Review and implement high-priority completion tasks');
      console.log('3. 🧪 Run verification again after fixes');
      console.log('4. 📊 Monitor progress with regular verification runs');
    } else if (completionReport.completionTasks.length > 0) {
      console.log('1. 📋 Review completion tasks and prioritize implementation');
      console.log('2. 🔧 Implement high-priority improvements');
      console.log('3. 🧪 Run verification to track progress');
      console.log('4. 🚀 Prepare for production deployment');
    } else {
      console.log('1. 🚀 Proceed with production deployment');
      console.log('2. 📊 Set up production monitoring');
      console.log('3. 🎯 Begin market domination strategy');
      console.log('4. 📈 Monitor performance and user feedback');
    }
    
    console.log('\n================================================');
    console.log('🏁 Verification Complete - HigherUp.ai Platform');
    console.log('================================================');
    
    // Exit with appropriate code
    process.exit(completionReport.criticalIssues > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED');
    console.error('======================');
    console.error(`Error: ${error.message}`);
    console.error('\nPlease check the platform setup and try again.');
    process.exit(1);
  }
}

function getStatusEmoji(status) {
  switch (status) {
    case 'PASS': return '✅';
    case 'FAIL': return '❌';
    case 'WARNING': return '⚠️';
    default: return '❓';
  }
}

// Run verification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteVerification();
}

export { runCompleteVerification };