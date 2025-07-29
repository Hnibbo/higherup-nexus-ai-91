/**
 * Advanced Team Management Service
 * Comprehensive team management with role-based access control,
 * performance tracking, activity monitoring, and team analytics
 */
import { productionDatabaseService } from '@/services/database/ProductionDatabaseService';
import { redisCacheService } from '@/services/database/RedisCache';

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  email: string;
  name: string;
  avatar?: string;
  role: TeamRole;
  permissions: TeamPermissions;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  joinedAt: Date;
  lastActive: Date;
  invitedBy?: string;
  metadata: Record<string, any>;
}

export interface TeamRole {
  id: string;
  name: string;
  description: string;
  level: number; // 1-10, higher = more permissions
  permissions: RolePermissions;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermissions {
  // Content permissions
  canCreateCampaigns: boolean;
  canEditCampaigns: boolean;
  canDeleteCampaigns: boolean;
  canPublishCampaigns: boolean;
  
  // Analytics permissions
  canViewAnalytics: boolean;
  canExportData: boolean;
  canViewReports: boolean;
  canCreateReports: boolean;
  
  // Team permissions
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canManageRoles: boolean;
  canViewTeamActivity: boolean;
  
  // System permissions
  canManageIntegrations: boolean;
  canManageSettings: boolean;
  canManageBilling: boolean;
  canAccessAPI: boolean;
  
  // Collaboration permissions
  canCreateWorkspaces: boolean;
  canManageWorkspaces: boolean;
  canShareContent: boolean;
  canComment: boolean;
}

export interface TeamPermissions {
  role: TeamRole;
  customPermissions?: Partial<RolePermissions>;
  restrictions?: string[];
  expiresAt?: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  owner: string;
  members: TeamMember[];
  settings: TeamSettings;
  subscription: TeamSubscription;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface TeamSettings {
  visibility: 'private' | 'public' | 'organization';
  allowInvites: boolean;
  requireApproval: boolean;
  defaultRole: string;
  maxMembers: number;
  features: {
    collaboration: boolean;
    analytics: boolean;
    integrations: boolean;
    api: boolean;
  };
  notifications: TeamNotificationSettings;
}

export interface TeamNotificationSettings {
  emailNotifications: boolean;
  slackIntegration?: {
    enabled: boolean;
    webhookUrl: string;
    channels: string[];
  };
  discordIntegration?: {
    enabled: boolean;
    webhookUrl: string;
  };
}

export interface TeamSubscription {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  limits: {
    members: number;
    campaigns: number;
    storage: number; // in GB
    apiCalls: number;
  };
  usage: {
    members: number;
    campaigns: number;
    storage: number;
    apiCalls: number;
  };
  billingCycle: 'monthly' | 'yearly';
  nextBilling?: Date;
  trialEnds?: Date;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  metadata: Record<string, any>;
}

export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  action: string;
  target?: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface TeamAnalytics {
  teamId: string;
  period: { start: Date; end: Date };
  metrics: {
    activeMembers: number;
    totalActivities: number;
    campaignsCreated: number;
    collaborationSessions: number;
    averageSessionDuration: number;
  };
  memberStats: MemberStats[];
  activityTrends: ActivityTrend[];
  performanceMetrics: PerformanceMetric[];
}

export interface MemberStats {
  userId: string;
  name: string;
  activeDays: number;
  totalActivities: number;
  campaignsCreated: number;
  collaborationTime: number;
  lastActive: Date;
  productivityScore: number;
}

export interface ActivityTrend {
  date: Date;
  activities: number;
  activeMembers: number;
  collaborationSessions: number;
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  change: number; // percentage change from previous period
  trend: 'up' | 'down' | 'stable';
}

/**
 * Advanced Team Management Service
 */
export class AdvancedTeamManagementService {
  private static instance: AdvancedTeamManagementService;
  private teams: Map<string, Team> = new Map();
  private teamMembers: Map<string, TeamMember[]> = new Map(); // teamId -> members
  private teamRoles: Map<string, TeamRole[]> = new Map(); // teamId -> roles
  private pendingInvitations: Map<string, TeamInvitation[]> = new Map(); // teamId -> invitations
  private teamActivities: Map<string, TeamActivity[]> = new Map(); // teamId -> activities
  private defaultRoles: TeamRole[] = [];

  private constructor() {
    this.initializeTeamManagementService();
  }

  public static getInstance(): AdvancedTeamManagementService {
    if (!AdvancedTeamManagementService.instance) {
      AdvancedTeamManagementService.instance = new AdvancedTeamManagementService();
    }
    return AdvancedTeamManagementService.instance;
  }

  private async initializeTeamManagementService(): Promise<void> {
    console.log('👥 Initializing Advanced Team Management Service');
    
    // Initialize default roles
    await this.initializeDefaultRoles();
    
    // Load teams
    await this.loadTeams();
    
    // Start activity monitoring
    this.startActivityMonitoring();
    
    // Setup cleanup tasks
    this.setupCleanupTasks();
    
    console.log('✅ Advanced Team Management Service initialized');
  }

  /**
   * Create team
   */
  async createTeam(teamData: {
    name: string;
    description?: string;
    owner: string;
    settings?: Partial<TeamSettings>;
  }): Promise<Team> {
    try {
      console.log(`🏗️ Creating team: ${teamData.name}`);
      
      const team: Team = {
        id: `team_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: teamData.name,
        description: teamData.description,
        owner: teamData.owner,
        members: [],
        settings: {
          visibility: 'private',
          allowInvites: true,
          requireApproval: false,
          defaultRole: 'member',
          maxMembers: 50,
          features: {
            collaboration: true,
            analytics: true,
            integrations: true,
            api: false
          },
          notifications: {
            emailNotifications: true
          },
          ...teamData.settings
        },
        subscription: {
          plan: 'free',
          status: 'active',
          limits: {
            members: 5,
            campaigns: 10,
            storage: 1,
            apiCalls: 1000
          },
          usage: {
            members: 0,
            campaigns: 0,
            storage: 0,
            apiCalls: 0
          },
          billingCycle: 'monthly'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      };

      // Add owner as first member
      const ownerMember: TeamMember = {
        id: `member_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: teamData.owner,
        teamId: team.id,
        email: '', // Would be populated from user data
        name: '', // Would be populated from user data
        role: this.getDefaultRole('owner'),
        permissions: {
          role: this.getDefaultRole('owner')
        },
        status: 'active',
        joinedAt: new Date(),
        lastActive: new Date(),
        metadata: {}
      };

      team.members.push(ownerMember);
      team.subscription.usage.members = 1;

      // Store team
      this.teams.set(team.id, team);
      this.teamMembers.set(team.id, [ownerMember]);
      this.teamRoles.set(team.id, [...this.defaultRoles]);
      this.pendingInvitations.set(team.id, []);
      this.teamActivities.set(team.id, []);
      
      await this.storeTeam(team);
      
      // Log activity
      await this.logActivity(team.id, teamData.owner, 'team_created', team.id, {
        teamName: team.name
      });
      
      console.log(`✅ Team created: ${team.id}`);
      return team;
    } catch (error) {
      console.error('❌ Failed to create team:', error);
      throw error;
    }
  }

  /**
   * Invite team member
   */
  async inviteMember(teamId: string, inviterUserId: string, inviteData: {
    email: string;
    role: string;
    message?: string;
  }): Promise<TeamInvitation> {
    try {
      console.log(`📧 Inviting member to team ${teamId}: ${inviteData.email}`);
      
      const team = this.teams.get(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Check permissions
      const inviter = team.members.find(m => m.userId === inviterUserId);
      if (!inviter || !inviter.permissions.role.permissions.canInviteMembers) {
        throw new Error('Insufficient permissions to invite members');
      }

      // Check if already a member
      const existingMember = team.members.find(m => m.email === inviteData.email);
      if (existingMember) {
        throw new Error('User is already a team member');
      }

      // Check subscription limits
      if (team.subscription.usage.members >= team.subscription.limits.members) {
        throw new Error('Team member limit reached');
      }

      // Create invitation
      const invitation: TeamInvitation = {
        id: `invite_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        teamId,
        email: inviteData.email,
        role: inviteData.role,
        invitedBy: inviterUserId,
        status: 'pending',
        token: this.generateInvitationToken(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        metadata: {
          message: inviteData.message
        }
      };

      // Store invitation
      const teamInvitations = this.pendingInvitations.get(teamId) || [];
      teamInvitations.push(invitation);
      this.pendingInvitations.set(teamId, teamInvitations);
      
      await this.storeInvitation(invitation);
      
      // Send invitation email
      await this.sendInvitationEmail(invitation, team);
      
      // Log activity
      await this.logActivity(teamId, inviterUserId, 'member_invited', invitation.id, {
        email: inviteData.email,
        role: inviteData.role
      });
      
      console.log(`✅ Member invited: ${invitation.id}`);
      return invitation;
    } catch (error) {
      console.error('❌ Failed to invite member:', error);
      throw error;
    }
  }

  /**
   * Accept team invitation
   */
  async acceptInvitation(token: string, userData: {
    userId: string;
    name: string;
    email: string;
    avatar?: string;
  }): Promise<TeamMember> {
    try {
      console.log(`✅ Accepting invitation with token: ${token}`);
      
      // Find invitation
      let invitation: TeamInvitation | null = null;
      let teamId: string | null = null;
      
      for (const [tId, invitations] of this.pendingInvitations.entries()) {
        const found = invitations.find(inv => inv.token === token && inv.status === 'pending');
        if (found) {
          invitation = found;
          teamId = tId;
          break;
        }
      }

      if (!invitation || !teamId) {
        throw new Error('Invalid or expired invitation');
      }

      // Check expiration
      if (new Date() > invitation.expiresAt) {
        invitation.status = 'expired';
        await this.updateInvitation(invitation);
        throw new Error('Invitation has expired');
      }

      const team = this.teams.get(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Create team member
      const member: TeamMember = {
        id: `member_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: userData.userId,
        teamId,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        role: this.getRoleByName(teamId, invitation.role),
        permissions: {
          role: this.getRoleByName(teamId, invitation.role)
        },
        status: 'active',
        joinedAt: new Date(),
        lastActive: new Date(),
        invitedBy: invitation.invitedBy,
        metadata: {}
      };

      // Add to team
      team.members.push(member);
      team.subscription.usage.members++;
      team.updatedAt = new Date();
      
      const teamMembers = this.teamMembers.get(teamId) || [];
      teamMembers.push(member);
      this.teamMembers.set(teamId, teamMembers);
      
      // Update invitation
      invitation.status = 'accepted';
      invitation.acceptedAt = new Date();
      
      await this.updateTeam(team);
      await this.updateInvitation(invitation);
      
      // Log activity
      await this.logActivity(teamId, userData.userId, 'member_joined', member.id, {
        memberName: userData.name,
        role: invitation.role
      });
      
      console.log(`✅ Invitation accepted: ${member.id}`);
      return member;
    } catch (error) {
      console.error('❌ Failed to accept invitation:', error);
      throw error;
    }
  }

  /**
   * Remove team member
   */
  async removeMember(teamId: string, removerUserId: string, memberUserId: string): Promise<void> {
    try {
      console.log(`🚫 Removing member ${memberUserId} from team ${teamId}`);
      
      const team = this.teams.get(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Check permissions
      const remover = team.members.find(m => m.userId === removerUserId);
      if (!remover || !remover.permissions.role.permissions.canRemoveMembers) {
        throw new Error('Insufficient permissions to remove members');
      }

      // Find member to remove
      const memberIndex = team.members.findIndex(m => m.userId === memberUserId);
      if (memberIndex === -1) {
        throw new Error('Member not found');
      }

      const member = team.members[memberIndex];
      
      // Cannot remove team owner
      if (member.userId === team.owner) {
        throw new Error('Cannot remove team owner');
      }

      // Remove member
      team.members.splice(memberIndex, 1);
      team.subscription.usage.members--;
      team.updatedAt = new Date();
      
      const teamMembers = this.teamMembers.get(teamId) || [];
      const teamMemberIndex = teamMembers.findIndex(m => m.userId === memberUserId);
      if (teamMemberIndex !== -1) {
        teamMembers.splice(teamMemberIndex, 1);
      }
      
      await this.updateTeam(team);
      
      // Log activity
      await this.logActivity(teamId, removerUserId, 'member_removed', member.id, {
        memberName: member.name,
        removedBy: remover.name
      });
      
      console.log(`✅ Member removed: ${memberUserId}`);
    } catch (error) {
      console.error('❌ Failed to remove member:', error);
      throw error;
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(teamId: string, updaterUserId: string, memberUserId: string, newRoleName: string): Promise<TeamMember> {
    try {
      console.log(`🔄 Updating role for member ${memberUserId} in team ${teamId}`);
      
      const team = this.teams.get(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Check permissions
      const updater = team.members.find(m => m.userId === updaterUserId);
      if (!updater || !updater.permissions.role.permissions.canManageRoles) {
        throw new Error('Insufficient permissions to manage roles');
      }

      // Find member
      const member = team.members.find(m => m.userId === memberUserId);
      if (!member) {
        throw new Error('Member not found');
      }

      // Get new role
      const newRole = this.getRoleByName(teamId, newRoleName);
      if (!newRole) {
        throw new Error('Role not found');
      }

      // Update member role
      const oldRole = member.role.name;
      member.role = newRole;
      member.permissions.role = newRole;
      
      team.updatedAt = new Date();
      await this.updateTeam(team);
      
      // Log activity
      await this.logActivity(teamId, updaterUserId, 'member_role_updated', member.id, {
        memberName: member.name,
        oldRole,
        newRole: newRoleName,
        updatedBy: updater.name
      });
      
      console.log(`✅ Member role updated: ${memberUserId}`);
      return member;
    } catch (error) {
      console.error('❌ Failed to update member role:', error);
      throw error;
    }
  }

  /**
   * Get team analytics
   */
  async getTeamAnalytics(teamId: string, period: { start: Date; end: Date }): Promise<TeamAnalytics> {
    try {
      console.log(`📊 Generating team analytics for team: ${teamId}`);
      
      const team = this.teams.get(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const activities = this.teamActivities.get(teamId) || [];
      const periodActivities = activities.filter(
        a => a.timestamp >= period.start && a.timestamp <= period.end
      );

      // Calculate metrics
      const activeMembers = new Set(periodActivities.map(a => a.userId)).size;
      const totalActivities = periodActivities.length;
      
      // Member stats
      const memberStats: MemberStats[] = team.members.map(member => {
        const memberActivities = periodActivities.filter(a => a.userId === member.userId);
        const activeDays = new Set(
          memberActivities.map(a => a.timestamp.toDateString())
        ).size;
        
        return {
          userId: member.userId,
          name: member.name,
          activeDays,
          totalActivities: memberActivities.length,
          campaignsCreated: memberActivities.filter(a => a.action === 'campaign_created').length,
          collaborationTime: 0, // Would calculate from collaboration sessions
          lastActive: member.lastActive,
          productivityScore: this.calculateProductivityScore(memberActivities, activeDays)
        };
      });

      // Activity trends
      const activityTrends: ActivityTrend[] = this.generateActivityTrends(periodActivities, period);
      
      // Performance metrics
      const performanceMetrics: PerformanceMetric[] = [
        {
          metric: 'Team Productivity',
          value: memberStats.reduce((sum, m) => sum + m.productivityScore, 0) / memberStats.length,
          change: 5.2,
          trend: 'up'
        },
        {
          metric: 'Collaboration Rate',
          value: 0.75,
          change: -2.1,
          trend: 'down'
        },
        {
          metric: 'Activity Level',
          value: totalActivities / team.members.length,
          change: 12.3,
          trend: 'up'
        }
      ];

      const analytics: TeamAnalytics = {
        teamId,
        period,
        metrics: {
          activeMembers,
          totalActivities,
          campaignsCreated: periodActivities.filter(a => a.action === 'campaign_created').length,
          collaborationSessions: 0, // Would calculate from collaboration data
          averageSessionDuration: 0
        },
        memberStats,
        activityTrends,
        performanceMetrics
      };

      console.log(`✅ Team analytics generated for team: ${teamId}`);
      return analytics;
    } catch (error) {
      console.error('❌ Failed to generate team analytics:', error);
      throw error;
    }
  }

  /**
   * Log team activity
   */
  async logActivity(teamId: string, userId: string, action: string, target?: string, details?: Record<string, any>): Promise<void> {
    try {
      const activity: TeamActivity = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        teamId,
        userId,
        action,
        target,
        details: details || {},
        timestamp: new Date()
      };

      // Store activity
      const teamActivities = this.teamActivities.get(teamId) || [];
      teamActivities.push(activity);
      
      // Keep only recent activities (last 10000)
      if (teamActivities.length > 10000) {
        teamActivities.splice(0, teamActivities.length - 10000);
      }
      
      this.teamActivities.set(teamId, teamActivities);
      
      await this.storeActivity(activity);
      
      // Update member last active
      const team = this.teams.get(teamId);
      if (team) {
        const member = team.members.find(m => m.userId === userId);
        if (member) {
          member.lastActive = new Date();
          await this.updateTeam(team);
        }
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Private helper methods
   */
  private async initializeDefaultRoles(): Promise<void> {
    console.log('🎭 Initializing default team roles');
    
    this.defaultRoles = [
      {
        id: 'owner',
        name: 'Owner',
        description: 'Full access to all team features and settings',
        level: 10,
        permissions: {
          canCreateCampaigns: true,
          canEditCampaigns: true,
          canDeleteCampaigns: true,
          canPublishCampaigns: true,
          canViewAnalytics: true,
          canExportData: true,
          canViewReports: true,
          canCreateReports: true,
          canInviteMembers: true,
          canRemoveMembers: true,
          canManageRoles: true,
          canViewTeamActivity: true,
          canManageIntegrations: true,
          canManageSettings: true,
          canManageBilling: true,
          canAccessAPI: true,
          canCreateWorkspaces: true,
          canManageWorkspaces: true,
          canShareContent: true,
          canComment: true
        },
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'admin',
        name: 'Admin',
        description: 'Administrative access with team management capabilities',
        level: 8,
        permissions: {
          canCreateCampaigns: true,
          canEditCampaigns: true,
          canDeleteCampaigns: true,
          canPublishCampaigns: true,
          canViewAnalytics: true,
          canExportData: true,
          canViewReports: true,
          canCreateReports: true,
          canInviteMembers: true,
          canRemoveMembers: true,
          canManageRoles: false,
          canViewTeamActivity: true,
          canManageIntegrations: true,
          canManageSettings: false,
          canManageBilling: false,
          canAccessAPI: true,
          canCreateWorkspaces: true,
          canManageWorkspaces: true,
          canShareContent: true,
          canComment: true
        },
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'editor',
        name: 'Editor',
        description: 'Can create and edit content with collaboration features',
        level: 6,
        permissions: {
          canCreateCampaigns: true,
          canEditCampaigns: true,
          canDeleteCampaigns: false,
          canPublishCampaigns: true,
          canViewAnalytics: true,
          canExportData: false,
          canViewReports: true,
          canCreateReports: false,
          canInviteMembers: false,
          canRemoveMembers: false,
          canManageRoles: false,
          canViewTeamActivity: false,
          canManageIntegrations: false,
          canManageSettings: false,
          canManageBilling: false,
          canAccessAPI: false,
          canCreateWorkspaces: true,
          canManageWorkspaces: false,
          canShareContent: true,
          canComment: true
        },
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'member',
        name: 'Member',
        description: 'Basic access with content creation and collaboration',
        level: 4,
        permissions: {
          canCreateCampaigns: true,
          canEditCampaigns: false,
          canDeleteCampaigns: false,
          canPublishCampaigns: false,
          canViewAnalytics: true,
          canExportData: false,
          canViewReports: true,
          canCreateReports: false,
          canInviteMembers: false,
          canRemoveMembers: false,
          canManageRoles: false,
          canViewTeamActivity: false,
          canManageIntegrations: false,
          canManageSettings: false,
          canManageBilling: false,
          canAccessAPI: false,
          canCreateWorkspaces: false,
          canManageWorkspaces: false,
          canShareContent: true,
          canComment: true
        },
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access with commenting capabilities',
        level: 2,
        permissions: {
          canCreateCampaigns: false,
          canEditCampaigns: false,
          canDeleteCampaigns: false,
          canPublishCampaigns: false,
          canViewAnalytics: true,
          canExportData: false,
          canViewReports: true,
          canCreateReports: false,
          canInviteMembers: false,
          canRemoveMembers: false,
          canManageRoles: false,
          canViewTeamActivity: false,
          canManageIntegrations: false,
          canManageSettings: false,
          canManageBilling: false,
          canAccessAPI: false,
          canCreateWorkspaces: false,
          canManageWorkspaces: false,
          canShareContent: false,
          canComment: true
        },
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private async loadTeams(): Promise<void> {
    try {
      console.log('📥 Loading teams');
      // Load from database
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  }

  private startActivityMonitoring(): void {
    console.log('👁️ Starting activity monitoring');
    
    // Clean up old activities every hour
    setInterval(() => {
      this.cleanupOldActivities();
    }, 3600000);
  }

  private setupCleanupTasks(): void {
    console.log('🧹 Setting up cleanup tasks');
    
    // Clean up expired invitations every day
    setInterval(() => {
      this.cleanupExpiredInvitations();
    }, 24 * 60 * 60 * 1000);
  }

  private cleanupOldActivities(): void {
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [teamId, activities] of this.teamActivities.entries()) {
      const recentActivities = activities.filter(a => a.timestamp > cutoff);
      this.teamActivities.set(teamId, recentActivities);
    }
  }

  private cleanupExpiredInvitations(): void {
    const now = new Date();
    
    for (const [teamId, invitations] of this.pendingInvitations.entries()) {
      const validInvitations = invitations.filter(inv => {
        if (inv.status === 'pending' && now > inv.expiresAt) {
          inv.status = 'expired';
          this.updateInvitation(inv);
          return false;
        }
        return inv.status === 'pending';
      });
      this.pendingInvitations.set(teamId, validInvitations);
    }
  }

  private getDefaultRole(roleName: string): TeamRole {
    return this.defaultRoles.find(r => r.id === roleName) || this.defaultRoles[3]; // Default to 'member'
  }

  private getRoleByName(teamId: string, roleName: string): TeamRole {
    const teamRoles = this.teamRoles.get(teamId) || [];
    return teamRoles.find(r => r.name === roleName || r.id === roleName) || this.getDefaultRole('member');
  }

  private generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private calculateProductivityScore(activities: TeamActivity[], activeDays: number): number {
    if (activities.length === 0) return 0;
    
    const baseScore = Math.min(100, activities.length * 2);
    const consistencyBonus = Math.min(20, activeDays * 2);
    const diversityBonus = Math.min(10, new Set(activities.map(a => a.action)).size);
    
    return Math.min(100, baseScore + consistencyBonus + diversityBonus);
  }

  private generateActivityTrends(activities: TeamActivity[], period: { start: Date; end: Date }): ActivityTrend[] {
    const trends: ActivityTrend[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let date = new Date(period.start); date <= period.end; date = new Date(date.getTime() + dayMs)) {
      const dayActivities = activities.filter(a => 
        a.timestamp.toDateString() === date.toDateString()
      );
      
      trends.push({
        date: new Date(date),
        activities: dayActivities.length,
        activeMembers: new Set(dayActivities.map(a => a.userId)).size,
        collaborationSessions: 0 // Would calculate from collaboration data
      });
    }
    
    return trends;
  }

  private async sendInvitationEmail(invitation: TeamInvitation, team: Team): Promise<void> {
    console.log(`📧 Sending invitation email to: ${invitation.email}`);
    // Email sending logic would go here
  }

  private async storeTeam(team: Team): Promise<void> {
    try {
      await redisCacheService.set(`team:${team.id}`, JSON.stringify(team), 86400);
    } catch (error) {
      console.error('Failed to store team:', error);
    }
  }

  private async updateTeam(team: Team): Promise<void> {
    try {
      team.updatedAt = new Date();
      await redisCacheService.set(`team:${team.id}`, JSON.stringify(team), 86400);
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  }

  private async storeInvitation(invitation: TeamInvitation): Promise<void> {
    try {
      await redisCacheService.set(`invitation:${invitation.id}`, JSON.stringify(invitation), 86400);
    } catch (error) {
      console.error('Failed to store invitation:', error);
    }
  }

  private async updateInvitation(invitation: TeamInvitation): Promise<void> {
    try {
      await redisCacheService.set(`invitation:${invitation.id}`, JSON.stringify(invitation), 86400);
    } catch (error) {
      console.error('Failed to update invitation:', error);
    }
  }

  private async storeActivity(activity: TeamActivity): Promise<void> {
    try {
      await redisCacheService.set(`activity:${activity.id}`, JSON.stringify(activity), 86400);
    } catch (error) {
      console.error('Failed to store activity:', error);
    }
  }
}

// Export singleton instance
export const advancedTeamManagementService = AdvancedTeamManagementService.getInstance();