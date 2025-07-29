import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Users,
  MapPin,
  Video,
  Bell,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  MoreVertical,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CollaborationService, { CalendarEvent, EventAttendee } from '@/services/collaboration/CollaborationService';

interface TeamCalendarProps {
  teamId: string;
  workspaceId?: string;
  currentUserId: string;
  className?: string;
}

const TeamCalendar: React.FC<TeamCalendarProps> = ({
  teamId,
  workspaceId,
  currentUserId,
  className
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'meeting' | 'deadline' | 'reminder' | 'event'>('all');
  
  // Dialog states
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  
  // Form states
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    all_day: false,
    location: '',
    meeting_url: '',
    type: 'meeting' as const,
    attendees: [] as string[],
    reminders: [{ type: 'email' as const, minutes_before: 15 }]
  });

  const collaborationService = CollaborationService.getInstance();

  useEffect(() => {
    loadEvents();
  }, [teamId, currentDate, viewMode]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on view mode
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();
      
      const eventsData = await collaborationService.getCalendarEvents(
        teamId,
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = () => {
    const date = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        date.setDate(1);
        date.setDate(date.getDate() - date.getDay());
        break;
      case 'week':
        date.setDate(date.getDate() - date.getDay());
        break;
      case 'day':
        break;
    }
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getViewEndDate = () => {
    const date = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        date.setMonth(date.getMonth() + 1, 0);
        date.setDate(date.getDate() + (6 - date.getDay()));
        break;
      case 'week':
        date.setDate(date.getDate() + 6);
        break;
      case 'day':
        break;
    }
    date.setHours(23, 59, 59, 999);
    return date;
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title.trim()) return;
    
    try {
      const eventData = {
        ...eventForm,
        team_id: teamId,
        workspace_id: workspaceId,
        attendees: eventForm.attendees.map(userId => ({
          user_id: userId,
          email: `${userId}@example.com`, // This would come from user data
          name: `User ${userId}`,
          status: 'pending' as const,
          is_optional: false
        })),
        status: 'scheduled' as const,
        reminders: eventForm.reminders.map(r => ({ ...r, sent: false }))
      };

      const newEvent = await collaborationService.createCalendarEvent(eventData);
      if (newEvent) {
        setEvents(prev => [...prev, newEvent]);
        setCreateEventOpen(false);
        resetEventForm();
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleUpdateEventStatus = async (eventId: string, status: 'accepted' | 'declined' | 'tentative') => {
    try {
      await collaborationService.updateEventAttendeeStatus(eventId, currentUserId, status);
      
      // Refresh events
      loadEvents();
    } catch (error) {
      console.error('Failed to update event status:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await collaborationService.deleteCalendarEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setEventDetailsOpen(false);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      all_day: false,
      location: '',
      meeting_url: '',
      type: 'meeting',
      attendees: [],
      reminders: [{ type: 'email', minutes_before: 15 }]
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.all_day) return 'All day';
    
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500';
      case 'deadline': return 'bg-red-500';
      case 'reminder': return 'bg-yellow-500';
      case 'event': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'deadline': return <AlertCircle className="h-4 w-4" />;
      case 'reminder': return <Bell className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const filteredEvents = events.filter(event => {
    if (filterType !== 'all' && event.type !== filterType) return false;
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const renderMonthView = () => {
    const startDate = getViewStartDate();
    const days = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.start_time);
        return eventDate.toDateString() === date.toDateString();
      });
      
      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
      const isToday = date.toDateString() === new Date().toDateString();
      
      days.push(
        <div
          key={i}
          className={`min-h-[120px] p-2 border-r border-b ${
            isCurrentMonth ? 'bg-white' : 'bg-gray-50'
          } ${isToday ? 'bg-blue-50' : ''}`}
        >
          <div className={`text-sm font-medium mb-2 ${
            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
          } ${isToday ? 'text-blue-600' : ''}`}>
            {date.getDate()}
          </div>
          
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map(event => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded cursor-pointer ${getEventTypeColor(event.type)} text-white truncate`}
                onClick={() => {
                  setSelectedEvent(event);
                  setEventDetailsOpen(true);
                }}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-7 border-l border-t">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 border-r border-b bg-gray-100 font-medium text-center">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = getViewStartDate();
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.start_time);
        return eventDate.toDateString() === date.toDateString();
      });
      
      const isToday = date.toDateString() === new Date().toDateString();
      
      days.push(
        <div key={i} className="flex-1 border-r">
          <div className={`p-3 border-b text-center ${isToday ? 'bg-blue-50 text-blue-600' : 'bg-gray-50'}`}>
            <div className="font-medium">{date.toLocaleDateString([], { weekday: 'short' })}</div>
            <div className={`text-lg ${isToday ? 'font-bold' : ''}`}>{date.getDate()}</div>
          </div>
          
          <div className="p-2 space-y-1 min-h-[400px]">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={`p-2 rounded cursor-pointer ${getEventTypeColor(event.type)} text-white text-sm`}
                onClick={() => {
                  setSelectedEvent(event);
                  setEventDetailsOpen(true);
                }}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-xs opacity-90">{formatEventTime(event)}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return <div className="flex border-l border-t">{days}</div>;
  };

  const renderDayView = () => {
    const dayEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === currentDate.toDateString();
    });
    
    return (
      <div className="space-y-2">
        <div className="text-lg font-medium text-center p-4 bg-gray-50 rounded">
          {currentDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        
        <div className="space-y-3">
          {dayEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events scheduled for this day</p>
            </div>
          ) : (
            dayEvents.map(event => (
              <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded ${getEventTypeColor(event.type)} text-white`}>
                        {getEventTypeIcon(event.type)}
                      </div>
                      
                      <div>
                        <h3 className="font-medium">{event.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{formatEventTime(event)}</p>
                        {event.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                        {event.meeting_url && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Video className="h-3 w-3" />
                            Video meeting
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(event);
                        setEventDetailsOpen(true);
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

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
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Team Calendar</h2>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-lg font-medium min-w-[200px] text-center">
              {viewMode === 'month' && currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
              {viewMode === 'week' && `Week of ${getViewStartDate().toLocaleDateString()}`}
              {viewMode === 'day' && currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="pl-10 w-48"
            />
          </div>
          
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="meeting">Meetings</SelectItem>
              <SelectItem value="deadline">Deadlines</SelectItem>
              <SelectItem value="reminder">Reminders</SelectItem>
              <SelectItem value="event">Events</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Schedule a new event for your team
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={eventForm.title}
                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Event title"
                  />
                </div>
                
                <div>
                  <Label>Type</Label>
                  <Select
                    value={eventForm.type}
                    onValueChange={(value: any) => setEventForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={eventForm.start_time}
                      onChange={(e) => setEventForm(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="datetime-local"
                      value={eventForm.end_time}
                      onChange={(e) => setEventForm(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>All Day</Label>
                  <Switch
                    checked={eventForm.all_day}
                    onCheckedChange={(checked) => setEventForm(prev => ({ ...prev, all_day: checked }))}
                  />
                </div>
                
                <div>
                  <Label>Location</Label>
                  <Input
                    value={eventForm.location}
                    onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Meeting location"
                  />
                </div>
                
                <div>
                  <Label>Meeting URL</Label>
                  <Input
                    value={eventForm.meeting_url}
                    onChange={(e) => setEventForm(prev => ({ ...prev, meeting_url: e.target.value }))}
                    placeholder="Video meeting link"
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateEventOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent}>
                  Create Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar View */}
      <Card>
        <CardContent className="p-0">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
        <DialogContent className="max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`p-2 rounded ${getEventTypeColor(selectedEvent.type)} text-white`}>
                    {getEventTypeIcon(selectedEvent.type)}
                  </div>
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription>
                  {formatEventTime(selectedEvent)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedEvent.description && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-gray-600 mt-1">{selectedEvent.description}</p>
                  </div>
                )}
                
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.meeting_url && (
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-gray-500" />
                    <a href={selectedEvent.meeting_url} className="text-sm text-blue-600 hover:underline">
                      Join meeting
                    </a>
                  </div>
                )}
                
                {selectedEvent.attendees.length > 0 && (
                  <div>
                    <Label>Attendees</Label>
                    <div className="space-y-2 mt-2">
                      {selectedEvent.attendees.map(attendee => (
                        <div key={attendee.user_id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {attendee.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{attendee.name}</span>
                          </div>
                          
                          <Badge variant={
                            attendee.status === 'accepted' ? 'default' :
                            attendee.status === 'declined' ? 'destructive' :
                            attendee.status === 'tentative' ? 'secondary' : 'outline'
                          }>
                            {attendee.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedEvent.attendees.some(a => a.user_id === currentUserId) && (
                  <div>
                    <Label>Your Response</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateEventStatus(selectedEvent.id, 'accepted')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateEventStatus(selectedEvent.id, 'tentative')}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Maybe
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateEventStatus(selectedEvent.id, 'declined')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setEventDetailsOpen(false)}>
                  Close
                </Button>
                {selectedEvent.organizer_id === currentUserId && (
                  <>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamCalendar;