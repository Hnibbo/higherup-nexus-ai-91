import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  MousePointer,
  Eye,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Zap
} from "lucide-react";

const Analytics = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      // Load real analytics data from multiple tables
      const [
        { data: contacts },
        { data: campaigns },
        { data: funnels },
        { data: aiInteractions }
      ] = await Promise.all([
        supabase.from('contacts').select('*').eq('user_id', user!.id),
        supabase.from('email_campaigns').select('*').eq('user_id', user!.id),
        supabase.from('funnels').select('*').eq('user_id', user!.id),
        supabase.from('ai_interactions').select('*').eq('user_id', user!.id)
      ]);

      setAnalyticsData({
        contacts: contacts || [],
        campaigns: campaigns || [],
        funnels: funnels || [],
        aiInteractions: aiInteractions || []
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    if (!analyticsData) return null;

    const totalContacts = analyticsData.contacts.length;
    const activeCampaigns = analyticsData.campaigns.filter(c => c.status === 'active').length;
    const totalFunnels = analyticsData.funnels.length;
    const aiCreditsUsed = analyticsData.aiInteractions.length;

    return {
      totalContacts,
      activeCampaigns,
      totalFunnels,
      aiCreditsUsed
    };
  };

  const stats = getStats();

  const performanceMetrics = [
    { label: "Revenue Growth", value: "+34.2%", trend: "up", color: "text-green-600" },
    { label: "Conversion Rate", value: "12.8%", trend: "up", color: "text-green-600" },
    { label: "Customer Acquisition", value: "+127", trend: "up", color: "text-green-600" },
    { label: "Churn Rate", value: "2.1%", trend: "down", color: "text-red-600" }
  ];

  const topChannels = [
    { name: "Email Marketing", performance: 87, revenue: "$24,500" },
    { name: "Funnel Campaigns", performance: 92, revenue: "$18,200" },
    { name: "SMS Marketing", performance: 76, revenue: "$12,800" },
    { name: "AI Automation", performance: 94, revenue: "$31,400" }
  ];

  const recentEvents = [
    { event: "Campaign 'Summer Sale' launched", time: "2 hours ago", type: "campaign" },
    { event: "Funnel 'Lead Magnet' completed 50 conversions", time: "4 hours ago", type: "funnel" },
    { event: "AI Assistant generated 25 email sequences", time: "6 hours ago", type: "ai" },
    { event: "127 new contacts imported", time: "1 day ago", type: "contacts" }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your business performance and growth metrics</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" onClick={loadAnalytics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                  <p className="text-3xl font-bold">{stats?.totalContacts || 0}</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12.5% this month
                  </p>
                </div>
                <div className="p-3 bg-primary/20 rounded-full">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                  <p className="text-3xl font-bold">{stats?.activeCampaigns || 0}</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +8 this week
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-full">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Funnels</p>
                  <p className="text-3xl font-bold">{stats?.totalFunnels || 0}</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +23% this month
                  </p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-full">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Credits Used</p>
                  <p className="text-3xl font-bold">{stats?.aiCreditsUsed || 0}</p>
                  <p className="text-xs text-orange-600 flex items-center">
                    <Zap className="w-3 h-3 mr-1" />
                    Optimizing performance
                  </p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-full">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="realtime">Real-time</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Key Performance Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performanceMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{metric.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold ${metric.color}`}>
                          {metric.value}
                        </span>
                        {metric.trend === "up" ? 
                          <TrendingUp className="w-4 h-4 text-green-600" /> :
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        }
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentEvents.map((event, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <div className="flex-1">
                          <p className="text-sm">{event.event}</p>
                          <p className="text-xs text-muted-foreground">{event.time}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="channels" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Channels</CardTitle>
                <CardDescription>Revenue and performance by marketing channel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {topChannels.map((channel, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{channel.name}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-muted-foreground">{channel.revenue}</span>
                          <span className="text-sm font-medium">{channel.performance}%</span>
                        </div>
                      </div>
                      <Progress value={channel.performance} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">247</div>
                  <p className="text-xs text-muted-foreground">Users online now</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Live Conversions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">In the last hour</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Revenue Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$2,847</div>
                  <p className="text-xs text-muted-foreground">+18% vs yesterday</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Live Feed</CardTitle>
                <CardDescription>Real-time business activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 bg-green-50 dark:bg-green-900/10 rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm">New contact added: john.doe@example.com</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-blue-50 dark:bg-blue-900/10 rounded">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm">Email campaign sent to 1,247 contacts</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-purple-50 dark:bg-purple-900/10 rounded">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-sm">Funnel conversion: Product Launch → Purchase</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Analytics;