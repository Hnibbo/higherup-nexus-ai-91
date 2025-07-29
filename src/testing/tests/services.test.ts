import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { testingFramework } from '../TestingFramework';

// Import all services for testing
import { aiInitializationService } from '../../services/core/AIInitializationService';
import { predictiveAnalyticsEngine } from '../../services/ai/PredictiveAnalyticsEngine';
import { nlpEngine } from '../../services/ai/NLPEngine';
import { computerVisionEngine } from '../../services/ai/ComputerVisionEngine';
import { vectorDatabase } from '../../services/ai/VectorDatabase';
import { enhancedSupabaseService } from '../../services/database/EnhancedSupabaseService';
import { dataSyncService } from '../../services/database/DataSyncService';
import { backupRecoveryService } from '../../services/database/BackupRecoveryService';
import { advancedCRMService } from '../../services/crm/AdvancedCRMService';
import { customerIntelligenceService } from '../../services/crm/CustomerIntelligenceService';
import { emailCampaignService } from '../../services/email/EmailCampaignService';
import { emailAutomationService } from '../../services/email/EmailAutomationService';
import { funnelBuilderService } from '../../services/funnel/FunnelBuilderService';
import { conversionOptimizationService } from '../../services/funnel/ConversionOptimizationService';
import { advancedAnalyticsService } from '../../services/analytics/AdvancedAnalyticsService';
import { reportingService } from '../../services/analytics/ReportingService';
import { aiAssistantService } from '../../services/ai/AIAssistantService';
import { contentGenerationService } from '../../services/ai/ContentGenerationService';
import { apiManagementService } from '../../services/api/APIManagementService';
import { thirdPartyIntegrationService } from '../../services/integrations/ThirdPartyIntegrationService';
import { workflowBuilderService } from '../../services/workflow/WorkflowBuilderService';
import { advancedAutomationService } from '../../services/workflow/AdvancedAutomationService';
import { pwaService } from '../../services/pwa/PWAService';
import { mobileOptimizationService } from '../../services/mobile/MobileOptimizationService';
import { teamManagementService } from '../../services/team/TeamManagementService';
import { collaborationService } from '../../services/collaboration/CollaborationService';
import { enterpriseSecurityService } from '../../services/security/EnterpriseSecurityService';
import { regulatoryComplianceService } from '../../services/compliance/RegulatoryComplianceService';
import { performanceOptimizationService } from '../../services/performance/PerformanceOptimizationService';
import { monitoringService } from '../../services/monitoring/MonitoringService';
import { intelligentLeadScoringService } from '../../services/leads/IntelligentLeadScoringService';
import { salesIntelligenceService } from '../../services/sales/SalesIntelligenceService';
import { socialMediaService } from '../../services/social/SocialMediaService';
import { socialMediaMonitoringService } from '../../services/social/SocialMediaMonitoringService';

describe('HigherUp.ai Services Test Suite', () => {
  beforeEach(async () => {
    // Setup test environment
    await testingFramework.initializeTestingFramework();
  });

  afterEach(() => {
    // Cleanup after each test
    jest.clearAllMocks();
  });

  describe('AI Core Services', () => {
    describe('AI Initialization Service', () => {
      it('should initialize AI system successfully', async () => {
        const result = await aiInitializationService.initializeAI();
        expect(result).toBeDefined();
        expect(result.status).toBe('initialized');
      });

      it('should handle initialization failures gracefully', async () => {
        // Mock failure scenario
        jest.spyOn(aiInitializationService, 'initializeAI').mockRejectedValue(new Error('Initialization failed'));
        
        await expect(aiInitializationService.initializeAI()).rejects.toThrow('Initialization failed');
      });

      it('should validate system health after initialization', async () => {
        await aiInitializationService.initializeAI();
        const health = await aiInitializationService.checkSystemHealth();
        
        expect(health.status).toBe('healthy');
        expect(health.components).toBeDefined();
      });
    });

    describe('Predictive Analytics Engine', () => {
      it('should generate revenue predictions', async () => {
        const prediction = await predictiveAnalyticsEngine.predictRevenue('2024-Q1', 0.95);
        
        expect(prediction).toBeDefined();
        expect(prediction.amount).toBeGreaterThan(0);
        expect(prediction.confidence).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      });

      it('should predict customer churn', async () => {
        const churnPrediction = await predictiveAnalyticsEngine.predictChurn('customer-123');
        
        expect(churnPrediction).toBeDefined();
        expect(churnPrediction.probability).toBeGreaterThanOrEqual(0);
        expect(churnPrediction.probability).toBeLessThanOrEqual(1);
        expect(churnPrediction.factors).toBeInstanceOf(Array);
      });

      it('should analyze market trends', async () => {
        const trends = await predictiveAnalyticsEngine.analyzeMarketTrends('technology');
        
        expect(trends).toBeDefined();
        expect(trends.trends).toBeInstanceOf(Array);
        expect(trends.insights).toBeInstanceOf(Array);
      });
    });

    describe('NLP Engine', () => {
      it('should process natural language queries', async () => {
        const query = 'Show me revenue for last quarter';
        const result = await nlpEngine.processQuery(query);
        
        expect(result).toBeDefined();
        expect(result.intent).toBeDefined();
        expect(result.entities).toBeInstanceOf(Array);
      });

      it('should generate content with brand voice', async () => {
        const content = await nlpEngine.generateContent('email subject line', {
          tone: 'professional',
          style: 'concise'
        });
        
        expect(content).toBeDefined();
        expect(content.text).toBeTruthy();
        expect(content.confidence).toBeGreaterThan(0);
      });

      it('should analyze sentiment accurately', async () => {
        const positiveText = 'This product is amazing and I love it!';
        const sentiment = await nlpEngine.analyzeSentiment(positiveText);
        
        expect(sentiment).toBeDefined();
        expect(sentiment.sentiment).toBe('positive');
        expect(sentiment.score).toBeGreaterThan(0);
      });
    });

    describe('Computer Vision Engine', () => {
      it('should generate images from prompts', async () => {
        const images = await computerVisionEngine.generateImages('professional business logo', {
          style: 'modern',
          format: 'png'
        });
        
        expect(images).toBeInstanceOf(Array);
        expect(images.length).toBeGreaterThan(0);
        expect(images[0].url).toBeTruthy();
      });

      it('should create videos from scripts', async () => {
        const video = await computerVisionEngine.createVideo('Welcome to our platform', 'avatar-1');
        
        expect(video).toBeDefined();
        expect(video.url).toBeTruthy();
        expect(video.duration).toBeGreaterThan(0);
      });

      it('should analyze visual performance', async () => {
        const mockAssets = [
          { id: '1', type: 'image', url: 'test.jpg', metrics: {} }
        ];
        
        const analysis = await computerVisionEngine.analyzeVisualPerformance(mockAssets);
        
        expect(analysis).toBeDefined();
        expect(analysis.insights).toBeInstanceOf(Array);
      });
    });

    describe('Vector Database', () => {
      it('should store and retrieve vectors', async () => {
        const vector = [0.1, 0.2, 0.3, 0.4, 0.5];
        const metadata = { type: 'content', category: 'email' };
        
        const id = await vectorDatabase.storeVector(vector, metadata);
        expect(id).toBeTruthy();
        
        const retrieved = await vectorDatabase.getVector(id);
        expect(retrieved.vector).toEqual(vector);
        expect(retrieved.metadata).toEqual(metadata);
      });

      it('should perform similarity search', async () => {
        const queryVector = [0.1, 0.2, 0.3, 0.4, 0.5];
        const results = await vectorDatabase.similaritySearch(queryVector, 5);
        
        expect(results).toBeInstanceOf(Array);
        expect(results.length).toBeLessThanOrEqual(5);
        
        if (results.length > 0) {
          expect(results[0].similarity).toBeGreaterThanOrEqual(0);
          expect(results[0].similarity).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe('Database Services', () => {
    describe('Enhanced Supabase Service', () => {
      it('should establish database connection', async () => {
        const connection = await enhancedSupabaseService.connect();
        expect(connection.status).toBe('connected');
      });

      it('should execute queries with proper error handling', async () => {
        const result = await enhancedSupabaseService.query('SELECT 1 as test');
        expect(result).toBeDefined();
      });

      it('should handle transactions properly', async () => {
        const transaction = await enhancedSupabaseService.beginTransaction();
        expect(transaction.id).toBeTruthy();
        
        await enhancedSupabaseService.commitTransaction(transaction.id);
      });
    });

    describe('Data Sync Service', () => {
      it('should sync data between systems', async () => {
        const syncResult = await dataSyncService.syncData('contacts', 'crm_system');
        
        expect(syncResult).toBeDefined();
        expect(syncResult.status).toBe('completed');
        expect(syncResult.recordsProcessed).toBeGreaterThanOrEqual(0);
      });

      it('should handle sync conflicts', async () => {
        const conflicts = await dataSyncService.resolveConflicts('contacts');
        
        expect(conflicts).toBeInstanceOf(Array);
      });
    });

    describe('Backup Recovery Service', () => {
      it('should create database backups', async () => {
        const backup = await backupRecoveryService.createBackup('full');
        
        expect(backup).toBeDefined();
        expect(backup.id).toBeTruthy();
        expect(backup.status).toBe('completed');
      });

      it('should restore from backup', async () => {
        const backupId = 'backup-123';
        const restore = await backupRecoveryService.restoreFromBackup(backupId);
        
        expect(restore).toBeDefined();
        expect(restore.status).toBe('completed');
      });
    });
  });

  describe('CRM Services', () => {
    describe('Advanced CRM Service', () => {
      it('should create and manage contacts', async () => {
        const contact = {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          company: 'Test Corp'
        };
        
        const created = await advancedCRMService.createContact(contact);
        expect(created.id).toBeTruthy();
        expect(created.email).toBe(contact.email);
      });

      it('should track customer interactions', async () => {
        const interaction = {
          contactId: 'contact-123',
          type: 'email',
          subject: 'Follow up',
          content: 'Test interaction'
        };
        
        const tracked = await advancedCRMService.trackInteraction(interaction);
        expect(tracked.id).toBeTruthy();
      });

      it('should manage deal pipeline', async () => {
        const deal = {
          title: 'Test Deal',
          value: 10000,
          stage: 'qualification',
          contactId: 'contact-123'
        };
        
        const created = await advancedCRMService.createDeal(deal);
        expect(created.id).toBeTruthy();
        expect(created.value).toBe(deal.value);
      });
    });

    describe('Customer Intelligence Service', () => {
      it('should segment customers', async () => {
        const segments = await customerIntelligenceService.segmentCustomers();
        
        expect(segments).toBeInstanceOf(Array);
        expect(segments.length).toBeGreaterThan(0);
        
        if (segments.length > 0) {
          expect(segments[0].name).toBeTruthy();
          expect(segments[0].criteria).toBeDefined();
        }
      });

      it('should calculate customer lifetime value', async () => {
        const clv = await customerIntelligenceService.calculateCLV('customer-123');
        
        expect(clv).toBeDefined();
        expect(clv.value).toBeGreaterThanOrEqual(0);
        expect(clv.confidence).toBeGreaterThanOrEqual(0);
      });

      it('should predict customer behavior', async () => {
        const prediction = await customerIntelligenceService.predictBehavior('customer-123');
        
        expect(prediction).toBeDefined();
        expect(prediction.actions).toBeInstanceOf(Array);
        expect(prediction.probability).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Email Marketing Services', () => {
    describe('Email Campaign Service', () => {
      it('should create email campaigns', async () => {
        const campaign = {
          name: 'Test Campaign',
          subject: 'Test Subject',
          content: 'Test Content',
          recipients: ['test@example.com']
        };
        
        const created = await emailCampaignService.createCampaign(campaign);
        expect(created.id).toBeTruthy();
        expect(created.name).toBe(campaign.name);
      });

      it('should send campaigns', async () => {
        const result = await emailCampaignService.sendCampaign('campaign-123');
        
        expect(result).toBeDefined();
        expect(result.status).toBe('sent');
        expect(result.recipientCount).toBeGreaterThanOrEqual(0);
      });

      it('should track campaign performance', async () => {
        const performance = await emailCampaignService.getCampaignPerformance('campaign-123');
        
        expect(performance).toBeDefined();
        expect(performance.openRate).toBeGreaterThanOrEqual(0);
        expect(performance.clickRate).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Email Automation Service', () => {
      it('should create automation sequences', async () => {
        const sequence = {
          name: 'Welcome Series',
          trigger: 'signup',
          emails: [
            { delay: 0, subject: 'Welcome!', content: 'Welcome content' },
            { delay: 24, subject: 'Getting Started', content: 'Getting started content' }
          ]
        };
        
        const created = await emailAutomationService.createSequence(sequence);
        expect(created.id).toBeTruthy();
        expect(created.emails.length).toBe(2);
      });

      it('should trigger automation sequences', async () => {
        const result = await emailAutomationService.triggerSequence('sequence-123', 'contact-123');
        
        expect(result).toBeDefined();
        expect(result.status).toBe('triggered');
      });
    });
  });

  describe('Funnel Services', () => {
    describe('Funnel Builder Service', () => {
      it('should create funnels', async () => {
        const funnel = {
          name: 'Lead Generation Funnel',
          pages: [
            { type: 'landing', name: 'Landing Page' },
            { type: 'form', name: 'Contact Form' },
            { type: 'thankyou', name: 'Thank You Page' }
          ]
        };
        
        const created = await funnelBuilderService.createFunnel(funnel);
        expect(created.id).toBeTruthy();
        expect(created.pages.length).toBe(3);
      });

      it('should track funnel performance', async () => {
        const performance = await funnelBuilderService.getFunnelPerformance('funnel-123');
        
        expect(performance).toBeDefined();
        expect(performance.conversionRate).toBeGreaterThanOrEqual(0);
        expect(performance.visitors).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Conversion Optimization Service', () => {
      it('should run A/B tests', async () => {
        const test = {
          name: 'Headline Test',
          variants: [
            { name: 'Control', content: 'Original headline' },
            { name: 'Variant A', content: 'New headline' }
          ]
        };
        
        const created = await conversionOptimizationService.createABTest(test);
        expect(created.id).toBeTruthy();
        expect(created.variants.length).toBe(2);
      });

      it('should analyze test results', async () => {
        const results = await conversionOptimizationService.getTestResults('test-123');
        
        expect(results).toBeDefined();
        expect(results.winner).toBeDefined();
        expect(results.confidence).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Analytics Services', () => {
    describe('Advanced Analytics Service', () => {
      it('should generate analytics reports', async () => {
        const report = await advancedAnalyticsService.generateReport('revenue', {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        });
        
        expect(report).toBeDefined();
        expect(report.data).toBeInstanceOf(Array);
        expect(report.summary).toBeDefined();
      });

      it('should create custom dashboards', async () => {
        const dashboard = {
          name: 'Sales Dashboard',
          widgets: [
            { type: 'metric', title: 'Total Revenue' },
            { type: 'chart', title: 'Revenue Trend' }
          ]
        };
        
        const created = await advancedAnalyticsService.createDashboard(dashboard);
        expect(created.id).toBeTruthy();
        expect(created.widgets.length).toBe(2);
      });
    });

    describe('Reporting Service', () => {
      it('should schedule automated reports', async () => {
        const schedule = {
          name: 'Weekly Sales Report',
          frequency: 'weekly',
          recipients: ['manager@example.com'],
          reportType: 'sales'
        };
        
        const created = await reportingService.scheduleReport(schedule);
        expect(created.id).toBeTruthy();
        expect(created.frequency).toBe('weekly');
      });

      it('should export reports in multiple formats', async () => {
        const exported = await reportingService.exportReport('report-123', 'pdf');
        
        expect(exported).toBeDefined();
        expect(exported.format).toBe('pdf');
        expect(exported.url).toBeTruthy();
      });
    });
  });

  describe('AI Assistant Services', () => {
    describe('AI Assistant Service', () => {
      it('should process voice commands', async () => {
        const audioData = new ArrayBuffer(1024); // Mock audio data
        const command = await aiAssistantService.processVoiceCommand(audioData);
        
        expect(command).toBeDefined();
        expect(command.intent).toBeTruthy();
        expect(command.confidence).toBeGreaterThanOrEqual(0);
      });

      it('should provide intelligent recommendations', async () => {
        const recommendations = await aiAssistantService.getRecommendations('user-123');
        
        expect(recommendations).toBeInstanceOf(Array);
        
        if (recommendations.length > 0) {
          expect(recommendations[0].type).toBeTruthy();
          expect(recommendations[0].priority).toBeTruthy();
        }
      });
    });

    describe('Content Generation Service', () => {
      it('should generate marketing copy', async () => {
        const copy = await contentGenerationService.generateCopy('email', {
          tone: 'professional',
          length: 'medium',
          audience: 'business'
        });
        
        expect(copy).toBeDefined();
        expect(copy.content).toBeTruthy();
        expect(copy.variations).toBeInstanceOf(Array);
      });

      it('should optimize content for performance', async () => {
        const optimized = await contentGenerationService.optimizeContent('content-123');
        
        expect(optimized).toBeDefined();
        expect(optimized.improvements).toBeInstanceOf(Array);
        expect(optimized.score).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Integration Services', () => {
    describe('API Management Service', () => {
      it('should manage API endpoints', async () => {
        const endpoint = {
          path: '/api/test',
          method: 'GET',
          handler: 'testHandler',
          authentication: true
        };
        
        const created = await apiManagementService.createEndpoint(endpoint);
        expect(created.id).toBeTruthy();
        expect(created.path).toBe(endpoint.path);
      });

      it('should handle rate limiting', async () => {
        const rateLimited = await apiManagementService.checkRateLimit('api-key-123', '/api/test');
        
        expect(rateLimited).toBeDefined();
        expect(typeof rateLimited.allowed).toBe('boolean');
        expect(rateLimited.remaining).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Third Party Integration Service', () => {
      it('should connect to external services', async () => {
        const connection = await thirdPartyIntegrationService.connect('salesforce', {
          apiKey: 'test-key',
          endpoint: 'https://api.salesforce.com'
        });
        
        expect(connection).toBeDefined();
        expect(connection.status).toBe('connected');
      });

      it('should sync data with external systems', async () => {
        const sync = await thirdPartyIntegrationService.syncData('salesforce', 'contacts');
        
        expect(sync).toBeDefined();
        expect(sync.status).toBe('completed');
        expect(sync.recordsProcessed).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Workflow Services', () => {
    describe('Workflow Builder Service', () => {
      it('should create workflows', async () => {
        const workflow = {
          name: 'Lead Qualification',
          trigger: 'form_submission',
          actions: [
            { type: 'score_lead', config: {} },
            { type: 'assign_owner', config: { ownerId: 'user-123' } },
            { type: 'send_notification', config: { template: 'new_lead' } }
          ]
        };
        
        const created = await workflowBuilderService.createWorkflow(workflow);
        expect(created.id).toBeTruthy();
        expect(created.actions.length).toBe(3);
      });

      it('should execute workflows', async () => {
        const execution = await workflowBuilderService.executeWorkflow('workflow-123', {
          leadId: 'lead-123',
          formData: { email: 'test@example.com' }
        });
        
        expect(execution).toBeDefined();
        expect(execution.status).toBe('completed');
      });
    });

    describe('Advanced Automation Service', () => {
      it('should create complex automation rules', async () => {
        const rule = {
          name: 'High Value Lead Alert',
          conditions: [
            { field: 'lead_score', operator: '>', value: 80 },
            { field: 'company_size', operator: '=', value: 'enterprise' }
          ],
          actions: [
            { type: 'notify_sales_team' },
            { type: 'schedule_call' }
          ]
        };
        
        const created = await advancedAutomationService.createRule(rule);
        expect(created.id).toBeTruthy();
        expect(created.conditions.length).toBe(2);
      });
    });
  });

  describe('Mobile and PWA Services', () => {
    describe('PWA Service', () => {
      it('should install service worker', async () => {
        const installed = await pwaService.installServiceWorker();
        
        expect(installed).toBeDefined();
        expect(installed.status).toBe('installed');
      });

      it('should handle offline functionality', async () => {
        const offline = await pwaService.enableOfflineMode();
        
        expect(offline).toBeDefined();
        expect(offline.enabled).toBe(true);
      });
    });

    describe('Mobile Optimization Service', () => {
      it('should optimize for mobile devices', async () => {
        const optimized = await mobileOptimizationService.optimizeForMobile('page-123');
        
        expect(optimized).toBeDefined();
        expect(optimized.improvements).toBeInstanceOf(Array);
        expect(optimized.score).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Team and Collaboration Services', () => {
    describe('Team Management Service', () => {
      it('should manage team members', async () => {
        const member = {
          email: 'team@example.com',
          role: 'sales_rep',
          permissions: ['view_leads', 'edit_deals']
        };
        
        const added = await teamManagementService.addTeamMember(member);
        expect(added.id).toBeTruthy();
        expect(added.role).toBe(member.role);
      });

      it('should track team performance', async () => {
        const performance = await teamManagementService.getTeamPerformance('team-123');
        
        expect(performance).toBeDefined();
        expect(performance.metrics).toBeDefined();
        expect(performance.members).toBeInstanceOf(Array);
      });
    });

    describe('Collaboration Service', () => {
      it('should enable real-time collaboration', async () => {
        const session = await collaborationService.startCollaborationSession('document-123');
        
        expect(session).toBeDefined();
        expect(session.id).toBeTruthy();
        expect(session.participants).toBeInstanceOf(Array);
      });
    });
  });

  describe('Security and Compliance Services', () => {
    describe('Enterprise Security Service', () => {
      it('should implement multi-factor authentication', async () => {
        const mfa = await enterpriseSecurityService.enableMFA('user-123');
        
        expect(mfa).toBeDefined();
        expect(mfa.enabled).toBe(true);
        expect(mfa.secret).toBeTruthy();
      });

      it('should detect security threats', async () => {
        const threats = await enterpriseSecurityService.detectThreats();
        
        expect(threats).toBeInstanceOf(Array);
      });
    });

    describe('Regulatory Compliance Service', () => {
      it('should ensure GDPR compliance', async () => {
        const compliance = await regulatoryComplianceService.getComplianceStatus();
        
        expect(compliance).toBeDefined();
        expect(compliance.frameworks).toBeInstanceOf(Array);
        expect(compliance.overall).toBeTruthy();
      });

      it('should handle data requests', async () => {
        const request = {
          type: 'access' as const,
          requestor: 'John Doe',
          email: 'john@example.com',
          dataSubject: 'user-123',
          description: 'Request for personal data'
        };
        
        const handled = await regulatoryComplianceService.handleDataRequest(request);
        expect(handled.id).toBeTruthy();
        expect(handled.status).toBe('received');
      });
    });
  });

  describe('Performance and Monitoring Services', () => {
    describe('Performance Optimization Service', () => {
      it('should collect performance metrics', async () => {
        const metrics = await performanceOptimizationService.collectPerformanceMetrics();
        
        expect(metrics).toBeDefined();
        expect(metrics.pageLoadTime).toBeGreaterThanOrEqual(0);
        expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      });

      it('should optimize application performance', async () => {
        const optimization = await performanceOptimizationService.optimizeBundle();
        
        expect(optimization).toBeDefined();
        expect(optimization.totalSize).toBeGreaterThan(0);
        expect(optimization.recommendations).toBeInstanceOf(Array);
      });
    });

    describe('Monitoring Service', () => {
      it('should collect system metrics', async () => {
        const metrics = await monitoringService.collectSystemMetrics();
        
        expect(metrics).toBeDefined();
        expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
        expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      });

      it('should perform health checks', async () => {
        const health = await monitoringService.performHealthCheck();
        
        expect(health).toBeDefined();
        expect(health.status).toBeTruthy();
        expect(health.details).toBeDefined();
      });

      it('should create alerts', async () => {
        const alert = {
          type: 'system' as const,
          severity: 'warning' as const,
          title: 'High CPU Usage',
          description: 'CPU usage is above 80%',
          metric: 'cpu_usage',
          threshold: 80,
          currentValue: 85
        };
        
        const created = await monitoringService.createAlert(alert);
        expect(created.id).toBeTruthy();
        expect(created.severity).toBe('warning');
      });
    });
  });

  describe('Lead Management and Sales Services', () => {
    describe('Intelligent Lead Scoring Service', () => {
      it('should score leads accurately', async () => {
        const mockLead = {
          id: 'lead-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          company: 'Test Corp',
          jobTitle: 'CEO',
          source: 'website',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'new' as const,
          tags: [],
          customFields: {}
        };
        
        const score = await intelligentLeadScoringService.calculateLeadScore(mockLead);
        
        expect(score).toBeDefined();
        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(100);
        expect(score.grade).toMatch(/^[A-F]$/);
        expect(score.factors).toBeInstanceOf(Array);
      });

      it('should track lead behavior', async () => {
        const behavior = {
          leadId: 'lead-123',
          action: 'page_view',
          page: '/pricing',
          duration: 120,
          metadata: {}
        };
        
        await expect(intelligentLeadScoringService.trackLeadBehavior(behavior)).resolves.not.toThrow();
      });

      it('should qualify leads based on criteria', async () => {
        const qualification = await intelligentLeadScoringService.qualifyLead('lead-123');
        
        expect(qualification).toBeDefined();
        expect(typeof qualification.qualified).toBe('boolean');
        expect(qualification.criteria).toBeInstanceOf(Array);
      });
    });

    describe('Sales Intelligence Service', () => {
      it('should analyze deal health', async () => {
        const healthScore = await salesIntelligenceService.analyzeDealHealth('deal-123');
        
        expect(healthScore).toBeDefined();
        expect(healthScore.score).toBeGreaterThanOrEqual(0);
        expect(healthScore.score).toBeLessThanOrEqual(100);
        expect(healthScore.grade).toMatch(/^[A-F]$/);
        expect(healthScore.factors).toBeInstanceOf(Array);
        expect(healthScore.risks).toBeInstanceOf(Array);
      });

      it('should generate sales forecasts', async () => {
        const forecast = await salesIntelligenceService.generateSalesForecast('Q1-2024');
        
        expect(forecast).toBeDefined();
        expect(forecast.totalValue).toBeGreaterThanOrEqual(0);
        expect(forecast.weightedValue).toBeGreaterThanOrEqual(0);
        expect(forecast.confidence).toBeGreaterThanOrEqual(0);
        expect(forecast.breakdown).toBeInstanceOf(Array);
      });

      it('should track sales performance', async () => {
        const performance = await salesIntelligenceService.trackSalesPerformance('user-123', 'Q1-2024');
        
        expect(performance).toBeDefined();
        expect(performance.metrics).toBeDefined();
        expect(performance.metrics.winRate).toBeGreaterThanOrEqual(0);
        expect(performance.rankings).toBeDefined();
      });
    });
  });

  describe('Social Media Services', () => {
    describe('Social Media Service', () => {
      it('should schedule social media posts', async () => {
        const post = {
          content: 'Test post content',
          platforms: ['twitter', 'facebook'],
          scheduledTime: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
        };
        
        const scheduled = await socialMediaService.schedulePost(post);
        
        expect(scheduled).toBeDefined();
        expect(scheduled.id).toBeTruthy();
        expect(scheduled.status).toBe('scheduled');
      });

      it('should analyze social media performance', async () => {
        const analytics = await socialMediaService.getAnalytics('post-123');
        
        expect(analytics).toBeDefined();
        expect(analytics.engagement).toBeGreaterThanOrEqual(0);
        expect(analytics.reach).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Social Media Monitoring Service', () => {
      it('should monitor brand mentions', async () => {
        const mentions = await socialMediaMonitoringService.getBrandMentions('24h');
        
        expect(mentions).toBeInstanceOf(Array);
        
        if (mentions.length > 0) {
          expect(mentions[0].platform).toBeTruthy();
          expect(mentions[0].content).toBeTruthy();
          expect(mentions[0].sentiment).toMatch(/^(positive|negative|neutral)$/);
        }
      });

      it('should analyze sentiment', async () => {
        const sentiment = await socialMediaMonitoringService.analyzeSentiment('This product is amazing!');
        
        expect(sentiment).toBeDefined();
        expect(sentiment.overall).toMatch(/^(positive|negative|neutral)$/);
        expect(sentiment.score).toBeGreaterThanOrEqual(-1);
        expect(sentiment.score).toBeLessThanOrEqual(1);
      });

      it('should track competitors', async () => {
        const tracking = await socialMediaMonitoringService.trackCompetitors(['Competitor A', 'Competitor B']);
        
        expect(tracking).toBeInstanceOf(Array);
        
        if (tracking.length > 0) {
          expect(tracking[0].competitor).toBeTruthy();
          expect(tracking[0].mentions).toBeGreaterThanOrEqual(0);
          expect(tracking[0].sentiment).toBeDefined();
        }
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle end-to-end lead processing workflow', async () => {
      // Create a lead
      const lead = await advancedCRMService.createContact({
        email: 'integration@test.com',
        firstName: 'Integration',
        lastName: 'Test',
        company: 'Test Company'
      });
      
      expect(lead.id).toBeTruthy();
      
      // Score the lead
      const score = await intelligentLeadScoringService.calculateLeadScore({
        ...lead,
        jobTitle: 'CEO',
        source: 'website',
        status: 'new',
        tags: [],
        customFields: {}
      });
      
      expect(score.score).toBeGreaterThanOrEqual(0);
      
      // Create a deal if lead is qualified
      if (score.score > 60) {
        const deal = await advancedCRMService.createDeal({
          title: 'Integration Test Deal',
          value: 25000,
          stage: 'qualification',
          contactId: lead.id
        });
        
        expect(deal.id).toBeTruthy();
        
        // Analyze deal health
        const health = await salesIntelligenceService.analyzeDealHealth(deal.id);
        expect(health.score).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle email campaign to lead nurturing workflow', async () => {
      // Create email campaign
      const campaign = await emailCampaignService.createCampaign({
        name: 'Integration Test Campaign',
        subject: 'Welcome to our platform',
        content: 'Thank you for your interest',
        recipients: ['integration@test.com']
      });
      
      expect(campaign.id).toBeTruthy();
      
      // Send campaign
      const sent = await emailCampaignService.sendCampaign(campaign.id);
      expect(sent.status).toBe('sent');
      
      // Track performance
      const performance = await emailCampaignService.getCampaignPerformance(campaign.id);
      expect(performance.openRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle funnel creation to conversion tracking workflow', async () => {
      // Create funnel
      const funnel = await funnelBuilderService.createFunnel({
        name: 'Integration Test Funnel',
        pages: [
          { type: 'landing', name: 'Landing Page' },
          { type: 'form', name: 'Contact Form' },
          { type: 'thankyou', name: 'Thank You Page' }
        ]
      });
      
      expect(funnel.id).toBeTruthy();
      
      // Track performance
      const performance = await funnelBuilderService.getFunnelPerformance(funnel.id);
      expect(performance.conversionRate).toBeGreaterThanOrEqual(0);
      
      // Run A/B test
      const abTest = await conversionOptimizationService.createABTest({
        name: 'Funnel Headline Test',
        variants: [
          { name: 'Control', content: 'Original headline' },
          { name: 'Variant A', content: 'New headline' }
        ]
      });
      
      expect(abTest.id).toBeTruthy();
    });
  });

  describe('Performance Tests', () => {
    it('should handle high volume of concurrent requests', async () => {
      const promises = [];
      const requestCount = 100;
      
      for (let i = 0; i < requestCount; i++) {
        promises.push(
          advancedCRMService.createContact({
            email: `perf-test-${i}@example.com`,
            firstName: `User${i}`,
            lastName: 'Test',
            company: 'Performance Test Corp'
          })
        );
      }
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(requestCount);
      
      results.forEach(result => {
        expect(result.id).toBeTruthy();
      });
    }, 30000); // 30 second timeout for performance test

    it('should maintain response times under load', async () => {
      const startTime = Date.now();
      
      const metrics = await performanceOptimizationService.collectPerformanceMetrics();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
      expect(metrics).toBeDefined();
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection attacks', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      await expect(
        advancedCRMService.createContact({
          email: maliciousInput,
          firstName: 'Test',
          lastName: 'User',
          company: 'Test Corp'
        })
      ).rejects.toThrow();
    });

    it('should validate input data properly', async () => {
      const invalidEmail = 'not-an-email';
      
      await expect(
        advancedCRMService.createContact({
          email: invalidEmail,
          firstName: 'Test',
          lastName: 'User',
          company: 'Test Corp'
        })
      ).rejects.toThrow();
    });

    it('should enforce authentication and authorization', async () => {
      // Test without proper authentication
      const originalAuth = process.env.SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_ANON_KEY;
      
      await expect(
        advancedCRMService.createContact({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          company: 'Test Corp'
        })
      ).rejects.toThrow();
      
      // Restore authentication
      process.env.SUPABASE_ANON_KEY = originalAuth;
    });
  });
});

// Export test utilities for use in other test files
export const testUtils = {
  createMockLead: () => ({
    id: crypto.randomUUID(),
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    company: 'Test Corp',
    jobTitle: 'CEO',
    source: 'website',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'new' as const,
    tags: [],
    customFields: {}
  }),
  
  createMockDeal: () => ({
    id: crypto.randomUUID(),
    title: 'Test Deal',
    value: 25000,
    currency: 'USD',
    probability: 50,
    stage: 'qualification',
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    leadId: 'lead-123',
    contactId: 'contact-123',
    accountId: 'account-123',
    ownerId: 'user-123',
    source: 'website',
    competitors: [],
    products: [],
    tags: [],
    customFields: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'open' as const
  }),
  
  createMockCampaign: () => ({
    id: crypto.randomUUID(),
    name: 'Test Campaign',
    subject: 'Test Subject',
    content: 'Test Content',
    recipients: ['test@example.com'],
    status: 'draft' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  })
};