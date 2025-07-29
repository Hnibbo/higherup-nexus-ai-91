import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Settings,
  Eye,
  AlertCircle,
  Info,
  Filter,
  Search,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RegulatoryComplianceService, {
  ComplianceMetrics,
  DataSubjectRequest,
  ComplianceIncident,
  ComplianceFramework
} from '@/services/compliance/RegulatoryComplianceService';

interface ComplianceDashboardProps {
  className?: string;
}

const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [dataSubjectRequests, setDataSubjectRequests] = useState<DataSubjectRequest[]>([]);
  const [incidents, setIncidents] = useState<ComplianceIncident[]>([]);
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filters
  const [requestFilter, setRequestFilter] = useState<string>('all');
  const [incidentFilter, setIncidentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<ComplianceIncident | null>(null);
  
  // Form states
  const [newRequestForm, setNewRequestForm] = useState({
    request_type: 'access' as const,
    subject_email: '',
    subject_name: '',
    request_details: '',
    priority: 'normal' as const
  });

  const complianceService = RegulatoryComplianceService.getInstance();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [metricsData, requestsData, incidentsData] = await Promise.all([
        complianceService.getComplianceStatus(),
        complianceService.getDataSubjectRequests(),
        complianceService.getComplianceIncidents()
      ]);
      
      setMetrics(metricsData);
      setDataSubjectRequests(requestsData);
      setIncidents(incidentsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequestForm.subject_email.trim()) return;
    
    try {
      const requestData = {
        ...newRequestForm,
        subject_id: `subject_${Date.now()}`,
        status: 'received' as const
      };

      const newRequest = await complianceService.processDataSubjectRequest(requestData);
      if (newRequest) {
        setDataSubjectRequests(prev => [newRequest, ...prev]);
        setNewRequestOpen(false);
        resetRequestForm();
      }
    } catch (error) {
      console.error('Failed to create request:', error);
    }
  };

  const resetRequestForm = () => {
    setNewRequestForm({
      request_type: 'access',
      subject_email: '',
      subject_name: '',
      request_details: '',
      priority: 'normal'
    });
  };

  const handleGenerateReport = async (frameworkId: string, reportType: string) => {
    try {
      const report = await complianceService.generateComplianceReport(frameworkId, reportType as any);
      if (report) {
        // Download or display report
        console.log('Generated report:', report);
        setReportDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'completed':
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'non_compliant':
      case 'critical':
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'partial':
      case 'in_progress':
      case 'investigating':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'completed':
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'non_compliant':
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'partial':
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredRequests = dataSubjectRequests.filter(request => {
    if (requestFilter !== 'all' && request.status !== requestFilter) return false;
    if (searchQuery && !request.subject_email.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !request.subject_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredIncidents = incidents.filter(incident => {
    if (incidentFilter !== 'all' && incident.severity !== incidentFilter) return false;
    if (searchQuery && !incident.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Dashboard</h2>
          <p className="text-gray-600">Monitor regulatory compliance and data protection</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Compliance Report</DialogTitle>
                <DialogDescription>
                  Create a compliance report for regulatory frameworks
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Framework</Label>
                  <Select defaultValue="gdpr">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gdpr">GDPR</SelectItem>
                      <SelectItem value="ccpa">CCPA</SelectItem>
                      <SelectItem value="soc2">SOC 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Report Type</Label>
                  <Select defaultValue="summary">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="audit">Audit Ready</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleGenerateReport('gdpr', 'summary')}>
                  Generate Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Compliance</p>
                  <p className="text-2xl font-bold">{metrics.overall_compliance_score}%</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <Progress value={metrics.overall_compliance_score} className="mt-3" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical Findings</p>
                  <p className="text-2xl font-bold">{metrics.critical_findings}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="flex items-center mt-3 text-sm">
                {metrics.critical_findings > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-600">Requires attention</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600">All clear</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                  <p className="text-2xl font-bold">{metrics.pending_requests}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="flex items-center mt-3 text-sm">
                <Clock className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-gray-600">Data subject requests</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Control Effectiveness</p>
                  <p className="text-2xl font-bold">{metrics.control_effectiveness}%</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <Progress value={metrics.control_effectiveness} className="mt-3" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Data Subject Requests</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Framework Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Framework Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics?.framework_scores || {}).map(([framework, score]) => (
                  <div key={framework} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="uppercase">
                        {framework}
                      </Badge>
                      <span className="font-medium">
                        {framework === 'gdpr' ? 'GDPR' : 
                         framework === 'ccpa' ? 'CCPA' : 
                         framework === 'soc2' ? 'SOC 2' : framework}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Progress value={score} className="w-24" />
                      <span className="text-sm font-medium w-12">{score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Data Subject Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dataSubjectRequests.slice(0, 5).map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{request.subject_name || request.subject_email}</div>
                        <div className="text-sm text-gray-600 capitalize">
                          {request.request_type} request
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {dataSubjectRequests.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No recent requests
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incidents.slice(0, 5).map(incident => (
                    <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{incident.title}</div>
                        <div className="text-sm text-gray-600">
                          {formatTimestamp(incident.discovery_date)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(incident.severity)}>
                          {getStatusIcon(incident.severity)}
                          <span className="ml-1 capitalize">{incident.severity}</span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {incidents.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No recent incidents
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search requests..."
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={requestFilter} onValueChange={setRequestFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Data Subject Request</DialogTitle>
                  <DialogDescription>
                    Process a new data subject rights request
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Request Type</Label>
                    <Select
                      value={newRequestForm.request_type}
                      onValueChange={(value: any) => 
                        setNewRequestForm(prev => ({ ...prev, request_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="access">Access Request</SelectItem>
                        <SelectItem value="rectification">Rectification</SelectItem>
                        <SelectItem value="erasure">Erasure (Right to be Forgotten)</SelectItem>
                        <SelectItem value="portability">Data Portability</SelectItem>
                        <SelectItem value="restriction">Restriction of Processing</SelectItem>
                        <SelectItem value="objection">Objection to Processing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Subject Email</Label>
                    <Input
                      value={newRequestForm.subject_email}
                      onChange={(e) => 
                        setNewRequestForm(prev => ({ ...prev, subject_email: e.target.value }))
                      }
                      placeholder="subject@example.com"
                    />
                  </div>
                  
                  <div>
                    <Label>Subject Name</Label>
                    <Input
                      value={newRequestForm.subject_name}
                      onChange={(e) => 
                        setNewRequestForm(prev => ({ ...prev, subject_name: e.target.value }))
                      }
                      placeholder="Full name"
                    />
                  </div>
                  
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={newRequestForm.priority}
                      onValueChange={(value: any) => 
                        setNewRequestForm(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Request Details</Label>
                    <Textarea
                      value={newRequestForm.request_details}
                      onChange={(e) => 
                        setNewRequestForm(prev => ({ ...prev, request_details: e.target.value }))
                      }
                      placeholder="Describe the request details..."
                      rows={3}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewRequestOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRequest}>
                    Create Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Requests List */}
          <Card>
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      
                      <div>
                        <div className="font-medium">{request.subject_name || request.subject_email}</div>
                        <div className="text-sm text-gray-600">
                          {request.request_type.replace('_', ' ')} request • {formatTimestamp(request.received_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(request.priority)}>
                        {request.priority}
                      </Badge>
                      
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Export Data
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                
                {filteredRequests.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                    <p className="text-gray-600">
                      {searchQuery ? 'No requests match your search.' : 'No data subject requests have been submitted.'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search incidents..."
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={incidentFilter} onValueChange={setIncidentFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button>
              <AlertCircle className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </div>

          {/* Incidents List */}
          <Card>
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredIncidents.map(incident => (
                  <div key={incident.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        incident.severity === 'critical' ? 'bg-red-100' :
                        incident.severity === 'high' ? 'bg-orange-100' :
                        incident.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          incident.severity === 'critical' ? 'text-red-600' :
                          incident.severity === 'high' ? 'text-orange-600' :
                          incident.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                      </div>
                      
                      <div>
                        <div className="font-medium">{incident.title}</div>
                        <div className="text-sm text-gray-600">
                          {incident.incident_type.replace('_', ' ')} • {formatTimestamp(incident.discovery_date)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                      
                      <Badge className={getStatusColor(incident.status)}>
                        {getStatusIcon(incident.status)}
                        <span className="ml-1 capitalize">{incident.status}</span>
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredIncidents.length === 0 && (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents found</h3>
                    <p className="text-gray-600">
                      {searchQuery ? 'No incidents match your search.' : 'No compliance incidents have been reported.'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* GDPR Framework */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    GDPR
                  </CardTitle>
                  <Badge variant="outline">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Compliance Score</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Requirements</span>
                      <span>23/27 compliant</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Assessment</span>
                      <span>2 days ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Review</span>
                      <span>In 88 days</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CCPA Framework */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    CCPA
                  </CardTitle>
                  <Badge variant="outline">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Compliance Score</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Requirements</span>
                      <span>11/12 compliant</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Assessment</span>
                      <span>1 week ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Review</span>
                      <span>In 83 days</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SOC 2 Framework */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    SOC 2
                  </CardTitle>
                  <Badge variant="outline">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Compliance Score</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Requirements</span>
                      <span>31/40 compliant</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Assessment</span>
                      <span>3 weeks ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Review</span>
                      <span>In 69 days</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceDashboard;