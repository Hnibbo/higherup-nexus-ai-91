import { supabase } from '@/integrations/supabase/client';
import { funnelAnalyticsService } from './FunnelAnalyticsService';

// Types for testing functionality
interface ABTest {
  id: string;
  funnel_id: string;
  test_name: string;
  variant_a: {
    name: string;
    config: Record<string, any>;
  };
  variant_b: {
    name: string;
    config: Record<string, any>;
  };
  traffic_split: number;
  status: 'draft' | 'running' | 'paused' | 'completed';
  results?: {
    variant_a_conversions: number;
    variant_b_conversions: number;
    variant_a_visitors: number;
    variant_b_visitors: number;
    winner: 'a' | 'b' | 'inconclusive';
    confidence_level: number;
    improvement: number;
  };
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

interface HeatmapTest {
  id: string;
  funnel_id: string;
  step_number: number;
  test_name: string;
  status: 'active' | 'completed';
  insights?: HeatmapInsight[];
  created_at: string;
}

interface HeatmapInsight {
  type: 'click_hotspot' | 'dead_zone' | 'scroll_drop_off' | 'rage_click' | 'form_abandonment';
  severity: 'high' | 'medium' | 'low';
  description: string;
  element_selector?: string;
  position?: { x: number; y: number };
  frequency: number;
  recommendation: string;
  potential_impact: string;
}

interface MultivariateTesting {
  id: string;
  funnel_id: string;
  test_name: string;
  elements: Array<{
    element_id: string;
    element_name: string;
    variations: Array<{
      variation_id: string;
      variation_name: string;
      config: Record<string, any>;
    }>;
  }>;
  combinations: Array<{
    combination_id: string;
    elements_config: Record<string, string>;
    traffic_allocation: number;
    performance: {
      visitors: number;
      conversions: number;
      conversion_rate: number;
    };
  }>;
  status: 'draft' | 'running' | 'completed';
  results?: {
    winning_combination: string;
    improvement: number;
    statistical_significance: boolean;
  };
  created_at: string;
}

class FunnelTestingService {
  private static instance: FunnelTestingService;

  static getInstance(): FunnelTestingService {
    if (!FunnelTestingService.instance) {
      FunnelTestingService.instance = new FunnelTestingService();
    }
    return FunnelTestingService.instance;
  }

  // A/B Testing
  async createABTest(test: Omit<ABTest, 'id' | 'results'>): Promise<ABTest> {
    try {
      console.log(`🧪 Creating A/B test: ${test.test_name}`);

      const { data, error } = await supabase
        .from('ab_tests')
        .insert({
          funnel_id: test.funnel_id,
          test_name: test.test_name,
          variant_a: test.variant_a,
          variant_b: test.variant_b,
          traffic_split: test.traffic_split,
          status: test.status,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ A/B test created successfully`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create A/B test:', error);
      throw error;
    }
  }

  async startABTest(testId: string): Promise<void> {
    try {
      console.log(`▶️ Starting A/B test: ${testId}`);

      const { error } = await supabase
        .from('ab_tests')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', testId);

      if (error) throw error;

      console.log(`✅ A/B test started successfully`);

    } catch (error) {
      console.error('❌ Failed to start A/B test:', error);
      throw error;
    }
  }

  async analyzeABTestResults(testId: string): Promise<ABTest['results']> {
    try {
      console.log(`📊 Analyzing A/B test results: ${testId}`);

      // Get test data
      const { data: test, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (error) throw error;

      // Get performance data from analytics service
      const performanceData = await funnelAnalyticsService.getABTestPerformance(testId);

      // Calculate results
      const variantAConversionRate = (performanceData.variant_a_conversions / performanceData.variant_a_visitors) * 100;
      const variantBConversionRate = (performanceData.variant_b_conversions / performanceData.variant_b_visitors) * 100;

      const improvement = ((variantBConversionRate - variantAConversionRate) / variantAConversionRate) * 100;

      // Determine winner (simplified statistical significance)
      let winner: 'a' | 'b' | 'inconclusive' = 'inconclusive';
      let confidenceLevel = 0;

      if (Math.abs(improvement) > 5 && performanceData.variant_a_visitors > 100 && performanceData.variant_b_visitors > 100) {
        winner = improvement > 0 ? 'b' : 'a';
        confidenceLevel = Math.min(95, 50 + Math.abs(improvement) * 2);
      }

      const results = {
        variant_a_conversions: performanceData.variant_a_conversions,
        variant_b_conversions: performanceData.variant_b_conversions,
        variant_a_visitors: performanceData.variant_a_visitors,
        variant_b_visitors: performanceData.variant_b_visitors,
        winner,
        confidence_level: confidenceLevel,
        improvement: Math.round(improvement * 100) / 100
      };

      // Update test with results
      await supabase
        .from('ab_tests')
        .update({ results })
        .eq('id', testId);

      console.log(`✅ A/B test analysis complete. Winner: ${winner} with ${improvement.toFixed(1)}% improvement`);
      return results;

    } catch (error) {
      console.error('❌ Failed to analyze A/B test results:', error);
      throw error;
    }
  }

  // Heatmap Testing
  async createHeatmapTest(test: Omit<HeatmapTest, 'id' | 'insights'>): Promise<HeatmapTest> {
    try {
      console.log(`🔥 Creating heatmap test: ${test.test_name}`);

      const { data, error } = await supabase
        .from('heatmap_tests')
        .insert({
          funnel_id: test.funnel_id,
          step_number: test.step_number,
          test_name: test.test_name,
          status: test.status,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Heatmap test created successfully`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create heatmap test:', error);
      throw error;
    }
  }

  async analyzeHeatmapResults(testId: string): Promise<HeatmapInsight[]> {
    try {
      console.log(`🔍 Analyzing heatmap results for test: ${testId}`);

      // Get heatmap test data
      const { data: test, error: testError } = await supabase
        .from('heatmap_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (testError) throw testError;

      // Get heatmap data from analytics service
      const heatmapData = await funnelAnalyticsService.getHeatmapData(test.funnel_id, test.step_number);

      const insights: HeatmapInsight[] = [];

      // Analyze click patterns
      if (heatmapData.click_data && heatmapData.click_data.length > 0) {
        const clickInsights = this.analyzeClickPatterns(heatmapData.click_data);
        insights.push(...clickInsights);
      }

      // Analyze scroll behavior
      if (heatmapData.scroll_data && heatmapData.scroll_data.length > 0) {
        const scrollInsights = this.analyzeScrollBehavior(heatmapData.scroll_data);
        insights.push(...scrollInsights);
      }

      // Analyze form interactions
      if (heatmapData.form_field_analytics && heatmapData.form_field_analytics.length > 0) {
        const formInsights = this.analyzeFormInteractions(heatmapData.form_field_analytics);
        insights.push(...formInsights);
      }

      // Update test with insights
      await supabase
        .from('heatmap_tests')
        .update({ insights })
        .eq('id', testId);

      console.log(`✅ Generated ${insights.length} heatmap insights`);
      return insights;

    } catch (error) {
      console.error('❌ Failed to analyze heatmap results:', error);
      throw error;
    }
  }

  private analyzeClickPatterns(clickData: any[]): HeatmapInsight[] {
    const insights: HeatmapInsight[] = [];

    // Find click hotspots
    const hotspots = clickData.filter(click => click.click_count > 50);
    hotspots.forEach(hotspot => {
      insights.push({
        type: 'click_hotspot',
        severity: 'high',
        description: `High click activity on "${hotspot.element_text}" (${hotspot.click_count} clicks)`,
        element_selector: hotspot.element_selector,
        position: hotspot.position,
        frequency: hotspot.click_count,
        recommendation: 'This element is performing well - consider making similar elements more prominent',
        potential_impact: 'Could increase overall engagement by 15-25%'
      });
    });

    // Find dead zones (elements that should be clicked but aren't)
    const deadZones = clickData.filter(click =>
      (click.element_text.toLowerCase().includes('button') ||
        click.element_text.toLowerCase().includes('cta') ||
        click.element_text.toLowerCase().includes('submit')) &&
      click.click_count < 5
    );

    deadZones.forEach(deadZone => {
      insights.push({
        type: 'dead_zone',
        severity: 'high',
        description: `Important element "${deadZone.element_text}" has very low click rate (${deadZone.click_count} clicks)`,
        element_selector: deadZone.element_selector,
        position: deadZone.position,
        frequency: deadZone.click_count,
        recommendation: 'Make this element more prominent with better colors, size, or positioning',
        potential_impact: 'Could improve conversion rate by 20-40%'
      });
    });

    // Detect rage clicks (multiple rapid clicks on same element)
    const rageClicks = clickData.filter(click => click.unique_clicks < click.click_count * 0.3);
    rageClicks.forEach(rageClick => {
      insights.push({
        type: 'rage_click',
        severity: 'medium',
        description: `Users are repeatedly clicking "${rageClick.element_text}" - possible frustration`,
        element_selector: rageClick.element_selector,
        position: rageClick.position,
        frequency: rageClick.click_count,
        recommendation: 'Check if this element is working properly or if users expect different behavior',
        potential_impact: 'Fixing this could reduce user frustration and improve experience'
      });
    });

    return insights;
  }

  private analyzeScrollBehavior(scrollData: any[]): HeatmapInsight[] {
    const insights: HeatmapInsight[] = [];

    // Find scroll drop-off points
    const sortedScrollData = scrollData.sort((a, b) => a.depth_percentage - b.depth_percentage);

    for (let i = 0; i < sortedScrollData.length - 1; i++) {
      const current = sortedScrollData[i];
      const next = sortedScrollData[i + 1];

      // If there's a significant drop in users between scroll depths
      if (current.user_count > next.user_count * 2 && current.depth_percentage < 80) {
        insights.push({
          type: 'scroll_drop_off',
          severity: 'medium',
          description: `Significant user drop-off at ${current.depth_percentage}% scroll depth`,
          frequency: current.user_count - next.user_count,
          recommendation: 'Consider moving important content higher up or improving content engagement at this point',
          potential_impact: 'Could retain more users and improve conversion rates'
        });
      }
    }

    // Check if most users don't scroll much
    const shallowScrollers = scrollData.filter(scroll => scroll.depth_percentage <= 30);
    const totalUsers = scrollData.reduce((sum, scroll) => sum + scroll.user_count, 0);
    const shallowScrollerCount = shallowScrollers.reduce((sum, scroll) => sum + scroll.user_count, 0);

    if (shallowScrollerCount > totalUsers * 0.6) {
      insights.push({
        type: 'scroll_drop_off',
        severity: 'high',
        description: 'Most users (60%+) don\'t scroll past 30% of the page',
        frequency: shallowScrollerCount,
        recommendation: 'Move critical content and CTAs higher up on the page',
        potential_impact: 'Could significantly improve engagement and conversions'
      });
    }

    return insights;
  }

  private analyzeFormInteractions(formData: any[]): HeatmapInsight[] {
    const insights: HeatmapInsight[] = [];

    // Find problematic form fields
    const problematicFields = formData.filter(field =>
      field.completion_rate < 70 || field.error_rate > 15
    );

    problematicFields.forEach(field => {
      const severity = field.completion_rate < 50 || field.error_rate > 25 ? 'high' : 'medium';

      insights.push({
        type: 'form_abandonment',
        severity: severity as 'high' | 'medium',
        description: `Form field "${field.field_name}" has ${field.completion_rate.toFixed(1)}% completion rate and ${field.error_rate.toFixed(1)}% error rate`,
        frequency: Math.round((100 - field.completion_rate) * 10), // Mock frequency
        recommendation: field.error_rate > 20 ?
          'Improve field validation and error messages' :
          'Consider making this field optional or simplifying it',
        potential_impact: 'Could improve form completion by 25-50%'
      });
    });

    return insights;
  }

  // Multivariate Testing
  async createMultivariateTest(test: Omit<MultivariateTesting, 'id' | 'combinations' | 'results'>): Promise<MultivariateTesting> {
    try {
      console.log(`🔬 Creating multivariate test: ${test.test_name}`);

      // Generate all possible combinations
      const combinations = this.generateTestCombinations(test.elements);

      const { data, error } = await supabase
        .from('multivariate_tests')
        .insert({
          funnel_id: test.funnel_id,
          test_name: test.test_name,
          elements: test.elements,
          combinations: combinations,
          status: test.status,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Multivariate test created with ${combinations.length} combinations`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create multivariate test:', error);
      throw error;
    }
  }

  private generateTestCombinations(elements: MultivariateTesting['elements']): MultivariateTesting['combinations'] {
    const combinations: MultivariateTesting['combinations'] = [];

    // Calculate total number of combinations
    const totalCombinations = elements.reduce((total, element) => total * element.variations.length, 1);

    if (totalCombinations > 16) {
      console.warn(`Warning: ${totalCombinations} combinations detected. Consider reducing variations to avoid statistical issues.`);
    }

    // Generate all combinations
    const generateCombos = (elementIndex: number, currentCombo: Record<string, string>): void => {
      if (elementIndex >= elements.length) {
        const combinationId = `combo_${combinations.length + 1}`;
        combinations.push({
          combination_id: combinationId,
          elements_config: { ...currentCombo },
          traffic_allocation: Math.round(100 / totalCombinations * 100) / 100,
          performance: {
            visitors: 0,
            conversions: 0,
            conversion_rate: 0
          }
        });
        return;
      }

      const element = elements[elementIndex];
      for (const variation of element.variations) {
        const newCombo = { ...currentCombo };
        newCombo[element.element_id] = variation.variation_id;
        generateCombos(elementIndex + 1, newCombo);
      }
    };

    generateCombos(0, {});
    return combinations;
  }

  async analyzeMultivariateResults(testId: string): Promise<MultivariateTesting['results']> {
    try {
      console.log(`📊 Analyzing multivariate test results: ${testId}`);

      // Get test data
      const { data: test, error } = await supabase
        .from('multivariate_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (error) throw error;

      // Calculate performance for each combination (mock data)
      const updatedCombinations = test.combinations.map((combo: any) => ({
        ...combo,
        performance: {
          visitors: Math.floor(Math.random() * 500) + 100,
          conversions: Math.floor(Math.random() * 50) + 5,
          conversion_rate: 0
        }
      }));

      // Calculate conversion rates
      updatedCombinations.forEach((combo: any) => {
        combo.performance.conversion_rate = (combo.performance.conversions / combo.performance.visitors) * 100;
      });

      // Find winning combination
      const winningCombo = updatedCombinations.reduce((best: any, current: any) =>
        current.performance.conversion_rate > best.performance.conversion_rate ? current : best
      );

      // Calculate improvement over baseline (first combination)
      const baseline = updatedCombinations[0];
      const improvement = ((winningCombo.performance.conversion_rate - baseline.performance.conversion_rate) / baseline.performance.conversion_rate) * 100;

      // Mock statistical significance
      const statisticalSignificance = Math.abs(improvement) > 10 && winningCombo.performance.visitors > 200;

      const results = {
        winning_combination: winningCombo.combination_id,
        improvement: Math.round(improvement * 100) / 100,
        statistical_significance: statisticalSignificance
      };

      // Update test with results
      await supabase
        .from('multivariate_tests')
        .update({
          combinations: updatedCombinations,
          results: results,
          status: 'completed'
        })
        .eq('id', testId);

      console.log(`✅ Multivariate test analysis complete. Winner: ${winningCombo.combination_id} with ${improvement.toFixed(1)}% improvement`);
      return results;

    } catch (error) {
      console.error('❌ Failed to analyze multivariate test results:', error);
      throw error;
    }
  }

  // Test Management
  async getAllTests(funnelId: string): Promise<{
    ab_tests: ABTest[];
    heatmap_tests: HeatmapTest[];
    multivariate_tests: MultivariateTesting[];
  }> {
    try {
      console.log(`📋 Getting all tests for funnel: ${funnelId}`);

      // Get A/B tests
      const { data: abTests, error: abError } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('created_at', { ascending: false });

      if (abError) throw abError;

      // Get heatmap tests
      const { data: heatmapTests, error: heatmapError } = await supabase
        .from('heatmap_tests')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('created_at', { ascending: false });

      if (heatmapError) throw heatmapError;

      // Get multivariate tests
      const { data: multivariateTests, error: multivariateError } = await supabase
        .from('multivariate_tests')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('created_at', { ascending: false });

      if (multivariateError) throw multivariateError;

      return {
        ab_tests: abTests || [],
        heatmap_tests: heatmapTests || [],
        multivariate_tests: multivariateTests || []
      };

    } catch (error) {
      console.error('❌ Failed to get all tests:', error);
      throw error;
    }
  }

  async getTestRecommendations(funnelId: string): Promise<Array<{
    test_type: 'ab_test' | 'multivariate' | 'heatmap';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    hypothesis: string;
    expected_impact: string;
    effort_required: 'low' | 'medium' | 'high';
    suggested_elements: string[];
  }>> {
    try {
      console.log(`💡 Getting test recommendations for funnel: ${funnelId}`);

      // Get funnel performance data
      const metrics = await funnelAnalyticsService.getFunnelPerformanceMetrics(funnelId);
      const recommendations = [];

      // Analyze performance and suggest tests
      if (metrics.overall_conversion_rate < 3) {
        recommendations.push({
          test_type: 'ab_test' as const,
          priority: 'high' as const,
          title: 'Test Primary Value Proposition',
          description: 'Your conversion rate suggests the main value proposition may not be resonating with visitors',
          hypothesis: 'A clearer, more compelling value proposition will increase conversion rates',
          expected_impact: 'Could improve conversion rate by 25-50%',
          effort_required: 'low' as const,
          suggested_elements: ['headline', 'subheadline', 'hero_section']
        });
      }

      // Check for high drop-off steps
      const highDropOffStep = metrics.step_analytics.find(step => step.drop_off_rate > 60);
      if (highDropOffStep) {
        recommendations.push({
          test_type: 'heatmap' as const,
          priority: 'high' as const,
          title: `Analyze User Behavior on ${highDropOffStep.step_name}`,
          description: `Step ${highDropOffStep.step_number} has a ${highDropOffStep.drop_off_rate.toFixed(1)}% drop-off rate`,
          hypothesis: 'Understanding where users click and scroll will reveal optimization opportunities',
          expected_impact: 'Could reduce drop-off by 20-40%',
          effort_required: 'low' as const,
          suggested_elements: ['click_tracking', 'scroll_tracking', 'form_interactions']
        });
      }

      // Mobile vs desktop performance gap
      const mobileData = metrics.device_breakdown.find(d => d.device_type === 'mobile');
      const desktopData = metrics.device_breakdown.find(d => d.device_type === 'desktop');

      if (mobileData && desktopData && mobileData.conversion_rate < desktopData.conversion_rate * 0.7) {
        recommendations.push({
          test_type: 'ab_test' as const,
          priority: 'high' as const,
          title: 'Test Mobile-Optimized Design',
          description: `Mobile converts at ${mobileData.conversion_rate.toFixed(1)}% vs desktop at ${desktopData.conversion_rate.toFixed(1)}%`,
          hypothesis: 'A mobile-first design approach will improve mobile conversion rates',
          expected_impact: 'Could improve mobile conversions by 30-60%',
          effort_required: 'medium' as const,
          suggested_elements: ['mobile_layout', 'button_sizes', 'form_design', 'navigation']
        });
      }

      // Form completion issues
      const formSteps = metrics.step_analytics.filter(step =>
        step.step_type === 'opt_in' && step.form_completion_rate && step.form_completion_rate < 50
      );

      if (formSteps.length > 0) {
        recommendations.push({
          test_type: 'multivariate' as const,
          priority: 'medium' as const,
          title: 'Optimize Form Design Elements',
          description: 'Multiple form elements could be optimized simultaneously',
          hypothesis: 'Testing different combinations of form elements will find the optimal configuration',
          expected_impact: 'Could improve form completion by 40-70%',
          effort_required: 'medium' as const,
          suggested_elements: ['form_fields', 'button_text', 'form_layout', 'trust_signals']
        });
      }

      // Traffic source performance differences
      const organicTraffic = metrics.traffic_sources.find(s => s.source === 'organic');
      const paidTraffic = metrics.traffic_sources.find(s => s.source.includes('paid'));

      if (organicTraffic && paidTraffic && Math.abs(organicTraffic.conversion_rate - paidTraffic.conversion_rate) > 3) {
        recommendations.push({
          test_type: 'ab_test' as const,
          priority: 'medium' as const,
          title: 'Test Messaging by Traffic Source',
          description: 'Different traffic sources have significantly different conversion rates',
          hypothesis: 'Tailored messaging for each traffic source will improve overall performance',
          expected_impact: 'Could improve overall conversion by 15-30%',
          effort_required: 'medium' as const,
          suggested_elements: ['headline', 'value_proposition', 'cta_text']
        });
      }

      // Sort by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      console.log(`✅ Generated ${recommendations.length} test recommendations`);
      return recommendations;

    } catch (error) {
      console.error('❌ Failed to get test recommendations:', error);
      throw error;
    }
  }

  // Test Templates
  async getTestTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    test_type: 'ab_test' | 'multivariate' | 'heatmap';
    category: 'conversion' | 'engagement' | 'usability' | 'trust';
    template_config: any;
    success_rate: number;
  }>> {
    try {
      const templates = [
        {
          id: 'headline_test',
          name: 'Headline A/B Test',
          description: 'Test different headlines to improve first impression and conversion',
          test_type: 'ab_test' as const,
          category: 'conversion' as const,
          template_config: {
            elements: ['h1', '.hero-headline'],
            variations: [
              'Benefit-focused headline',
              'Problem-solution headline',
              'Question-based headline'
            ]
          },
          success_rate: 85
        },
        {
          id: 'cta_button_test',
          name: 'CTA Button Optimization',
          description: 'Test different call-to-action button designs and copy',
          test_type: 'multivariate' as const,
          category: 'conversion' as const,
          template_config: {
            elements: [
              {
                element: 'button_text',
                variations: ['Get Started', 'Try Free', 'Start Now', 'Join Today']
              },
              {
                element: 'button_color',
                variations: ['#ff6b35', '#4CAF50', '#2196F3', '#FF9800']
              }
            ]
          },
          success_rate: 78
        },
        {
          id: 'form_optimization',
          name: 'Form Field Optimization',
          description: 'Optimize form completion rates by testing field configurations',
          test_type: 'ab_test' as const,
          category: 'conversion' as const,
          template_config: {
            elements: ['form'],
            variations: [
              'Minimal fields (name, email)',
              'Standard fields (name, email, phone)',
              'Extended fields (name, email, phone, company)'
            ]
          },
          success_rate: 72
        },
        {
          id: 'trust_signals',
          name: 'Trust Signal Testing',
          description: 'Test different trust signals to improve credibility',
          test_type: 'ab_test' as const,
          category: 'trust' as const,
          template_config: {
            elements: ['.trust-section'],
            variations: [
              'Customer testimonials',
              'Security badges',
              'Money-back guarantee',
              'Customer logos'
            ]
          },
          success_rate: 68
        },
        {
          id: 'page_layout',
          name: 'Page Layout Heatmap',
          description: 'Analyze user behavior to optimize page layout',
          test_type: 'heatmap' as const,
          category: 'usability' as const,
          template_config: {
            tracking: {
              clicks: true,
              scrolling: true,
              mouse_movement: true,
              form_interactions: true
            }
          },
          success_rate: 90
        }
      ];

      return templates;

    } catch (error) {
      console.error('❌ Failed to get test templates:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const funnelTestingService = FunnelTestingService.getInstance();