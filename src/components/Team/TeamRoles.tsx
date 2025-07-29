import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Crown, 
  Users, 
  Eye, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import TeamManagementService, { TeamRole, Permission } from '@/services/team/TeamManagementService';

interface TeamRolesProps {
  teamId: string;
  className?: string;
}

const TeamRoles: React.FC<TeamRolesProps> = ({
  teamId,
  className
}) => {
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<TeamRole | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    level: 4,
    permissions: [] as Permission[]
  });

  const teamService = TeamManagementService.getInstance();

  // Available permissions
  const availablePermissions: Permission[] = [
    { id: 'users_manage', name: 'Manage Users', description: 'Create, update, delete users', resource: 'users', action: 'manage', scope: 'team' },
    { id: 'users_read', name: 'View Users', description: 'View user information', resource: 'users', action: 'read', scope: 'team' },
    { id: 'campaigns_manage', name: 'Manage Campaigns', description: 'Full campaign management', resource: 'campaigns', action: 'manage', scope: 'team' },
    { id: 'campaigns_create', name: 'Create Campaigns', description: 'Create new campaigns', resource: 'campaigns', action: 'create', scope: 'team' },
    { id: 'campaigns_update', name: 'Update Campaigns', description: 'Edit existing campaigns', resource: 'campaigns', action: 'update', scope: 'own' },
    { id: 'campaigns_read', name: 'View Campaigns', description: 'View campaign details', resource: 'campaigns', action: 'read', scope: 'team' },
    { id: 'leads_manage', name: 'Manage Leads', description: 'Full lead management', resource: 'leads', action: 'manage', scope: 'team' },
    { id: 'leads_create', name: 'Create Leads', description: 'Add new leads', resource: 'leads', action: 'create', scope: 'own' },
    { id: 'leads_read', name: 'View Leads', description: 'View lead information', resource: 'leads', action: 'read', scope: 'team' },
    { id: 'contacts_manage', name: 'Manage Contacts', description: 'Full contact management', resource: 'contacts', action: 'manage', scope: 'team' },
    { id: 'contacts_create', name: 'Create Contacts', description: 'Add new contacts', resource: 'contacts', action: 'create', scope: 'own' },
    { id: 'contacts_read', name: 'View Contacts', description: 'View contact information', resource: 'contacts', action: 'read', scope: 'team' },
    { id: 'analytics_read', name: 'View Analytics', description: 'Access to analytics and reports', resource: 'analytics', action: 'read', scope: 'team' },
    { id: 'settings_manage', name: 'Manage Settings', description: 'Modify system settings', resource: 'settings', action: 'manage', scope: 'team' },
    { id: 'integrations_manage', name: 'Manage Integrations', description: 'Configure integrations', resource: 'integrations', action: 'manage', scope: 'team' }
  ];

  useEffect(() => {
    loadRoles();
  }, [teamId]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await teamService.getRoles(teamId);
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!roleForm.name.trim()) return;

      await teamService.createRole({
        name: roleForm.name,
        description: roleForm.description,
        level: roleForm.level,
        permissions: roleForm.permissions,
        is_system_role: false
      });

      setCreateDialogOpen(false);
      setRoleForm({ name: '', description: '', level: 4, permissions: [] });
      await loadRoles();
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  const handleUpdateRole = async () => {
    try {
      if (!selectedRole) return;

      await teamService.updateRole(selectedRole.id, {
        name: roleForm.name,
        description: roleForm.description,
        level: roleForm.level,
        permissions: roleForm.permissions
      });

      setEditDialogOpen(false);
      setSelectedRole(null);
      setRoleForm({ name: '', description: '', level: 4, permissions: [] });
      await loadRoles();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      if (window.confirm('Are you sure you want to delete this role?')) {
        await teamService.deleteRole(roleId);
        await loadRoles();
      }
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const openEditDialog = (role: TeamRole) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      level: role.level,
      permissions: role.permissions
    });
    setEditDialogOpen(true);
  };

  const getRoleIcon = (level: number) => {
    if (level === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (level === 2) return <Shield className="h-4 w-4 text-blue-500" />;
    if (level === 3) return <Settings className="h-4 w-4 text-green-500" />;
    if (level === 4) return <Users className="h-4 w-4 text-gray-500" />;
    return <Eye className="h-4 w-4 text-gray-400" />;
  };

  const getRoleBadgeVariant = (level: number) => {
    if (level <= 2) return 'default';
    if (level === 3) return 'secondary';
    return 'outline';
  };

  const getLevelName = (level: number) => {
    switch (level) {
      case 1: return 'Owner';
      case 2: return 'Admin';
      case 3: return 'Manager';
      case 4: return 'Member';
      case 5: return 'Viewer';
      default: return 'Custom';
    }
  };

  const handlePermissionToggle = (permission: Permission, checked: boolean) => {
    if (checked) {
      setRoleForm(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission]
      }));
    } else {
      setRoleForm(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p.id !== permission.id)
      }));
    }
  };

  const isPermissionSelected = (permissionId: string) => {
    return roleForm.permissions.some(p => p.id === permissionId);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
            <Shield className="h-5 w-5" />
            Team Roles ({roles.length})
          </CardTitle>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Define a custom role with specific permissions
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="roleName">Role Name</Label>
                    <Input
                      id="roleName"
                      placeholder="e.g., Content Manager"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="roleLevel">Access Level</Label>
                    <select
                      id="roleLevel"
                      className="w-full p-2 border rounded-md"
                      value={roleForm.level}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                    >
                      <option value={3}>Manager Level</option>
                      <option value={4}>Member Level</option>
                      <option value={5}>Viewer Level</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="roleDescription">Description</Label>
                  <Textarea
                    id="roleDescription"
                    placeholder="Describe what this role can do..."
                    value={roleForm.description}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto border rounded-md p-4">
                    {availablePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={permission.id}
                          checked={isPermissionSelected(permission.id)}
                          onCheckedChange={(checked) => handlePermissionToggle(permission, checked as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={permission.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.name}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleCreateRole} className="flex-1">
                    Create Role
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCreateDialogOpen(false);
                      setRoleForm({ name: '', description: '', level: 4, permissions: [] });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                {getRoleIcon(role.level)}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{role.name}</h4>
                    {role.is_system_role && (
                      <Lock className="h-3 w-3 text-gray-400" title="System Role" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {role.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getRoleBadgeVariant(role.level)}>
                      Level {role.level} - {getLevelName(role.level)}
                    </Badge>
                    
                    <Badge variant="outline">
                      {role.permissions.length} permissions
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!role.is_system_role && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(role)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Role
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Role
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {role.is_system_role && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    System Role
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {roles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No custom roles created</p>
              <p className="text-sm">Create custom roles to manage team permissions</p>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Modify role permissions and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editRoleName">Role Name</Label>
                <Input
                  id="editRoleName"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="editRoleLevel">Access Level</Label>
                <select
                  id="editRoleLevel"
                  className="w-full p-2 border rounded-md"
                  value={roleForm.level}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                >
                  <option value={3}>Manager Level</option>
                  <option value={4}>Member Level</option>
                  <option value={5}>Viewer Level</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="editRoleDescription">Description</Label>
              <Textarea
                id="editRoleDescription"
                value={roleForm.description}
                onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto border rounded-md p-4">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`edit-${permission.id}`}
                      checked={isPermissionSelected(permission.id)}
                      onCheckedChange={(checked) => handlePermissionToggle(permission, checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`edit-${permission.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleUpdateRole} className="flex-1">
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedRole(null);
                  setRoleForm({ name: '', description: '', level: 4, permissions: [] });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TeamRoles;