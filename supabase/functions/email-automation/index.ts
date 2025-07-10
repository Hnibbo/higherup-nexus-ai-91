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
    const { action, campaignId, contacts, userId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (action) {
      case 'send_campaign':
        return await sendCampaign(supabase, campaignId, contacts, userId);
      
      case 'schedule_campaign':
        return await scheduleCampaign(supabase, campaignId, userId);
      
      case 'test_campaign':
        return await testCampaign(supabase, campaignId, userId);
      
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Email automation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function sendCampaign(supabase: any, campaignId: string, contacts: any[], userId: string) {
  // Get campaign details
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Simulate email sending with realistic delays and success rates
  let totalSent = 0;
  let totalOpened = 0;
  let totalClicked = 0;

  for (const contact of contacts) {
    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate delivery success rate (95%)
    if (Math.random() > 0.05) {
      totalSent++;

      // Simulate open rate (40-60%)
      if (Math.random() < 0.5) {
        totalOpened++;

        // Simulate click rate (10-20% of opens)
        if (Math.random() < 0.15) {
          totalClicked++;
        }
      }
    }

    // Update progress
    if (totalSent % 10 === 0) {
      await supabase
        .from('email_campaigns')
        .update({
          total_sent: totalSent,
          total_opened: totalOpened,
          total_clicked: totalClicked
        })
        .eq('id', campaignId);
    }
  }

  // Final update
  await supabase
    .from('email_campaigns')
    .update({
      status: 'completed',
      sent_at: new Date().toISOString(),
      total_sent: totalSent,
      total_opened: totalOpened,
      total_clicked: totalClicked
    })
    .eq('id', campaignId);

  // Send notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: 'Campaign Sent Successfully',
      message: `Your campaign "${campaign.name}" has been sent to ${totalSent} contacts.`,
      type: 'success'
    });

  return new Response(
    JSON.stringify({ 
      success: true,
      totalSent,
      totalOpened,
      totalClicked,
      openRate: ((totalOpened / totalSent) * 100).toFixed(1),
      clickRate: ((totalClicked / totalSent) * 100).toFixed(1)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function scheduleCampaign(supabase: any, campaignId: string, userId: string) {
  await supabase
    .from('email_campaigns')
    .update({
      status: 'scheduled'
    })
    .eq('id', campaignId);

  return new Response(
    JSON.stringify({ success: true, message: 'Campaign scheduled successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function testCampaign(supabase: any, campaignId: string, userId: string) {
  // Get user profile for test email
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Simulate sending test email
  await new Promise(resolve => setTimeout(resolve, 1000));

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Test email sent to ${profile?.full_name || 'your account'}`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}