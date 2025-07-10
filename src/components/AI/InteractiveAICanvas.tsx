import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Zap, 
  Play, 
  Pause, 
  Save, 
  Share, 
  Download,
  Layers,
  Target,
  Mail,
  BarChart3,
  FileText,
  Video,
  Users,
  Calendar,
  Settings,
  Sparkles,
  Eye,
  Hand,
  MousePointer2,
  Activity
} from 'lucide-react';

interface CanvasElement {
  id: string;
  type: 'funnel' | 'email' | 'video' | 'analytics' | 'automation';
  name: string;
  status: 'planned' | 'building' | 'testing' | 'live' | 'optimizing';
  position: { x: number; y: number };
  data: any;
  connections: string[];
}

interface AIAction {
  id: string;
  type: string;
  title: string;
  description: string;
  progress: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  results?: any;
}

export const InteractiveAICanvas = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [aiActions, setAiActions] = useState<AIAction[]>([]);
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null);
  const [isAIActive, setIsAIActive] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [canvasMode, setCanvasMode] = useState<'view' | 'edit' | 'ai-building'>('view');
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    activeUsers: 247,
    conversions: 34,
    revenue: 12847,
    engagement: 87.3
  });

  useEffect(() => {
    loadCanvasData();
    startRealTimeUpdates();
  }, [user]);

  const loadCanvasData = async () => {
    if (!user) return;

    try {
      // Load existing canvas elements from AI interactions
      const { data: interactions } = await supabase
        .from('ai_interactions')
        .select('*')
        .eq('user_id', user.id)
        .not('canvas_data', 'eq', '{}')
        .order('created_at', { ascending: false })
        .limit(1);

      if (interactions && interactions.length > 0) {
        const canvasData = interactions[0].canvas_data as any;
        if (canvasData.elements) {
          setElements(canvasData.elements);
        }
      } else {
        // Create initial canvas with sample elements
        const initialElements: CanvasElement[] = [
          {
            id: '1',
            type: 'funnel',
            name: 'Lead Generation Funnel',
            status: 'live',
            position: { x: 100, y: 100 },
            data: { conversion_rate: 12.3, visitors: 1247 },
            connections: ['2']
          },
          {
            id: '2',
            type: 'email',
            name: 'Welcome Email Sequence',
            status: 'live',
            position: { x: 350, y: 150 },
            data: { open_rate: 42.1, click_rate: 8.7 },
            connections: ['3']
          },
          {
            id: '3',
            type: 'video',
            name: 'Product Demo Video',
            status: 'building',
            position: { x: 600, y: 200 },
            data: { completion_rate: 78.5 },
            connections: []
          }
        ];
        setElements(initialElements);
      }
    } catch (error) {
      console.error('Error loading canvas data:', error);
    }
  };

  const startRealTimeUpdates = () => {
    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      setRealTimeMetrics(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5),
        conversions: prev.conversions + Math.floor(Math.random() * 3),
        revenue: prev.revenue + Math.floor(Math.random() * 100),
        engagement: Math.min(100, Math.max(0, prev.engagement + (Math.random() * 2 - 1)))
      }));
    }, 5000);

    return () => clearInterval(interval);
  };

  const saveCanvasState = async () => {
    if (!user) return;

    try {
      await supabase
        .from('ai_interactions')
        .insert({
          user_id: user.id,
          interaction_type: 'canvas_save',
          canvas_data: JSON.parse(JSON.stringify({ elements, timestamp: new Date().toISOString() })) as any,
          prompt: 'Canvas state saved'
        });

      toast({
        title: "Canvas Saved",
        description: "Your AI canvas has been saved successfully."
      });
    } catch (error) {
      console.error('Error saving canvas:', error);
    }
  };

  const handleAICommand = async (command: string) => {
    if (!user) return;

    setIsAIActive(true);
    setCanvasMode('ai-building');

    // Create new AI action
    const newAction: AIAction = {
      id: Date.now().toString(),
      type: 'ai_command',
      title: `AI Building: ${command}`,
      description: `Executing command: ${command}`,
      progress: 0,
      status: 'processing'
    };

    setAiActions(prev => [...prev, newAction]);

    try {
      // Simulate AI processing
      const progressInterval = setInterval(() => {
        setAiActions(prev => prev.map(action => 
          action.id === newAction.id 
            ? { ...action, progress: Math.min(100, action.progress + 10) }
            : action
        ));
      }, 500);

      // Process AI command
      await new Promise(resolve => setTimeout(resolve, 3000));

      clearInterval(progressInterval);

      // Generate new elements based on command
      if (command.toLowerCase().includes('funnel')) {
        const newFunnel: CanvasElement = {
          id: Date.now().toString(),
          type: 'funnel',
          name: 'AI-Generated Sales Funnel',
          status: 'building',
          position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
          data: { predicted_conversion: 15.7, estimated_revenue: 25000 },
          connections: []
        };
        setElements(prev => [...prev, newFunnel]);
      }

      if (command.toLowerCase().includes('email')) {
        const newEmail: CanvasElement = {
          id: Date.now().toString(),
          type: 'email',
          name: 'AI-Optimized Email Campaign',
          status: 'building',
          position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
          data: { predicted_open_rate: 45.2, predicted_ctr: 12.1 },
          connections: []
        };
        setElements(prev => [...prev, newEmail]);
      }

      // Update action as completed
      setAiActions(prev => prev.map(action => 
        action.id === newAction.id 
          ? { ...action, progress: 100, status: 'completed', results: 'Successfully created new marketing element' }
          : action
      ));

      toast({
        title: "AI Task Completed",
        description: `Successfully executed: ${command}`
      });

    } catch (error) {
      setAiActions(prev => prev.map(action => 
        action.id === newAction.id 
          ? { ...action, status: 'failed' }
          : action
      ));
    } finally {
      setIsAIActive(false);
      setCanvasMode('view');
    }
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'funnel': return Target;
      case 'email': return Mail;
      case 'video': return Video;
      case 'analytics': return BarChart3;
      case 'automation': return Zap;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'building': return 'bg-yellow-500';
      case 'testing': return 'bg-blue-500';
      case 'planned': return 'bg-gray-500';
      case 'optimizing': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center">
            <Bot className="w-8 h-8 mr-3 text-primary" />
            AI Canvas
            <Badge className="ml-3" variant={isAIActive ? "default" : "secondary"}>
              {isAIActive ? "AI Building..." : "Ready"}
            </Badge>
          </h2>
          <p className="text-muted-foreground">Watch your AI agent build and optimize your marketing empire in real-time</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setCanvasMode('edit')}>
            <Settings className="w-4 h-4 mr-2" />
            Edit Mode
          </Button>
          <Button onClick={saveCanvasState}>
            <Save className="w-4 h-4 mr-2" />
            Save Canvas
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Bar */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">{realTimeMetrics.activeUsers}</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Conversions Today</p>
              <p className="text-2xl font-bold">{realTimeMetrics.conversions}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Revenue Today</p>
              <p className="text-2xl font-bold">${realTimeMetrics.revenue.toLocaleString()}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Engagement</p>
              <p className="text-2xl font-bold">{realTimeMetrics.engagement.toFixed(1)}%</p>
            </div>
            <Eye className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Canvas */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Layers className="w-5 h-5 mr-2" />
                  Marketing Canvas
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Real-time</Badge>
                  <Badge variant={canvasMode === 'ai-building' ? "default" : "secondary"}>
                    {canvasMode === 'ai-building' ? 'AI Building' : 'Interactive'}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Interactive visualization of your marketing ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div 
                ref={canvasRef}
                className="relative w-full h-[500px] bg-gradient-to-br from-background to-muted/20 overflow-hidden"
                style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgba(255,255,255,0.1) 2px, transparent 0)', backgroundSize: '100px 100px' }}
              >
                {/* Canvas Elements */}
                {elements.map((element) => {
                  const Icon = getElementIcon(element.type);
                  return (
                    <div
                      key={element.id}
                      className={`absolute p-4 bg-background border-2 rounded-lg shadow-lg cursor-pointer transition-all hover:scale-105 ${
                        selectedElement?.id === element.id ? 'border-primary' : 'border-border'
                      }`}
                      style={{
                        left: element.position.x,
                        top: element.position.y,
                        minWidth: '180px'
                      }}
                      onClick={() => setSelectedElement(element)}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Icon className="w-5 h-5 text-primary" />
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(element.status)}`} />
                      </div>
                      <h4 className="font-medium text-sm mb-1">{element.name}</h4>
                      <p className="text-xs text-muted-foreground capitalize">{element.status}</p>
                      {element.data && (
                      <div className="text-xs text-green-600 mt-1">
                        {Object.entries(element.data).slice(0, 2).map(([key, value]) => (
                          <div key={key}>
                            {key}: {typeof value === 'number' ? value.toFixed(1) : String(value)}
                          </div>
                        ))}
                      </div>
                      )}
                    </div>
                  );
                })}

                {/* Connections */}
                <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                  {elements.map(element => 
                    element.connections.map(connectionId => {
                      const targetElement = elements.find(e => e.id === connectionId);
                      if (!targetElement) return null;
                      
                      return (
                        <line
                          key={`${element.id}-${connectionId}`}
                          x1={element.position.x + 90}
                          y1={element.position.y + 40}
                          x2={targetElement.position.x + 90}
                          y2={targetElement.position.y + 40}
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          opacity="0.6"
                        />
                      );
                    })
                  )}
                </svg>

                {/* AI Building Indicator */}
                {canvasMode === 'ai-building' && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
                      <h3 className="text-lg font-semibold">AI is Building...</h3>
                      <p className="text-muted-foreground">Creating marketing magic</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Control Panel */}
        <div className="space-y-4">
          {/* AI Assistant */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="w-5 h-5 mr-2 text-primary" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">HigherUp AI</span>
                </div>
                <p className="text-sm">I'm analyzing your canvas and ready to build. What would you like me to create?</p>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Tell me what to build..."
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAICommand(aiMessage)}
                />
                <Button 
                  className="w-full" 
                  onClick={() => handleAICommand(aiMessage)}
                  disabled={isAIActive || !aiMessage.trim()}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Build with AI
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium">Quick Actions:</p>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    'Create high-converting funnel',
                    'Build email sequence',
                    'Generate video campaign',
                    'Optimize conversion rates'
                  ].map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => handleAICommand(action)}
                      disabled={isAIActive}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active AI Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiActions.slice(-3).map((action) => (
                  <div key={action.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{action.title}</h4>
                      <Badge 
                        variant={action.status === 'completed' ? 'default' : 
                                action.status === 'failed' ? 'destructive' : 'secondary'}
                      >
                        {action.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{action.description}</p>
                    {action.status === 'processing' && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${action.progress}%` }}
                        />
                      </div>
                    )}
                    {action.results && (
                      <p className="text-xs text-green-600 mt-1">{action.results}</p>
                    )}
                  </div>
                ))}
                {aiActions.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No active tasks
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Element Details */}
          {selectedElement && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Element Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{selectedElement.name}</h4>
                    <p className="text-sm text-muted-foreground capitalize">{selectedElement.type}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {selectedElement.status}
                  </Badge>
                  {selectedElement.data && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Metrics:</p>
                      {Object.entries(selectedElement.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{typeof value === 'number' ? value.toFixed(1) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Button size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};