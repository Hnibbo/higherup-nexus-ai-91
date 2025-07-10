import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface RealTimeData {
  activeUsers: number;
  conversions: number;
  revenue: number;
  engagement: number;
  campaigns: {
    total: number;
    active: number;
    completed: number;
  };
  funnels: {
    total: number;
    live: number;
    converting: number;
  };
}

export const useRealTimeUpdates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<RealTimeData>({
    activeUsers: 0,
    conversions: 0,
    revenue: 0,
    engagement: 0,
    campaigns: { total: 0, active: 0, completed: 0 },
    funnels: { total: 0, live: 0, converting: 0 }
  });

  useEffect(() => {
    if (!user) return;

    loadInitialData();
    
    // Set up real-time subscriptions
    const campaignChannel = supabase
      .channel('campaign_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_campaigns',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refreshCampaignData();
        }
      )
      .subscribe();

    const funnelChannel = supabase
      .channel('funnel_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'funnels',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refreshFunnelData();
        }
      )
      .subscribe();

    const analyticsChannel = supabase
      .channel('analytics_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          handleAnalyticsUpdate(payload.new);
        }
      )
      .subscribe();

    // Simulate real-time metrics updates
    const metricsInterval = setInterval(() => {
      setData(prev => ({
        ...prev,
        activeUsers: Math.max(0, prev.activeUsers + Math.floor(Math.random() * 10 - 5)),
        conversions: prev.conversions + Math.floor(Math.random() * 3),
        revenue: prev.revenue + Math.floor(Math.random() * 100),
        engagement: Math.min(100, Math.max(0, prev.engagement + (Math.random() * 2 - 1)))
      }));
    }, 10000);

    return () => {
      supabase.removeChannel(campaignChannel);
      supabase.removeChannel(funnelChannel);  
      supabase.removeChannel(analyticsChannel);
      clearInterval(metricsInterval);
    };
  }, [user]);

  const loadInitialData = async () => {
    if (!user) return;

    try {
      const [campaignData, funnelData, analyticsData] = await Promise.all([
        supabase
          .from('email_campaigns')
          .select('status')
          .eq('user_id', user.id),
        
        supabase
          .from('funnels')
          .select('status')
          .eq('user_id', user.id),
          
        supabase
          .from('analytics_events')
          .select('event_type, created_at')
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const campaigns = campaignData.data || [];
      const funnels = funnelData.data || [];
      const analytics = analyticsData.data || [];

      setData(prev => ({
        ...prev,
        campaigns: {
          total: campaigns.length,
          active: campaigns.filter(c => c.status === 'active').length,
          completed: campaigns.filter(c => c.status === 'completed').length
        },
        funnels: {
          total: funnels.length,
          live: funnels.filter(f => f.status === 'live').length,
          converting: funnels.filter(f => f.status === 'active').length
        },
        activeUsers: Math.floor(Math.random() * 500) + 100,
        conversions: analytics.filter(a => a.event_type === 'conversion').length,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        engagement: Math.floor(Math.random() * 30) + 70
      }));
    } catch (error) {
      console.error('Error loading real-time data:', error);
    }
  };

  const refreshCampaignData = async () => {
    if (!user) return;

    try {
      const { data: campaigns } = await supabase
        .from('email_campaigns')
        .select('status')
        .eq('user_id', user.id);

      if (campaigns) {
        setData(prev => ({
          ...prev,
          campaigns: {
            total: campaigns.length,
            active: campaigns.filter(c => c.status === 'active').length,
            completed: campaigns.filter(c => c.status === 'completed').length
          }
        }));
      }
    } catch (error) {
      console.error('Error refreshing campaign data:', error);
    }
  };

  const refreshFunnelData = async () => {
    if (!user) return;

    try {
      const { data: funnels } = await supabase
        .from('funnels')
        .select('status')
        .eq('user_id', user.id);

      if (funnels) {
        setData(prev => ({
          ...prev,
          funnels: {
            total: funnels.length,
            live: funnels.filter(f => f.status === 'live').length,
            converting: funnels.filter(f => f.status === 'active').length
          }
        }));
      }
    } catch (error) {
      console.error('Error refreshing funnel data:', error);
    }
  };

  const handleAnalyticsUpdate = (newEvent: any) => {
    if (newEvent.event_type === 'conversion') {
      setData(prev => ({
        ...prev,
        conversions: prev.conversions + 1
      }));
      
      toast({
        title: "New Conversion! 🎉",
        description: "Someone just converted through your funnel!",
      });
    }
  };

  return { data, refresh: loadInitialData };
};

export default useRealTimeUpdates;