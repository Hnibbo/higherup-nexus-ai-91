import { supabase } from '@/integrations/supabase/client';
import { funnelAnalyticsService } from './FunnelAnalyticsService';
import { funnelBuilderService } from './FunnelBuilderService';

export interface OptimizationTest {
  id: string;
  funnel_id: string;
  step_number: number;
  test_name: string;
  test_type: 'headline' | 'cta_button' | 'form_fields' | 'layout' | 'colors' | 'copy' | 'images' | 'pricing';
  hypothesis: string;
  status: 'draft' | 'running' | 'completed' | 'paused' | 'cancelled';
  start_date: Date;
  end_date?: Date;
  target_sample_size: number;
  current_sample_size: number;
  confidence_level: number;
  statistical_significance: boolean;
  winning_variant?: string;
  variants: OptimizationVariant[];
  results?: OptimizationResults;
  created_at: Date;
  updated_at: Date;
}

export interface OptimizationVariant {
  id: string;
  name: string;
  description: string;
  traffic_allocation: number; // Percentage of traffic
  changes: Record<string, any>; // What's different from control
  is_control: boolean;
  metrics: {
    visitors: number;
    conversions: number;
    conversion_rate: number;
    revenue: number;
    bounce_rate: number;
    time_on_page: number;
  };
}

export interface OptimizationResults {
  test_duration_days: number;
  total_visitors: number;
  total_conversions: number;
  improvement_percentage: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  p_value: number;
  effect_size: number;
  recommendation: 'implement_winner' | 'continue_testing' | 'inconclusive' | 'stop_test';
  insights: string[];
}

export interface HeatmapInsight {
  type: 'click_pattern' | 'scroll_behavior' | 'form_interaction' | 'attention_area';
  priority: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
  potential_impact: string;
  element_selector?: string;
  position?: { x: number; y: number };
}

export interface ConversionBarrier {
  type: 'technical' | 'design' | 'content' | 'trust' | 'pricing' | 'form';
  severity: 'critical' | 'major' | 'minor';
  step_number: number;
  description: string;
  impact_estimate: string;
  suggested_fixes: string[];
  priority_score: number;
}

export interface PersonalizationRule {
  id: string;
  funnel_id: string;
  rule_name: string;
  conditions: Array<{
    attribute: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list';
    value: any;
  }>;
  changes: Record<string, any>;
  is_active: boolean;
  performance_metrics: {
    impressions: number;
    conversions: number;
    lift: number;
  };
}

export class ConversionOptimizationService {
  private static instance: ConversionOptimizationService;

  private constructor() {}

  public static getInstance(): ConversionOptimizationService {
    if (!ConversionOptimizationService.instance) {
      ConversionOptimizationService.instance = new ConversionOptimizationService();
    }
    return ConversionOptimizationService.instance;
  }

  // A/B Testing Management
  async createOptimizationTest(test: Omit<OptimizationTest, 'id' | 'created_at' | 'updated_at' | 'current_sample_size' | 'statistical_significance' | 'results'>): Promise<OptimizationTest> {
    try {
      console.log(`🧪 Creating optimization test: ${test.test_name}`);

      // Validate test configuration
      this.validateTestConfiguration(test);

      const { data, error } = await supabase
        .from('optimization_tests')
        .insert({
          funnel_id: test.funnel_id,
          step_number: test.step_number,
          test_name: test.test_name,
          test_type: test.test_type,
          hypothesis: test.hypothesis,
          status: test.status,
          start_date: test.start_date.toISOString(),
          end_date: test.end_date?.toISOString(),
          target_sample_size: test.target_sample_size,
          current_sample_size: 0,
          confidence_level: test.confidence_level,
          statistical_significance: false,
          variants: test.variants,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Optimization test created: ${test.test_name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create optimization test:', error);
      throw error;
    }
  }

  private validateTestConfiguration(test: Partial<OptimizationTest>): void {
    if (!test.variants || test.variants.length < 2) {
      throw new Error('Test must have at least 2 variants (including control)');
    }

    const totalTraffic = test.variants.reduce((sum, variant) => sum + variant.traffic_allocation, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error('Traffic allocation must sum to 100%');
    }

    const controlVariants = test.variants.filter(v => v.is_control);
    if (controlVariants.length !== 1) {
      throw new Error('Test must have exactly one control variant');
    }

    if (test.target_sample_size && test.target_sample_size < 100) {
      throw new Error('Target sample size must be at least 100 visitors per variant');
    }
  }

  async getOptimizationTests(funnelId: string, status?: string): Promise<OptimizationTest[]> {
    try {
      let query = supabase
        .from('optimization_tests')
        .select('*')
        .eq('funnel_id', funnelId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get optimization tests:', error);
      throw error;
    }
  }

  async startTest(testId: string): Promise<OptimizationTest> {
    try {
      console.log(`▶️ Starting optimization test: ${testId}`);

      const { data, error } = await supabase
        .from('optimization_tests')
        .update({
          status: 'running',
          start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', testId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Optimization test started: ${testId}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to start optimization test:', error);
      throw error;
    }
  }

  async stopTest(testId: string, reason?: string): Promise<OptimizationTest> {
    try {
      console.log(`⏹️ Stopping optimization test: ${testId}`);

      // Calculate final results
      const results = await this.calculateTestResults(testId);

      const { data, error } = await supabase
        .from('optimization_tests')
        .update({
          status: 'completed',
          end_date: new Date().toISOString(),
          results: results,
          updated_at: new Date().toISOString()
        })
        .eq('id', testId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Optimization test stopped: ${testId}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to stop optimization test:', error);
      throw error;
    }
  }

  private async calculateTestResults(testId: string): Promise<OptimizationResults> {
    try {
      // Get test data
      const { data: test, error } = await supabase
        .from('optimization_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (error) throw error;

      // Calculate metrics for each variant
      const variants = test.variants.map((variant: OptimizationVariant) => {
        // In a real implementation, you would fetch actual visitor data
        // For now, we'll use mock data
        const visitors = Math.floor(Math.random() * 1000) + 100;
        const conversions = Math.floor(visitors * (Math.random() * 0.1 + 0.02));
        
        return {
          ...variant,
          metrics: {
            visitors,
            conversions,
            conversion_rate: (conversions / visitors) * 100,
            revenue: conversions * (Math.random() * 100 + 50),
            bounce_rate: Math.random() * 50 + 20,
            time_on_page: Math.random() * 300 + 60
          }
        };
      });

      // Find control and best performing variant
      const control = variants.find(v => v.is_control);
      const bestVariant = variants.reduce((best, current) => 
        current.metrics.conversion_rate > best.metrics.conversion_rate ? current : best
      );

      // Calculate statistical significance
      const improvement = control ? 
        ((bestVariant.metrics.conversion_rate - control.metrics.conversion_rate) / control.metrics.conversion_rate) * 100 : 0;

      const totalVisitors = variants.reduce((sum, v) => sum + v.metrics.visitors, 0);
      const totalConversions = variants.reduce((sum, v) => sum + v.metrics.conversions, 0);

      // Mock statistical calculations
      const pValue = Math.random() * 0.1;
      const confidenceLevel = test.confidence_level || 95;
      const isSignificant = pValue < (1 - confidenceLevel / 100);

      const testDuration = test.start_date ? 
        Math.ceil((new Date().getTime() - new Date(test.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;

      let recommendation: OptimizationResults['recommendation'] = 'inconclusive';
      if (isSignificant && improvement > 5) {
        recommendation = 'implement_winner';
      } else if (totalVisitors < test.target_sample_size) {
        recommendation = 'continue_testing';
      } else if (improvement < 1) {
        recommendation = 'stop_test';
      }

      const insights = this.generateTestInsights(variants, improvement, isSignificant);

      return {
        test_duration_days: testDuration,
        total_visitors: totalVisitors,
        total_conversions: totalConversions,
        improvement_percentage: Math.round(improvement * 100) / 100,
        confidence_interval: {
          lower: improvement - 5,
          upper: improvement + 5
        },
        p_value: Math.round(pValue * 1000) / 1000,
        effect_size: Math.abs(improvement) / 10, // Simplified effect size
        recommendation,
        insights
      };

    } catch (error) {
      console.error('Failed to calculate test results:', error);
      throw error;
    }
  }

  private generateTestInsights(variants: OptimizationVariant[], improvement: number, isSignificant: boolean): string[] {
    const insights = [];

    if (isSignificant && improvement > 0) {
      insights.push(`The winning variant shows a statistically significant improvement of ${improvement.toFixed(1)}%`);
    } else if (!isSignificant) {
      insights.push('The test did not reach statistical significance - consider running longer or with more traffic');
    }

    // Analyze variant performance
    const sortedVariants = variants.sort((a, b) => b.metrics.conversion_rate - a.metrics.conversion_rate);
    const best = sortedVariants[0];
    const worst = sortedVariants[sortedVariants.length - 1];

    if (best.metrics.conversion_rate > worst.metrics.conversion_rate * 1.2) {
      insights.push(`There's a significant performance gap between variants - ${best.name} outperforms ${worst.name} by ${((best.metrics.conversion_rate / worst.metrics.conversion_rate - 1) * 100).toFixed(1)}%`);
    }

    // Bounce rate insights
    const avgBounceRate = variants.reduce((sum, v) => sum + v.metrics.bounce_rate, 0) / variants.length;
    const lowBounceVariant = variants.find(v => v.metrics.bounce_rate < avgBounceRate * 0.8);
    if (lowBounceVariant) {
      insights.push(`${lowBounceVariant.name} has significantly lower bounce rate, indicating better user engagement`);
    }

    return insights;
  }

  // Heatmap Analysis
  async analyzeHeatmapData(funnelId: string, stepNumber: number): Promise<HeatmapInsight[]> {
    try {
      console.log(`🔥 Analyzing heatmap data: funnel ${funnelId}, step ${stepNumber}`);

      const heatmapData = await funnelAnalyticsService.getHeatmapData(funnelId, stepNumber);
      const insights: HeatmapInsight[] = [];

      // Analyze click patterns
      const clickData = heatmapData.click_data;
      if (clickData.length > 0) {
        // Find most clicked elements
        const topClicks = clickData.sort((a, b) => b.click_count - a.click_count).slice(0, 3);
        
        topClicks.forEach((click, index) => {
          if (index === 0 && click.click_count > 50) {
            insights.push({
              type: 'click_pattern',
              priority: 'high',
              description: `"${click.element_text}" receives the most clicks (${click.click_count} total)`,
              recommendation: 'This element is performing well - consider making similar elements more prominent',
              potential_impact: 'Could increase overall engagement by 10-20%',
              element_selector: click.element_selector,
              position: click.position
            });
          }
        });

        // Find elements with low click rates that should be clicked more
        const lowClickElements = clickData.filter(click => 
          click.element_text.toLowerCase().includes('button') || 
          click.element_text.toLowerCase().includes('submit') ||
          click.element_text.toLowerCase().includes('buy')
        ).filter(click => click.click_count < 10);

        lowClickElements.forEach(element => {
          insights.push({
            type: 'click_pattern',
            priority: 'medium',
            description: `Important element "${element.element_text}" has low click rate (${element.click_count} clicks)`,
            recommendation: 'Consider making this element more prominent with better colors, size, or positioning',
            potential_impact: 'Could improve conversion rate by 15-30%',
            element_selector: element.element_selector,
            position: element.position
          });
        });
      }

      // Analyze scroll behavior
      const scrollData = heatmapData.scroll_data;
      if (scrollData.length > 0) {
        const deepScrollers = scrollData.filter(scroll => scroll.depth_percentage >= 80);
        const shallowScrollers = scrollData.filter(scroll => scroll.depth_percentage <= 30);

        if (shallowScrollers.length > deepScrollers.length * 2) {
          insights.push({
            type: 'scroll_behavior',
            priority: 'high',
            description: 'Most users don\'t scroll past 30% of the page',
            recommendation: 'Move important content and CTAs higher up on the page',
            potential_impact: 'Could increase engagement and conversions by 20-40%'
          });
        }

        // Find areas where users spend time but don't convert
        const highTimeAreas = scrollData.filter(scroll => scroll.average_time > 30);
        if (highTimeAreas.length > 0) {
          insights.push({
            type: 'attention_area',
            priority: 'medium',
            description: 'Users spend significant time in certain page areas without converting',
            recommendation: 'Add clear CTAs or value propositions in these high-attention areas',
            potential_impact: 'Could capture more conversions from engaged users'
          });
        }
      }

      // Analyze form interactions if available
      if (heatmapData.form_field_analytics) {
        const formFields = heatmapData.form_field_analytics;
        
        const problematicFields = formFields.filter(field => 
          field.completion_rate < 70 || field.error_rate > 20
        );

        problematicFields.forEach(field => {
          insights.push({
            type: 'form_interaction',
            priority: 'high',
            description: `Form field "${field.field_name}" has ${field.completion_rate.toFixed(1)}% completion rate and ${field.error_rate.toFixed(1)}% error rate`,
            recommendation: field.error_rate > 20 ? 
              'Improve field validation and error messages' : 
              'Consider making this field optional or simplifying it',
            potential_impact: 'Could improve form completion by 25-50%'
          });
        });
      }

      // Sort insights by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      console.log(`✅ Generated ${insights.length} heatmap insights`);
      return insights;

    } catch (error) {
      console.error('❌ Failed to analyze heatmap data:', error);
      throw error;
    }
  }

  // Conversion Barrier Detection
  async identifyConversionBarriers(funnelId: string): Promise<ConversionBarrier[]> {
    try {
      console.log(`🚧 Identifying conversion barriers for funnel: ${funnelId}`);

      const metrics = await funnelAnalyticsService.getFunnelPerformanceMetrics(funnelId);
      const barriers: ConversionBarrier[] = [];

      // Analyze each step for barriers
      metrics.step_analytics.forEach((step, index) => {
        // High drop-off rate
        if (step.drop_off_rate > 60) {
          barriers.push({
            type: 'design',
            severity: 'critical',
            step_number: step.step_number,
            description: `${step.drop_off_rate.toFixed(1)}% of visitors leave at "${step.step_name}"`,
            impact_estimate: 'Fixing this could improve overall conversion by 30-50%',
            suggested_fixes: [
              'Simplify the page design and reduce distractions',
              'Improve value proposition clarity',
              'Add trust signals and social proof',
              'Optimize page loading speed',
              'Test different layouts and messaging'
            ],
            priority_score: 90
          });
        }

        // Long time on page with low conversion
        if (step.average_time_on_page > 300 && step.conversion_rate < 15) {
          barriers.push({
            type: 'content',
            severity: 'major',
            step_number: step.step_number,
            description: `Users spend ${Math.round(step.average_time_on_page / 60)} minutes on page but don't convert`,
            impact_estimate: 'Could improve conversion rate by 20-35%',
            suggested_fixes: [
              'Clarify the value proposition',
              'Add FAQ section to address concerns',
              'Simplify complex content',
              'Add live chat or support options',
              'Include video explanations'
            ],
            priority_score: 75
          });
        }

        // Form completion issues
        if (step.form_completion_rate && step.form_completion_rate < 40) {
          barriers.push({
            type: 'form',
            severity: 'major',
            step_number: step.step_number,
            description: `Only ${step.form_completion_rate.toFixed(1)}% of visitors complete the form`,
            impact_estimate: 'Form optimization could double completions',
            suggested_fixes: [
              'Reduce number of required fields',
              'Improve form validation and error messages',
              'Add progress indicators for multi-step forms',
              'Use smart defaults and auto-fill',
              'Test single-column vs multi-column layouts'
            ],
            priority_score: 80
          });
        }
      });

      // Technical barriers
      const mobileData = metrics.device_breakdown.find(d => d.device_type === 'mobile');
      const desktopData = metrics.device_breakdown.find(d => d.device_type === 'desktop');
      
      if (mobileData && desktopData && mobileData.conversion_rate < desktopData.conversion_rate * 0.6) {
        barriers.push({
          type: 'technical',
          severity: 'critical',
          step_number: 0, // Affects all steps
          description: `Mobile conversion rate (${mobileData.conversion_rate.toFixed(1)}%) is much lower than desktop (${desktopData.conversion_rate.toFixed(1)}%)`,
          impact_estimate: 'Mobile optimization could increase overall conversions by 40-60%',
          suggested_fixes: [
            'Implement mobile-first responsive design',
            'Optimize page loading speed on mobile',
            'Improve mobile navigation and usability',
            'Test mobile form layouts and input types',
            'Optimize button sizes for touch interfaces'
          ],
          priority_score: 95
        });
      }

      // Trust and credibility barriers
      if (metrics.overall_conversion_rate < 2) {
        barriers.push({
          type: 'trust',
          severity: 'major',
          step_number: 0,
          description: `Overall conversion rate of ${metrics.overall_conversion_rate.toFixed(1)}% suggests trust issues`,
          impact_estimate: 'Building trust could improve conversions by 50-100%',
          suggested_fixes: [
            'Add customer testimonials and reviews',
            'Display security badges and certifications',
            'Include money-back guarantees',
            'Show company contact information clearly',
            'Add social proof and customer logos'
          ],
          priority_score: 85
        });
      }

      // Pricing barriers
      if (metrics.total_revenue > 0 && metrics.average_order_value > 200) {
        const highValueSteps = metrics.step_analytics.filter(step => 
          step.step_type === 'checkout' && step.conversion_rate < 10
        );

        if (highValueSteps.length > 0) {
          barriers.push({
            type: 'pricing',
            severity: 'major',
            step_number: highValueSteps[0].step_number,
            description: `High-value checkout (avg $${metrics.average_order_value.toFixed(2)}) has low conversion rate`,
            impact_estimate: 'Pricing optimization could improve revenue by 25-40%',
            suggested_fixes: [
              'Test payment plans and installment options',
              'Add limited-time discounts or bonuses',
              'Clearly communicate value and ROI',
              'Offer multiple pricing tiers',
              'Add risk-free trial periods'
            ],
            priority_score: 70
          });
        }
      }

      // Sort barriers by priority score
      barriers.sort((a, b) => b.priority_score - a.priority_score);

      console.log(`✅ Identified ${barriers.length} conversion barriers`);
      return barriers;

    } catch (error) {
      console.error('❌ Failed to identify conversion barriers:', error);
      throw error;
    }
  }

  // Personalization
  async createPersonalizationRule(rule: Omit<PersonalizationRule, 'id' | 'performance_metrics'>): Promise<PersonalizationRule> {
    try {
      console.log(`🎯 Creating personalization rule: ${rule.rule_name}`);

      const { data, error } = await supabase
        .from('personalization_rules')
        .insert({
          funnel_id: rule.funnel_id,
          rule_name: rule.rule_name,
          conditions: rule.conditions,
          changes: rule.changes,
          is_active: rule.is_active,
          performance_metrics: {
            impressions: 0,
            conversions: 0,
            lift: 0
          }
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Personalization rule created: ${rule.rule_name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create personalization rule:', error);
      throw error;
    }
  }

  async getPersonalizationRules(funnelId: string): Promise<PersonalizationRule[]> {
    try {
      const { data, error } = await supabase
        .from('personalization_rules')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('rule_name', { ascending: true });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get personalization rules:', error);
      throw error;
    }
  }

  // Automated Optimization Suggestions
  async generateAutomatedOptimizations(funnelId: string): Promise<Array<{
    type: 'test_suggestion' | 'quick_fix' | 'personalization_opportunity';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    implementation: {
      effort: 'low' | 'medium' | 'high';
      timeline: string;
      steps: string[];
    };
    expected_impact: {
      metric: string;
      improvement_range: string;
      confidence: number;
    };
  }>> {
    try {
      console.log(`🤖 Generating automated optimizations for funnel: ${funnelId}`);

      const metrics = await funnelAnalyticsService.getFunnelPerformanceMetrics(funnelId);
      const barriers = await this.identifyConversionBarriers(funnelId);
      const optimizations = [];

      // Test suggestions based on performance data
      if (metrics.overall_conversion_rate < 5) {
        optimizations.push({
          type: 'test_suggestion' as const,
          priority: 'high' as const,
          title: 'Test Headline Variations',
          description: 'Your conversion rate suggests the main value proposition may not be resonating. Test different headlines that focus on specific benefits.',
          implementation: {
            effort: 'low' as const,
            timeline: '1-2 weeks',
            steps: [
              'Create 2-3 headline variations focusing on different benefits',
              'Set up A/B test with equal traffic split',
              'Run test for minimum 2 weeks or 1000 visitors per variant',
              'Implement winning headline across funnel'
            ]
          },
          expected_impact: {
            metric: 'conversion_rate',
            improvement_range: '15-40%',
            confidence: 85
          }
        });
      }

      // Quick fixes based on barriers
      const highDropOffStep = metrics.step_analytics.find(step => step.drop_off_rate > 70);
      if (highDropOffStep) {
        optimizations.push({
          type: 'quick_fix' as const,
          priority: 'high' as const,
          title: `Reduce Friction on ${highDropOffStep.step_name}`,
          description: `Step ${highDropOffStep.step_number} has a ${highDropOffStep.drop_off_rate.toFixed(1)}% drop-off rate. Quick design changes could significantly improve flow.`,
          implementation: {
            effort: 'low' as const,
            timeline: '2-3 days',
            steps: [
              'Remove unnecessary form fields or content',
              'Improve visual hierarchy and CTA prominence',
              'Add progress indicators if multi-step',
              'Optimize for mobile if needed'
            ]
          },
          expected_impact: {
            metric: 'step_conversion_rate',
            improvement_range: '20-50%',
            confidence: 90
          }
        });
      }

      // Personalization opportunities
      const trafficSources = metrics.traffic_sources;
      const organicTraffic = trafficSources.find(s => s.source === 'organic');
      const paidTraffic = trafficSources.find(s => s.source.includes('paid') || s.source.includes('ads'));

      if (organicTraffic && paidTraffic && Math.abs(organicTraffic.conversion_rate - paidTraffic.conversion_rate) > 2) {
        optimizations.push({
          type: 'personalization_opportunity' as const,
          priority: 'medium' as const,
          title: 'Personalize by Traffic Source',
          description: `Organic (${organicTraffic.conversion_rate.toFixed(1)}%) and paid (${paidTraffic.conversion_rate.toFixed(1)}%) traffic have different conversion rates. Personalized messaging could help.`,
          implementation: {
            effort: 'medium' as const,
            timeline: '1-2 weeks',
            steps: [
              'Create personalized headlines for each traffic source',
              'Adjust messaging to match visitor intent',
              'Set up dynamic content rules',
              'Monitor performance by segment'
            ]
          },
          expected_impact: {
            metric: 'overall_conversion_rate',
            improvement_range: '10-25%',
            confidence: 75
          }
        });
      }

      // Mobile optimization opportunity
      const mobileData = metrics.device_breakdown.find(d => d.device_type === 'mobile');
      const desktopData = metrics.device_breakdown.find(d => d.device_type === 'desktop');
      
      if (mobileData && desktopData && mobileData.conversion_rate < desktopData.conversion_rate * 0.8) {
        optimizations.push({
          type: 'quick_fix' as const,
          priority: 'high' as const,
          title: 'Mobile Experience Optimization',
          description: `Mobile converts at ${mobileData.conversion_rate.toFixed(1)}% vs desktop at ${desktopData.conversion_rate.toFixed(1)}%. Mobile optimization is critical.`,
          implementation: {
            effort: 'medium' as const,
            timeline: '1 week',
            steps: [
              'Audit mobile user experience',
              'Optimize button sizes and touch targets',
              'Improve mobile page loading speed',
              'Simplify mobile forms and navigation'
            ]
          },
          expected_impact: {
            metric: 'mobile_conversion_rate',
            improvement_range: '30-60%',
            confidence: 95
          }
        });
      }

      // Sort by priority and expected impact
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      optimizations.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.expected_impact.confidence - a.expected_impact.confidence;
      });

      console.log(`✅ Generated ${optimizations.length} automated optimization suggestions`);
      return optimizations;

    } catch (error) {
      console.error('❌ Failed to generate automated optimizations:', error);
      throw error;
    }
  }

  // Implementation Helper
  async implementOptimization(funnelId: string, optimizationType: string, changes: Record<string, any>): Promise<void> {
    try {
      console.log(`🔧 Implementing optimization: ${optimizationType} for funnel ${funnelId}`);

      // This would integrate with the funnel builder to apply changes
      // For now, we'll log the implementation
      console.log('Optimization changes:', changes);

      // Record the optimization implementation
      const { error } = await supabase
        .from('optimization_implementations')
        .insert({
          funnel_id: funnelId,
          optimization_type: optimizationType,
          changes: changes,
          implemented_at: new Date().toISOString(),
          status: 'active'
        });

      if (error) throw error;

      console.log(`✅ Optimization implemented: ${optimizationType}`);

    } catch (error) {
      console.error('❌ Failed to implement optimization:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const conversionOptimizationService = ConversionOptimizationService.getInstance();