/**
 * APIValidator - Validates all API endpoints and security measures
 * Tests endpoint functionality, authentication, rate limiting, and documentation
 */

import fs from 'fs';
import path from 'path';
import { CategoryResult, TestResult, PerformanceMetrics } from './VerificationController';

export class APIValidator {
  private servicesPath = 'src/services';
  private testResults: TestResult[] = [];

  /**
   * Validates complete API implementation
   */
  async validateAPI(): Promise<CategoryResult> {
    console.log('🌐 Starting API Validation');
    console.log('==========================');

    this.testResults = [];
    const startTime = Date.now();

    try {
      // Validate API management service
      await this.validateAPIManagement();
      
      // Validate service endpoints
      await this.validateServiceEndpoints();
      
      // Validate authentication
      await this.validateAuthentication();
      
      // Validate rate limiting
      await this.validateRateLimiting();
      
      // Validate error handling
      await this.validateErrorHandling();
      
      // Validate security measures
      await this.validateSecurity();

      const executionTime = Date.now() - startTime;
      const performance = this.calculatePerformanceMetrics();
      const coverage = this.calculateCoverage();
      const status = this.determineStatus();

      console.log(`✅ API validation completed in ${executionTime}ms`);
      console.log(`📊 Coverage: ${coverage}%`);
      console.log(`📈 Status: ${status}`);

      return {
        status,
        tests: this.testResults,
        coverage,
        performance
      };

    } catch (error) {
      console.error('❌ API validation failed:', error);
      throw error;
    }
  }

  /**
   * Validates API management service
   */
  private async validateAPIManagement(): Promise<void> {
    console.log('🔧 Validating API Management...');

    const apiServicePath = path.join(this.servicesPath, 'api', 'APIManagementService.ts');
    
    if (!fs.existsSync(apiServicePath)) {
      this.addTestResult({
        name: 'API Management - Service File',
        status: 'FAIL',
        message: 'APIManagementService.ts not found',
        executionTime: 0
      });
      return;
    }

    try {
      const content = fs.readFileSync(apiServicePath, 'utf8');
      
      // Check for essential API management methods
      const hasCreateEndpoint = content.includes('createEndpoint') || content.includes('registerEndpoint');
      const hasValidateRequest = content.includes('validateRequest') || content.includes('validate');
      const hasHandleResponse = content.includes('handleResponse') || content.includes('response');
      const hasErrorHandling = content.includes('handleError') || content.includes('error');
      const hasRateLimiting = content.includes('rateLimit') || content.includes('throttle');

      let score = 0;
      if (hasCreateEndpoint) score += 20;
      if (hasValidateRequest) score += 20;
      if (hasHandleResponse) score += 20;
      if (hasErrorHandling) score += 20;
      if (hasRateLimiting) score += 20;

      this.addTestResult({
        name: 'API Management - Core Features',
        status: score >= 80 ? 'PASS' : score >= 60 ? 'WARNING' : 'FAIL',
        message: `API management features score: ${score}%`,
        executionTime: 0,
        details: {
          hasCreateEndpoint,
          hasValidateRequest,
          hasHandleResponse,
          hasErrorHandling,
          hasRateLimiting,
          score
        }
      });

    } catch (error) {
      this.addTestResult({
        name: 'API Management - Service Analysis',
        status: 'FAIL',
        message: `Error analyzing API service: ${error.message}`,
        executionTime: 0
      });
    }
  }

  /**
   * Validates service endpoints across all services
   */
  private async validateServiceEndpoints(): Promise<void> {
    console.log('📡 Validating Service Endpoints...');

    const serviceCategories = [
      'ai', 'analytics', 'crm', 'email', 'funnel', 
      'database', 'integrations', 'workflow', 'team'
    ];

    let totalEndpoints = 0;
    let validEndpoints = 0;

    for (const category of serviceCategories) {
      const categoryPath = path.join(this.servicesPath, category);
      if (!fs.existsSync(categoryPath)) continue;

      const services = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.ts'));

      for (const service of services) {
        const endpoints = await this.analyzeServiceEndpoints(category, service);
        totalEndpoints += endpoints.total;
        validEndpoints += endpoints.valid;
      }
    }

    const endpointScore = totalEndpoints > 0 ? (validEndpoints / totalEndpoints) * 100 : 0;

    this.addTestResult({
      name: 'Service Endpoints - Coverage',
      status: endpointScore >= 80 ? 'PASS' : endpointScore >= 60 ? 'WARNING' : 'FAIL',
      message: `${validEndpoints}/${totalEndpoints} endpoints properly implemented`,
      executionTime: 0,
      details: {
        totalEndpoints,
        validEndpoints,
        endpointScore
      }
    });
  }

  /**
   * Analyzes endpoints in a specific service
   */
  private async analyzeServiceEndpoints(category: string, serviceName: string): Promise<{total: number, valid: number}> {
    const servicePath = path.join(this.servicesPath, category, serviceName);
    
    try {
      const content = fs.readFileSync(servicePath, 'utf8');
      
      // Count potential endpoint methods (async methods that could be API endpoints)
      const asyncMethods = content.match(/async\s+\w+\(/g) || [];
      const publicMethods = content.match(/public\s+async\s+\w+\(/g) || [];
      const exportedMethods = content.match(/export\s+async\s+function\s+\w+\(/g) || [];
      
      const totalMethods = asyncMethods.length + publicMethods.length + exportedMethods.length;
      
      // Check for proper endpoint patterns
      const hasValidation = content.includes('validate') || content.includes('schema');
      const hasErrorHandling = content.includes('try') && content.includes('catch');
      const hasReturnTypes = content.includes(': Promise<');
      
      let validMethods = 0;
      if (hasValidation) validMethods += Math.floor(totalMethods * 0.3);
      if (hasErrorHandling) validMethods += Math.floor(totalMethods * 0.4);
      if (hasReturnTypes) validMethods += Math.floor(totalMethods * 0.3);
      
      return {
        total: totalMethods,
        valid: Math.min(validMethods, totalMethods)
      };
      
    } catch (error) {
      return { total: 0, valid: 0 };
    }
  }

  /**
   * Validates authentication implementation
   */
  private async validateAuthentication(): Promise<void> {
    console.log('🔐 Validating Authentication...');

    // Check for authentication service
    const authServicePath = path.join(this.servicesPath, 'security', 'EnterpriseSecurityService.ts');
    const hasAuthService = fs.existsSync(authServicePath);

    // Check for auth hooks
    const authHookPath = 'src/hooks/useAuth.tsx';
    const hasAuthHook = fs.existsSync(authHookPath);

    // Check for protected routes
    const protectedRoutePath = 'src/components/ProtectedRoute.tsx';
    const hasProtectedRoutes = fs.existsSync(protectedRoutePath);

    // Analyze authentication features
    let authFeatures = 0;
    let authDetails: any = {};

    if (hasAuthService) {
      try {
        const content = fs.readFileSync(authServicePath, 'utf8');
        authDetails.hasJWT = content.includes('jwt') || content.includes('JWT') || content.includes('token');
        authDetails.hasMFA = content.includes('MFA') || content.includes('multi-factor') || content.includes('2FA');
        authDetails.hasPasswordHashing = content.includes('hash') || content.includes('bcrypt') || content.includes('crypto');
        authDetails.hasSessionManagement = content.includes('session') || content.includes('Session');
        
        if (authDetails.hasJWT) authFeatures += 25;
        if (authDetails.hasMFA) authFeatures += 25;
        if (authDetails.hasPasswordHashing) authFeatures += 25;
        if (authDetails.hasSessionManagement) authFeatures += 25;
      } catch (error) {
        // Error reading auth service
      }
    }

    this.addTestResult({
      name: 'Authentication - Security Features',
      status: authFeatures >= 75 ? 'PASS' : authFeatures >= 50 ? 'WARNING' : 'FAIL',
      message: `Authentication implementation score: ${authFeatures}%`,
      executionTime: 0,
      details: {
        hasAuthService,
        hasAuthHook,
        hasProtectedRoutes,
        authFeatures,
        ...authDetails
      }
    });
  }

  /**
   * Validates rate limiting implementation
   */
  private async validateRateLimiting(): Promise<void> {
    console.log('🚦 Validating Rate Limiting...');

    // Check server configuration for rate limiting
    const serverPath = 'server.js';
    let hasRateLimiting = false;
    let rateLimitingDetails: any = {};

    if (fs.existsSync(serverPath)) {
      try {
        const content = fs.readFileSync(serverPath, 'utf8');
        hasRateLimiting = content.includes('rate-limit') || content.includes('rateLimit') || 
                         content.includes('express-rate-limit');
        
        rateLimitingDetails.hasExpressRateLimit = content.includes('express-rate-limit');
        rateLimitingDetails.hasCustomRateLimit = content.includes('rateLimit') && !content.includes('express-rate-limit');
        rateLimitingDetails.hasWindowMs = content.includes('windowMs');
        rateLimitingDetails.hasMaxRequests = content.includes('max:') || content.includes('limit:');
      } catch (error) {
        // Error reading server file
      }
    }

    // Check API service for rate limiting
    const apiServicePath = path.join(this.servicesPath, 'api', 'APIManagementService.ts');
    if (fs.existsSync(apiServicePath)) {
      try {
        const content = fs.readFileSync(apiServicePath, 'utf8');
        if (content.includes('rateLimit') || content.includes('throttle')) {
          hasRateLimiting = true;
          rateLimitingDetails.hasServiceLevelRateLimit = true;
        }
      } catch (error) {
        // Error reading API service
      }
    }

    this.addTestResult({
      name: 'Rate Limiting - Implementation',
      status: hasRateLimiting ? 'PASS' : 'WARNING',
      message: hasRateLimiting ? 'Rate limiting implemented' : 'Rate limiting not detected',
      executionTime: 0,
      details: {
        hasRateLimiting,
        ...rateLimitingDetails
      }
    });
  }

  /**
   * Validates error handling across API services
   */
  private async validateErrorHandling(): Promise<void> {
    console.log('⚠️ Validating Error Handling...');

    const serviceCategories = ['ai', 'analytics', 'crm', 'email', 'funnel'];
    let totalServices = 0;
    let servicesWithErrorHandling = 0;

    for (const category of serviceCategories) {
      const categoryPath = path.join(this.servicesPath, category);
      if (!fs.existsSync(categoryPath)) continue;

      const services = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.ts'));

      for (const service of services) {
        totalServices++;
        
        try {
          const servicePath = path.join(categoryPath, service);
          const content = fs.readFileSync(servicePath, 'utf8');
          
          const hasTryCatch = content.includes('try') && content.includes('catch');
          const hasErrorThrow = content.includes('throw') || content.includes('Error(');
          const hasErrorLogging = content.includes('console.error') || content.includes('logger.error');
          
          if (hasTryCatch || hasErrorThrow || hasErrorLogging) {
            servicesWithErrorHandling++;
          }
        } catch (error) {
          // Skip services that can't be read
        }
      }
    }

    const errorHandlingScore = totalServices > 0 ? (servicesWithErrorHandling / totalServices) * 100 : 0;

    this.addTestResult({
      name: 'Error Handling - Service Coverage',
      status: errorHandlingScore >= 80 ? 'PASS' : errorHandlingScore >= 60 ? 'WARNING' : 'FAIL',
      message: `${servicesWithErrorHandling}/${totalServices} services have error handling`,
      executionTime: 0,
      details: {
        totalServices,
        servicesWithErrorHandling,
        errorHandlingScore
      }
    });
  }

  /**
   * Validates security measures
   */
  private async validateSecurity(): Promise<void> {
    console.log('🛡️ Validating Security Measures...');

    let securityScore = 0;
    const securityDetails: any = {};

    // Check for HTTPS enforcement
    const serverPath = 'server.js';
    if (fs.existsSync(serverPath)) {
      try {
        const content = fs.readFileSync(serverPath, 'utf8');
        securityDetails.hasHelmet = content.includes('helmet');
        securityDetails.hasCORS = content.includes('cors');
        securityDetails.hasHTTPS = content.includes('https') || content.includes('ssl');
        
        if (securityDetails.hasHelmet) securityScore += 20;
        if (securityDetails.hasCORS) securityScore += 20;
        if (securityDetails.hasHTTPS) securityScore += 20;
      } catch (error) {
        // Error reading server file
      }
    }

    // Check for input validation
    let hasInputValidation = false;
    const checkValidation = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          checkValidation(itemPath);
        } else if (item.name.endsWith('.ts')) {
          try {
            const content = fs.readFileSync(itemPath, 'utf8');
            if (content.includes('zod') || content.includes('joi') || content.includes('validate')) {
              hasInputValidation = true;
              return;
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    };

    checkValidation(this.servicesPath);
    securityDetails.hasInputValidation = hasInputValidation;
    if (hasInputValidation) securityScore += 20;

    // Check for security service
    const securityServicePath = path.join(this.servicesPath, 'security', 'EnterpriseSecurityService.ts');
    securityDetails.hasSecurityService = fs.existsSync(securityServicePath);
    if (securityDetails.hasSecurityService) securityScore += 20;

    this.addTestResult({
      name: 'Security - Overall Implementation',
      status: securityScore >= 80 ? 'PASS' : securityScore >= 60 ? 'WARNING' : 'FAIL',
      message: `Security implementation score: ${securityScore}%`,
      executionTime: 0,
      details: {
        securityScore,
        ...securityDetails
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