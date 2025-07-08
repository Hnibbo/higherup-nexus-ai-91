import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  Upload, 
  User, 
  Mic, 
  Image, 
  Play, 
  Pause, 
  Download,
  Share,
  Settings,
  Wand2,
  Camera,
  FileVideo,
  Palette,
  Type,
  Music,
  Zap
} from "lucide-react";

const VideoCreator = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const avatarTemplates = [
    {
      id: 1,
      name: "Professional Male",
      category: "Business",
      thumbnail: "/api/placeholder/120/120",
      voice: "Corporate, Confident"
    },
    {
      id: 2,
      name: "Friendly Female",
      category: "Marketing",
      thumbnail: "/api/placeholder/120/120",
      voice: "Warm, Engaging"
    },
    {
      id: 3,
      name: "Young Entrepreneur",
      category: "Startup",
      thumbnail: "/api/placeholder/120/120",
      voice: "Energetic, Modern"
    },
    {
      id: 4,
      name: "Expert Consultant",
      category: "Professional",
      thumbnail: "/api/placeholder/120/120",
      voice: "Authoritative, Clear"
    }
  ];

  const videoTemplates = [
    {
      id: 1,
      name: "Product Demo",
      category: "Sales",
      description: "Showcase your product features",
      duration: "30-60s"
    },
    {
      id: 2,
      name: "Testimonial Style",
      category: "Social Proof",
      description: "Customer success stories",
      duration: "45-90s"
    },
    {
      id: 3,
      name: "Educational Content",
      category: "Training",
      description: "How-to and tutorials",
      duration: "60-180s"
    },
    {
      id: 4,
      name: "Brand Story",
      category: "Branding",
      description: "Company introduction",
      duration: "90-120s"
    }
  ];

  const generatedVideos = [
    {
      id: 1,
      title: "Summer Sale Announcement",
      thumbnail: "/api/placeholder/300/200",
      duration: "0:45",
      created: "2 hours ago",
      status: "Ready"
    },
    {
      id: 2,
      title: "Product Launch Video",
      thumbnail: "/api/placeholder/300/200",
      duration: "1:20",
      created: "1 day ago",
      status: "Ready"
    },
    {
      id: 3,
      title: "Customer Testimonial",
      thumbnail: "/api/placeholder/300/200",
      duration: "0:55",
      created: "3 days ago",
      status: "Ready"
    }
  ];

  const handleGenerateVideo = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate video generation progress
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Video Creator</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Media
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Video Creator</h1>
          <p className="text-muted-foreground">
            Create professional marketing videos with AI-powered avatars and your products
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">Create Video</TabsTrigger>
            <TabsTrigger value="avatars">AI Avatars</TabsTrigger>
            <TabsTrigger value="library">Video Library</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Video Creation Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Wand2 className="w-5 h-5 mr-2 text-primary" />
                      Create Your Video
                    </CardTitle>
                    <CardDescription>
                      Choose a template and customize with your content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Template Selection */}
                    <div>
                      <Label className="text-base font-medium">Video Template</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {videoTemplates.map((template) => (
                          <Card key={template.id} className="cursor-pointer hover:ring-2 hover:ring-primary">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm">{template.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {template.duration}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {template.description}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Script Input */}
                    <div>
                      <Label htmlFor="script">Video Script</Label>
                      <Textarea
                        id="script"
                        placeholder="Enter your video script here... AI will help optimize it for maximum engagement."
                        className="min-h-32"
                      />
                      <div className="flex justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          Estimated duration: 45-60 seconds
                        </p>
                        <Button variant="ghost" size="sm">
                          <Wand2 className="w-4 h-4 mr-1" />
                          AI Optimize
                        </Button>
                      </div>
                    </div>

                    {/* Product Integration */}
                    <div>
                      <Label>Product Integration</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <Button variant="outline" className="h-auto p-4 flex flex-col">
                          <Upload className="w-6 h-6 mb-2" />
                          <span className="text-sm">Upload Product Images</span>
                        </Button>
                        <Button variant="outline" className="h-auto p-4 flex flex-col">
                          <FileVideo className="w-6 h-6 mb-2" />
                          <span className="text-sm">Upload Product Video</span>
                        </Button>
                      </div>
                    </div>

                    {/* Voice & Style */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Voice Style</Label>
                        <select className="w-full mt-1 p-2 border rounded-md">
                          <option>Professional & Confident</option>
                          <option>Friendly & Conversational</option>
                          <option>Energetic & Exciting</option>
                          <option>Calm & Trustworthy</option>
                        </select>
                      </div>
                      <div>
                        <Label>Video Style</Label>
                        <select className="w-full mt-1 p-2 border rounded-md">
                          <option>Modern Corporate</option>
                          <option>Casual & Friendly</option>
                          <option>High Energy</option>
                          <option>Minimalist</option>
                        </select>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button 
                      className="w-full h-12"
                      onClick={handleGenerateVideo}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Generating Video... {generationProgress}%
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Generate Video with AI
                        </>
                      )}
                    </Button>

                    {isGenerating && (
                      <div className="space-y-2">
                        <Progress value={generationProgress} />
                        <p className="text-sm text-muted-foreground text-center">
                          Creating your personalized marketing video...
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Avatar Selection */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2 text-primary" />
                      Choose Your Avatar
                    </CardTitle>
                    <CardDescription>
                      Select an AI presenter or clone yourself
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Clone Option */}
                    <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
                      <CardContent className="p-4 text-center">
                        <Camera className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <h4 className="font-medium mb-2">Clone Yourself</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Upload your photo and voice sample
                        </p>
                        <Button size="sm" variant="outline" className="w-full">
                          Start Cloning Process
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Avatar Templates */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Template Avatars</h4>
                      {avatarTemplates.slice(0, 3).map((avatar) => (
                        <div key={avatar.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{avatar.name}</h5>
                            <p className="text-xs text-muted-foreground">{avatar.voice}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="avatars">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {avatarTemplates.map((avatar) => (
                <Card key={avatar.id} className="group hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4 flex items-center justify-center">
                      <User className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">{avatar.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{avatar.voice}</p>
                    <Badge variant="outline" className="text-xs mb-3">
                      {avatar.category}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Play className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" className="flex-1">
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="library">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Your Videos</h2>
                <Button>
                  <Video className="w-4 h-4 mr-2" />
                  Create New Video
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedVideos.map((video) => (
                  <Card key={video.id} className="group hover:shadow-lg transition-all">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg flex items-center justify-center relative">
                        <Play className="w-12 h-12 text-primary group-hover:scale-110 transition-transform cursor-pointer" />
                        <Badge className="absolute top-2 right-2">
                          {video.duration}
                        </Badge>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium mb-2">{video.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Created {video.created}
                        </p>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Share className="w-3 h-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Videos</p>
                      <p className="text-2xl font-bold">47</p>
                    </div>
                    <Video className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                      <p className="text-2xl font-bold">24.8K</p>
                    </div>
                    <Play className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                      <p className="text-2xl font-bold">12.4%</p>
                    </div>
                    <Share className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                      <p className="text-2xl font-bold">8.7%</p>
                    </div>
                    <Download className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Video Performance</CardTitle>
                <CardDescription>Track how your videos are performing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-r from-primary/20 to-secondary/20 rounded flex items-center justify-center">
                  <p className="text-muted-foreground">Analytics chart will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VideoCreator;