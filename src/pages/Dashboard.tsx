import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  Mail,
  Target,
  DollarSign,
  Activity,
  Bot,
  Zap,
  BarChart3,
  Video,
  Plus,
  ArrowUpRight,
  Calendar,
  MessageSquare,
} from 'lucide-react';

interface DashboardStats {
  totalContacts: number;
  activeCampaigns: number;
  totalFunnels: number;
  aiCreditsUsed: number;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    activeCampaigns: 0,
    totalFunnels: 0,
    aiCreditsUsed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch contacts count
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      // Fetch active campaigns count
      const { count: campaignsCount } = await supabase
        .from('email_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .neq('status', 'archived');

      // Fetch funnels count
      const { count: funnelsCount } = await supabase
        .from('funnels')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      // Fetch AI interactions count
      const { count: aiInteractionsCount } = await supabase
        .from('ai_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      setStats({
        totalContacts: contactsCount || 0,
        activeCampaigns: campaignsCount || 0,
        totalFunnels: funnelsCount || 0,
        aiCreditsUsed: aiInteractionsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Add Contact',
      icon: Users,
      description: 'Add your first contact',
      action: () => navigate('/crm'),
      color: 'text-blue-600'
    },
    {
      title: 'Create Campaign',
      icon: Mail,
      description: 'Launch email marketing',
      action: () => navigate('/email-marketing'),
      color: 'text-green-600'
    },
    {
      title: 'Build Funnel',
      icon: Target,
      description: 'Design conversion flow',
      action: () => navigate('/funnel-builder'),
      color: 'text-purple-600'
    },
    {
      title: 'Generate Video',
      icon: Video,
      description: 'AI-powered content',
      action: () => navigate('/video-creator'),
      color: 'text-orange-600'
    },
    {
      title: 'AI Assistant',
      icon: Bot,
      description: 'Get smart suggestions',
      action: () => navigate('/ai-assistant'),
      color: 'text-primary'
    },
    {
      title: 'View Analytics',
      icon: BarChart3,
      description: 'Track performance',
      action: () => navigate('/analytics'),
      color: 'text-indigo-600'
    },
  ];

  const statCards = [
    {
      title: 'Total Contacts',
      value: stats.totalContacts.toLocaleString(),
      change: '+12.5%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Active Campaigns',
      value: stats.activeCampaigns.toString(),
      change: '+4',
      icon: Mail,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Funnels Built',
      value: stats.totalFunnels.toString(),
      change: '+23.1%',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'AI Credits Used',
      value: stats.aiCreditsUsed.toString(),
      change: `${profile?.ai_credits_remaining || 0} remaining`,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {userName}! 👋
              </h1>
              <p className="text-muted-foreground text-lg">
                Ready to dominate your market? Here's your command center.
              </p>
            </div>
            <Button size="lg" className="group">
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
              Quick Start
            </Button>
          </div>

          {/* Plan Status Alert */}
          {profile?.plan_type === 'starter' && (
            <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Unlock Your Full Potential</h3>
                      <p className="text-sm text-muted-foreground">
                        Upgrade to Pro for unlimited everything and crush your competition
                      </p>
                    </div>
                  </div>
                  <Button>
                    Upgrade Now
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold">{loading ? '...' : stat.value}</p>
                      <p className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color} group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-primary" />
                  Dominate Your Market
                </CardTitle>
                <CardDescription>
                  Power moves to outperform every competitor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start group hover:border-primary hover:shadow-md transition-all"
                      onClick={action.action}
                    >
                      <div className="flex items-center w-full mb-2">
                        <action.icon className={`w-5 h-5 mr-2 ${action.color} group-hover:scale-110 transition-transform`} />
                        <span className="font-medium">{action.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground text-left">
                        {action.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-primary" />
                  AI Command Center
                </CardTitle>
                <CardDescription>
                  Your intelligent business domination co-pilot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-medium">AI Strategy Alert</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    I've analyzed your competition. Ready to implement a crushing email sequence that converts 3x better?
                  </p>
                  <div className="flex space-x-2">
                    <Button size="sm" className="text-xs">Dominate Now</Button>
                    <Button size="sm" variant="outline" className="text-xs">Show Analysis</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>AI Credits Remaining</span>
                    <span className="font-medium">{profile?.ai_credits_remaining || 0}</span>
                  </div>
                  <Progress 
                    value={((profile?.ai_credits_remaining || 0) / 100) * 100} 
                    className="h-2"
                  />
                </div>
                
                <Button className="w-full group" onClick={() => navigate('/ai-assistant')}>
                  <MessageSquare className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Launch AI Assistant
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Market Dominance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-primary" />
                Market Dominance Dashboard
              </CardTitle>
              <CardDescription>
                Real-time metrics showing how you're crushing the competition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Competitive Advantage</span>
                    <Badge variant="default">Leading</Badge>
                  </div>
                  <Progress value={87} className="h-2" />
                  <p className="text-xs text-muted-foreground">87% better than industry average</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Automation Score</span>
                    <Badge variant="secondary">Elite</Badge>
                  </div>
                  <Progress value={94} className="h-2" />
                  <p className="text-xs text-muted-foreground">94% of tasks automated</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Market Share</span>
                    <Badge variant="outline">Growing</Badge>
                  </div>
                  <Progress value={76} className="h-2" />
                  <p className="text-xs text-muted-foreground">+23% growth this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-primary" />
                  Domination Timeline
                </div>
                <Button variant="outline" size="sm">View All</Button>
              </CardTitle>
              <CardDescription>
                Latest power moves and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading your empire's activity...
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Market domination platform activated</p>
                        <p className="text-xs text-muted-foreground">Just now</p>
                      </div>
                      <Badge variant="default">Success</Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm">Ready to import contacts and launch campaigns</p>
                        <p className="text-xs text-muted-foreground">Start with CRM to add your contacts</p>
                      </div>
                      <Badge variant="secondary">Next Step</Badge>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default Dashboard;