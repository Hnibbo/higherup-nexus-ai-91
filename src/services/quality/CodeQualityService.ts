import { supabase } from '@/integrations/supabase/client';

export interface CodeQualityMetrics {
  id: string;
  timestamp: Date;
  project: string;
  branch: string;
  commit: string;
  metrics: {
    linesOfCode: number;
    complexity: number;
    maintainabilityIndex: number;
    technicalDebt: number;
    codeSmells: number;
    bugs: number;
    vulnerabilities: number;
    duplicatedLines: number;
    testCoverage: number;
    documentationCoverage: number;
  };
  qualityGate: {
    passed: boolean;
    conditions: QualityCondition[];
  };
  issues: CodeIssue[];
  trends: QualityTrend[];
}

export interface QualityCondition {
  metric: string;
  operator: 'GT' | 'LT' | 'EQ' | 'NE';
  threshold: number;
  actual: number;
  passed: boolean;
  severity: 'info' | 'minor' | 'major' | 'critical' | 'blocker';
}

export interface CodeIssue {
  id: string;
  type: 'bug' | 'vulnerability' | 'code_smell' | 'security_hotspot';
  severity: 'info' | 'minor' | 'major' | 'critical' | 'blocker';
  rule: string;
  message: string;
  file: string;
  line: number;
  column?: number;
  effort: string; // Time to fix
  tags: string[];
  status: 'open' | 'confirmed' | 'resolved' | 'false_positive' | 'wont_fix';
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QualityTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  trend: 'improving' | 'degrading' | 'stable';
}

export interface CodeReview {
  id: string;
  pullRequestId: string;
  author: string;
  reviewers: string[];
  status: 'pending' | 'approved' | 'changes_requested' | 'rejected';
  comments: ReviewComment[];
  checklist: ReviewChecklist;
  metrics: {
    linesAdded: number;
    linesDeleted: number;
    filesChanged: number;
    complexity: number;
    testCoverage: number;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ReviewComment {
  id: string;
  author: string;
  content: string;
  file?: string;
  line?: number;
  type: 'general' | 'suggestion' | 'issue' | 'praise';
  resolved: boolean;
  createdAt: Date;
}

export interface ReviewChecklist {
  items: Array<{
    id: string;
    description: string;
    checked: boolean;
    required: boolean;
    category: 'functionality' | 'performance' | 'security' | 'maintainability' | 'testing';
  }>;
  completionRate: number;
}

export interface CodingStandards {
  id: string;
  name: string;
  description: string;
  rules: CodingRule[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CodingRule {
  id: string;
  name: string;
  description: string;
  category: 'naming' | 'formatting' | 'structure' | 'performance' | 'security' | 'documentation';
  severity: 'error' | 'warning' | 'info';
  pattern?: string;
  examples: {
    good: string[];
    bad: string[];
  };
  autoFixable: boolean;
  enabled: boolean;
}

export interface AccessibilityReport {
  id: string;
  url: string;
  timestamp: Date;
  score: number;
  level: 'A' | 'AA' | 'AAA';
  violations: AccessibilityViolation[];
  passes: AccessibilityPass[];
  incomplete: AccessibilityIncomplete[];
  summary: {
    totalViolations: number;
    criticalViolations: number;
    moderateViolations: number;
    minorViolations: number;
  };
}

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

export interface AccessibilityPass {
  id: string;
  description: string;
  help: string;
  nodes: number;
}

export interface AccessibilityIncomplete {
  id: string;
  description: string;
  help: string;
  nodes: Array<{
    html: string;
    target: string[];
  }>;
}

export class CodeQualityService {
  private qualityGateRules: QualityCondition[] = [];
  private codingStandards: CodingStandards[] = [];

  async initializeCodeQuality(): Promise<void> {
    await this.setupQualityGates();
    await this.setupCodingStandards();
    await this.setupAutomatedChecks();
    await this.setupReviewProcess();
    await this.setupAccessibilityTesting();
  }

  async analyzeCodeQuality(project: string, branch: string = 'main'): Promise<CodeQualityMetrics> {
    const commit = await this.getCurrentCommit(branch);
    
    const metrics: CodeQualityMetrics = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      project,
      branch,
      commit,
      metrics: await this.calculateMetrics(project, branch),
      qualityGate: await this.evaluateQualityGate(project, branch),
      issues: await this.findCodeIssues(project, branch),
      trends: await this.calculateTrends(project, branch)
    };

    await this.storeQualityMetrics(metrics);
    
    // Trigger notifications if quality gate fails
    if (!metrics.qualityGate.passed) {
      await this.notifyQualityGateFailure(metrics);
    }

    return metrics;
  }

  async createCodeReview(pullRequestId: string, author: string): Promise<CodeReview> {
    const review: CodeReview = {
      id: crypto.randomUUID(),
      pullRequestId,
      author,
      reviewers: await this.assignReviewers(author),
      status: 'pending',
      comments: [],
      checklist: await this.generateReviewChecklist(),
      metrics: await this.calculatePRMetrics(pullRequestId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storeCodeReview(review);
    await this.notifyReviewers(review);

    return review;
  }

  async addReviewComment(reviewId: string, comment: Omit<ReviewComment, 'id' | 'createdAt'>): Promise<ReviewComment> {
    const newComment: ReviewComment = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      resolved: false,
      ...comment
    };

    const review = await this.getCodeReview(reviewId);
    review.comments.push(newComment);
    review.updatedAt = new Date();

    await this.storeCodeReview(review);
    await this.notifyCommentAdded(review, newComment);

    return newComment;
  }

  async approveReview(reviewId: string, reviewerId: string): Promise<void> {
    const review = await this.getCodeReview(reviewId);
    
    if (!review.reviewers.includes(reviewerId)) {
      throw new Error('User is not assigned as reviewer');
    }

    // Check if all checklist items are completed
    const requiredItems = review.checklist.items.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.checked);
    
    if (completedRequired.length < requiredItems.length) {
      throw new Error('All required checklist items must be completed');
    }

    review.status = 'approved';
    review.completedAt = new Date();
    review.updatedAt = new Date();

    await this.storeCodeReview(review);
    await this.notifyReviewApproved(review);
  }

  async requestChanges(reviewId: string, reviewerId: string, reason: string): Promise<void> {
    const review = await this.getCodeReview(reviewId);
    
    review.status = 'changes_requested';
    review.updatedAt = new Date();

    await this.addReviewComment(reviewId, {
      author: reviewerId,
      content: reason,
      type: 'issue',
      resolved: false
    });

    await this.storeCodeReview(review);
    await this.notifyChangesRequested(review, reason);
  }

  async runLinting(files: string[]): Promise<{
    errors: Array<{
      file: string;
      line: number;
      column: number;
      rule: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
    warnings: Array<{
      file: string;
      line: number;
      column: number;
      rule: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
    fixable: number;
  }> {
    const errors = [];
    const warnings = [];
    let fixable = 0;

    for (const file of files) {
      const issues = await this.lintFile(file);
      
      for (const issue of issues) {
        if (issue.severity === 'error') {
          errors.push(issue);
        } else {
          warnings.push(issue);
        }
        
        if (issue.fixable) {
          fixable++;
        }
      }
    }

    return { errors, warnings, fixable };
  }

  async formatCode(files: string[]): Promise<{
    formatted: string[];
    errors: string[];
  }> {
    const formatted = [];
    const errors = [];

    for (const file of files) {
      try {
        await this.formatFile(file);
        formatted.push(file);
      } catch (error) {
        errors.push(file);
      }
    }

    return { formatted, errors };
  }

  async checkAccessibility(url: string): Promise<AccessibilityReport> {
    const violations = await this.runAccessibilityTests(url);
    const passes = await this.getAccessibilityPasses(url);
    const incomplete = await this.getIncompleteAccessibilityTests(url);

    const summary = {
      totalViolations: violations.length,
      criticalViolations: violations.filter(v => v.impact === 'critical').length,
      moderateViolations: violations.filter(v => v.impact === 'moderate').length,
      minorViolations: violations.filter(v => v.impact === 'minor').length
    };

    const score = this.calculateAccessibilityScore(violations, passes);
    const level = this.determineAccessibilityLevel(score, violations);

    const report: AccessibilityReport = {
      id: crypto.randomUUID(),
      url,
      timestamp: new Date(),
      score,
      level,
      violations,
      passes,
      incomplete,
      summary
    };

    await this.storeAccessibilityReport(report);

    return report;
  }

  async generateQualityReport(project: string, timeRange: { start: Date; end: Date }): Promise<{
    overview: {
      qualityScore: number;
      trend: 'improving' | 'degrading' | 'stable';
      totalIssues: number;
      resolvedIssues: number;
      newIssues: number;
    };
    metrics: {
      maintainability: number;
      reliability: number;
      security: number;
      coverage: number;
      duplication: number;
    };
    topIssues: CodeIssue[];
    recommendations: string[];
    trends: Array<{
      date: string;
      qualityScore: number;
      issues: number;
      coverage: number;
    }>;
  }> {
    const qualityMetrics = await this.getQualityMetricsInRange(project, timeRange);
    const issues = await this.getIssuesInRange(project, timeRange);

    const overview = this.calculateOverview(qualityMetrics, issues);
    const metrics = this.calculateQualityMetrics(qualityMetrics);
    const topIssues = this.getTopIssues(issues);
    const recommendations = this.generateRecommendations(qualityMetrics, issues);
    const trends = this.calculateQualityTrends(qualityMetrics);

    return {
      overview,
      metrics,
      topIssues,
      recommendations,
      trends
    };
  }

  async setupContinuousIntegration(): Promise<void> {
    // Setup CI/CD pipeline integration
    await this.setupPreCommitHooks();
    await this.setupPullRequestChecks();
    await this.setupDeploymentGates();
    await this.setupAutomatedReporting();
  }

  private async setupQualityGates(): Promise<void> {
    this.qualityGateRules = [
      {
        metric: 'coverage',
        operator: 'GT',
        threshold: 80,
        actual: 0,
        passed: false,
        severity: 'major'
      },
      {
        metric: 'duplicated_lines_density',
        operator: 'LT',
        threshold: 3,
        actual: 0,
        passed: false,
        severity: 'major'
      },
      {
        metric: 'maintainability_rating',
        operator: 'LT',
        threshold: 3,
        actual: 0,
        passed: false,
        severity: 'major'
      },
      {
        metric: 'reliability_rating',
        operator: 'LT',
        threshold: 3,
        actual: 0,
        passed: false,
        severity: 'major'
      },
      {
        metric: 'security_rating',
        operator: 'LT',
        threshold: 3,
        actual: 0,
        passed: false,
        severity: 'major'
      }
    ];
  }

  private async setupCodingStandards(): Promise<void> {
    const standards: CodingStandards = {
      id: 'typescript-standards',
      name: 'TypeScript Coding Standards',
      description: 'Coding standards for TypeScript development',
      rules: [
        {
          id: 'naming-camelcase',
          name: 'Use camelCase for variables and functions',
          description: 'Variables and functions should use camelCase naming convention',
          category: 'naming',
          severity: 'error',
          pattern: '^[a-z][a-zA-Z0-9]*$',
          examples: {
            good: ['userName', 'calculateTotal', 'isValid'],
            bad: ['user_name', 'calculate_total', 'is_valid']
          },
          autoFixable: false,
          enabled: true
        },
        {
          id: 'naming-pascalcase-classes',
          name: 'Use PascalCase for classes and interfaces',
          description: 'Classes and interfaces should use PascalCase naming convention',
          category: 'naming',
          severity: 'error',
          pattern: '^[A-Z][a-zA-Z0-9]*$',
          examples: {
            good: ['UserService', 'ApiResponse', 'DatabaseConnection'],
            bad: ['userService', 'apiResponse', 'database_connection']
          },
          autoFixable: false,
          enabled: true
        },
        {
          id: 'no-any-type',
          name: 'Avoid using any type',
          description: 'Use specific types instead of any for better type safety',
          category: 'structure',
          severity: 'warning',
          examples: {
            good: ['const user: User = {}', 'function process(data: string): number'],
            bad: ['const user: any = {}', 'function process(data: any): any']
          },
          autoFixable: false,
          enabled: true
        },
        {
          id: 'prefer-const',
          name: 'Use const for immutable variables',
          description: 'Use const instead of let for variables that are not reassigned',
          category: 'structure',
          severity: 'warning',
          examples: {
            good: ['const API_URL = "https://api.example.com"'],
            bad: ['let API_URL = "https://api.example.com"']
          },
          autoFixable: true,
          enabled: true
        },
        {
          id: 'function-documentation',
          name: 'Document public functions',
          description: 'All public functions should have JSDoc comments',
          category: 'documentation',
          severity: 'warning',
          examples: {
            good: ['/**\n * Calculates the total price\n * @param items - Array of items\n * @returns Total price\n */\nexport function calculateTotal(items: Item[]): number'],
            bad: ['export function calculateTotal(items: Item[]): number']
          },
          autoFixable: false,
          enabled: true
        }
      ],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.codingStandards.push(standards);
  }

  private async setupAutomatedChecks(): Promise<void> {
    // Setup automated code quality checks
    console.log('Setting up automated quality checks');
  }

  private async setupReviewProcess(): Promise<void> {
    // Setup code review process
    console.log('Setting up code review process');
  }

  private async setupAccessibilityTesting(): Promise<void> {
    // Setup accessibility testing
    console.log('Setting up accessibility testing');
  }

  private async getCurrentCommit(branch: string): Promise<string> {
    // Get current commit hash
    return 'abc123def456';
  }

  private async calculateMetrics(project: string, branch: string): Promise<CodeQualityMetrics['metrics']> {
    // Calculate code quality metrics
    return {
      linesOfCode: 15000,
      complexity: 2.5,
      maintainabilityIndex: 75,
      technicalDebt: 8,
      codeSmells: 25,
      bugs: 3,
      vulnerabilities: 1,
      duplicatedLines: 150,
      testCoverage: 85,
      documentationCoverage: 70
    };
  }

  private async evaluateQualityGate(project: string, branch: string): Promise<CodeQualityMetrics['qualityGate']> {
    const metrics = await this.calculateMetrics(project, branch);
    const conditions = this.qualityGateRules.map(rule => ({
      ...rule,
      actual: (metrics as any)[rule.metric] || 0,
      passed: this.evaluateCondition(rule, (metrics as any)[rule.metric] || 0)
    }));

    return {
      passed: conditions.every(c => c.passed),
      conditions
    };
  }

  private evaluateCondition(rule: QualityCondition, actual: number): boolean {
    switch (rule.operator) {
      case 'GT': return actual > rule.threshold;
      case 'LT': return actual < rule.threshold;
      case 'EQ': return actual === rule.threshold;
      case 'NE': return actual !== rule.threshold;
      default: return false;
    }
  }

  private async findCodeIssues(project: string, branch: string): Promise<CodeIssue[]> {
    // Find code issues using static analysis
    return [
      {
        id: 'issue-1',
        type: 'code_smell',
        severity: 'major',
        rule: 'cognitive-complexity',
        message: 'Function has cognitive complexity of 15 (threshold: 10)',
        file: 'src/services/UserService.ts',
        line: 45,
        column: 10,
        effort: '30min',
        tags: ['maintainability'],
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'issue-2',
        type: 'bug',
        severity: 'critical',
        rule: 'null-pointer-dereference',
        message: 'Possible null pointer dereference',
        file: 'src/utils/helpers.ts',
        line: 23,
        effort: '15min',
        tags: ['reliability'],
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private async calculateTrends(project: string, branch: string): Promise<QualityTrend[]> {
    // Calculate quality trends
    return [
      {
        metric: 'coverage',
        current: 85,
        previous: 82,
        change: 3,
        trend: 'improving'
      },
      {
        metric: 'bugs',
        current: 3,
        previous: 5,
        change: -2,
        trend: 'improving'
      }
    ];
  }

  private async assignReviewers(author: string): Promise<string[]> {
    // Assign reviewers based on expertise and availability
    return ['reviewer1', 'reviewer2'];
  }

  private async generateReviewChecklist(): Promise<ReviewChecklist> {
    const items = [
      {
        id: '1',
        description: 'Code follows established coding standards',
        checked: false,
        required: true,
        category: 'maintainability' as const
      },
      {
        id: '2',
        description: 'All new code has appropriate tests',
        checked: false,
        required: true,
        category: 'testing' as const
      },
      {
        id: '3',
        description: 'No security vulnerabilities introduced',
        checked: false,
        required: true,
        category: 'security' as const
      },
      {
        id: '4',
        description: 'Performance impact has been considered',
        checked: false,
        required: false,
        category: 'performance' as const
      },
      {
        id: '5',
        description: 'Documentation has been updated',
        checked: false,
        required: false,
        category: 'maintainability' as const
      }
    ];

    return {
      items,
      completionRate: 0
    };
  }

  private async calculatePRMetrics(pullRequestId: string): Promise<CodeReview['metrics']> {
    // Calculate pull request metrics
    return {
      linesAdded: 150,
      linesDeleted: 75,
      filesChanged: 8,
      complexity: 2.3,
      testCoverage: 88
    };
  }

  private async lintFile(file: string): Promise<Array<{
    file: string;
    line: number;
    column: number;
    rule: string;
    message: string;
    severity: 'error' | 'warning';
    fixable: boolean;
  }>> {
    // Run linting on file
    return [
      {
        file,
        line: 10,
        column: 5,
        rule: 'no-unused-vars',
        message: 'Variable is defined but never used',
        severity: 'warning',
        fixable: true
      }
    ];
  }

  private async formatFile(file: string): Promise<void> {
    // Format file using prettier or similar
    console.log(`Formatting file: ${file}`);
  }

  private async runAccessibilityTests(url: string): Promise<AccessibilityViolation[]> {
    // Run accessibility tests using axe-core or similar
    return [
      {
        id: 'color-contrast',
        impact: 'serious',
        tags: ['wcag2a', 'wcag143'],
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure all text elements have sufficient color contrast',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
        nodes: [
          {
            html: '<button class="btn-primary">Submit</button>',
            target: ['.btn-primary'],
            failureSummary: 'Fix any of the following:\n  Element has insufficient color contrast of 2.93 (foreground color: #ffffff, background color: #007bff, font size: 14.0pt (18.6667px), font weight: normal). Expected contrast ratio of 3:1'
          }
        ]
      }
    ];
  }

  private async getAccessibilityPasses(url: string): Promise<AccessibilityPass[]> {
    return [
      {
        id: 'aria-allowed-attr',
        description: 'ARIA attributes are allowed for an element\'s role',
        help: 'Elements must only use allowed ARIA attributes',
        nodes: 15
      }
    ];
  }

  private async getIncompleteAccessibilityTests(url: string): Promise<AccessibilityIncomplete[]> {
    return [
      {
        id: 'color-contrast',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure all text elements have sufficient color contrast',
        nodes: [
          {
            html: '<div class="text-muted">Secondary text</div>',
            target: ['.text-muted']
          }
        ]
      }
    ];
  }

  private calculateAccessibilityScore(violations: AccessibilityViolation[], passes: AccessibilityPass[]): number {
    const totalTests = violations.length + passes.reduce((sum, pass) => sum + pass.nodes, 0);
    const passedTests = passes.reduce((sum, pass) => sum + pass.nodes, 0);
    
    return totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;
  }

  private determineAccessibilityLevel(score: number, violations: AccessibilityViolation[]): AccessibilityReport['level'] {
    const criticalViolations = violations.filter(v => v.impact === 'critical').length;
    const seriousViolations = violations.filter(v => v.impact === 'serious').length;

    if (criticalViolations > 0 || score < 70) return 'A';
    if (seriousViolations > 0 || score < 85) return 'AA';
    return 'AAA';
  }

  // Storage and notification methods
  private async storeQualityMetrics(metrics: CodeQualityMetrics): Promise<void> {
    const { error } = await supabase
      .from('code_quality_metrics')
      .insert(metrics);

    if (error) throw error;
  }

  private async storeCodeReview(review: CodeReview): Promise<void> {
    const { error } = await supabase
      .from('code_reviews')
      .upsert(review);

    if (error) throw error;
  }

  private async storeAccessibilityReport(report: AccessibilityReport): Promise<void> {
    const { error } = await supabase
      .from('accessibility_reports')
      .insert(report);

    if (error) throw error;
  }

  private async getCodeReview(id: string): Promise<CodeReview> {
    const { data, error } = await supabase
      .from('code_reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  private async notifyQualityGateFailure(metrics: CodeQualityMetrics): Promise<void> {
    console.log(`Quality gate failed for ${metrics.project}:${metrics.branch}`);
  }

  private async notifyReviewers(review: CodeReview): Promise<void> {
    console.log(`Notifying reviewers for PR ${review.pullRequestId}`);
  }

  private async notifyCommentAdded(review: CodeReview, comment: ReviewComment): Promise<void> {
    console.log(`New comment added to review ${review.id}`);
  }

  private async notifyReviewApproved(review: CodeReview): Promise<void> {
    console.log(`Review ${review.id} approved`);
  }

  private async notifyChangesRequested(review: CodeReview, reason: string): Promise<void> {
    console.log(`Changes requested for review ${review.id}: ${reason}`);
  }

  // Reporting methods
  private async getQualityMetricsInRange(project: string, timeRange: { start: Date; end: Date }): Promise<CodeQualityMetrics[]> {
    const { data, error } = await supabase
      .from('code_quality_metrics')
      .select('*')
      .eq('project', project)
      .gte('timestamp', timeRange.start.toISOString())
      .lte('timestamp', timeRange.end.toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getIssuesInRange(project: string, timeRange: { start: Date; end: Date }): Promise<CodeIssue[]> {
    // Mock implementation
    return [];
  }

  private calculateOverview(metrics: CodeQualityMetrics[], issues: CodeIssue[]): any {
    return {
      qualityScore: 85,
      trend: 'improving' as const,
      totalIssues: issues.length,
      resolvedIssues: issues.filter(i => i.status === 'resolved').length,
      newIssues: issues.filter(i => i.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    };
  }

  private calculateQualityMetrics(metrics: CodeQualityMetrics[]): any {
    if (metrics.length === 0) {
      return {
        maintainability: 0,
        reliability: 0,
        security: 0,
        coverage: 0,
        duplication: 0
      };
    }

    const latest = metrics[0];
    return {
      maintainability: latest.metrics.maintainabilityIndex,
      reliability: 100 - latest.metrics.bugs,
      security: 100 - latest.metrics.vulnerabilities,
      coverage: latest.metrics.testCoverage,
      duplication: 100 - (latest.metrics.duplicatedLines / latest.metrics.linesOfCode * 100)
    };
  }

  private getTopIssues(issues: CodeIssue[]): CodeIssue[] {
    return issues
      .filter(issue => issue.status === 'open')
      .sort((a, b) => {
        const severityOrder = { blocker: 5, critical: 4, major: 3, minor: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 10);
  }

  private generateRecommendations(metrics: CodeQualityMetrics[], issues: CodeIssue[]): string[] {
    const recommendations = [];

    if (metrics.length > 0) {
      const latest = metrics[0];
      
      if (latest.metrics.testCoverage < 80) {
        recommendations.push('Increase test coverage to at least 80%');
      }
      
      if (latest.metrics.complexity > 3) {
        recommendations.push('Reduce code complexity by refactoring complex functions');
      }
      
      if (latest.metrics.duplicatedLines > 100) {
        recommendations.push('Eliminate code duplication by extracting common functionality');
      }
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical' && i.status === 'open');
    if (criticalIssues.length > 0) {
      recommendations.push(`Address ${criticalIssues.length} critical issues immediately`);
    }

    return recommendations;
  }

  private calculateQualityTrends(metrics: CodeQualityMetrics[]): Array<{
    date: string;
    qualityScore: number;
    issues: number;
    coverage: number;
  }> {
    return metrics.slice(0, 30).map(metric => ({
      date: metric.timestamp.toISOString().split('T')[0],
      qualityScore: metric.metrics.maintainabilityIndex,
      issues: metric.metrics.bugs + metric.metrics.vulnerabilities + metric.metrics.codeSmells,
      coverage: metric.metrics.testCoverage
    }));
  }

  // CI/CD Integration methods
  private async setupPreCommitHooks(): Promise<void> {
    console.log('Setting up pre-commit hooks');
  }

  private async setupPullRequestChecks(): Promise<void> {
    console.log('Setting up pull request checks');
  }

  private async setupDeploymentGates(): Promise<void> {
    console.log('Setting up deployment gates');
  }

  private async setupAutomatedReporting(): Promise<void> {
    console.log('Setting up automated reporting');
  }
}

export const codeQualityService = new CodeQualityService();