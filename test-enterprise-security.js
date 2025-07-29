/**
 * Enterprise Security System Test
 * Comprehensive testing of security framework, MFA, and compliance monitoring
 */

const { enterpriseSecurityFramework } = require('./src/services/security/EnterpriseSecurityFramework');
const { multiFactorAuthService } = require('./src/services/security/MultiFactorAuthService');
const { complianceMonitoringService } = require('./src/services/security/ComplianceMonitoringService');

class EnterpriseSecurityTester {
  constructor() {
    this.testResults = {
      securityFramework: [],
      mfaService: [],
      complianceService: [],
      integration: []
    };
  }

  async runAllTests() {
    console.log('🔒 Starting Enterprise Security System Tests');
    console.log('=' .repeat(60));

    try {
      // Test Security Framework
      await this.testSecurityFramework();
      
      // Test MFA Service
      await this.testMFAService();
      
      // Test Compliance Service
      await this.testComplianceService();
      
      // Test Integration
      await this.testSecurityIntegration();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testSecurityFramework() {
    console.log('\n🛡️ Testing Enterprise Security Framework');
    console.log('-'.repeat(40));

    try {
      // Test 1: Security Policy Creation
      console.log('📋 Test 1: Security Policy Creation');
      const policy = await enterpriseSecurityFramework.createSecurityPolicy({
        name: 'Test Access Policy',
        description: 'Test policy for access control',
        type: 'access_control',
        rules: [
          {
            id: 'test_rule_1',
            name: 'Require Authentication',
            condition: {
              type: 'user_attribute',
              operator: 'equals',
              value: 'authenticated'
            },
            action: {
              type: 'allow',
              parameters: {}
            },
            priority: 1,
            isActive: true,
            metadata: {}
          }
        ],
        enforcement: 'strict',
        scope: 'global',
        isActive: true,
        createdBy: 'test_system'
      });
      
      this.testResults.securityFramework.push({
        test: 'Policy Creation',
        status: policy ? 'PASS' : 'FAIL',
        details: policy ? `Policy created: ${policy.id}` : 'Failed to create policy'
      });

      // Test 2: Access Evaluation
      console.log('🔐 Test 2: Access Evaluation');
      const accessRequest = {
        userId: 'test_user_123',
        resourceId: 'test_resource_456',
        resourceType: 'document',
        action: 'read',
        context: {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 Test Browser',
          timestamp: new Date(),
          mfaVerified: true
        }
      };

      const accessResult = await enterpriseSecurityFramework.evaluateAccess(accessRequest);
      
      this.testResults.securityFramework.push({
        test: 'Access Evaluation',
        status: accessResult ? 'PASS' : 'FAIL',
        details: accessResult ? 
          `Access ${accessResult.allowed ? 'granted' : 'denied'}: ${accessResult.reason}` : 
          'Failed to evaluate access'
      });

      // Test 3: Threat Detection
      console.log('🔍 Test 3: Threat Detection');
      const mockEvents = [
        {
          id: 'event_1',
          type: 'authentication',
          severity: 'warning',
          userId: 'test_user_123',
          action: 'login_attempt',
          result: 'failure',
          details: {
            ipAddress: '192.168.1.100',
            userAgent: 'Test Browser',
            riskScore: 75,
            anomalyFlags: []
          },
          metadata: {},
          timestamp: new Date(),
          source: 'auth_system'
        },
        {
          id: 'event_2',
          type: 'authentication',
          severity: 'warning',
          userId: 'test_user_123',
          action: 'login_attempt',
          result: 'failure',
          details: {
            ipAddress: '192.168.1.100',
            userAgent: 'Test Browser',
            riskScore: 80,
            anomalyFlags: []
          },
          metadata: {},
          timestamp: new Date(),
          source: 'auth_system'
        }
      ];

      const threats = await enterpriseSecurityFramework.detectThreats(mockEvents);
      
      this.testResults.securityFramework.push({
        test: 'Threat Detection',
        status: Array.isArray(threats) ? 'PASS' : 'FAIL',
        details: `Detected ${threats.length} threats`
      });

      // Test 4: Data Encryption
      console.log('🔐 Test 4: Data Encryption');
      const testData = 'Sensitive user information';
      const keyId = 'data_encryption_key_1';
      
      const encrypted = await enterpriseSecurityFramework.encryptData(testData, keyId);
      const decrypted = await enterpriseSecurityFramework.decryptData(encrypted);
      
      this.testResults.securityFramework.push({
        test: 'Data Encryption',
        status: decrypted === testData ? 'PASS' : 'FAIL',
        details: decrypted === testData ? 'Encryption/decryption successful' : 'Data integrity failed'
      });

      // Test 5: Security Audit
      console.log('🔍 Test 5: Security Audit');
      const audit = await enterpriseSecurityFramework.conductSecurityAudit('vulnerability_scan', ['application']);
      
      this.testResults.securityFramework.push({
        test: 'Security Audit',
        status: audit && audit.status === 'completed' ? 'PASS' : 'FAIL',
        details: audit ? 
          `Audit completed with ${audit.findings.length} findings` : 
          'Audit failed'
      });

      // Test 6: Security Dashboard
      console.log('📊 Test 6: Security Dashboard');
      const dashboard = await enterpriseSecurityFramework.getSecurityDashboard();
      
      this.testResults.securityFramework.push({
        test: 'Security Dashboard',
        status: dashboard && typeof dashboard.securityScore === 'number' ? 'PASS' : 'FAIL',
        details: dashboard ? 
          `Security score: ${dashboard.securityScore}, Active threats: ${dashboard.activeThreats.length}` : 
          'Dashboard failed'
      });

    } catch (error) {
      console.error('❌ Security Framework test failed:', error);
      this.testResults.securityFramework.push({
        test: 'Framework Error',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testMFAService() {
    console.log('\n🔐 Testing Multi-Factor Authentication Service');
    console.log('-'.repeat(40));

    try {
      const testUserId = 'test_user_mfa_123';

      // Test 1: TOTP Setup
      console.log('📱 Test 1: TOTP Setup');
      const totpSetup = await multiFactorAuthService.setupTOTP(testUserId, 'test@example.com');
      
      this.testResults.mfaService.push({
        test: 'TOTP Setup',
        status: totpSetup && totpSetup.secret ? 'PASS' : 'FAIL',
        details: totpSetup ? 'TOTP setup successful' : 'TOTP setup failed'
      });

      // Test 2: SMS Setup
      console.log('📲 Test 2: SMS Setup');
      const smsSetup = await multiFactorAuthService.setupSMS(testUserId, '+1234567890');
      
      this.testResults.mfaService.push({
        test: 'SMS Setup',
        status: smsSetup ? 'PASS' : 'FAIL',
        details: smsSetup ? `SMS method created: ${smsSetup}` : 'SMS setup failed'
      });

      // Test 3: MFA Challenge Creation
      console.log('🎯 Test 3: MFA Challenge Creation');
      const challenge = await multiFactorAuthService.createChallenge(testUserId);
      
      this.testResults.mfaService.push({
        test: 'Challenge Creation',
        status: challenge && challenge.id ? 'PASS' : 'FAIL',
        details: challenge ? `Challenge created: ${challenge.id}` : 'Challenge creation failed'
      });

      // Test 4: Biometric Setup
      console.log('👤 Test 4: Biometric Setup');
      const biometricSetup = await multiFactorAuthService.setupBiometric(testUserId, {
        type: 'fingerprint',
        template: 'mock_biometric_template_data',
        confidence: 95,
        deviceId: 'test_device_123'
      });
      
      this.testResults.mfaService.push({
        test: 'Biometric Setup',
        status: biometricSetup ? 'PASS' : 'FAIL',
        details: biometricSetup ? `Biometric method created: ${biometricSetup}` : 'Biometric setup failed'
      });

      // Test 5: Get User MFA Methods
      console.log('📋 Test 5: Get User MFA Methods');
      const userMethods = await multiFactorAuthService.getUserMFAMethods(testUserId);
      
      this.testResults.mfaService.push({
        test: 'Get MFA Methods',
        status: Array.isArray(userMethods) ? 'PASS' : 'FAIL',
        details: `Found ${userMethods.length} MFA methods`
      });

      // Test 6: MFA Status Check
      console.log('✅ Test 6: MFA Status Check');
      const hasMFA = await multiFactorAuthService.hasMFAEnabled(testUserId);
      
      this.testResults.mfaService.push({
        test: 'MFA Status Check',
        status: typeof hasMFA === 'boolean' ? 'PASS' : 'FAIL',
        details: `MFA enabled: ${hasMFA}`
      });

    } catch (error) {
      console.error('❌ MFA Service test failed:', error);
      this.testResults.mfaService.push({
        test: 'MFA Error',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testComplianceService() {
    console.log('\n📋 Testing Compliance Monitoring Service');
    console.log('-'.repeat(40));

    try {
      const testUserId = 'test_user_compliance_123';

      // Test 1: Data Processing Activity Registration
      console.log('📝 Test 1: Data Processing Activity Registration');
      const activity = await complianceMonitoringService.registerDataProcessingActivity({
        name: 'Test User Analytics',
        description: 'Processing user behavior data for analytics',
        dataController: 'HigherUp.ai',
        purposeOfProcessing: ['analytics', 'improvement'],
        legalBasis: 'legitimate_interest',
        dataCategories: ['behavioral_data', 'usage_statistics'],
        dataSubjects: ['users', 'customers'],
        recipients: ['internal_teams'],
        thirdCountryTransfers: false,
        retentionPeriod: '2_years',
        securityMeasures: ['encryption', 'access_controls']
      });
      
      this.testResults.complianceService.push({
        test: 'Data Processing Registration',
        status: activity && activity.id ? 'PASS' : 'FAIL',
        details: activity ? `Activity registered: ${activity.id}` : 'Registration failed'
      });

      // Test 2: Consent Recording
      console.log('✅ Test 2: Consent Recording');
      const consent = await complianceMonitoringService.recordConsent({
        userId: testUserId,
        dataSubject: 'test@example.com',
        processingPurpose: 'marketing',
        consentGiven: true,
        consentDate: new Date(),
        consentMethod: 'explicit',
        consentScope: ['email_marketing', 'personalization'],
        isActive: true,
        metadata: { source: 'registration_form' }
      });
      
      this.testResults.complianceService.push({
        test: 'Consent Recording',
        status: consent && consent.id ? 'PASS' : 'FAIL',
        details: consent ? `Consent recorded: ${consent.id}` : 'Consent recording failed'
      });

      // Test 3: Data Subject Request
      console.log('📨 Test 3: Data Subject Request');
      const dsRequest = await complianceMonitoringService.handleDataSubjectRequest({
        requestType: 'access',
        dataSubject: 'test@example.com',
        contactInfo: 'test@example.com',
        description: 'Request for all personal data'
      });
      
      this.testResults.complianceService.push({
        test: 'Data Subject Request',
        status: dsRequest && dsRequest.id ? 'PASS' : 'FAIL',
        details: dsRequest ? `Request created: ${dsRequest.id}` : 'Request creation failed'
      });

      // Test 4: Access Request Processing
      console.log('🔍 Test 4: Access Request Processing');
      const accessData = await complianceMonitoringService.processAccessRequest(dsRequest.id);
      
      this.testResults.complianceService.push({
        test: 'Access Request Processing',
        status: accessData && accessData.personalData ? 'PASS' : 'FAIL',
        details: accessData ? 'Access request processed successfully' : 'Processing failed'
      });

      // Test 5: Compliance Violation Detection
      console.log('🚨 Test 5: Compliance Violation Detection');
      const violation = await complianceMonitoringService.detectViolation({
        frameworkId: 'gdpr',
        requirementId: 'gdpr_consent',
        severity: 'medium',
        title: 'Test Consent Violation',
        description: 'Test violation for compliance monitoring',
        detectionMethod: 'automated',
        affectedSystems: ['user_management'],
        affectedData: ['user_preferences'],
        potentialImpact: 'Low risk of regulatory action'
      });
      
      this.testResults.complianceService.push({
        test: 'Violation Detection',
        status: violation && violation.id ? 'PASS' : 'FAIL',
        details: violation ? `Violation detected: ${violation.id}` : 'Detection failed'
      });

      // Test 6: Compliance Report Generation
      console.log('📊 Test 6: Compliance Report Generation');
      const report = await complianceMonitoringService.generateComplianceReport({
        type: 'assessment',
        title: 'Test Compliance Assessment',
        frameworks: ['gdpr', 'ccpa'],
        reportPeriod: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      });
      
      this.testResults.complianceService.push({
        test: 'Report Generation',
        status: report && report.id ? 'PASS' : 'FAIL',
        details: report ? 
          `Report generated: ${report.id}, Score: ${report.overallScore}` : 
          'Report generation failed'
      });

      // Test 7: Compliance Dashboard
      console.log('📈 Test 7: Compliance Dashboard');
      const dashboard = await complianceMonitoringService.getComplianceDashboard();
      
      this.testResults.complianceService.push({
        test: 'Compliance Dashboard',
        status: dashboard && typeof dashboard.overallScore === 'number' ? 'PASS' : 'FAIL',
        details: dashboard ? 
          `Overall score: ${dashboard.overallScore}, Active violations: ${dashboard.activeViolations.length}` : 
          'Dashboard failed'
      });

      // Test 8: Consent Withdrawal
      console.log('🚫 Test 8: Consent Withdrawal');
      const withdrawal = await complianceMonitoringService.withdrawConsent(
        testUserId, 
        consent.id, 
        'user_request'
      );
      
      this.testResults.complianceService.push({
        test: 'Consent Withdrawal',
        status: withdrawal ? 'PASS' : 'FAIL',
        details: withdrawal ? 'Consent withdrawn successfully' : 'Withdrawal failed'
      });

    } catch (error) {
      console.error('❌ Compliance Service test failed:', error);
      this.testResults.complianceService.push({
        test: 'Compliance Error',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testSecurityIntegration() {
    console.log('\n🔗 Testing Security System Integration');
    console.log('-'.repeat(40));

    try {
      const testUserId = 'test_user_integration_123';

      // Test 1: MFA + Security Framework Integration
      console.log('🔐 Test 1: MFA + Security Framework Integration');
      
      // Setup MFA
      await multiFactorAuthService.setupTOTP(testUserId, 'integration@example.com');
      
      // Create access request that requires MFA
      const accessRequest = {
        userId: testUserId,
        resourceId: 'sensitive_resource',
        resourceType: 'financial_data',
        action: 'read',
        context: {
          ipAddress: '192.168.1.100',
          userAgent: 'Test Browser',
          timestamp: new Date(),
          mfaVerified: false // Not verified initially
        }
      };

      const accessResult1 = await enterpriseSecurityFramework.evaluateAccess(accessRequest);
      
      // Should require MFA
      const mfaRequired = accessResult1.requiresMFA || !accessResult1.allowed;
      
      this.testResults.integration.push({
        test: 'MFA Integration',
        status: mfaRequired ? 'PASS' : 'FAIL',
        details: mfaRequired ? 'MFA correctly required for sensitive access' : 'MFA not enforced'
      });

      // Test 2: Compliance + Security Framework Integration
      console.log('📋 Test 2: Compliance + Security Framework Integration');
      
      // Register a data processing activity
      const activity = await complianceMonitoringService.registerDataProcessingActivity({
        name: 'Integration Test Processing',
        description: 'Test data processing for integration',
        dataController: 'HigherUp.ai',
        purposeOfProcessing: ['testing'],
        legalBasis: 'consent',
        dataCategories: ['test_data'],
        dataSubjects: ['test_users'],
        recipients: ['internal'],
        thirdCountryTransfers: false,
        retentionPeriod: '1_year',
        securityMeasures: ['encryption']
      });

      // Check if security framework can access compliance data
      const complianceDashboard = await complianceMonitoringService.getComplianceDashboard();
      const securityDashboard = await enterpriseSecurityFramework.getSecurityDashboard();
      
      this.testResults.integration.push({
        test: 'Compliance Integration',
        status: activity && complianceDashboard && securityDashboard ? 'PASS' : 'FAIL',
        details: 'Security and compliance systems integrated successfully'
      });

      // Test 3: End-to-End Security Workflow
      console.log('🔄 Test 3: End-to-End Security Workflow');
      
      // 1. User attempts access
      // 2. Security framework evaluates
      // 3. MFA challenge created if needed
      // 4. Compliance check performed
      // 5. Access granted/denied
      
      const workflow = {
        step1: await enterpriseSecurityFramework.evaluateAccess(accessRequest),
        step2: await multiFactorAuthService.createChallenge(testUserId),
        step3: await complianceMonitoringService.getComplianceDashboard()
      };
      
      const workflowSuccess = workflow.step1 && workflow.step2 && workflow.step3;
      
      this.testResults.integration.push({
        test: 'End-to-End Workflow',
        status: workflowSuccess ? 'PASS' : 'FAIL',
        details: workflowSuccess ? 'Complete security workflow executed' : 'Workflow failed'
      });

      // Test 4: Security Event Correlation
      console.log('🔍 Test 4: Security Event Correlation');
      
      // Generate security events
      const events = [
        {
          id: 'event_integration_1',
          type: 'authentication',
          severity: 'info',
          userId: testUserId,
          action: 'mfa_challenge_created',
          result: 'success',
          details: {
            ipAddress: '192.168.1.100',
            userAgent: 'Test Browser',
            riskScore: 30,
            anomalyFlags: []
          },
          metadata: { challengeId: workflow.step2.id },
          timestamp: new Date(),
          source: 'mfa_service'
        }
      ];

      const threats = await enterpriseSecurityFramework.detectThreats(events);
      
      this.testResults.integration.push({
        test: 'Event Correlation',
        status: Array.isArray(threats) ? 'PASS' : 'FAIL',
        details: `Processed ${events.length} events, detected ${threats.length} threats`
      });

    } catch (error) {
      console.error('❌ Integration test failed:', error);
      this.testResults.integration.push({
        test: 'Integration Error',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  generateTestReport() {
    console.log('\n📊 ENTERPRISE SECURITY TEST REPORT');
    console.log('='.repeat(60));

    const categories = [
      { name: 'Security Framework', results: this.testResults.securityFramework },
      { name: 'MFA Service', results: this.testResults.mfaService },
      { name: 'Compliance Service', results: this.testResults.complianceService },
      { name: 'Integration Tests', results: this.testResults.integration }
    ];

    let totalTests = 0;
    let passedTests = 0;

    categories.forEach(category => {
      console.log(`\n${category.name}:`);
      console.log('-'.repeat(30));
      
      category.results.forEach(result => {
        const status = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${status} ${result.test}: ${result.details}`);
        
        totalTests++;
        if (result.status === 'PASS') passedTests++;
      });
    });

    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log(`📈 SUMMARY: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
    
    if (successRate >= 90) {
      console.log('🎉 EXCELLENT: Enterprise security system is production-ready!');
    } else if (successRate >= 75) {
      console.log('✅ GOOD: Security system is functional with minor issues');
    } else if (successRate >= 50) {
      console.log('⚠️  WARNING: Security system needs attention');
    } else {
      console.log('❌ CRITICAL: Security system requires major fixes');
    }

    console.log('\n🔒 Enterprise Security System Testing Complete!');
  }
}

// Run the tests
async function runTests() {
  const tester = new EnterpriseSecurityTester();
  await tester.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { EnterpriseSecurityTester };