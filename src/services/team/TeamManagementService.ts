import { supabase } from '@/integrations/supabase/client';

/**
 * Team Management Service
 * 
 * Handles user roles, permissions, team member management, invitations,
 * activity tracking, and team performance analytics.
 */

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: TeamRole;
  permissions: Permission[];
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  joined_at: string;
  last_active: string;
  invited_by: string;
  department?: string;
  title?: string;
  phone?: string;
  timezone: string;
  preferences: UserPreferences;
}

export interface TeamRole {
  id: string;
  name: string;
  description: string;
  level: number; // 1 = Owner, 2 = Admin, 3 = Manager, 4 = Member, 5 = Viewer
  is_system_role: boolean;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  scope: 'own' | 'team' | 'all';
  conditions?: Record<string, any>;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  invitation_token: string;
  message?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  team_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  session_id: string;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
  privacy: PrivacyPreferences;
  accessibility: AccessibilityPreferences;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  notification_types: {
    mentions: boolean;
    assignments: boolean;
    deadlines: boolean;
    team_updates: boolean;
    system_alerts: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
    timezone: string;
  };
}

export interface DashboardPreferences {
  default_view: string;
  widgets: string[];
  layout: 'grid' | 'list' | 'cards';
  theme: 'light' | 'dark' | 'auto';
  sidebar_collapsed: boolean;
}

export interface PrivacyPreferences {
  profile_visibility: 'public' | 'team' | 'private';
  activity_visibility: 'public' | 'team' | 'private';
  contact_info_visibility: 'public' | 'team' | 'private';
  allow_mentions: boolean;
  allow_direct_messages: boolean;
}

export interface AccessibilityPreferences {
  high_contrast: boolean;
  large_text: boolean;
  reduced_motion: boolean;
  screen_reader: boolean;
  keyboard_navigation: boolean;
}

export interface TeamPerformanceMetrics {
  team_id: string;
  period: string;
  metrics: {
    total_members: number;
    active_members: number;
    new_members: number;
    member_retention_rate: number;
    average_session_duration: number;
    total_activities: number;
    collaboration_score: number;
    productivity_score: number;
    engagement_score: number;
  };
  member_metrics: MemberPerformanceMetrics[];
  department_metrics: DepartmentMetrics[];
  calculated_at: string;
}

export interface MemberPerformanceMetrics {
  user_id: string;
  activities_count: number;
  session_duration: number;
  collaboration_score: number;
  productivity_score: number;
  last_active: string;
  performance_trend: 'up' | 'down' | 'stable';
}

export interface DepartmentMetrics {
  department: string;
  member_count: number;
  average_performance: number;
  collaboration_score: number;
  activity_volume: number;
}

export interface TeamCommunication {
  id: string;
  team_id: string;
  type: 'announcement' | 'notification' | 'alert' | 'reminder';
  title: string;
  message: string;
  sender_id: string;
  recipients: string[];
  channels: ('email' | 'push' | 'sms' | 'in_app')[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduled_at?: string;
  sent_at?: string;
  read_by: Record<string, string>; // user_id -> timestamp
  created_at: string;
}

export class TeamManagementService {
  private static instance: TeamManagementService;
  private currentUser: any = null;
  private currentTeam: any = null;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): TeamManagementService {
    if (!TeamManagementService.instance) {
      TeamManagementService.instance = new TeamManagementService();
    }
    return TeamManagementService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      console.log('👥 Initializing Team Management Service');
      
      // Get current user
      await this.getCurrentUser();
      
      // Set up real-time subscriptions
      await this.setupRealtimeSubscriptions();
      
      console.log('✅ Team Management Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Team Management Service:', error);
    }
  }

  private async getCurrentUser(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUser = user;
    } catch (error) {
      console.warn('Could not get current user:', error);
    }
  }

  private async setupRealtimeSubscriptions(): Promise<void> {
    // Subscribe to team member changes
    supabase
      .channel('team_members')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'team_members' },
        (payload) => this.handleTeamMemberChange(payload)
      )
      .subscribe();

    // Subscribe to activity logs
    supabase
      .channel('activity_logs')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => this.handleActivityLogChange(payload)
      )
      .subscribe();
  }

  private handleTeamMemberChange(payload: any): void {
    console.log('👥 Team member change:', payload);
    // Handle real-time team member updates
  }

  private handleActivityLogChange(payload: any): void {
    console.log('📝 Activity log change:', payload);
    // Handle real-time activity updates
  }

  // Team Member Management
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      console.log(`👥 Getting team members for team: ${teamId}`);

      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          role:team_roles(*),
          user:users(*)
        `)
        .eq('team_id', teamId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch team members:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get team members:', error);
      return [];
    }
  }

  async addTeamMember(teamId: string, memberData: Partial<TeamMember>): Promise<TeamMember | null> {
    try {
      console.log(`👥 Adding team member to team: ${teamId}`);

      const newMember = {
        team_id: teamId,
        joined_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        invited_by: this.currentUser?.id,
        status: 'active',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        preferences: this.getDefaultUserPreferences(),
        ...memberData
      };

      const { data, error } = await supabase
        .from('team_members')
        .insert(newMember)
        .select()
        .single();

      if (error) {
        console.error('Failed to add team member:', error);
        return null;
      }

      // Log activity
      await this.logActivity({
        action: 'member_added',
        resource: 'team_member',
        resource_id: data.id,
        details: { member_email: memberData.email }
      });

      console.log('✅ Team member added successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to add team member:', error);
      return null;
    }
  }

  async updateTeamMember(memberId: string, updates: Partial<TeamMember>): Promise<TeamMember | null> {
    try {
      console.log(`👥 Updating team member: ${memberId}`);

      const { data, error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update team member:', error);
        return null;
      }

      // Log activity
      await this.logActivity({
        action: 'member_updated',
        resource: 'team_member',
        resource_id: memberId,
        details: { updates }
      });

      console.log('✅ Team member updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to update team member:', error);
      return null;
    }
  }

  async removeTeamMember(memberId: string): Promise<boolean> {
    try {
      console.log(`👥 Removing team member: ${memberId}`);

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('Failed to remove team member:', error);
        return false;
      }

      // Log activity
      await this.logActivity({
        action: 'member_removed',
        resource: 'team_member',
        resource_id: memberId,
        details: {}
      });

      console.log('✅ Team member removed successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to remove team member:', error);
      return false;
    }
  }

  // Role and Permission Management
  async getTeamRoles(teamId: string): Promise<TeamRole[]> {
    try {
      const { data, error } = await supabase
        .from('team_roles')
        .select('*')
        .or(`team_id.eq.${teamId},is_system_role.eq.true`)
        .order('level', { ascending: true });

      if (error) {
        console.warn('Could not fetch team roles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get team roles:', error);
      return [];
    }
  }

  async createTeamRole(teamId: string, roleData: Omit<TeamRole, 'id' | 'created_at' | 'updated_at'>): Promise<TeamRole | null> {
    try {
      console.log(`👥 Creating team role for team: ${teamId}`);

      const newRole = {
        team_id: teamId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...roleData
      };

      const { data, error } = await supabase
        .from('team_roles')
        .insert(newRole)
        .select()
        .single();

      if (error) {
        console.error('Failed to create team role:', error);
        return null;
      }

      // Log activity
      await this.logActivity({
        action: 'role_created',
        resource: 'team_role',
        resource_id: data.id,
        details: { role_name: roleData.name }
      });

      console.log('✅ Team role created successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to create team role:', error);
      return null;
    }
  }

  async updateTeamRole(roleId: string, updates: Partial<TeamRole>): Promise<TeamRole | null> {
    try {
      console.log(`👥 Updating team role: ${roleId}`);

      const updatedRole = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('team_roles')
        .update(updatedRole)
        .eq('id', roleId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update team role:', error);
        return null;
      }

      // Log activity
      await this.logActivity({
        action: 'role_updated',
        resource: 'team_role',
        resource_id: roleId,
        details: { updates }
      });

      console.log('✅ Team role updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to update team role:', error);
      return null;
    }
  }

  async checkPermission(userId: string, resource: string, action: string, resourceId?: string): Promise<boolean> {
    try {
      // Get user's role and permissions
      const { data: member } = await supabase
        .from('team_members')
        .select(`
          role:team_roles(permissions),
          permissions
        `)
        .eq('user_id', userId)
        .single();

      if (!member) return false;

      // Check role permissions
      const rolePermissions = member.role?.permissions || [];
      const userPermissions = member.permissions || [];
      const allPermissions = [...rolePermissions, ...userPermissions];

      // Check if user has the required permission
      return allPermissions.some((permission: Permission) => {
        return permission.resource === resource && 
               permission.action === action &&
               this.checkPermissionScope(permission, userId, resourceId);
      });
    } catch (error) {
      console.error('❌ Failed to check permission:', error);
      return false;
    }
  }

  private checkPermissionScope(permission: Permission, userId: string, resourceId?: string): boolean {
    switch (permission.scope) {
      case 'own':
        return resourceId === userId;
      case 'team':
        return true; // User is already in the team
      case 'all':
        return true;
      default:
        return false;
    }
  }

  // Team Invitations
  async inviteTeamMember(teamId: string, email: string, roleId: string, message?: string): Promise<TeamInvitation | null> {
    try {
      console.log(`📧 Inviting team member: ${email}`);

      const invitation: Omit<TeamInvitation, 'id'> = {
        team_id: teamId,
        email,
        role_id: roleId,
        invited_by: this.currentUser?.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_at: new Date().toISOString(),
        invitation_token: this.generateInvitationToken(),
        message
      };

      const { data, error } = await supabase
        .from('team_invitations')
        .insert(invitation)
        .select()
        .single();

      if (error) {
        console.error('Failed to create invitation:', error);
        return null;
      }

      // Send invitation email
      await this.sendInvitationEmail(data);

      // Log activity
      await this.logActivity({
        action: 'member_invited',
        resource: 'team_invitation',
        resource_id: data.id,
        details: { email, role_id: roleId }
      });

      console.log('✅ Team invitation sent successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to invite team member:', error);
      return null;
    }
  }

  async acceptInvitation(token: string): Promise<boolean> {
    try {
      console.log(`✅ Accepting invitation with token: ${token}`);

      // Get invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('invitation_token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        console.error('Invalid or expired invitation');
        return false;
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        await supabase
          .from('team_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);
        return false;
      }

      // Create team member
      const memberData = {
        team_id: invitation.team_id,
        user_id: this.currentUser?.id,
        email: invitation.email,
        role_id: invitation.role_id,
        status: 'active',
        joined_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        invited_by: invitation.invited_by,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        preferences: this.getDefaultUserPreferences()
      };

      const { error: memberError } = await supabase
        .from('team_members')
        .insert(memberData);

      if (memberError) {
        console.error('Failed to create team member:', memberError);
        return false;
      }

      // Update invitation status
      await supabase
        .from('team_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      // Log activity
      await this.logActivity({
        action: 'invitation_accepted',
        resource: 'team_invitation',
        resource_id: invitation.id,
        details: { email: invitation.email }
      });

      console.log('✅ Invitation accepted successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to accept invitation:', error);
      return false;
    }
  }

  async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch team invitations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get team invitations:', error);
      return [];
    }
  }

  // Activity Tracking
  async logActivity(activityData: Omit<ActivityLog, 'id' | 'user_id' | 'team_id' | 'timestamp' | 'ip_address' | 'user_agent' | 'session_id'>): Promise<void> {
    try {
      const activity: Omit<ActivityLog, 'id'> = {
        user_id: this.currentUser?.id,
        team_id: this.currentTeam?.id,
        timestamp: new Date().toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        session_id: this.getSessionId(),
        ...activityData
      };

      const { error } = await supabase
        .from('activity_logs')
        .insert(activity);

      if (error) {
        console.warn('Could not log activity:', error);
      }
    } catch (error) {
      console.warn('Failed to log activity:', error);
    }
  }

  async getActivityLogs(teamId: string, limit: number = 100, userId?: string): Promise<ActivityLog[]> {
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('team_id', teamId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Could not fetch activity logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get activity logs:', error);
      return [];
    }
  }

  // Team Performance Analytics
  async getTeamPerformanceMetrics(teamId: string, period: string = '30d'): Promise<TeamPerformanceMetrics | null> {
    try {
      console.log(`📊 Getting team performance metrics for period: ${period}`);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get team members
      const members = await this.getTeamMembers(teamId);
      
      // Get activity logs for the period
      const { data: activities } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('team_id', teamId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Calculate metrics
      const metrics = this.calculateTeamMetrics(members, activities || [], period);

      console.log('✅ Team performance metrics calculated');
      return metrics;
    } catch (error) {
      console.error('❌ Failed to get team performance metrics:', error);
      return null;
    }
  }

  private calculateTeamMetrics(members: TeamMember[], activities: ActivityLog[], period: string): TeamPerformanceMetrics {
    const activeMembers = members.filter(m => m.status === 'active');
    const totalActivities = activities.length;
    
    // Calculate member metrics
    const memberMetrics: MemberPerformanceMetrics[] = members.map(member => {
      const memberActivities = activities.filter(a => a.user_id === member.user_id);
      
      return {
        user_id: member.user_id,
        activities_count: memberActivities.length,
        session_duration: this.calculateSessionDuration(memberActivities),
        collaboration_score: this.calculateCollaborationScore(memberActivities),
        productivity_score: this.calculateProductivityScore(memberActivities),
        last_active: member.last_active,
        performance_trend: this.calculatePerformanceTrend(memberActivities)
      };
    });

    // Calculate department metrics
    const departmentMetrics: DepartmentMetrics[] = this.calculateDepartmentMetrics(members, memberMetrics);

    return {
      team_id: members[0]?.team_id || '',
      period,
      metrics: {
        total_members: members.length,
        active_members: activeMembers.length,
        new_members: this.calculateNewMembers(members, period),
        member_retention_rate: this.calculateRetentionRate(members),
        average_session_duration: this.calculateAverageSessionDuration(memberMetrics),
        total_activities: totalActivities,
        collaboration_score: this.calculateTeamCollaborationScore(memberMetrics),
        productivity_score: this.calculateTeamProductivityScore(memberMetrics),
        engagement_score: this.calculateEngagementScore(members, activities)
      },
      member_metrics: memberMetrics,
      department_metrics: departmentMetrics,
      calculated_at: new Date().toISOString()
    };
  }

  private calculateSessionDuration(activities: ActivityLog[]): number {
    // Simple calculation based on activity timestamps
    if (activities.length < 2) return 0;
    
    const sortedActivities = activities.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const firstActivity = new Date(sortedActivities[0].timestamp);
    const lastActivity = new Date(sortedActivities[sortedActivities.length - 1].timestamp);
    
    return lastActivity.getTime() - firstActivity.getTime();
  }

  private calculateCollaborationScore(activities: ActivityLog[]): number {
    const collaborativeActions = activities.filter(a => 
      ['comment', 'share', 'mention', 'assign', 'collaborate'].includes(a.action)
    );
    
    return Math.min(100, (collaborativeActions.length / Math.max(1, activities.length)) * 100);
  }

  private calculateProductivityScore(activities: ActivityLog[]): number {
    const productiveActions = activities.filter(a => 
      ['create', 'update', 'complete', 'publish', 'deploy'].includes(a.action)
    );
    
    return Math.min(100, (productiveActions.length / Math.max(1, activities.length)) * 100);
  }

  private calculatePerformanceTrend(activities: ActivityLog[]): 'up' | 'down' | 'stable' {
    if (activities.length < 10) return 'stable';
    
    const midpoint = Math.floor(activities.length / 2);
    const firstHalf = activities.slice(0, midpoint);
    const secondHalf = activities.slice(midpoint);
    
    const firstHalfScore = this.calculateProductivityScore(firstHalf);
    const secondHalfScore = this.calculateProductivityScore(secondHalf);
    
    const difference = secondHalfScore - firstHalfScore;
    
    if (difference > 10) return 'up';
    if (difference < -10) return 'down';
    return 'stable';
  }

  private calculateDepartmentMetrics(members: TeamMember[], memberMetrics: MemberPerformanceMetrics[]): DepartmentMetrics[] {
    const departments = [...new Set(members.map(m => m.department).filter(Boolean))];
    
    return departments.map(department => {
      const deptMembers = members.filter(m => m.department === department);
      const deptMetrics = memberMetrics.filter(m => 
        deptMembers.some(dm => dm.user_id === m.user_id)
      );
      
      return {
        department: department!,
        member_count: deptMembers.length,
        average_performance: deptMetrics.reduce((sum, m) => sum + m.productivity_score, 0) / deptMetrics.length,
        collaboration_score: deptMetrics.reduce((sum, m) => sum + m.collaboration_score, 0) / deptMetrics.length,
        activity_volume: deptMetrics.reduce((sum, m) => sum + m.activities_count, 0)
      };
    });
  }

  private calculateNewMembers(members: TeamMember[], period: string): number {
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    
    return members.filter(m => new Date(m.joined_at) > cutoffDate).length;
  }

  private calculateRetentionRate(members: TeamMember[]): number {
    const activeMembers = members.filter(m => m.status === 'active').length;
    return members.length > 0 ? (activeMembers / members.length) * 100 : 0;
  }

  private calculateAverageSessionDuration(memberMetrics: MemberPerformanceMetrics[]): number {
    if (memberMetrics.length === 0) return 0;
    return memberMetrics.reduce((sum, m) => sum + m.session_duration, 0) / memberMetrics.length;
  }

  private calculateTeamCollaborationScore(memberMetrics: MemberPerformanceMetrics[]): number {
    if (memberMetrics.length === 0) return 0;
    return memberMetrics.reduce((sum, m) => sum + m.collaboration_score, 0) / memberMetrics.length;
  }

  private calculateTeamProductivityScore(memberMetrics: MemberPerformanceMetrics[]): number {
    if (memberMetrics.length === 0) return 0;
    return memberMetrics.reduce((sum, m) => sum + m.productivity_score, 0) / memberMetrics.length;
  }

  private calculateEngagementScore(members: TeamMember[], activities: ActivityLog[]): number {
    const activeMembers = members.filter(m => {
      const lastActive = new Date(m.last_active);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastActive > weekAgo;
    }).length;
    
    const engagementRate = members.length > 0 ? (activeMembers / members.length) * 100 : 0;
    const activityFactor = Math.min(100, activities.length / members.length * 10);
    
    return (engagementRate + activityFactor) / 2;
  }

  // Team Communication
  async sendTeamCommunication(communication: Omit<TeamCommunication, 'id' | 'created_at' | 'read_by'>): Promise<TeamCommunication | null> {
    try {
      console.log(`📢 Sending team communication: ${communication.title}`);

      const newCommunication: Omit<TeamCommunication, 'id'> = {
        ...communication,
        sender_id: this.currentUser?.id,
        read_by: {},
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('team_communications')
        .insert(newCommunication)
        .select()
        .single();

      if (error) {
        console.error('Failed to send team communication:', error);
        return null;
      }

      // Send notifications based on channels
      await this.deliverCommunication(data);

      // Log activity
      await this.logActivity({
        action: 'communication_sent',
        resource: 'team_communication',
        resource_id: data.id,
        details: { title: communication.title, type: communication.type }
      });

      console.log('✅ Team communication sent successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to send team communication:', error);
      return null;
    }
  }

  private async deliverCommunication(communication: TeamCommunication): Promise<void> {
    // Implementation would depend on available notification services
    console.log(`📬 Delivering communication via channels:`, communication.channels);
    
    // Update status to sent
    await supabase
      .from('team_communications')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', communication.id);
  }

  // Utility Methods
  private generateInvitationToken(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('higherup_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
      sessionStorage.setItem('higherup_session_id', sessionId);
    }
    return sessionId;
  }

  private getDefaultUserPreferences(): UserPreferences {
    return {
      notifications: {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        notification_types: {
          mentions: true,
          assignments: true,
          deadlines: true,
          team_updates: true,
          system_alerts: true
        },
        quiet_hours: {
          enabled: false,
          start_time: '22:00',
          end_time: '08:00',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      },
      dashboard: {
        default_view: 'dashboard',
        widgets: ['recent_activity', 'team_performance', 'notifications'],
        layout: 'grid',
        theme: 'auto',
        sidebar_collapsed: false
      },
      privacy: {
        profile_visibility: 'team',
        activity_visibility: 'team',
        contact_info_visibility: 'team',
        allow_mentions: true,
        allow_direct_messages: true
      },
      accessibility: {
        high_contrast: false,
        large_text: false,
        reduced_motion: false,
        screen_reader: false,
        keyboard_navigation: false
      }
    };
  }

  private async sendInvitationEmail(invitation: TeamInvitation): Promise<void> {
    // Implementation would depend on email service
    console.log(`📧 Sending invitation email to: ${invitation.email}`);
    
    const invitationUrl = `${window.location.origin}/invite/${invitation.invitation_token}`;
    console.log(`Invitation URL: ${invitationUrl}`);
  }

  // Public API Methods
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ preferences })
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to update user preferences:', error);
        return false;
      }

      await this.logActivity({
        action: 'preferences_updated',
        resource: 'user_preferences',
        details: { updated_fields: Object.keys(preferences) }
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to update user preferences:', error);
      return false;
    }
  }

  async updateLastActive(userId: string): Promise<void> {
    try {
      await supabase
        .from('team_members')
        .update({ last_active: new Date().toISOString() })
        .eq('user_id', userId);
    } catch (error) {
      console.warn('Failed to update last active:', error);
    }
  }

  async searchTeamMembers(teamId: string, query: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(20);

      if (error) {
        console.warn('Could not search team members:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to search team members:', error);
      return [];
    }
  }

  async getTeamCommunications(teamId: string, limit: number = 50): Promise<TeamCommunication[]> {
    try {
      const { data, error } = await supabase
        .from('team_communications')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Could not fetch team communications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get team communications:', error);
      return [];
    }
  }

  async markCommunicationAsRead(communicationId: string, userId: string): Promise<void> {
    try {
      const { data: communication } = await supabase
        .from('team_communications')
        .select('read_by')
        .eq('id', communicationId)
        .single();

      if (communication) {
        const updatedReadBy = {
          ...communication.read_by,
          [userId]: new Date().toISOString()
        };

        await supabase
          .from('team_communications')
          .update({ read_by: updatedReadBy })
          .eq('id', communicationId);
      }
    } catch (error) {
      console.warn('Failed to mark communication as read:', error);
    }
  }
}

export default TeamManagementService;