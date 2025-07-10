import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Upload, 
  Download,
  Zap,
  Volume2,
  FileAudio,
  MessageSquare
} from 'lucide-react';

interface TranscriptionResult {
  text: string;
  confidence: number;
  timestamp: string;
  duration: number;
}

export const VoiceToText = () => {
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      mediaRecorder.onstop = () => {
        clearInterval(interval);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  }, [isRecording]);

  const transcribeAudio = useCallback(async (audioData: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert blob to base64
      const arrayBuffer = await audioData.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      
      const transcriptionResult: TranscriptionResult = {
        text: result.text,
        confidence: result.confidence || 0.95,
        timestamp: new Date().toISOString(),
        duration: recordingTime
      };
      
      setTranscription(transcriptionResult);
      
      toast({
        title: "Success",
        description: "Audio transcribed successfully!"
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [recordingTime, toast]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  }, []);

  const playAudio = useCallback(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
      };
    }
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadTranscription = () => {
    if (transcription) {
      const content = `Transcription - ${new Date(transcription.timestamp).toLocaleString()}\n\n${transcription.text}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="w-6 h-6 mr-2" />
            Voice to Text Converter
            <Badge className="ml-3" variant="outline">AI Powered</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recording Controls */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
              {!isRecording ? (
                <Button 
                  onClick={startRecording}
                  size="lg"
                  className="w-32"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start
                </Button>
              ) : (
                <Button 
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="w-32"
                >
                  <MicOff className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              )}
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">or</p>
              </div>
              
              <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                size="lg"
                className="w-32"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {isRecording && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Recording in progress...</p>
              </div>
            )}
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileAudio className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">Audio Recording</p>
                      <p className="text-sm text-muted-foreground">
                        Ready for transcription
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={playAudio}
                      disabled={isPlaying}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Button 
                      onClick={() => audioBlob && transcribeAudio(audioBlob)}
                      disabled={isProcessing}
                      className="w-32"
                    >
                      {isProcessing ? (
                        <>
                          <Zap className="w-4 h-4 mr-2 animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Transcribe
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {isProcessing && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Processing audio...</span>
                      <span>AI Analysis</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transcription Results */}
          {transcription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Transcription Result
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {Math.round(transcription.confidence * 100)}% confidence
                    </Badge>
                    <Button variant="outline" size="sm" onClick={downloadTranscription}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={transcription.text}
                  onChange={(e) => setTranscription(prev => prev ? {...prev, text: e.target.value} : null)}
                  placeholder="Transcription will appear here..."
                  className="min-h-32 text-base leading-relaxed"
                />
                
                <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                  <span>
                    Transcribed on {new Date(transcription.timestamp).toLocaleString()}
                  </span>
                  <span>
                    Duration: {formatTime(transcription.duration)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <Zap className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="font-medium mb-1">AI Powered</h3>
              <p className="text-sm text-muted-foreground">
                Advanced speech recognition with high accuracy
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <Volume2 className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="font-medium mb-1">Real-time</h3>
              <p className="text-sm text-muted-foreground">
                Live recording and instant transcription
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <FileAudio className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="font-medium mb-1">Multiple Formats</h3>
              <p className="text-sm text-muted-foreground">
                Supports various audio file formats
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};