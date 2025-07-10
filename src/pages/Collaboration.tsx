import { RealTimeCollaboration } from '@/components/Collaboration/RealTimeCollaboration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Video, Share } from 'lucide-react';

export default function Collaboration() {
  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Real-Time Collaboration</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Work together seamlessly with your team in real-time. Share ideas, collaborate on projects, 
          and stay connected with advanced collaboration tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">Live Presence</h3>
            <p className="text-sm text-muted-foreground">
              See who's online and active in real-time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">Team Chat</h3>
            <p className="text-sm text-muted-foreground">
              Instant messaging and communication
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Video className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">Video Calls</h3>
            <p className="text-sm text-muted-foreground">
              Start video calls directly from the platform
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Share className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">Screen Sharing</h3>
            <p className="text-sm text-muted-foreground">
              Share your screen and collaborate visually
            </p>
          </CardContent>
        </Card>
      </div>

      <RealTimeCollaboration roomId="main-workspace" />
    </div>
  );
}