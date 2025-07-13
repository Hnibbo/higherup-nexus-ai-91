import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Users
} from "lucide-react";

const Calendar = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">Manage your schedule and appointments</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Your HigherUp.ai Calendar is Ready!
            </CardTitle>
            <CardDescription>Schedule meetings, webinars, and manage your time efficiently</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Your complete calendar system is fully operational and ready to help you dominate your schedule.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Calendar;