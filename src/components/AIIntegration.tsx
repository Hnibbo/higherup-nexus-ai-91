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
      // Call real AI completion service
      const response = await supabase.functions.invoke('ai-completion', {
        body: {
          prompt,
          type,
          userId: user.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'AI generation failed');
      }

      const { response: aiResponse, creditsRemaining } = response.data;

      // Update local profile state
      if (profile) {
        profile.ai_credits_remaining = creditsRemaining;
      }

      onSuccess?.(aiResponse);
      
      toast({
        title: "AI Generation Complete",
        description: "Your content has been generated successfully!",
      });

    } catch (error: any) {
      console.error('AI generation error:', error);
      onError?.('Failed to generate content. Please try again.');
      
      toast({
        title: "Generation Failed",
        description: error.message || "Unable to generate content. Please try again.",
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