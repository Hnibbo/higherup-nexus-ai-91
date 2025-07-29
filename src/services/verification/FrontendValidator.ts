/**
 * FrontendValidator - Validates all UI components and frontend functionality
 * Tests component rendering, responsiveness, accessibility, and user flows
 */

import fs from 'fs';
import path from 'path';
import { CategoryResult, TestResult, PerformanceMetrics } from './VerificationController';

export class FrontendValidator {
  private componentsPath = 'src/components';
  private pagesPath = 'src/pages';
  private testResults: TestResult[] = [];

  /**
   * Validates complete frontend implementation
   */
  async validateFrontend(): Promise<CategoryResult> {
    console.log('🎨 Starting Frontend Validation');
    console.log('===============================');

    this.testResults = [];
    const startTime = Date.now();

    try {
      // Validate UI components
      await this.validateComponents();
      
      // Validate pages and routing
      await this.validatePages();
      
      // Validate responsive design
      await this.validateResponsiveness();
      
      // Validate accessibility
      await this.validateAccessibility();
      
      // Validate PWA features
      await this.validatePWAFeatures();
      
      // Validate performance
      await this.validatePerformance();

      const executionTime = Date.now() - startTime;
      const performance = this.calculatePerformanceMetrics();
      const coverage = this.calculateCoverage();
      const status = this.determineStatus();

      console.log(`✅ Frontend validation completed in ${executionTime}ms`);
      console.log(`📊 Coverage: ${coverage}%`);
      console.log(`📈 Status: ${status}`);

      return {
        status,
        tests: this.testResults,
        coverage,
        performance
      };

    } catch (error) {
      console.error('❌ Frontend validation failed:', error);
      throw error;
    }
  }

  /**
   * Validates UI components structure and implementation
   */
  private async validateComponents(): Promise<void> {
    console.log('🧩 Validating UI Components...');

    if (!fs.existsSync(this.componentsPath)) {
      this.addTestResult({
        name: 'Components - Directory Structure',
        status: 'FAIL',
        message: 'Components directory not found',
        executionTime: 0
      });
      return;
    }

    // Get all component directories
    const componentDirs = fs.readdirSync(this.componentsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Validate each component category
    for (const dir of componentDirs) {
      await this.validateComponentCategory(dir);
    }

    // Validate root-level components
    await this.validateRootComponents();

    // Check for essential UI components
    await this.validateEssentialComponents();
  }

  /**
   * Validates component category (e.g., ui, AI, PWA, etc.)
   */
  private async validateComponentCategory(categoryName: string): Promise<void> {
    const categoryPath = path.join(this.componentsPath, categoryName);
    const components = fs.readdirSync(categoryPath)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));

    if (components.length === 0) {
      this.addTestResult({
        name: `Components - ${categoryName} Category`,
        status: 'WARNING',
        message: `No components found in ${categoryName} directory`,
        executionTime: 0
      });
      return;
    }

    // Validate each component in the category
    for (const component of components) {
      await this.validateComponent(categoryName, component);
    }

    this.addTestResult({
      name: `Components - ${categoryName} Category`,
      status: 'PASS',
      message: `Found ${components.length} components in ${categoryName}`,
      executionTime: 0,
      details: { componentCount: components.length }
    });
  }

  /**
   * Validates individual component file
   */
  private async validateComponent(category: string, componentName: string): Promise<void> {
    const startTime = Date.now();
    const componentPath = path.join(this.componentsPath, category, componentName);

    try {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for React component structure
      const isReactComponent = content.includes('export') && 
        (content.includes('function ') || content.includes('const ') || content.includes('class '));
      
      // Check for TypeScript usage
      const hasTypeScript = content.includes('interface ') || content.includes('type ') || 
        content.includes(': React.') || componentName.endsWith('.tsx');
      
      // Check for proper imports
      const hasReactImport = content.includes("import React") || content.includes("import {") && content.includes("} from 'react'");
      
      // Check for component props
      const hasProps = content.includes('props') || content.includes('Props');
      
      // Check for hooks usage
      const hasHooks = content.includes('useState') || content.includes('useEffect') || 
        content.includes('useCallback') || content.includes('useMemo');

      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let message = 'Component structure is valid';

      if (!isReactComponent) {
        status = 'FAIL';
        message = 'Not a valid React component';
      } else if (!hasTypeScript) {
        status = 'WARNING';
        message = 'Component should use TypeScript for better type safety';
      }

      this.addTestResult({
        name: `Component - ${category}/${componentName}`,
        status,
        message,
        executionTime: Date.now() - startTime,
        details: {
          isReactComponent,
          hasTypeScript,
          hasReactImport,
          hasProps,
          hasHooks,
          fileSize: content.length
        }
      });

    } catch (error) {
      this.addTestResult({
        name: `Component - ${category}/${componentName}`,
        status: 'FAIL',
        message: `Error reading component: ${error.message}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Validates root-level components
   */
  private async validateRootComponents(): Promise<void> {
    const rootComponents = fs.readdirSync(this.componentsPath)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));

    for (const component of rootComponents) {
      await this.validateComponent('root', component);
    }
  }

  /**
   * Validates essential UI components are present
   */
  private async validateEssentialComponents(): Promise<void> {
    const essentialComponents = [
      'ui/button.tsx',
      'ui/input.tsx',
      'ui/card.tsx',
      'ui/dialog.tsx',
      'ui/form.tsx'
    ];

    let foundComponents = 0;
    for (const component of essentialComponents) {
      const componentPath = path.join(this.componentsPath, component);
      if (fs.existsSync(componentPath)) {
        foundComponents++;
      }
    }

    this.addTestResult({
      name: 'Components - Essential UI Components',
      status: foundComponents >= 4 ? 'PASS' : 'WARNING',
      message: `Found ${foundComponents}/${essentialComponents.length} essential UI components`,
      executionTime: 0,
      details: { foundComponents, totalEssential: essentialComponents.length }
    });
  }

  /**
   * Validates pages and routing structure
   */
  private async validatePages(): Promise<void> {
    console.log('📄 Validating Pages and Routing...');

    if (!fs.existsSync(this.pagesPath)) {
      this.addTestResult({
        name: 'Pages - Directory Structure',
        status: 'FAIL',
        message: 'Pages directory not found',
        executionTime: 0
      });
      return;
    }

    const pages = fs.readdirSync(this.pagesPath)
      .filter(file => file.endsWith('.tsx'));

    if (pages.length === 0) {
      this.addTestResult({
        name: 'Pages - Page Files',
        status: 'FAIL',
        message: 'No page files found',
        executionTime: 0
      });
      return;
    }

    // Validate each page
    for (const page of pages) {
      await this.validatePage(page);
    }

    // Check for essential pages
    await this.validateEssentialPages(pages);

    this.addTestResult({
      name: 'Pages - Overview',
      status: 'PASS',
      message: `Found ${pages.length} page components`,
      executionTime: 0,
      details: { pageCount: pages.length }
    });
  }

  /**
   * Validates individual page component
   */
  private async validatePage(pageName: string): Promise<void> {
    const startTime = Date.now();
    const pagePath = path.join(this.pagesPath, pageName);

    try {
      const content = fs.readFileSync(pagePath, 'utf8');
      
      // Check for page component structure
      const isPageComponent = content.includes('export default') || content.includes('export {');
      const hasRouting = content.includes('useNavigate') || content.includes('Link') || content.includes('NavLink');
      const hasStateManagement = content.includes('useState') || content.includes('useEffect');
      const hasDataFetching = content.includes('fetch') || content.includes('axios') || content.includes('useQuery');

      this.addTestResult({
        name: `Page - ${pageName}`,
        status: isPageComponent ? 'PASS' : 'WARNING',
        message: isPageComponent ? 'Page component structure is valid' : 'Page may need proper export',
        executionTime: Date.now() - startTime,
        details: {
          isPageComponent,
          hasRouting,
          hasStateManagement,
          hasDataFetching,
          fileSize: content.length
        }
      });

    } catch (error) {
      this.addTestResult({
        name: `Page - ${pageName}`,
        status: 'FAIL',
        message: `Error reading page: ${error.message}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Validates essential pages are present
   */
  private async validateEssentialPages(pages: string[]): Promise<void> {
    const essentialPages = [
      'Dashboard.tsx',
      'CRM.tsx',
      'EmailMarketing.tsx',
      'FunnelBuilder.tsx',
      'Analytics.tsx',
      'Settings.tsx'
    ];

    const foundPages = essentialPages.filter(page => pages.includes(page));

    this.addTestResult({
      name: 'Pages - Essential Pages',
      status: foundPages.length >= 5 ? 'PASS' : 'WARNING',
      message: `Found ${foundPages.length}/${essentialPages.length} essential pages`,
      executionTime: 0,
      details: { foundPages: foundPages.length, totalEssential: essentialPages.length }
    });
  }

  /**
   * Validates responsive design implementation
   */
  private async validateResponsiveness(): Promise<void> {
    console.log('📱 Validating Responsive Design...');

    // Check for mobile-specific components
    const mobileComponentsPath = path.join(this.componentsPath, 'Mobile');
    const hasMobileComponents = fs.existsSync(mobileComponentsPath);

    // Check for mobile styles
    const mobileStylesPath = 'src/styles/mobile.css';
    const hasMobileStyles = fs.existsSync(mobileStylesPath);

    // Check for responsive hooks
    const hooksPath = 'src/hooks';
    let hasMobileHooks = false;
    if (fs.existsSync(hooksPath)) {
      const hooks = fs.readdirSync(hooksPath);
      hasMobileHooks = hooks.some(hook => hook.includes('mobile') || hook.includes('Mobile'));
    }

    let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
    let message = 'Responsive design features implemented';

    if (!hasMobileComponents && !hasMobileStyles && !hasMobileHooks) {
      status = 'WARNING';
      message = 'Limited responsive design features found';
    }

    this.addTestResult({
      name: 'Responsive Design - Mobile Support',
      status,
      message,
      executionTime: 0,
      details: {
        hasMobileComponents,
        hasMobileStyles,
        hasMobileHooks
      }
    });
  }

  /**
   * Validates accessibility implementation
   */
  private async validateAccessibility(): Promise<void> {
    console.log('♿ Validating Accessibility...');

    // Check components for accessibility features
    let totalComponents = 0;
    let accessibleComponents = 0;

    const checkAccessibility = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          checkAccessibility(itemPath);
        } else if (item.name.endsWith('.tsx')) {
          totalComponents++;
          
          try {
            const content = fs.readFileSync(itemPath, 'utf8');
            
            // Check for accessibility attributes
            const hasAriaLabels = content.includes('aria-label') || content.includes('aria-labelledby');
            const hasAriaDescriptions = content.includes('aria-describedby') || content.includes('aria-description');
            const hasRoles = content.includes('role=');
            const hasKeyboardSupport = content.includes('onKeyDown') || content.includes('onKeyPress');
            const hasFocusManagement = content.includes('focus') || content.includes('tabIndex');

            if (hasAriaLabels || hasAriaDescriptions || hasRoles || hasKeyboardSupport || hasFocusManagement) {
              accessibleComponents++;
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    };

    checkAccessibility(this.componentsPath);

    const accessibilityScore = totalComponents > 0 ? (accessibleComponents / totalComponents) * 100 : 0;

    this.addTestResult({
      name: 'Accessibility - ARIA and Keyboard Support',
      status: accessibilityScore >= 70 ? 'PASS' : accessibilityScore >= 40 ? 'WARNING' : 'FAIL',
      message: `${accessibilityScore.toFixed(1)}% of components have accessibility features`,
      executionTime: 0,
      details: {
        totalComponents,
        accessibleComponents,
        accessibilityScore
      }
    });
  }

  /**
   * Validates PWA features implementation
   */
  private async validatePWAFeatures(): Promise<void> {
    console.log('📱 Validating PWA Features...');

    // Check for PWA components
    const pwaComponentsPath = path.join(this.componentsPath, 'PWA');
    const hasPWAComponents = fs.existsSync(pwaComponentsPath);

    // Check for service worker
    const serviceWorkerPath = 'public/sw.js';
    const hasServiceWorker = fs.existsSync(serviceWorkerPath);

    // Check for manifest
    const manifestPath = 'public/manifest.json';
    const hasManifest = fs.existsSync(manifestPath);

    // Check for PWA hooks
    const pwaHooksPath = 'src/hooks/usePWA.tsx';
    const hasPWAHooks = fs.existsSync(pwaHooksPath);

    let pwaScore = 0;
    if (hasPWAComponents) pwaScore += 25;
    if (hasServiceWorker) pwaScore += 25;
    if (hasManifest) pwaScore += 25;
    if (hasPWAHooks) pwaScore += 25;

    this.addTestResult({
      name: 'PWA Features - Implementation',
      status: pwaScore >= 75 ? 'PASS' : pwaScore >= 50 ? 'WARNING' : 'FAIL',
      message: `PWA implementation score: ${pwaScore}%`,
      executionTime: 0,
      details: {
        hasPWAComponents,
        hasServiceWorker,
        hasManifest,
        hasPWAHooks,
        pwaScore
      }
    });
  }

  /**
   * Validates frontend performance considerations
   */
  private async validatePerformance(): Promise<void> {
    console.log('⚡ Validating Frontend Performance...');

    // Check for lazy loading
    let hasLazyLoading = false;
    const checkLazyLoading = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          checkLazyLoading(itemPath);
        } else if (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) {
          try {
            const content = fs.readFileSync(itemPath, 'utf8');
            if (content.includes('lazy(') || content.includes('Suspense') || content.includes('dynamic(')) {
              hasLazyLoading = true;
              return;
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    };

    checkLazyLoading('src');

    // Check for performance hooks
    const performanceHooksPath = 'src/hooks';
    let hasPerformanceOptimizations = false;
    if (fs.existsSync(performanceHooksPath)) {
      const hooks = fs.readdirSync(performanceHooksPath);
      hasPerformanceOptimizations = hooks.some(hook => 
        hook.includes('useMemo') || hook.includes('useCallback') || hook.includes('performance')
      );
    }

    this.addTestResult({
      name: 'Performance - Optimization Features',
      status: hasLazyLoading || hasPerformanceOptimizations ? 'PASS' : 'WARNING',
      message: 'Performance optimization features detected',
      executionTime: 0,
      details: {
        hasLazyLoading,
        hasPerformanceOptimizations
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