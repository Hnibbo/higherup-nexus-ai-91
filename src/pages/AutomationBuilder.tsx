import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Settings,
  Trash2,
  Clock,
  Mail,
  Smartphone,
  Users,
  BarChart3,
  Globe,
  Calendar,
  Bot,
  Webhook,
  GitBranch,
  Timer,
  Filter,
  Database,
  ExternalLink,
  Copy,
  Eye,
  Edit,
  MoreVertical,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertTriangle,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  status: string;
  total_runs: number;
  successful_runs: number;
  created_at: string;
  actions: any;
  trigger_config: any;
}

const AutomationBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  // Builder state
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [triggerType, setTriggerType] = useState('');
  const [triggerConfig, setTriggerConfig] = useState<any>({});
  const [actions, setActions] = useState<any[]>([]);

  const triggerTypes = [
    { value: 'form_submit', label: 'Form Submission', icon: Users },
    { value: 'email_open', label: 'Email Opened', icon: Mail },
    { value: 'email_click', label: 'Email Link Clicked', icon: ExternalLink },
    { value: 'contact_added', label: 'New Contact Added', icon: Users },
    { value: 'tag_added', label: 'Tag Added to Contact', icon: Filter },
    { value: 'webhook', label: 'Webhook Trigger', icon: Webhook },
    { value: 'schedule', label: 'Scheduled Trigger', icon: Clock },
    { value: 'funnel_step', label: 'Funnel Step Completed', icon: GitBranch },
    { value: 'api_call', label: 'API Call Received', icon: Database },
    { value: 'page_visit', label: 'Page Visit', icon: Globe },
  ];

  const actionTypes = [
    { value: 'send_email', label: 'Send Email', icon: Mail },
    { value: 'send_sms', label: 'Send SMS', icon: Smartphone },
    { value: 'add_tag', label: 'Add Tag', icon: Filter },
    { value: 'update_contact', label: 'Update Contact', icon: Users },
    { value: 'create_task', label: 'Create Task', icon: CheckCircle },
    { value: 'wait', label: 'Wait/Delay', icon: Timer },
    { value: 'webhook', label: 'Send Webhook', icon: Webhook },
    { value: 'api_request', label: 'API Request', icon: Database },
    { value: 'conditional', label: 'If/Then Logic', icon: GitBranch },
    { value: 'ai_action', label: 'AI Action', icon: Bot },
  ];

  useEffect(() => {
    fetchWorkflows();
  }, [user]);

  const fetchWorkflows = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast({
        title: 'Error',
        description: 'Failed to load automation workflows',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async () => {
    if (!user || !workflowName || !triggerType) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .insert({
          user_id: user.id,
          name: workflowName,
          description: workflowDescription,
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          actions: actions,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      setWorkflows([data, ...workflows]);
      resetBuilder();
      setIsBuilderOpen(false);

      toast({
        title: 'Success',
        description: 'Automation workflow created successfully',
      });
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to create automation workflow',
        variant: 'destructive',
      });
    }
  };

  const toggleWorkflow = async (workflow: AutomationWorkflow) => {
    const newStatus = workflow.status === 'active' ? 'paused' : 'active';

    try {
      const { error } = await supabase
        .from('automation_workflows')
        .update({ status: newStatus })
        .eq('id', workflow.id);

      if (error) throw error;

      setWorkflows(workflows.map(w => 
        w.id === workflow.id ? { ...w, status: newStatus } : w
      ));

      toast({
        title: 'Success',
        description: `Workflow ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });
    } catch (error) {
      console.error('Error updating workflow status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update workflow status',
        variant: 'destructive',
      });
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;

      setWorkflows(workflows.filter(w => w.id !== workflowId));

      toast({
        title: 'Success',
        description: 'Workflow deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete workflow',
        variant: 'destructive',
      });
    }
  };

  const resetBuilder = () => {
    setWorkflowName('');
    setWorkflowDescription('');
    setTriggerType('');
    setTriggerConfig({});
    setActions([]);
  };

  const addAction = (actionType: string) => {
    setActions([...actions, {
      id: Math.random().toString(36).substr(2, 9),
      type: actionType,
      config: {},
    }]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'draft':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSuccessRate = (workflow: AutomationWorkflow) => {
    if (workflow.total_runs === 0) return 0;
    return Math.round((workflow.successful_runs / workflow.total_runs) * 100);
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
            <h1 className="text-3xl font-bold tracking-tight">Automation Builder</h1>
            <p className="text-muted-foreground">
              Create powerful automations that work 24/7. Better than Make, n8n, and Zapier combined.
            </p>
          </div>
          <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create Automation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Automation</DialogTitle>
                <DialogDescription>
                  Build a powerful automation workflow that runs automatically
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Workflow Name</Label>
                    <Input
                      id="name"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      placeholder="e.g., Welcome Email Sequence"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trigger">Trigger Type</Label>
                    <Select value={triggerType} onValueChange={setTriggerType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger" />
                      </SelectTrigger>
                      <SelectContent>
                        {triggerTypes.map((trigger) => (
                          <SelectItem key={trigger.value} value={trigger.value}>
                            <div className="flex items-center space-x-2">
                              <trigger.icon className="w-4 h-4" />
                              <span>{trigger.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    placeholder="Describe what this automation does..."
                  />
                </div>

                {/* Actions Builder */}
                <div className="space-y-4">
                  <Label>Actions</Label>
                  <div className="border rounded-lg p-4 min-h-32">
                    {actions.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No actions added yet. Add your first action below.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {actions.map((action, index) => (
                          <div key={action.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">
                                {actionTypes.find(t => t.value === action.type)?.label || action.type}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActions(actions.filter(a => a.id !== action.id))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {actionTypes.map((actionType) => (
                      <Button
                        key={actionType.value}
                        variant="outline"
                        size="sm"
                        onClick={() => addAction(actionType.value)}
                        className="flex items-center space-x-2"
                      >
                        <actionType.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{actionType.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsBuilderOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createWorkflow}>
                    Create Workflow
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflows.length}</div>
              <p className="text-xs text-muted-foreground">
                {workflows.filter(w => w.status === 'active').length} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflows.reduce((sum, w) => sum + w.total_runs, 0)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflows.length > 0 
                  ? Math.round(
                      workflows.reduce((sum, w) => sum + getSuccessRate(w), 0) / workflows.length
                    )
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Average success rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(workflows.reduce((sum, w) => sum + w.total_runs, 0) * 0.5)}h
              </div>
              <p className="text-xs text-muted-foreground">Estimated</p>
            </CardContent>
          </Card>
        </div>

        {/* Workflows Grid */}
        <div className="grid gap-4">
          {workflows.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <Bot className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Automations Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first automation to start working smarter, not harder.
                </p>
                <Button onClick={() => setIsBuilderOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Automation
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {workflow.description}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedWorkflow(workflow)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteWorkflow(workflow.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(workflow.status)}`} />
                        <Badge variant="outline" className="capitalize">
                          {workflow.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getSuccessRate(workflow)}% success
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total Runs</div>
                        <div className="font-medium">{workflow.total_runs}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Successful</div>
                        <div className="font-medium">{workflow.successful_runs}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleWorkflow(workflow)}
                        className="flex-1"
                      >
                        {workflow.status === 'active' ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AutomationBuilder;