import { VoiceToText } from '@/components/Voice/VoiceToText';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MessageSquare, Zap, Globe, FileAudio, Download } from 'lucide-react';

export default function VoiceTools() {
  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">AI Voice Tools</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Transform your voice into text with our advanced AI-powered speech recognition. 
          Perfect for content creation, meeting notes, and accessibility.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Mic className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">Live Recording</h3>
            <p className="text-sm text-muted-foreground">
              Real-time voice recording with high quality
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Zap className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">AI Processing</h3>
            <p className="text-sm text-muted-foreground">
              Advanced AI for accurate transcription
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Globe className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">Multi-Language</h3>
            <p className="text-sm text-muted-foreground">
              Support for multiple languages
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <FileAudio className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">File Upload</h3>
            <p className="text-sm text-muted-foreground">
              Upload existing audio files for transcription
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">Text Editing</h3>
            <p className="text-sm text-muted-foreground">
              Edit and refine transcribed text
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Download className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">Export</h3>
            <p className="text-sm text-muted-foreground">
              Download transcriptions in multiple formats
            </p>
          </CardContent>
        </Card>
      </div>

      <VoiceToText />
    </div>
  );
}