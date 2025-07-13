import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  Eye,
  MousePointer,
  DollarSign,
  BarChart3,
  Calendar,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState({
    totalContacts: 0,
    totalCampaigns: 0,
    totalRevenue: 0,
    conversionRate: 0,
  });

  // Sample data for charts
  const revenueData = [
    { month: 'Jan', revenue: 12400, leads: 240, conversions: 45 },
    { month: 'Feb', revenue: 15600, leads: 310, conversions: 62 },
    { month: 'Mar', revenue: 18900, leads: 378, conversions: 75 },
    { month: 'Apr', revenue: 22100, leads: 442, conversions: 88 },
    { month: 'May', revenue: 25300, leads: 506, conversions: 101 },
    { month: 'Jun', revenue: 28700, leads: 574, conversions: 115 },
  ];

  const trafficData = [
    { name: 'Organic Search', value: 35, color: '#8B5CF6' },
    { name: 'Direct', value: 25, color: '#06B6D4' },
    { name: 'Social Media', value: 20, color: '#F59E0B' },
    { name: 'Email', value: 15, color: '#10B981' },
    { name: 'Referral', value: 5, color: '#EF4444' },
  ];

  const conversionFunnelData = [
    { step: 'Visitors', count: 10000, percentage: 100 },
    { step: 'Leads', count: 2500, percentage: 25 },
    { step: 'Qualified', count: 750, percentage: 7.5 },
    { step: 'Customers', count: 150, percentage: 1.5 },
  ];

  const campaignPerformance = [
    { name: 'Email Campaign A', sent: 5000, opened: 1250, clicked: 375, converted: 45 },
    { name: 'Email Campaign B', sent: 3500, opened: 980, clicked: 294, converted: 32 },
    { name: 'SMS Campaign A', sent: 2000, opened: 1800, clicked: 540, converted: 65 },
    { name: 'Social Media A', sent: 8000, opened: 2400, clicked: 720, converted: 58 },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      // Fetch real data from your tables
      const [contactsRes, campaignsRes, metricsRes] = await Promise.all([
        supabase.from('contacts').select('id').eq('user_id', user.id),
        supabase.from('email_campaigns').select('id').eq('user_id', user.id),
        supabase.from('performance_metrics').select('*').eq('user_id', user.id).limit(10),
      ]);

      setMetrics({
        totalContacts: contactsRes.data?.length || 0,
        totalCampaigns: campaignsRes.data?.length || 0,
        totalRevenue: 28700, // You can calculate this from your data
        conversionRate: 15.2, // You can calculate this from your data
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
            <p className="text-muted-foreground">
              Real-time insights and performance metrics to optimize your business
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAnalytics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex space-x-2">
          {['24h', '7d', '30d', '90d', '1y'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>+12.5% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics.totalContacts)}</div>
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>+8.2% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
              <div className="flex items-center space-x-1 text-xs text-red-600">
                <TrendingDown className="w-3 h-3" />
                <span>-2.1% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalCampaigns}</div>
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>+3 new this week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Conversions</CardTitle>
              <CardDescription>Monthly revenue and conversion trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value as number) : value,
                    name === 'revenue' ? 'Revenue' : name === 'leads' ? 'Leads' : 'Conversions'
                  ]} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.3}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    stroke="#06B6D4"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where your visitors are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trafficData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {trafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Customer journey from visitor to customer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnelData.map((item, index) => (
                  <div key={item.step} className="flex items-center space-x-4">
                    <div className="w-20 text-sm font-medium">{item.step}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{formatNumber(item.count)}</span>
                        <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Compare your campaign metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="opened" fill="#8B5CF6" name="Opened" />
                  <Bar dataKey="clicked" fill="#06B6D4" name="Clicked" />
                  <Bar dataKey="converted" fill="#10B981" name="Converted" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions and events in your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New contact added', details: 'Sarah Johnson from TechCorp', time: '2 minutes ago', type: 'contact' },
                { action: 'Email campaign sent', details: 'Product Launch Campaign - 1,250 recipients', time: '15 minutes ago', type: 'campaign' },
                { action: 'Automation triggered', details: 'Welcome Email Sequence for 5 new leads', time: '1 hour ago', type: 'automation' },
                { action: 'Form submission', details: 'Demo request from Digital Agency', time: '2 hours ago', type: 'form' },
                { action: 'Goal achieved', details: 'Monthly revenue target reached', time: '1 day ago', type: 'goal' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <div className="flex-1">
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-muted-foreground">{activity.details}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Analytics;