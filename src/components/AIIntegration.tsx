import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Bot, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from './LoadingSpinner';

interface AIInteractionProps {
  type: 'email_generation' | 'content_creation' | 'funnel_optimization' | 'market_analysis';
  prompt: string;
  onSuccess?: (result: string) => void;
  onError?: (error: string) => void;
}

export const AIInteraction = ({ type, prompt, onSuccess, onError }: AIInteractionProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleAIGeneration = async () => {
    if (!user || !profile) return;

    if (profile.ai_credits_remaining <= 0) {
      toast({
        title: "No AI Credits",
        description: "Upgrade your plan to get more AI credits.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate AI generation (replace with actual AI service integration)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResponses = {
        email_generation: "Subject: 🚀 Transform Your Business Today\n\nHi there!\n\nReady to dominate your market? Our AI-powered platform gives you the tools to crush competition and scale rapidly.\n\n✅ 10x your email conversions\n✅ Automate your entire sales funnel\n✅ Generate leads while you sleep\n\nClick here to start your free trial: [CTA Button]\n\nTo your success,\nThe HigherUp Team",
        content_creation: "# 5 Ways to Dominate Your Market in 2024\n\n1. **Leverage AI Automation** - Automate repetitive tasks and focus on strategy\n2. **Build Converting Funnels** - Create high-converting sales sequences\n3. **Master Email Marketing** - Nurture leads with personalized campaigns\n4. **Use Data Analytics** - Make decisions based on real performance data\n5. **Stay Ahead of Trends** - Continuously innovate and adapt\n\nReady to implement these strategies? Let's build your empire together!",
        funnel_optimization: "## Funnel Optimization Recommendations\n\n### Current Performance Analysis:\n- Conversion Rate: 2.3% (Industry Average: 2.1%)\n- Drop-off Point: Email capture (67% bounce)\n- Best Performing Element: Social proof testimonials\n\n### Optimization Strategy:\n1. **A/B Test Headlines** - Test emotional vs. logical appeals\n2. **Reduce Form Fields** - Only ask for email initially\n3. **Add Exit Intent Popup** - Capture leaving visitors\n4. **Implement Urgency** - Limited time offers\n5. **Mobile Optimization** - 43% of traffic is mobile\n\n### Expected Results:\n- 35% increase in conversions\n- 25% reduction in bounce rate\n- $12,000 additional monthly revenue",
        market_analysis: "## Market Analysis Report\n\n### Industry Overview:\n- Market Size: $127B (Growing 15% YoY)\n- Key Trends: AI automation, personalization, omnichannel\n- Opportunity Score: 9.2/10\n\n### Competitive Landscape:\n- Direct Competitors: 7 major players\n- Market Share Available: 23%\n- Competitive Advantage: AI-first approach\n\n### Recommendations:\n1. **Target Micro-Niches** - Focus on specific industries\n2. **Emphasize AI Capabilities** - Highlight automation benefits\n3. **Premium Positioning** - Price 20% above average\n4. **Content Marketing** - Establish thought leadership\n\n### Growth Potential:\n- 6-month revenue target: $50K MRR\n- 12-month target: $150K MRR\n- Market domination timeline: 18 months"
      };

      const result = mockResponses[type];
      
      // Record AI interaction in database
      await supabase
        .from('ai_interactions')
        .insert({
          user_id: user.id,
          interaction_type: type,
          prompt,
          response: result,
          credits_used: 1
        });

      // Update user credits
      await supabase
        .from('profiles')
        .update({
          ai_credits_remaining: profile.ai_credits_remaining - 1
        })
        .eq('user_id', user.id);

      onSuccess?.(result);
      
      toast({
        title: "AI Generation Complete",
        description: "Your content has been generated successfully!",
      });

    } catch (error) {
      console.error('AI generation error:', error);
      onError?.('Failed to generate content. Please try again.');
      
      toast({
        title: "Generation Failed",
        description: "Unable to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bot className="w-5 h-5 mr-2 text-primary" />
          AI Content Generator
        </CardTitle>
        <CardDescription>
          Generate professional content with AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">AI Credits Remaining</span>
          <Badge variant={profile?.ai_credits_remaining > 10 ? "default" : "destructive"}>
            {profile?.ai_credits_remaining || 0}
          </Badge>
        </div>
        
        {profile?.ai_credits_remaining <= 0 ? (
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium">No AI Credits</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Upgrade your plan to get more AI credits
            </p>
          </div>
        ) : (
          <Button 
            onClick={handleAIGeneration}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate with AI
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInteraction;