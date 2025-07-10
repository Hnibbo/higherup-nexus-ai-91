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
    const { script, avatarId, settings, userId, projectId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update project status to processing
    await supabase
      .from('video_projects')
      .update({
        generation_status: 'processing',
        generation_metadata: {
          started_at: new Date().toISOString(),
          script_length: script.length,
          avatar_id: avatarId,
          settings: settings
        }
      })
      .eq('id', projectId);

    // Simulate video generation process
    const steps = [
      { step: 'Analyzing script', progress: 10, delay: 1000 },
      { step: 'Preparing avatar', progress: 25, delay: 2000 },
      { step: 'Generating speech synthesis', progress: 45, delay: 3000 },
      { step: 'Creating visual elements', progress: 65, delay: 2000 },
      { step: 'Applying effects and transitions', progress: 80, delay: 2000 },
      { step: 'Rendering final video', progress: 95, delay: 3000 },
      { step: 'Finalizing', progress: 100, delay: 1000 }
    ];

    for (const { step, progress, delay } of steps) {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      await supabase
        .from('video_projects')
        .update({
          generation_metadata: {
            current_step: step,
            progress: progress,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', projectId);

      // Send real-time update
      await supabase
        .channel('video_generation')
        .send({
          type: 'broadcast',
          event: 'progress_update',
          payload: {
            project_id: projectId,
            user_id: userId,
            step: step,
            progress: progress
          }
        });
    }

    // Generate mock video URLs (in production, these would be real generated videos)
    const videoUrl = `https://example.com/videos/${projectId}.mp4`;
    const thumbnailUrl = `https://example.com/thumbnails/${projectId}.jpg`;

    // Update project as completed
    await supabase
      .from('video_projects')
      .update({
        generation_status: 'completed',
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration_seconds: Math.ceil(script.length / 150) * 60,
        generation_metadata: {
          completed_at: new Date().toISOString(),
          total_time_seconds: steps.reduce((acc, step) => acc + step.delay, 0) / 1000
        }
      })
      .eq('id', projectId);

    // Send completion notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Video Generation Complete',
        message: `Your video "${script.substring(0, 50)}..." has been successfully generated!`,
        type: 'success',
        action_url: `/video-creator?project=${projectId}`
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        message: 'Video generated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Video generation error:', error);
    
    // Update project as failed if projectId is available
    const body = await req.json().catch(() => ({}));
    if (body.projectId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('video_projects')
        .update({
          generation_status: 'failed',
          generation_metadata: {
            error: error.message,
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', body.projectId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});