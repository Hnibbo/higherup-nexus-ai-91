import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Video, 
  Phone, 
  Calendar as CalendarIcon, 
  Link as LinkIcon, 
  Copy, 
  Settings, 
  ExternalLink,
  Users,
  Clock,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MeetingRoom {
  id: string;
  name: string;
  platform: string;
  url: string;
  status: 'active' | 'scheduled' | 'ended';
  participants: number;
  duration: number;
  startTime?: string;
}

export const MeetingIntegrations = () => {
  const { toast } = useToast();
  
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([
    {
      id: '1',
      name: 'Strategy Session with John',
      platform: 'zoom',
      url: 'https://zoom.us/j/123456789',
      status: 'active',
      participants: 2,
      duration: 45,
      startTime: '10:00 AM'
    },
    {
      id: '2',
      name: 'Team Marketing Review',
      platform: 'googlemeet',
      url: 'https://meet.google.com/abc-def-ghi',
      status: 'scheduled',
      participants: 0,
      duration: 60,
      startTime: '2:30 PM'
    }
  ]);

  const [newMeeting, setNewMeeting] = useState({
    name: '',
    platform: 'zoom',
    duration: 30,
    scheduledTime: '',
    participants: []
  });

  const createMeetingRoom = () => {
    if (!newMeeting.name) {
      toast({
        title: "Error",
        description: "Please enter a meeting name",
        variant: "destructive"
      });
      return;
    }

    const meetingUrl = newMeeting.platform === 'zoom' 
      ? `https://zoom.us/j/${Math.random().toString().slice(2, 12)}`
      : `https://meet.google.com/${Math.random().toString(36).substr(2, 3)}-${Math.random().toString(36).substr(2, 3)}-${Math.random().toString(36).substr(2, 3)}`;

    const meeting: MeetingRoom = {
      id: (meetingRooms.length + 1).toString(),
      name: newMeeting.name,
      platform: newMeeting.platform,
      url: meetingUrl,
      status: 'scheduled',
      participants: 0,
      duration: newMeeting.duration,
      startTime: newMeeting.scheduledTime
    };

    setMeetingRooms([...meetingRooms, meeting]);
    setNewMeeting({ name: '', platform: 'zoom', duration: 30, scheduledTime: '', participants: [] });
    
    toast({
      title: "Success",
      description: `${newMeeting.platform === 'zoom' ? 'Zoom' : 'Google Meet'} room created successfully`
    });
  };

  const copyMeetingLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "Meeting link copied to clipboard"
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'googlemeet':
        return <Video className="w-5 h-5 text-green-600" />;
      default:
        return <Video className="w-5 h-5" />;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return 'Zoom';
      case 'googlemeet':
        return 'Google Meet';
      default:
        return platform;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Meeting Integrations</h2>
          <p className="text-muted-foreground">Manage Zoom, Google Meet, and other meeting platforms</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Video className="w-4 h-4 mr-2" />
              Create Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Meeting Room</DialogTitle>
              <DialogDescription>Generate a new meeting room with your preferred platform</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meetingName">Meeting Name</Label>
                <Input
                  id="meetingName"
                  value={newMeeting.name}
                  onChange={(e) => setNewMeeting({ ...newMeeting, name: e.target.value })}
                  placeholder="Strategy Session"
                />
              </div>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={newMeeting.platform} onValueChange={(value) => setNewMeeting({ ...newMeeting, platform: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="googlemeet">Google Meet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select value={newMeeting.duration.toString()} onValueChange={(value) => setNewMeeting({ ...newMeeting, duration: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scheduledTime">Time</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={newMeeting.scheduledTime}
                    onChange={(e) => setNewMeeting({ ...newMeeting, scheduledTime: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={createMeetingRoom} className="w-full">
                Create Meeting Room
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>Active & Scheduled Meetings</CardTitle>
          <CardDescription>Currently running and upcoming meeting rooms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {meetingRooms.map((meeting) => (
              <div key={meeting.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(meeting.platform)}
                    <h3 className="font-semibold">{meeting.name}</h3>
                    <Badge variant={meeting.status === 'active' ? 'default' : meeting.status === 'scheduled' ? 'secondary' : 'outline'}>
                      {meeting.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyMeetingLink(meeting.url)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => window.open(meeting.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Platform:</span>
                    <span>{getPlatformName(meeting.platform)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{meeting.participants} participants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{meeting.duration} minutes</span>
                  </div>
                  {meeting.startTime && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{meeting.startTime}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 p-2 bg-muted/30 rounded text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-3 h-3" />
                    <span className="truncate">{meeting.url}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Integrations</CardTitle>
          <CardDescription>Configure your meeting platform settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Video className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold">Zoom Integration</h3>
                <Badge variant="default">Connected</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Create and manage Zoom meetings directly from your calendar
              </p>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Video className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold">Google Meet</h3>
                <Badge variant="default">Connected</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Seamlessly integrate with Google Calendar and Meet
              </p>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};