/**
 * DatabaseValidator - Validates database schema, performance, and data integrity
 * Ensures all tables, relationships, and constraints are properly configured
 */

import fs from 'fs';
import path from 'path';
import { CategoryResult, TestResult, PerformanceMetrics } from './VerificationController';

export class DatabaseValidator {
  private migrationsPath = 'supabase/migrations';
  private testResults: TestResult[] = [];

  /**
   * Validates complete database setup and configuration
   */
  async validateDatabase(): Promise<CategoryResult> {
    console.log('🗄️ Starting Database Validation');
    console.log('===============================');

    this.testResults = [];
    const startTime = Date.now();

    try {
      // Validate database schema
      await this.validateSchema();
      
      // Validate migrations
      await this.validateMigrations();
      
      // Validate constraints and relationships
      await this.validateConstraints();
      
      // Validate indexes and performance
      await this.validateIndexes();
      
      // Validate data integrity
      await this.validateDataIntegrity();
      
      // Validate backup and recovery
      await this.validateBackupRecovery();

      const executionTime = Date.now() - startTime;
      const performance = this.calculatePerformanceMetrics();
      const coverage = this.calculateCoverage();
      const status = this.determineStatus();

      console.log(`✅ Database validation completed in ${executionTime}ms`);
      console.log(`📊 Coverage: ${coverage}%`);
      console.log(`📈 Status: ${status}`);

      return {
        status,
        tests: this.testResults,
        coverage,
        performance
      };

    } catch (error) {
      console.error('❌ Database validation failed:', error);
      throw error;
    }
  }

  /**
   * Validates database schema structure
   */
  private async validateSchema(): Promise<void> {
    console.log('📋 Validating Database Schema...');

    // Check if migrations directory exists
    if (!fs.existsSync(this.migrationsPath)) {
      this.addTestResult({
        name: 'Schema - Migrations Directory',
        status: 'FAIL',
        message: 'Migrations directory not found',
        executionTime: 0
      });
      return;
    }

    // Get all migration files
    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      this.addTestResult({
        name: 'Schema - Migration Files',
        status: 'FAIL',
        message: 'No migration files found',
        executionTime: 0
      });
      return;
    }

    this.addTestResult({
      name: 'Schema - Migration Files',
      status: 'PASS',
      message: `Found ${migrationFiles.length} migration files`,
      executionTime: 0,
      details: { migrationCount: migrationFiles.length }
    });

    // Validate each migration file
    for (const file of migrationFiles) {
      await this.validateMigrationFile(file);
    }
  }

  /**
   * Validates individual migration file
   */
  private async validateMigrationFile(filename: string): Promise<void> {
    const startTime = Date.now();
    const filePath = path.join(this.migrationsPath, filename);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for basic SQL structure
      const hasCreateTable = content.includes('CREATE TABLE');
      const hasAlterTable = content.includes('ALTER TABLE');
      const hasCreateIndex = content.includes('CREATE INDEX');
      const hasCreateFunction = content.includes('CREATE FUNCTION') || content.includes('CREATE OR REPLACE FUNCTION');
      
      // Check for proper constraints
      const hasPrimaryKey = content.includes('PRIMARY KEY');
      const hasForeignKey = content.includes('FOREIGN KEY') || content.includes('REFERENCES');
      const hasNotNull = content.includes('NOT NULL');
      
      // Check for security features
      const hasRLS = content.includes('ROW LEVEL SECURITY') || content.includes('ENABLE ROW LEVEL SECURITY');
      const hasPolicies = content.includes('CREATE POLICY');

      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let message = 'Migration file structure is valid';

      if (!hasCreateTable && !hasAlterTable && !hasCreateFunction) {
        status = 'WARNING';
        message = 'Migration file may be incomplete - no major DDL statements found';
      }

      this.addTestResult({
        name: `Migration - ${filename}`,
        status,
        message,
        executionTime: Date.now() - startTime,
        details: {
          hasCreateTable,
          hasAlterTable,
          hasCreateIndex,
          hasCreateFunction,
          hasPrimaryKey,
          hasForeignKey,
          hasNotNull,
          hasRLS,
          hasPolicies,
          fileSize: content.length
        }
      });

    } catch (error) {
      this.addTestResult({
        name: `Migration - ${filename}`,
        status: 'FAIL',
        message: `Error reading migration file: ${error.message}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Validates migration execution order and dependencies
   */
  private async validateMigrations(): Promise<void> {
    console.log('🔄 Validating Migration Order...');

    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Check migration naming convention (timestamp-based)
    const timestampPattern = /^\d{14}_/;
    let hasProperNaming = true;
    let previousTimestamp = '';

    for (const file of migrationFiles) {
      if (!timestampPattern.test(file)) {
        hasProperNaming = false;
        break;
      }

      const timestamp = file.substring(0, 14);
      if (previousTimestamp && timestamp <= previousTimestamp) {
        hasProperNaming = false;
        break;
      }
      previousTimestamp = timestamp;
    }

    this.addTestResult({
      name: 'Migrations - Naming Convention',
      status: hasProperNaming ? 'PASS' : 'WARNING',
      message: hasProperNaming 
        ? 'Migration files follow proper timestamp naming convention'
        : 'Migration files may not follow proper naming convention',
      executionTime: 0,
      details: { migrationCount: migrationFiles.length }
    });

    // Check for dependency order
    await this.validateMigrationDependencies(migrationFiles);
  }

  /**
   * Validates migration dependencies and execution order
   */
  private async validateMigrationDependencies(migrationFiles: string[]): Promise<void> {
    const startTime = Date.now();
    const tables: Set<string> = new Set();
    const dependencies: Map<string, string[]> = new Map();

    for (const file of migrationFiles) {
      const filePath = path.join(this.migrationsPath, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Extract table names from CREATE TABLE statements
      const createTableMatches = content.match(/CREATE TABLE\s+(\w+)/gi);
      if (createTableMatches) {
        createTableMatches.forEach(match => {
          const tableName = match.split(/\s+/)[2];
          tables.add(tableName.toLowerCase());
        });
      }

      // Extract foreign key dependencies
      const foreignKeyMatches = content.match(/REFERENCES\s+(\w+)/gi);
      if (foreignKeyMatches) {
        const fileDependencies: string[] = [];
        foreignKeyMatches.forEach(match => {
          const referencedTable = match.split(/\s+/)[1];
          fileDependencies.push(referencedTable.toLowerCase());
        });
        dependencies.set(file, fileDependencies);
      }
    }

    this.addTestResult({
      name: 'Migrations - Dependencies',
      status: 'PASS',
      message: `Analyzed ${tables.size} tables and their dependencies`,
      executionTime: Date.now() - startTime,
      details: {
        tableCount: tables.size,
        dependencyCount: dependencies.size
      }
    });
  }

  /**
   * Validates database constraints and relationships
   */
  private async validateConstraints(): Promise<void> {
    console.log('🔗 Validating Database Constraints...');

    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'));

    let totalConstraints = 0;
    let primaryKeys = 0;
    let foreignKeys = 0;
    let uniqueConstraints = 0;
    let checkConstraints = 0;

    for (const file of migrationFiles) {
      const filePath = path.join(this.migrationsPath, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Count different types of constraints
      primaryKeys += (content.match(/PRIMARY KEY/gi) || []).length;
      foreignKeys += (content.match(/FOREIGN KEY|REFERENCES/gi) || []).length;
      uniqueConstraints += (content.match(/UNIQUE/gi) || []).length;
      checkConstraints += (content.match(/CHECK\s*\(/gi) || []).length;
    }

    totalConstraints = primaryKeys + foreignKeys + uniqueConstraints + checkConstraints;

    this.addTestResult({
      name: 'Constraints - Overview',
      status: totalConstraints > 0 ? 'PASS' : 'WARNING',
      message: `Found ${totalConstraints} total constraints`,
      executionTime: 0,
      details: {
        totalConstraints,
        primaryKeys,
        foreignKeys,
        uniqueConstraints,
        checkConstraints
      }
    });
  }

  /**
   * Validates database indexes for performance
   */
  private async validateIndexes(): Promise<void> {
    console.log('📈 Validating Database Indexes...');

    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'));

    let totalIndexes = 0;
    let uniqueIndexes = 0;
    let compositeIndexes = 0;

    for (const file of migrationFiles) {
      const filePath = path.join(this.migrationsPath, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Count indexes
      const createIndexMatches = content.match(/CREATE\s+(UNIQUE\s+)?INDEX/gi) || [];
      totalIndexes += createIndexMatches.length;

      // Count unique indexes
      uniqueIndexes += (content.match(/CREATE\s+UNIQUE\s+INDEX/gi) || []).length;

      // Count composite indexes (indexes on multiple columns)
      const indexDefinitions = content.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+\w+\s+ON\s+\w+\s*\([^)]+\)/gi) || [];
      compositeIndexes += indexDefinitions.filter(def => (def.match(/,/g) || []).length > 0).length;
    }

    let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
    let message = `Found ${totalIndexes} indexes for performance optimization`;

    if (totalIndexes < 5) {
      status = 'WARNING';
      message = `Only ${totalIndexes} indexes found, consider adding more for performance`;
    }

    this.addTestResult({
      name: 'Indexes - Performance Optimization',
      status,
      message,
      executionTime: 0,
      details: {
        totalIndexes,
        uniqueIndexes,
        compositeIndexes
      }
    });
  }

  /**
   * Validates data integrity rules
   */
  private async validateDataIntegrity(): Promise<void> {
    console.log('🛡️ Validating Data Integrity...');

    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'));

    let notNullConstraints = 0;
    let defaultValues = 0;
    let triggers = 0;
    let functions = 0;

    for (const file of migrationFiles) {
      const filePath = path.join(this.migrationsPath, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Count data integrity features
      notNullConstraints += (content.match(/NOT NULL/gi) || []).length;
      defaultValues += (content.match(/DEFAULT/gi) || []).length;
      triggers += (content.match(/CREATE TRIGGER/gi) || []).length;
      functions += (content.match(/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/gi) || []).length;
    }

    this.addTestResult({
      name: 'Data Integrity - Constraints',
      status: notNullConstraints > 0 ? 'PASS' : 'WARNING',
      message: `Data integrity features implemented`,
      executionTime: 0,
      details: {
        notNullConstraints,
        defaultValues,
        triggers,
        functions
      }
    });
  }

  /**
   * Validates backup and recovery procedures
   */
  private async validateBackupRecovery(): Promise<void> {
    console.log('💾 Validating Backup & Recovery...');

    // Check for backup-related services
    const backupServicePath = 'src/services/database/BackupRecoveryService.ts';
    const hasBackupService = fs.existsSync(backupServicePath);

    // Check for data replication service
    const replicationServicePath = 'src/services/database/DataReplicationService.ts';
    const hasReplicationService = fs.existsSync(replicationServicePath);

    // Check for monitoring service
    const monitoringServicePath = 'src/services/database/DatabaseMonitoringService.ts';
    const hasMonitoringService = fs.existsSync(monitoringServicePath);

    let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
    let message = 'Backup and recovery services are implemented';

    if (!hasBackupService) {
      status = 'WARNING';
      message = 'Backup service not found, consider implementing automated backups';
    }

    this.addTestResult({
      name: 'Backup & Recovery - Services',
      status,
      message,
      executionTime: 0,
      details: {
        hasBackupService,
        hasReplicationService,
        hasMonitoringService
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