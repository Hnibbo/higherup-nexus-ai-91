/**
 * Security Dashboard Component
 * Comprehensive security monitoring and management interface
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Lock, 
  Users, 
  FileText,
  TrendingUp,
  Clock,
  Activity,
  Settings
} from 'lucide-react';
import { enterpriseSecurityFramework } from '@/services/security/EnterpriseSecurityFramework';
import { multiFactorAuthService } from '@/services/security/MultiFactorAuthService';
import { complianceMonitoringService } from '@/services/security/ComplianceMonitoringService';

interface SecurityDashboardProps {
  userId?: string;
  isAdmin?: boolean;
}

interface SecurityMetrics {
  securityScore: number;
  activeThreats: any[];
  recentEvents: any[];
  complianceStatus: string;
  mfaEnabled: boolean;
  complianceScore: number;
  activeViolations: any[];
  pendingRequests: any[];
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ 
  userId, 
  isAdmin = false 
}) => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSecurityMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSecurityMetrics, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadSecurityMetrics = async () => {
    try {
      setRefreshing(true);
      
      // Load security framework data
      const securityData = await enterpriseSecurityFramework.getSecurityDashboard();
      
      // Load compliance data
      const complianceData = await complianceMonitoringService.getComplianceDashboard();
      
      // Load MFA status if user ID provided
      let mfaEnabled = false;
      if (userId) {
        mfaEnabled = await multiFactorAuthService.hasMFAEnabled(userId);
      }

      setMetrics({
        securityScore: securityData.securityScore,
        activeThreats: securityData.activeThreats,
        recentEvents: securityData.recentEvents,
        complianceStatus: securityData.complianceStatus,
        mfaEnabled,
        complianceScore: complianceData.overallScore,
        activeViolations: complianceData.activeViolations,
        pendingRequests: complianceData.pendingRequests
      });
    } catch (error) {
      console.error('Failed to load security metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleThreatAction = async (threatId: string, action: string) => {
    try {
      // Handle threat actions (acknowledge, investigate, etc.)
      console.log(`Handling threat ${threatId} with action: ${action}`);
      await loadSecurityMetrics(); // Refresh data
    } catch (error) {
      console.error('Failed to handle threat action:', error);
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSecurityScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <Badge className={colors[severity] || colors.medium}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading security dashboard...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load security metrics. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Security Dashboard</h1>
          {refreshing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>
        <Button onClick={loadSecurityMetrics} variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Security Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            {getSecurityScoreIcon(metrics.securityScore)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSecurityScoreColor(metrics.securityScore)}`}>
              {metrics.securityScore}/100
            </div>
            <Progress value={metrics.securityScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.complianceStatus}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeThreats.length}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeThreats.filter(t => t.severity === 'critical').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.complianceScore}/100</div>
            <Progress value={metrics.complianceScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.activeViolations.length} violations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MFA Status</CardTitle>
            <Lock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.mfaEnabled ? 'Enabled' : 'Disabled'}
            </div>
            <p className="text-xs text-muted-foreground">
              Multi-factor authentication
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="threats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Threats Tab */}
        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Security Threats</CardTitle>
              <CardDescription>
                Current security threats requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.activeThreats.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">No Active Threats</p>
                  <p className="text-muted-foreground">Your system is secure</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.activeThreats.map((threat) => (
                    <div
                      key={threat.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedThreat(threat)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <div>
                            <h3 className="font-medium">{threat.description}</h3>
                            <p className="text-sm text-muted-foreground">
                              Detected: {new Date(threat.detectedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getSeverityBadge(threat.severity)}
                          <Badge variant="outline">
                            {threat.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                      
                      {threat.affectedResources.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">
                            Affected: {threat.affectedResources.join(', ')}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-3 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleThreatAction(threat.id, 'investigate');
                          }}
                        >
                          Investigate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleThreatAction(threat.id, 'acknowledge');
                          }}
                        >
                          Acknowledge
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Latest security-related activities and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recentEvents.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 p-3 border rounded">
                    <div className={`w-2 h-2 rounded-full ${
                      event.severity === 'critical' ? 'bg-red-500' :
                      event.severity === 'warning' ? 'bg-yellow-500' :
                      event.severity === 'error' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.source} • {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={event.result === 'success' ? 'default' : 'destructive'}>
                      {event.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Violations</CardTitle>
                <CardDescription>
                  Active compliance violations requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.activeViolations.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm">No active violations</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {metrics.activeViolations.slice(0, 5).map((violation) => (
                      <div key={violation.id} className="border rounded p-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{violation.title}</h4>
                          {getSeverityBadge(violation.severity)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {violation.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Subject Requests</CardTitle>
                <CardDescription>
                  Pending data subject requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.pendingRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm">No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {metrics.pendingRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="border rounded p-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            {request.requestType.toUpperCase()} Request
                          </h4>
                          <Badge variant="outline">{request.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          From: {request.dataSubject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Received: {new Date(request.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and compliance settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Multi-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Enhance account security with MFA
                    </p>
                  </div>
                  <Button variant={metrics.mfaEnabled ? "default" : "outline"}>
                    {metrics.mfaEnabled ? "Configured" : "Setup MFA"}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Security Monitoring</h4>
                    <p className="text-sm text-muted-foreground">
                      Real-time threat detection and monitoring
                    </p>
                  </div>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Compliance Reporting</h4>
                    <p className="text-sm text-muted-foreground">
                      Automated compliance reports and audits
                    </p>
                  </div>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Threat Detail Modal */}
      {selectedThreat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Threat Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedThreat(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedThreat.description}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Severity</h3>
                  {getSeverityBadge(selectedThreat.severity)}
                </div>
                <div>
                  <h3 className="font-medium">Confidence</h3>
                  <p className="text-sm">{selectedThreat.confidence}%</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium">Affected Resources</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedThreat.affectedResources.map((resource, index) => (
                    <Badge key={index} variant="outline">{resource}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium">Mitigation Actions</h3>
                <div className="space-y-2 mt-1">
                  {selectedThreat.mitigationActions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{action.type.replace('_', ' ')}</span>
                      <Badge variant={action.status === 'executed' ? 'default' : 'outline'}>
                        {action.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setSelectedThreat(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  handleThreatAction(selectedThreat.id, 'investigate');
                  setSelectedThreat(null);
                }}
              >
                Investigate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;