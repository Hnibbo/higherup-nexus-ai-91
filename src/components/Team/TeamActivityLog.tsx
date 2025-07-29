import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  User, 
  UserPlus, 
  UserMinus, 
  Settings, 
  Shield, 
  Mail, 
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  Clock,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import TeamManagementService, { ActivityLog, TeamMember } from '@/services/team/TeamManagementService';

interface TeamActivityLogProps {
  teamId: string;
  className?: string;
}

const TeamActivityLog: React.FC<TeamActivityLogProps> = ({ teamId, className }) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const teamService = TeamManagementService.getInstance();

  useEffect(() => {
    loadActivityData();
  }, [teamId]);

  const loadActivityData = async () => {
    try {
      setLoading(true);
      const [activitiesData, membersData] = await Promise.all([
        teamService.getActivityLogs(teamId, 100),
        teamService.getTeamMembers(teamId)
      ]);
      
      setActivities(activitiesData);
      setMembers(membersData);
    } catch (error) {
      console.error('Failed to load activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivityData();
    setRefreshing(false);
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'member_added':
      case 'member_invited':
      case 'invitation_accepted':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'member_removed':
      case 'member_left':
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'member_updated':
      case 'profile_updated':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'role_created':
      case 'role_updated':
      case 'permissions_changed':
        return <Shield className="h-4 w-4 text-purple-500" />;
      case 'communication_sent':
      case 'notification_sent':
        return <Mail className="h-4 w-4 text-orange-500" />;
      case 'settings_updated':
      case 'preferences_updated':
        return <Settings className="h-4 w-4 text-gray-500" />;
      case 'document_created':
      case 'document_updated':
        return <FileText className="h-4 w-4 text-indigo-500" />;
      case 'login':
      case 'logout':
        return <Activity className="h-4 w-4 text-teal-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityDescription = (activity: ActivityLog) => {
    const member = members.find(m => m.user_id === activity.user_id);
    const memberName = member ? `${member.first_name} ${member.last_name}` : 'Unknown User';

    switch (activity.action) {
      case 'member_added':
        return `${memberName} added a new team member`;
      case 'member_invited':
        return `${memberName} invited ${activity.details.email} to join the team`;
      case 'invitation_accepted':
        return `${memberName} accepted the team invitation`;
      case 'member_removed':
        return `${memberName} removed a team member`;
      case 'member_updated':
        return `${memberName} updated member information`;
      case 'role_created':
        return `${memberName} created a new role: ${activity.details.role_name}`;
      case 'role_updated':
        return `${memberName} updated role permissions`;
      case 'communication_sent':
        return `${memberName} sent a ${activity.details.type}: ${activity.details.title}`;
      case 'settings_updated':
        return `${memberName} updated team settings`;
      case 'preferences_updated':
        return `${memberName} updated their preferences`;
      case 'login':
        return `${memberName} logged in`;
      case 'logout':
        return `${memberName} logged out`;
      default:
        return `${memberName} performed ${activity.action.replace('_', ' ')}`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getFilteredActivities = () => {
    let filtered = activities;

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(activity => activity.user_id === userFilter);
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(activity => activity.action === actionFilter);
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (timeFilter) {
        case '1h':
          cutoffDate.setHours(now.getHours() - 1);
          break;
        case '24h':
          cutoffDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(now.getDate() - 30);
          break;
      }
      
      filtered = filtered.filter(activity => new Date(activity.timestamp) > cutoffDate);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(activity => {
        const description = getActivityDescription(activity).toLowerCase();
        return description.includes(searchQuery.toLowerCase());
      });
    }

    return filtered;
  };

  const getUniqueActions = () => {
    const actions = [...new Set(activities.map(a => a.action))];
    return actions.sort();
  };

  const getMemberById = (userId: string) => {
    return members.find(m => m.user_id === userId);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const filteredActivities = getFilteredActivities();

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Team Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Team Activity
            <Badge variant="secondary">{filteredActivities.length}</Badge>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {members.map(member => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.first_name} {member.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {getUniqueActions().map(action => (
                  <SelectItem key={action} value={action}>
                    {action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-4">
          {filteredActivities.map((activity, index) => {
            const member = getMemberById(activity.user_id);
            
            return (
              <div key={`${activity.id}-${index}`} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0">
                  {member ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityIcon(activity.action)}
                    <p className="text-sm text-gray-900">
                      {getActivityDescription(activity)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(activity.timestamp)}
                    </div>
                    
                    {activity.ip_address && activity.ip_address !== 'unknown' && (
                      <span>IP: {activity.ip_address}</span>
                    )}
                    
                    {activity.resource && (
                      <span>Resource: {activity.resource}</span>
                    )}
                  </div>
                  
                  {/* Activity Details */}
                  {Object.keys(activity.details).length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <Eye className="h-3 w-3" />
                        <span className="font-medium">Details:</span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(activity.details).map(([key, value]) => (
                          <div key={key} className="flex">
                            <span className="font-medium w-20 capitalize">
                              {key.replace('_', ' ')}:
                            </span>
                            <span className="text-gray-600">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredActivities.length === 0 && (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activity found</h3>
            <p className="text-gray-600">
              {searchQuery || userFilter !== 'all' || actionFilter !== 'all' || timeFilter !== 'all'
                ? 'Try adjusting your filters to see more activities.'
                : 'Team activity will appear here as members interact with the platform.'
              }
            </p>
          </div>
        )}

        {/* Activity Summary */}
        {activities.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {activities.filter(a => a.action.includes('member')).length}
                </div>
                <div className="text-sm text-gray-600">Member Actions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {activities.filter(a => a.action.includes('login')).length}
                </div>
                <div className="text-sm text-gray-600">Logins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {activities.filter(a => a.action.includes('role') || a.action.includes('permission')).length}
                </div>
                <div className="text-sm text-gray-600">Role Changes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {activities.filter(a => a.action.includes('communication')).length}
                </div>
                <div className="text-sm text-gray-600">Communications</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamActivityLog;