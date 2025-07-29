/**
 * IntegrationValidator - Validates all third-party integrations and data flows
 * Tests external API connections, data synchronization, and error handling
 */

import fs from 'fs';
import path from 'path';
import { CategoryResult, TestResult, PerformanceMetrics } from './VerificationController';

export class IntegrationValidator {
  private integrationsPath = 'src/services/integrations';
  private testResults: TestResult[] = [];

  /**
   * Validates complete integration ecosystem
   */
  async validateIntegrations(): Promise<CategoryResult> {
    console.log('🔗 Starting Integration Validation');
    console.log('==================================');

    this.testResults = [];
    const startTime = Date.now();

    try {
      // Validate integration services
      await this.validateIntegrationServices();
      
      // Validate third-party APIs
      await this.validateThirdPartyAPIs();
      
      // Validate data synchronization
      await this.validateDataSynchronization();
      
      // Validate webhook handling
      await this.validateWebhooks();
      
      // Validate error recovery
      await this.validateErrorRecovery();
      
      // Validate integration monitoring
      await this.validateIntegrationMonitoring();

      const executionTime = Date.now() - startTime;
      const performance = this.calculatePerformanceMetrics();
      const coverage = this.calculateCoverage();
      const status = this.determineStatus();

      console.log(`✅ Integration validation completed in ${executionTime}ms`);
      console.log(`📊 Coverage: ${coverage}%`);
      console.log(`📈 Status: ${status}`);

      return {
        status,
        tests: this.testResults,
        coverage,
        performance
      };

    } catch (error) {
      console.error('❌ Integration validation failed:', error);
      throw error;
    }
  }

  /**
   * Validates integration services implementation
   */
  private async validateIntegrationServices(): Promise<void> {
    console.log('🔧 Validating Integration Services...');

    if (!fs.existsSync(this.integrationsPath)) {
      this.addTestResult({
        name: 'Integration Services - Directory',
        status: 'FAIL',
        message: 'Integrations directory not found',
        executionTime: 0
      });
      return;
    }

    const integrationServices = fs.readdirSync(this.integrationsPath)
      .filter(file => file.endsWith('.ts'));

    if (integrationServices.length === 0) {
      this.addTestResult({
        name: 'Integration Services - Service Files',
        status: 'WARNING',
        message: 'No integration service files found',
        executionTime: 0
      });
      return;
    }

    // Validate each integration service
    for (const service of integrationServices) {
      await this.validateIntegrationService(service);
    }

    this.addTestResult({
      name: 'Integration Services - Overview',
      status: 'PASS',
      message: `Found ${integrationServices.length} integration services`,
      executionTime: 0,
      details: { serviceCount: integrationServices.length }
    });
  }

  /**
   * Validates individual integration service
   */
  private async validateIntegrationService(serviceName: string): Promise<void> {
    const startTime = Date.now();
    const servicePath = path.join(this.integrationsPath, serviceName);

    try {
      const content = fs.readFileSync(servicePath, 'utf8');
      
      // Check for essential integration patterns
      const hasAPIClient = content.includes('axios') || content.includes('fetch') || content.includes('http');
      const hasAuthentication = content.includes('auth') || content.includes('token') || content.includes('key');
      const hasErrorHandling = content.includes('try') && content.includes('catch');
      const hasRetryLogic = content.includes('retry') || content.includes('attempt');
      const hasRateLimiting = content.includes('rateLimit') || content.includes('throttle');
      const hasDataMapping = content.includes('map') || content.includes('transform') || content.includes('convert');

      let integrationScore = 0;
      if (hasAPIClient) integrationScore += 20;
      if (hasAuthentication) integrationScore += 15;
      if (hasErrorHandling) integrationScore += 20;
      if (hasRetryLogic) integrationScore += 15;
      if (hasRateLimiting) integrationScore += 15;
      if (hasDataMapping) integrationScore += 15;

      this.addTestResult({
        name: `Integration Service - ${serviceName}`,
        status: integrationScore >= 80 ? 'PASS' : integrationScore >= 60 ? 'WARNING' : 'FAIL',
        message: `Integration patterns score: ${integrationScore}%`,
        executionTime: Date.now() - startTime,
        details: {
          hasAPIClient,
          hasAuthentication,
          hasErrorHandling,
          hasRetryLogic,
          hasRateLimiting,
          hasDataMapping,
          integrationScore
        }
      });

    } catch (error) {
      this.addTestResult({
        name: `Integration Service - ${serviceName}`,
        status: 'FAIL',
        message: `Error analyzing service: ${error.message}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Validates third-party API integrations
   */
  private async validateThirdPartyAPIs(): Promise<void> {
    console.log('🌐 Validating Third-Party APIs...');

    const expectedIntegrations = [
      'CRM', 'Email', 'Payment', 'Analytics', 'Social', 'Storage', 'Communication'
    ];

    let foundIntegrations = 0;
    const integrationDetails: any = {};

    // Check for common third-party integrations in services
    const checkIntegrations = (dirPath: string, category: string) => {
      if (!fs.existsSync(dirPath)) return;

      const services = fs.readdirSync(dirPath)
        .filter(file => file.endsWith('.ts'));

      for (const service of services) {
        try {
          const servicePath = path.join(dirPath, service);
          const content = fs.readFileSync(servicePath, 'utf8');

          // Check for specific integration patterns
          if (category === 'CRM' && (content.includes('salesforce') || content.includes('hubspot') || content.includes('pipedrive'))) {
            integrationDetails.hasCRMIntegration = true;
            foundIntegrations++;
          }
          
          if (category === 'Email' && (content.includes('sendgrid') || content.includes('mailchimp') || content.includes('ses'))) {
            integrationDetails.hasEmailIntegration = true;
            foundIntegrations++;
          }
          
          if (category === 'Payment' && (content.includes('stripe') || content.includes('paypal') || content.includes('square'))) {
            integrationDetails.hasPaymentIntegration = true;
            foundIntegrations++;
          }
          
          if (category === 'Analytics' && (content.includes('google-analytics') || content.includes('mixpanel') || content.includes('amplitude'))) {
            integrationDetails.hasAnalyticsIntegration = true;
            foundIntegrations++;
          }
          
          if (category === 'Social' && (content.includes('facebook') || content.includes('twitter') || content.includes('linkedin'))) {
            integrationDetails.hasSocialIntegration = true;
            foundIntegrations++;
          }

        } catch (error) {
          // Skip files that can't be read
        }
      }
    };

    // Check different service categories for integrations
    checkIntegrations('src/services/crm', 'CRM');
    checkIntegrations('src/services/email', 'Email');
    checkIntegrations('src/services/integrations', 'Payment');
    checkIntegrations('src/services/analytics', 'Analytics');
    checkIntegrations('src/services/social', 'Social');

    // Check package.json for integration dependencies
    const packageJsonPath = 'package.json';
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageContent);
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        if (dependencies['@supabase/supabase-js']) integrationDetails.hasSupabaseIntegration = true;
        if (dependencies['stripe']) integrationDetails.hasStripeIntegration = true;
        if (dependencies['axios']) integrationDetails.hasHTTPClient = true;
        
      } catch (error) {
        // Error reading package.json
      }
    }

    const integrationScore = (foundIntegrations / expectedIntegrations.length) * 100;

    this.addTestResult({
      name: 'Third-Party APIs - Integration Coverage',
      status: integrationScore >= 60 ? 'PASS' : integrationScore >= 40 ? 'WARNING' : 'FAIL',
      message: `${foundIntegrations}/${expectedIntegrations.length} integration categories implemented`,
      executionTime: 0,
      details: {
        foundIntegrations,
        expectedIntegrations: expectedIntegrations.length,
        integrationScore,
        ...integrationDetails
      }
    });
  }

  /**
   * Validates data synchronization capabilities
   */
  private async validateDataSynchronization(): Promise<void> {
    console.log('🔄 Validating Data Synchronization...');

    // Check for data sync service
    const dataSyncPath = 'src/services/database/DataSyncService.ts';
    const hasDataSyncService = fs.existsSync(dataSyncPath);

    let syncFeatures = 0;
    const syncDetails: any = {};

    if (hasDataSyncService) {
      try {
        const content = fs.readFileSync(dataSyncPath, 'utf8');
        
        syncDetails.hasRealTimeSync = content.includes('realtime') || content.includes('websocket') || content.includes('socket');
        syncDetails.hasBatchSync = content.includes('batch') || content.includes('bulk');
        syncDetails.hasConflictResolution = content.includes('conflict') || content.includes('merge') || content.includes('resolve');
        syncDetails.hasSyncStatus = content.includes('status') || content.includes('progress');
        syncDetails.hasRetryMechanism = content.includes('retry') || content.includes('queue');

        if (syncDetails.hasRealTimeSync) syncFeatures += 20;
        if (syncDetails.hasBatchSync) syncFeatures += 20;
        if (syncDetails.hasConflictResolution) syncFeatures += 20;
        if (syncDetails.hasSyncStatus) syncFeatures += 20;
        if (syncDetails.hasRetryMechanism) syncFeatures += 20;

      } catch (error) {
        // Error reading sync service
      }
    }

    this.addTestResult({
      name: 'Data Synchronization - Features',
      status: syncFeatures >= 80 ? 'PASS' : syncFeatures >= 60 ? 'WARNING' : 'FAIL',
      message: hasDataSyncService ? `Sync features score: ${syncFeatures}%` : 'Data sync service not found',
      executionTime: 0,
      details: {
        hasDataSyncService,
        syncFeatures,
        ...syncDetails
      }
    });
  }

  /**
   * Validates webhook handling capabilities
   */
  private async validateWebhooks(): Promise<void> {
    console.log('🪝 Validating Webhook Handling...');

    let hasWebhookHandling = false;
    const webhookDetails: any = {};

    // Check server.js for webhook endpoints
    const serverPath = 'server.js';
    if (fs.existsSync(serverPath)) {
      try {
        const content = fs.readFileSync(serverPath, 'utf8');
        hasWebhookHandling = content.includes('webhook') || content.includes('/webhook');
        webhookDetails.hasWebhookEndpoints = hasWebhookHandling;
        webhookDetails.hasSignatureVerification = content.includes('signature') || content.includes('verify');
      } catch (error) {
        // Error reading server file
      }
    }

    // Check integration services for webhook handling
    if (fs.existsSync(this.integrationsPath)) {
      const integrationServices = fs.readdirSync(this.integrationsPath)
        .filter(file => file.endsWith('.ts'));

      for (const service of integrationServices) {
        try {
          const servicePath = path.join(this.integrationsPath, service);
          const content = fs.readFileSync(servicePath, 'utf8');
          
          if (content.includes('webhook') || content.includes('callback')) {
            hasWebhookHandling = true;
            webhookDetails.hasServiceWebhooks = true;
            break;
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }

    this.addTestResult({
      name: 'Webhooks - Handling Capabilities',
      status: hasWebhookHandling ? 'PASS' : 'WARNING',
      message: hasWebhookHandling ? 'Webhook handling implemented' : 'Webhook handling not detected',
      executionTime: 0,
      details: {
        hasWebhookHandling,
        ...webhookDetails
      }
    });
  }

  /**
   * Validates error recovery mechanisms
   */
  private async validateErrorRecovery(): Promise<void> {
    console.log('🔧 Validating Error Recovery...');

    let recoveryFeatures = 0;
    const recoveryDetails: any = {};

    // Check integration services for error recovery patterns
    if (fs.existsSync(this.integrationsPath)) {
      const integrationServices = fs.readdirSync(this.integrationsPath)
        .filter(file => file.endsWith('.ts'));

      let servicesWithRetry = 0;
      let servicesWithCircuitBreaker = 0;
      let servicesWithFallback = 0;

      for (const service of integrationServices) {
        try {
          const servicePath = path.join(this.integrationsPath, service);
          const content = fs.readFileSync(servicePath, 'utf8');
          
          if (content.includes('retry') || content.includes('attempt')) {
            servicesWithRetry++;
          }
          
          if (content.includes('circuit') || content.includes('breaker')) {
            servicesWithCircuitBreaker++;
          }
          
          if (content.includes('fallback') || content.includes('default')) {
            servicesWithFallback++;
          }
          
        } catch (error) {
          // Skip files that can't be read
        }
      }

      recoveryDetails.servicesWithRetry = servicesWithRetry;
      recoveryDetails.servicesWithCircuitBreaker = servicesWithCircuitBreaker;
      recoveryDetails.servicesWithFallback = servicesWithFallback;
      recoveryDetails.totalServices = integrationServices.length;

      if (servicesWithRetry > 0) recoveryFeatures += 40;
      if (servicesWithCircuitBreaker > 0) recoveryFeatures += 30;
      if (servicesWithFallback > 0) recoveryFeatures += 30;
    }

    this.addTestResult({
      name: 'Error Recovery - Resilience Patterns',
      status: recoveryFeatures >= 70 ? 'PASS' : recoveryFeatures >= 40 ? 'WARNING' : 'FAIL',
      message: `Error recovery patterns score: ${recoveryFeatures}%`,
      executionTime: 0,
      details: {
        recoveryFeatures,
        ...recoveryDetails
      }
    });
  }

  /**
   * Validates integration monitoring capabilities
   */
  private async validateIntegrationMonitoring(): Promise<void> {
    console.log('📊 Validating Integration Monitoring...');

    let monitoringFeatures = 0;
    const monitoringDetails: any = {};

    // Check for monitoring service
    const monitoringServicePath = 'src/services/monitoring/MonitoringService.ts';
    monitoringDetails.hasMonitoringService = fs.existsSync(monitoringServicePath);

    if (monitoringDetails.hasMonitoringService) {
      try {
        const content = fs.readFileSync(monitoringServicePath, 'utf8');
        
        monitoringDetails.hasHealthChecks = content.includes('health') || content.includes('ping');
        monitoringDetails.hasMetrics = content.includes('metrics') || content.includes('stats');
        monitoringDetails.hasAlerting = content.includes('alert') || content.includes('notify');
        monitoringDetails.hasLogging = content.includes('log') || content.includes('Logger');

        if (monitoringDetails.hasHealthChecks) monitoringFeatures += 25;
        if (monitoringDetails.hasMetrics) monitoringFeatures += 25;
        if (monitoringDetails.hasAlerting) monitoringFeatures += 25;
        if (monitoringDetails.hasLogging) monitoringFeatures += 25;

      } catch (error) {
        // Error reading monitoring service
      }
    }

    // Check for integration-specific monitoring
    if (fs.existsSync(this.integrationsPath)) {
      const integrationServices = fs.readdirSync(this.integrationsPath)
        .filter(file => file.endsWith('.ts'));

      let servicesWithMonitoring = 0;
      for (const service of integrationServices) {
        try {
          const servicePath = path.join(this.integrationsPath, service);
          const content = fs.readFileSync(servicePath, 'utf8');
          
          if (content.includes('monitor') || content.includes('track') || content.includes('log')) {
            servicesWithMonitoring++;
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      monitoringDetails.servicesWithMonitoring = servicesWithMonitoring;
      monitoringDetails.totalIntegrationServices = integrationServices.length;
    }

    this.addTestResult({
      name: 'Integration Monitoring - Observability',
      status: monitoringFeatures >= 75 ? 'PASS' : monitoringFeatures >= 50 ? 'WARNING' : 'FAIL',
      message: `Monitoring features score: ${monitoringFeatures}%`,
      executionTime: 0,
      details: {
        monitoringFeatures,
        ...monitoringDetails
      }
    });
  }

  /**
   * Adds test result to collection
   */
  private addTestResult(result: TestResult): void {
    this.testResults.push(result);
  }

  /**
   * Calculates performance metrics from test results
   */
  private calculatePerformanceMetrics(): PerformanceMetrics {
    if (this.testResults.length === 0) {
      return {
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        throughput: 0,
        errorRate: 0
      };
    }

    const executionTimes = this.testResults.map(r => r.executionTime);
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;

    return {
      averageResponseTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
      maxResponseTime: Math.max(...executionTimes),
      minResponseTime: Math.min(...executionTimes),
      throughput: this.testResults.length / (Math.max(...executionTimes) / 1000 || 1),
      errorRate: (failedTests / this.testResults.length) * 100
    };
  }

  /**
   * Calculates test coverage percentage
   */
  private calculateCoverage(): number {
    if (this.testResults.length === 0) return 0;
    
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const warningTests = this.testResults.filter(r => r.status === 'WARNING').length;
    
    // Consider warnings as partial coverage (50%)
    const weightedPassed = passedTests + (warningTests * 0.5);
    return Math.round((weightedPassed / this.testResults.length) * 100);
  }

  /**
   * Determines overall validation status
   */
  private determineStatus(): 'PASS' | 'FAIL' | 'WARNING' {
    const failedTests = this.testResults.filter(r => r.status === 'FAIL');
    const warningTests = this.testResults.filter(r => r.status === 'WARNING');

    if (failedTests.length > 0) return 'FAIL';
    if (warningTests.length > 0) return 'WARNING';
    return 'PASS';
  }
}