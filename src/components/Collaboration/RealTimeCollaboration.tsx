import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  MessageCircle, 
  Eye, 
  Edit, 
  Video, 
  Mic, 
  MicOff,
  VideoOff,
  Share,
  Settings,
  Crown,
  Clock
} from 'lucide-react';

interface CollaboratorPresence {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'busy';
  current_page: string;
  cursor_position?: { x: number; y: number };
  selection?: string;
  last_seen: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  message: string;
  timestamp: string;
  type: 'text' | 'system' | 'file' | 'link';
}

interface SessionState {
  room_id: string;
  shared_state: any;
  permissions: {
    can_edit: boolean;
    can_comment: boolean;
    can_share: boolean;
    is_admin: boolean;
  };
}

export const RealTimeCollaboration = ({ roomId = 'default' }: { roomId?: string }) => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Real-time presence tracking
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`room:${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const collaboratorsList = Object.keys(newState).map(userId => {
          const presences = newState[userId] as any[];
          const presence = presences[0];
          return {
            user_id: userId,
            user_name: presence?.user_name || 'Unknown',
            avatar_url: presence?.avatar_url,
            status: presence?.status || 'online',
            current_page: presence?.current_page || '',
            cursor_position: presence?.cursor_position,
            selection: presence?.selection,
            last_seen: presence?.last_seen || new Date().toISOString()
          };
        });
        setCollaborators(collaboratorsList);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
        setMessages(prev => [...prev, payload]);
      })
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        setSessionState(prev => ({ ...prev, shared_state: payload }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await channel.track({
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
            avatar_url: user.user_metadata?.avatar_url,
            status: 'online',
            current_page: window.location.pathname,
            last_seen: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, roomId]);

  // Track cursor movement
  useEffect(() => {
    if (!isConnected) return;

    const handleMouseMove = (e: MouseEvent) => {
      const channel = supabase.channel(`room:${roomId}`);
      channel.track({
        cursor_position: { x: e.clientX, y: e.clientY }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isConnected, roomId]);

  // Send chat message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    const channel = supabase.channel(`room:${roomId}`);
    await channel.send({
      type: 'broadcast',
      event: 'chat_message',
      payload: message
    });

    setNewMessage('');
  }, [newMessage, user, roomId]);

  // Update shared state
  const updateSharedState = useCallback(async (updates: any) => {
    const channel = supabase.channel(`room:${roomId}`);
    await channel.send({
      type: 'broadcast',
      event: 'state_update',
      payload: updates
    });
  }, [roomId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Main Collaboration Area */}
      <div className="lg:col-span-3 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Live Collaboration
                <Badge className="ml-2" variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Video className="w-4 h-4 mr-2" />
                  Start Call
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Share Room
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Active Collaborators */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Active Collaborators ({collaborators.length})</h3>
              <div className="flex flex-wrap gap-2">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.user_id} className="flex items-center space-x-2 bg-muted rounded-full px-3 py-1">
                    <div className="relative">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={collaborator.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {collaborator.user_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(collaborator.status)}`} />
                    </div>
                    <span className="text-sm font-medium">{collaborator.user_name}</span>
                    {collaborator.user_id === user?.id && (
                      <Crown className="w-3 h-3 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Shared Workspace Preview */}
            <div className="border rounded-lg p-6 bg-muted/20">
              <div className="text-center">
                <Edit className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Shared Workspace</h3>
                <p className="text-muted-foreground mb-4">
                  Collaborate in real-time with your team members
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <Button variant="outline" className="flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    View Mode
                  </Button>
                  <Button className="flex items-center">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Mode
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MessageCircle className="w-5 h-5 mr-2" />
              Team Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <div className="h-64 overflow-y-auto space-y-3 border rounded p-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs">Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{message.user_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm bg-muted rounded px-2 py-1">{message.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="flex space-x-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button size="sm" onClick={sendMessage}>
                Send
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Room Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="w-5 h-5 mr-2" />
              Room Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Room ID</label>
              <Input value={roomId} readOnly />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Permissions</label>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Can Edit</span>
                  <Badge variant="default">Yes</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Can Comment</span>
                  <Badge variant="default">Yes</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Can Share</span>
                  <Badge variant="default">Yes</Badge>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              Advanced Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};