import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  Download, 
  Trash2, 
  Eye, 
  Search,
  FolderPlus,
  Share,
  Star,
  MoreHorizontal
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  bucket_id: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: any;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export const AdvancedFileManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState<UploadProgress[]>([]);
  const [selectedBucket, setSelectedBucket] = useState('documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const buckets = [
    { id: 'documents', name: 'Documents', icon: File, color: 'blue' },
    { id: 'images', name: 'Images', icon: Image, color: 'green' },
    { id: 'videos', name: 'Videos', icon: Video, color: 'purple' },
    { id: 'assets', name: 'Assets', icon: FolderPlus, color: 'orange' }
  ];

  const loadFiles = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.storage
        .from(selectedBucket)
        .list(`${user.id}/`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'updated_at', order: 'desc' }
        });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive"
      });
    }
  }, [user, selectedBucket, toast]);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!user || !files.length) return;

    const uploadPromises = Array.from(files).map(async (file) => {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      
      setUploading(prev => [...prev, {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      }]);

      try {
        const { data, error } = await supabase.storage
          .from(selectedBucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        setUploading(prev => prev.map(item => 
          item.fileName === file.name 
            ? { ...item, progress: 100, status: 'completed' }
            : item
        ));

        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`
        });

      } catch (error) {
        setUploading(prev => prev.map(item => 
          item.fileName === file.name 
            ? { ...item, status: 'error' }
            : item
        ));

        toast({
          title: "Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    });

    await Promise.all(uploadPromises);
    loadFiles();
    
    // Clear upload progress after 3 seconds
    setTimeout(() => {
      setUploading(prev => prev.filter(item => item.status === 'uploading'));
    }, 3000);
  }, [user, selectedBucket, loadFiles, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const deleteFile = async (fileName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.storage
        .from(selectedBucket)
        .remove([`${user.id}/${fileName}`]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "File deleted successfully"
      });

      loadFiles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const downloadFile = async (fileName: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.storage
        .from(selectedBucket)
        .download(`${user.id}/${fileName}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return Image;
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) return Video;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderPlus className="w-6 h-6 mr-2" />
            Advanced File Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedBucket} onValueChange={setSelectedBucket}>
            <TabsList className="grid w-full grid-cols-4">
              {buckets.map((bucket) => {
                const Icon = bucket.icon;
                return (
                  <TabsTrigger key={bucket.id} value={bucket.id} className="flex items-center">
                    <Icon className="w-4 h-4 mr-1" />
                    {bucket.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {buckets.map((bucket) => (
              <TabsContent key={bucket.id} value={bucket.id} className="space-y-4">
                {/* Upload Area */}
                <div
                  className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Drop files here or click to upload</p>
                  <p className="text-sm text-muted-foreground">
                    Supports all file types up to 50MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  />
                </div>

                {/* Upload Progress */}
                {uploading.length > 0 && (
                  <div className="space-y-2">
                    {uploading.map((upload, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{upload.fileName}</span>
                          <Badge variant={
                            upload.status === 'completed' ? 'default' :
                            upload.status === 'error' ? 'destructive' : 'secondary'
                          }>
                            {upload.status}
                          </Badge>
                        </div>
                        <Progress value={upload.progress} className="h-1" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Search and Controls */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      List
                    </Button>
                  </div>
                </div>

                {/* Files Grid/List */}
                <div className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    : "space-y-2"
                }>
                  {filteredFiles.map((file) => {
                    const Icon = getFileIcon(file.name);
                    return (
                      <Card key={file.id} className="group hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          {viewMode === 'grid' ? (
                            <div className="space-y-3">
                              <div className="flex justify-center">
                                <Icon className="w-12 h-12 text-primary" />
                              </div>
                              <div className="text-center">
                                <p className="font-medium text-sm truncate" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.metadata?.size || 0)}
                                </p>
                              </div>
                              <div className="flex justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="outline" onClick={() => downloadFile(file.name)}>
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Share className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => deleteFile(file.name)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Icon className="w-8 h-8 text-primary" />
                                <div>
                                  <p className="font-medium">{file.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatFileSize(file.metadata?.size || 0)} • {new Date(file.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Button size="sm" variant="outline" onClick={() => downloadFile(file.name)}>
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <MoreHorizontal className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {filteredFiles.length === 0 && (
                  <div className="text-center py-12">
                    <File className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No files found</p>
                    <p className="text-muted-foreground">Upload some files to get started</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};