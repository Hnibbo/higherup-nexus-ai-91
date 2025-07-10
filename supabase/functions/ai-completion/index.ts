import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type, userId } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check user credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_credits_remaining')
      .eq('user_id', userId)
      .single();

    if (!profile || profile.ai_credits_remaining <= 0) {
      return new Response(
        JSON.stringify({ error: 'Insufficient AI credits' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
      );
    }

    // Generate AI response based on type
    const systemPrompts = {
      email_generation: "You are an expert email marketer. Create compelling, high-converting email campaigns that drive action. Focus on engagement, personalization, and clear CTAs.",
      content_creation: "You are a professional content creator specializing in marketing content. Create engaging, valuable content that positions the brand as an authority.",
      funnel_optimization: "You are a conversion rate optimization expert. Analyze funnels and provide specific, actionable recommendations to improve conversion rates.",
      market_analysis: "You are a strategic market analyst. Provide comprehensive market insights, competitive analysis, and growth opportunities.",
      video_script: "You are a professional video script writer. Create engaging, persuasive scripts for marketing videos that capture attention and drive conversions.",
      automation_workflow: "You are an automation expert. Design sophisticated marketing automation workflows that nurture leads and drive conversions.",
      social_media: "You are a social media marketing expert. Create compelling social media content that engages audiences and builds brand awareness."
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompts[type] || 'You are a helpful marketing assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Record AI interaction
    await supabase
      .from('ai_interactions')
      .insert({
        user_id: userId,
        interaction_type: type,
        prompt: prompt,
        response: aiResponse,
        credits_used: 1,
        performance_metrics: {
          model: 'gpt-4o-mini',
          tokens_used: data.usage?.total_tokens || 0,
          response_time: Date.now()
        }
      });

    // Deduct credit
    await supabase
      .from('profiles')
      .update({
        ai_credits_remaining: profile.ai_credits_remaining - 1
      })
      .eq('user_id', userId);

    return new Response(
      JSON.stringify({ response: aiResponse, creditsRemaining: profile.ai_credits_remaining - 1 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI completion error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});