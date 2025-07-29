import React, { useState } from 'react';
import { Mail, UserPlus, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import TeamManagementService, { TeamMember } from '@/services/team/TeamManagementService';

interface TeamInvitationProps {
  teamId: string;
  currentUserId: string;
  onInvitationSent: () => void;
}

interface InvitationForm {
  email: string;
  role: TeamMember['role'];
  message?: string;
}

const TeamInvitation: React.FC<TeamInvitationProps> = ({
  teamId,
  currentUserId,
  onInvitationSent
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<InvitationForm[]>([
    { email: '', role: 'member' }
  ]);
  const [customMessage, setCustomMessage] = useState('');

  const teamService = TeamManagementService.getInstance();

  const addInvitation = () => {
    setInvitations([...invitations, { email: '', role: 'member' }]);
  };

  const removeInvitation = (index: number) => {
    if (invitations.length > 1) {
      setInvitations(invitations.filter((_, i) => i !== index));
    }
  };

  const updateInvitation = (index: number, field: keyof InvitationForm, value: string) => {
    const updated = invitations.map((inv, i) => 
      i === index ? { ...inv, [field]: value } : inv
    );
    setInvitations(updated);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendInvitations = async () => {
    // Validate all invitations
    const validInvitations = invitations.filter(inv => 
      inv.email.trim() && validateEmail(inv.email.trim())
    );

    if (validInvitations.length === 0) {
      alert('Please enter at least one valid email address');
      return;
    }

    setLoading(true);
    try {
      // Send invitations
      const results = await teamService.bulkInviteMembers(
        teamId,
        validInvitations.map(inv => ({
          email: inv.email.trim(),
          role: inv.role
        })),
        currentUserId
      );

      console.log(`Sent ${results.length} invitations`);
      
      // Reset form
      setInvitations([{ email: '', role: 'member' }]);
      setCustomMessage('');
      setOpen(false);
      
      // Notify parent
      onInvitationSent();
      
      alert(`Successfully sent ${results.length} invitation(s)`);
    } catch (error) {
      console.error('Failed to send invitations:', error);
      alert('Failed to send invitations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDescription = (role: TeamMember['role']): string => {
    switch (role) {
      case 'owner':
        return 'Full access to all features and settings';
      case 'admin':
        return 'Manage team members and most settings';
      case 'manager':
        return 'Manage campaigns and view analytics';
      case 'member':
        return 'Create and edit campaigns, view reports';
      case 'viewer':
        return 'View-only access to dashboards and reports';
      default:
        return '';
    }
  };

  const getRoleBadgeVariant = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'member':
        return 'secondary';
      case 'viewer':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Members
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Team Members
          </DialogTitle>
          <DialogDescription>
            Send invitations to new team members. They'll receive an email with instructions to join your team.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Invitations List */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Email Invitations</Label>
            
            {invitations.map((invitation, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="flex-1 space-y-3">
                  <div>
                    <Label htmlFor={`email-${index}`}>Email Address</Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      placeholder="colleague@company.com"
                      value={invitation.email}
                      onChange={(e) => updateInvitation(index, 'email', e.target.value)}
                      className={
                        invitation.email && !validateEmail(invitation.email)
                          ? 'border-red-500'
                          : ''
                      }
                    />
                    {invitation.email && !validateEmail(invitation.email) && (
                      <p className="text-sm text-red-500 mt-1">Please enter a valid email address</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor={`role-${index}`}>Role</Label>
                    <Select
                      value={invitation.role}
                      onValueChange={(value) => updateInvitation(index, 'role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Badge variant={getRoleBadgeVariant('viewer')}>Viewer</Badge>
                            <span className="text-sm text-gray-500">View only</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <Badge variant={getRoleBadgeVariant('member')}>Member</Badge>
                            <span className="text-sm text-gray-500">Standard access</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="manager">
                          <div className="flex items-center gap-2">
                            <Badge variant={getRoleBadgeVariant('manager')}>Manager</Badge>
                            <span className="text-sm text-gray-500">Manage campaigns</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Badge variant={getRoleBadgeVariant('admin')}>Admin</Badge>
                            <span className="text-sm text-gray-500">Manage team</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      {getRoleDescription(invitation.role)}
                    </p>
                  </div>
                </div>
                
                {invitations.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInvitation(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addInvitation}
              className="w-full flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Invitation
            </Button>
          </div>
          
          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="custom-message">Custom Message (Optional)</Label>
            <Textarea
              id="custom-message"
              placeholder="Add a personal message to your invitation..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
            <p className="text-sm text-gray-500">
              This message will be included in the invitation email.
            </p>
          </div>
          
          {/* Role Permissions Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Role Permissions</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant('admin')}>Admin</Badge>
                <span>Manage team members, settings, and all campaigns</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant('manager')}>Manager</Badge>
                <span>Create and manage campaigns, view analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant('member')}>Member</Badge>
                <span>Create and edit campaigns, view reports</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant('viewer')}>Viewer</Badge>
                <span>View dashboards and reports only</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvitations}
              disabled={loading || invitations.every(inv => !inv.email.trim())}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Invitations
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamInvitation;