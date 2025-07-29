#!/usr/bin/env node

/**
 * Test script for Customer Intelligence System
 * Tests the advanced CRM, customer intelligence, predictive analytics, and lead scoring services
 */

import { customerIntelligenceService } from './src/services/crm/CustomerIntelligenceService.js';
import { predictiveAnalyticsService } from './src/services/crm/PredictiveAnalyticsService.js';
import { customerAnalyticsService } from './src/services/crm/CustomerAnalyticsService.js';
import { leadScoringService } from './src/services/crm/LeadScoringService.js';
import { advancedCRMService } from './src/services/crm/AdvancedCRMService.js';

const TEST_USER_ID = 'test-user-123';
const TEST_CONTACT_ID = 'test-contact-456';

async function testCustomerIntelligence() {
  console.log('\n🔍 Testing Customer Intelligence Service...');
  
  try {
    // Test customer insights generation
    console.log('📊 Generating customer insights...');
    const insights = await customerIntelligenceService.generateCustomerInsights(TEST_CONTACT_ID);
    console.log(`✅ Generated ${insights.length} customer insights`);
    
    // Test customer predictions
    console.log('🔮 Generating customer predictions...');
    const predictions = await customerIntelligenceService.generatePredictions(TEST_CONTACT_ID);
    console.log(`✅ Generated ${predictions.length} predictions`);
    
    // Test customer 360 profile
    console.log('📋 Building customer 360 profile...');
    const profile = await customerIntelligenceService.getCustomerProfile(TEST_CONTACT_ID);
    console.log(`✅ Built customer profile with ${profile.insights.length} insights and ${profile.predictions.length} predictions`);
    
    return true;
  } catch (error) {
    console.error('❌ Customer Intelligence test failed:', error.message);
    return false;
  }
}

async function testPredictiveAnalytics() {
  console.log('\n🤖 Testing Predictive Analytics Service...');
  
  try {
    // Test model creation
    console.log('🔧 Creating prediction model...');
    const model = await predictiveAnalyticsService.createPredictionModel({
      user_id: TEST_USER_ID,
      name: 'Test Churn Model',
      description: 'Test model for churn prediction',
      model_type: 'churn',
      algorithm: 'random_forest',
      features: ['interaction_count', 'days_since_last_interaction', 'email_engagement'],
      hyperparameters: { n_estimators: 100, max_depth: 10 }
    });
    console.log(`✅ Created prediction model: ${model.name}`);
    
    // Test prediction insights
    console.log('📈 Getting prediction insights...');
    const insights = await predictiveAnalyticsService.getPredictionInsights(TEST_USER_ID);
    console.log(`✅ Retrieved prediction insights: ${insights.total_predictions} total predictions`);
    
    return true;
  } catch (error) {
    console.error('❌ Predictive Analytics test failed:', error.message);
    return false;
  }
}

async function testCustomerAnalytics() {
  console.log('\n📊 Testing Customer Analytics Service...');
  
  try {
    // Test customer metrics
    console.log('📈 Getting customer metrics...');
    const metrics = await customerAnalyticsService.getCustomerMetrics(TEST_USER_ID);
    console.log(`✅ Retrieved customer metrics: ${metrics.total_customers} customers, ${metrics.churn_rate}% churn rate`);
    
    // Test customer health score
    console.log('💊 Calculating customer health score...');
    const healthScore = await customerAnalyticsService.calculateCustomerHealthScore(TEST_CONTACT_ID);
    console.log(`✅ Calculated health score: ${healthScore.overall_score}/100 (${healthScore.risk_level} risk)`);
    
    // Test cohort analysis
    console.log('👥 Performing cohort analysis...');
    const cohorts = await customerAnalyticsService.getCohortAnalysis(TEST_USER_ID, 6);
    console.log(`✅ Analyzed ${cohorts.length} customer cohorts`);
    
    return true;
  } catch (error) {
    console.error('❌ Customer Analytics test failed:', error.message);
    return false;
  }
}

async function testLeadScoring() {
  console.log('\n🎯 Testing Lead Scoring Service...');
  
  try {
    // Test default rules setup
    console.log('🔧 Setting up default scoring rules...');
    await leadScoringService.setupDefaultScoringRules(TEST_USER_ID);
    console.log('✅ Default scoring rules created');
    
    // Test lead score calculation
    console.log('🎯 Calculating lead score...');
    const leadScore = await leadScoringService.calculateLeadScore(TEST_CONTACT_ID);
    console.log(`✅ Calculated lead score: ${leadScore.total_score} (Grade: ${leadScore.grade}, Status: ${leadScore.qualification_status})`);
    
    // Test scoring insights
    console.log('📊 Getting lead scoring insights...');
    const insights = await leadScoringService.getLeadScoringInsights(TEST_USER_ID);
    console.log(`✅ Retrieved scoring insights: ${insights.top_scoring_leads.length} top leads`);
    
    return true;
  } catch (error) {
    console.error('❌ Lead Scoring test failed:', error.message);
    return false;
  }
}

async function testAdvancedCRM() {
  console.log('\n🏢 Testing Advanced CRM Service...');
  
  try {
    // Test CRM initialization
    console.log('🚀 Initializing CRM...');
    await advancedCRMService.initializeCRMForUser(TEST_USER_ID);
    console.log('✅ CRM initialized successfully');
    
    // Test CRM dashboard
    console.log('📊 Building CRM dashboard...');
    const dashboard = await advancedCRMService.getCRMDashboard(TEST_USER_ID);
    console.log(`✅ Dashboard built: ${dashboard.overview.total_contacts} contacts, ${dashboard.insights.length} insights`);
    
    // Test contact enrichment
    console.log('🔍 Enriching contact...');
    const enrichment = await advancedCRMService.enrichContact(TEST_CONTACT_ID);
    console.log(`✅ Contact enriched with ${enrichment.technologies.length} technologies`);
    
    // Test deal pipeline creation
    console.log('💰 Creating deal pipeline...');
    const pipeline = await advancedCRMService.createDealPipeline(TEST_USER_ID, 'Test Pipeline', [
      { name: 'Lead', probability: 10 },
      { name: 'Qualified', probability: 50 },
      { name: 'Closed Won', probability: 100, is_closed_won: true }
    ]);
    console.log(`✅ Created pipeline: ${pipeline.name} with ${pipeline.stages.length} stages`);
    
    return true;
  } catch (error) {
    console.error('❌ Advanced CRM test failed:', error.message);
    return false;
  }
}

async function testIntegration() {
  console.log('\n🔗 Testing Service Integration...');
  
  try {
    // Test end-to-end workflow
    console.log('🔄 Running end-to-end workflow...');
    
    // 1. Calculate lead score
    const leadScore = await leadScoringService.calculateLeadScore(TEST_CONTACT_ID);
    console.log(`📊 Lead Score: ${leadScore.total_score}`);
    
    // 2. Generate customer insights
    const insights = await customerIntelligenceService.generateCustomerInsights(TEST_CONTACT_ID);
    console.log(`🔍 Generated ${insights.length} insights`);
    
    // 3. Calculate health score
    const healthScore = await customerAnalyticsService.calculateCustomerHealthScore(TEST_CONTACT_ID);
    console.log(`💊 Health Score: ${healthScore.overall_score}`);
    
    // 4. Get CRM dashboard
    const dashboard = await advancedCRMService.getCRMDashboard(TEST_USER_ID);
    console.log(`📊 Dashboard: ${dashboard.overview.total_contacts} contacts`);
    
    console.log('✅ Integration test completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Customer Intelligence System Tests...');
  console.log('=' .repeat(60));
  
  const results = {
    customerIntelligence: false,
    predictiveAnalytics: false,
    customerAnalytics: false,
    leadScoring: false,
    advancedCRM: false,
    integration: false
  };
  
  // Run individual service tests
  results.customerIntelligence = await testCustomerIntelligence();
  results.predictiveAnalytics = await testPredictiveAnalytics();
  results.customerAnalytics = await testCustomerAnalytics();
  results.leadScoring = await testLeadScoring();
  results.advancedCRM = await testAdvancedCRM();
  
  // Run integration test
  results.integration = await testIntegration();
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} - ${testName}`);
  });
  
  console.log('\n' + '-'.repeat(60));
  console.log(`📊 Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Customer Intelligence System is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the error messages above.');
  }
  
  console.log('\n🏁 Customer Intelligence System testing completed.');
}

// Handle both direct execution and module import
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

export { runAllTests };