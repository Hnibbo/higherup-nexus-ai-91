import { useState, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Video,
  MapPin,
  Phone,
  Link as LinkIcon,
  Bell,
  Settings,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Scene3D } from "@/components/Three/Scene3D";
import { MeetingIntegrations } from "@/components/Meeting/MeetingIntegrations";
import { motion } from "framer-motion";

const Calendar = () => {
  const { toast } = useToast();
  
  const [appointments, setAppointments] = useState([
    { 
      id: 1, 
      title: "Strategy Consultation", 
      client: "John Smith", 
      date: "2024-01-15", 
      time: "10:00", 
      duration: 60, 
      type: "Video Call",
      status: "Confirmed",
      email: "john@example.com",
      phone: "+1234567890"
    },
    { 
      id: 2, 
      title: "Website Review", 
      client: "Sarah Johnson", 
      date: "2024-01-15", 
      time: "14:30", 
      duration: 30, 
      type: "In-Person",
      status: "Pending",
      email: "sarah@example.com",
      phone: "+1234567891"
    },
    { 
      id: 3, 
      title: "Marketing Workshop", 
      client: "Mike Wilson", 
      date: "2024-01-16", 
      time: "09:00", 
      duration: 90, 
      type: "Video Call",
      status: "Confirmed",
      email: "mike@example.com",
      phone: "+1234567892"
    },
  ]);

  const [serviceTypes, setServiceTypes] = useState([
    { id: 1, name: "Strategy Consultation", duration: 60, price: 200, description: "1-on-1 business strategy session" },
    { id: 2, name: "Website Review", duration: 30, price: 100, description: "Comprehensive website analysis" },
    { id: 3, name: "Marketing Workshop", duration: 90, price: 300, description: "Group marketing training session" },
  ]);

  const [newAppointment, setNewAppointment] = useState({
    title: "",
    client: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    duration: 60,
    type: "Video Call"
  });

  const [newService, setNewService] = useState({
    name: "",
    duration: 30,
    price: 0,
    description: ""
  });

  const handleCreateAppointment = () => {
    if (!newAppointment.title || !newAppointment.client || !newAppointment.date) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    const appointment = {
      id: appointments.length + 1,
      ...newAppointment,
      status: "Pending"
    };

    setAppointments([...appointments, appointment]);
    setNewAppointment({
      title: "",
      client: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      duration: 60,
      type: "Video Call"
    });
    
    toast({
      title: "Success",
      description: "Appointment scheduled successfully"
    });
  };

  const handleCreateService = () => {
    if (!newService.name) {
      toast({
        title: "Error",
        description: "Please enter service name",
        variant: "destructive"
      });
      return;
    }

    const service = {
      id: serviceTypes.length + 1,
      ...newService
    };

    setServiceTypes([...serviceTypes, service]);
    setNewService({ name: "", duration: 30, price: 0, description: "" });
    
    toast({
      title: "Success",
      description: "Service type created successfully"
    });
  };

  const handleConfirmAppointment = (id: number) => {
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, status: "Confirmed" } : apt
    ));
    toast({
      title: "Confirmed",
      description: "Appointment has been confirmed"
    });
  };

  const stats = [
    { label: "Today's Appointments", value: "3", icon: CalendarIcon, change: "+1" },
    { label: "This Week", value: "12", icon: Clock, change: "+4" },
    { label: "Total Clients", value: "89", icon: Users, change: "+7" },
    { label: "Revenue This Month", value: "$4,200", icon: CheckCircle, change: "+23%" }
  ];

  const todayAppointments = appointments.filter(apt => apt.date === "2024-01-15");
  const upcomingAppointments = appointments.filter(apt => new Date(apt.date) > new Date("2024-01-15"));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5 p-6 relative overflow-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <Suspense fallback={null}>
          <Scene3D interactive={false} />
        </Suspense>
      </div>
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold">Calendar & Booking</h1>
            <p className="text-muted-foreground">Manage appointments and client bookings</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule Appointment</DialogTitle>
                  <DialogDescription>Create a new appointment with a client</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Service Type *</Label>
                    <Select value={newAppointment.title} onValueChange={(value) => setNewAppointment({ ...newAppointment, title: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((service) => (
                          <SelectItem key={service.id} value={service.name}>
                            {service.name} ({service.duration}min - ${service.price})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="client">Client Name *</Label>
                    <Input
                      id="client"
                      value={newAppointment.client}
                      onChange={(e) => setNewAppointment({ ...newAppointment, client: e.target.value })}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newAppointment.email}
                        onChange={(e) => setNewAppointment({ ...newAppointment, email: e.target.value })}
                        placeholder="client@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newAppointment.phone}
                        onChange={(e) => setNewAppointment({ ...newAppointment, phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newAppointment.date}
                        onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newAppointment.time}
                        onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="type">Meeting Type</Label>
                    <Select value={newAppointment.type} onValueChange={(value) => setNewAppointment({ ...newAppointment, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Video Call">Video Call</SelectItem>
                        <SelectItem value="Phone Call">Phone Call</SelectItem>
                        <SelectItem value="In-Person">In-Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateAppointment} className="w-full">
                    Schedule Appointment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-background/80 border-primary/10 hover:border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-green-600">{stat.change}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Tabs defaultValue="today" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 backdrop-blur-sm bg-background/60">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="meetings">Meetings</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="booking">Booking Page</TabsTrigger>
            </TabsList>

          <TabsContent value="today" className="space-y-6">
            <Card className="backdrop-blur-sm bg-background/80 border-primary/10">
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Appointments for January 15, 2024</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayAppointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-4" />
                      <p>No appointments scheduled for today</p>
                    </div>
                  ) : (
                    todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-mono bg-primary/10 px-2 py-1 rounded">
                              {appointment.time}
                            </div>
                            <h3 className="font-semibold">{appointment.title}</h3>
                            <Badge variant={appointment.status === 'Confirmed' ? 'default' : 'outline'}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {appointment.status === 'Pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleConfirmAppointment(appointment.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirm
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{appointment.client}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{appointment.duration} minutes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {appointment.type === 'Video Call' && <Video className="w-4 h-4 text-muted-foreground" />}
                            {appointment.type === 'Phone Call' && <Phone className="w-4 h-4 text-muted-foreground" />}
                            {appointment.type === 'In-Person' && <MapPin className="w-4 h-4 text-muted-foreground" />}
                            <span>{appointment.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Contact:</span>
                            <span>{appointment.email || appointment.phone}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings" className="space-y-6">
            <MeetingIntegrations />
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <Card className="backdrop-blur-sm bg-background/80 border-primary/10">
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>All future scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-mono bg-primary/10 px-2 py-1 rounded">
                            {appointment.date} at {appointment.time}
                          </div>
                          <h3 className="font-semibold">{appointment.title}</h3>
                          <Badge variant={appointment.status === 'Confirmed' ? 'default' : 'outline'}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Bell className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{appointment.client}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{appointment.duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {appointment.type === 'Video Call' && <Video className="w-4 h-4 text-muted-foreground" />}
                          {appointment.type === 'Phone Call' && <Phone className="w-4 h-4 text-muted-foreground" />}
                          {appointment.type === 'In-Person' && <MapPin className="w-4 h-4 text-muted-foreground" />}
                          <span>{appointment.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Service Types</CardTitle>
                    <CardDescription>Configure your bookable services</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Service
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create Service Type</DialogTitle>
                        <DialogDescription>Add a new bookable service</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="serviceName">Service Name *</Label>
                          <Input
                            id="serviceName"
                            value={newService.name}
                            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                            placeholder="Enter service name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newService.description}
                            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                            placeholder="Service description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                              id="duration"
                              type="number"
                              value={newService.duration}
                              onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                              placeholder="30"
                            />
                          </div>
                          <div>
                            <Label htmlFor="price">Price ($)</Label>
                            <Input
                              id="price"
                              type="number"
                              value={newService.price}
                              onChange={(e) => setNewService({ ...newService, price: parseInt(e.target.value) })}
                              placeholder="100"
                            />
                          </div>
                        </div>
                        <Button onClick={handleCreateService} className="w-full">
                          Create Service
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {serviceTypes.map((service) => (
                    <div key={service.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{service.name}</h3>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Duration: {service.duration} minutes</span>
                        <span>Price: ${service.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="booking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Online Booking Page</CardTitle>
                <CardDescription>Configure your public booking page for clients</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <LinkIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Your Booking Link</h3>
                      <p className="text-sm text-muted-foreground">Share this link with clients for easy booking</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      value="https://yourdomain.com/book"
                      readOnly
                      className="bg-background"
                    />
                    <Button>
                      Copy Link
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Booking Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Time Zone</Label>
                        <Select defaultValue="america/new_york">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="america/new_york">Eastern Time</SelectItem>
                            <SelectItem value="america/chicago">Central Time</SelectItem>
                            <SelectItem value="america/denver">Mountain Time</SelectItem>
                            <SelectItem value="america/los_angeles">Pacific Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Buffer Time (minutes)</Label>
                        <Input type="number" defaultValue="15" />
                      </div>
                      <div>
                        <Label>Advance Booking Limit</Label>
                        <Select defaultValue="30">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">1 Week</SelectItem>
                            <SelectItem value="14">2 Weeks</SelectItem>
                            <SelectItem value="30">1 Month</SelectItem>
                            <SelectItem value="60">2 Months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Availability</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Monday</span>
                          <span className="text-sm text-muted-foreground">9:00 AM - 5:00 PM</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Tuesday</span>
                          <span className="text-sm text-muted-foreground">9:00 AM - 5:00 PM</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Wednesday</span>
                          <span className="text-sm text-muted-foreground">9:00 AM - 5:00 PM</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Thursday</span>
                          <span className="text-sm text-muted-foreground">9:00 AM - 5:00 PM</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Friday</span>
                          <span className="text-sm text-muted-foreground">9:00 AM - 3:00 PM</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Weekend</span>
                          <span className="text-sm text-muted-foreground">Unavailable</span>
                        </div>
                      </div>
                      <Button className="w-full mt-4" variant="outline">
                        Edit Availability
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Calendar;