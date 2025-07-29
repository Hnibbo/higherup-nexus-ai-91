import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Share2,
  Link,
  Eye,
  Trash2,
  File,
  Image,
  Video,
  FileText,
  Archive,
  Music,
  Code,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  User,
  Lock,
  Globe,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CollaborationService, { FileShare } from '@/services/collaboration/CollaborationService';

interface FileSharingProps {
  teamId: string;
  workspaceId?: string;
  currentUserId: string;
  className?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

const FileSharing: React.FC<FileSharingProps> = ({
  teamId,
  workspaceId,
  currentUserId,
  className
}) => {
  const [files, setFiles] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'documents' | 'videos' | 'other'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  
  // Dialog states
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileShare | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Share settings
  const [shareSettings, setShareSettings] = useState({
    publicAccess: false,
    passwordProtected: false,
    password: '',
    expiresAt: '',
    allowDownload: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const collaborationService = CollaborationService.getInstance();

  useEffect(() => {
    loadFiles();
  }, [teamId, workspaceId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const filesData = await collaborationService.getSharedFiles(teamId, workspaceId);
      setFiles(filesData);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    const newUploads: UploadProgress[] = selectedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadProgress(prev => [...prev, ...newUploads]);

    for (const upload of newUploads) {
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => 
            prev.map(p => 
              p.file === upload.file && p.status === 'uploading'
                ? { ...p, progress: Math.min(p.progress + 10, 90) }
                : p
            )
          );
        }, 200);

        const uploadedFile = await collaborationService.uploadFile(upload.file, {
          teamId,
          workspaceId,
          permissions: {
            team_access: true,
            allow_download: true
          }
        });

        clearInterval(progressInterval);

        if (uploadedFile) {
          setUploadProgress(prev => 
            prev.map(p => 
              p.file === upload.file 
                ? { ...p, progress: 100, status: 'completed' }
                : p
            )
          );
          
          setFiles(prev => [uploadedFile, ...prev]);
        } else {
          setUploadProgress(prev => 
            prev.map(p => 
              p.file === upload.file 
                ? { ...p, status: 'error', error: 'Upload failed' }
                : p
            )
          );
        }
      } catch (error) {
        setUploadProgress(prev => 
          prev.map(p => 
            p.file === upload.file 
              ? { ...p, status: 'error', error: 'Upload failed' }
              : p
          )
        );
      }
    }

    // Clear completed uploads after 3 seconds
    setTimeout(() => {
      setUploadProgress(prev => prev.filter(p => p.status !== 'completed'));
    }, 3000);
  };

  const handleShare = async (file: FileShare) => {
    setSelectedFile(file);
    
    // Generate share link
    const link = `${window.location.origin}/shared/${file.id}`;
    setShareLink(link);
    setShareDialogOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleDownload = async (file: FileShare) => {
    try {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Update download count
      await collaborationService.incrementDownloadCount(file.id);
      
      // Refresh files to update download count
      loadFiles();
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const handleDelete = async (file: FileShare) => {
    if (!confirm(`Are you sure you want to delete ${file.file_name}?`)) return;
    
    try {
      await collaborationService.deleteFile(file.id);
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const getFileIcon = (fileType: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-8 w-8';
    
    if (fileType.startsWith('image/')) return <Image className={`${iconSize} text-green-500`} />;
    if (fileType.startsWith('video/')) return <Video className={`${iconSize} text-red-500`} />;
    if (fileType.startsWith('audio/')) return <Music className={`${iconSize} text-purple-500`} />;
    if (fileType.includes('document') || fileType.includes('text')) return <FileText className={`${iconSize} text-blue-500`} />;
    if (fileType.includes('zip') || fileType.includes('archive')) return <Archive className={`${iconSize} text-yellow-500`} />;
    if (fileType.includes('code') || fileType.includes('javascript') || fileType.includes('json')) return <Code className={`${iconSize} text-gray-500`} />;
    return <File className={`${iconSize} text-gray-500`} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredFiles = () => {
    let filtered = files;
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(file => {
        switch (filterType) {
          case 'images': return file.file_type.startsWith('image/');
          case 'documents': return file.file_type.includes('document') || file.file_type.includes('text') || file.file_type.includes('pdf');
          case 'videos': return file.file_type.startsWith('video/');
          case 'other': return !file.file_type.startsWith('image/') && !file.file_type.startsWith('video/') && !file.file_type.includes('document');
          default: return true;
        }
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort files
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.file_name.localeCompare(b.file_name);
        case 'size':
          return b.file_size - a.file_size;
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    
    return filtered;
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
        <h2 className="text-2xl font-bold">File Sharing</h2>
        
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploading Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploadProgress.map((upload, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(upload.file.type, 'sm')}
                    <span className="text-sm font-medium">{upload.file.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {upload.status === 'completed' && <Check className="h-4 w-4 text-green-500" />}
                    {upload.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-sm text-gray-500">
                      {upload.status === 'uploading' && `${upload.progress}%`}
                      {upload.status === 'completed' && 'Completed'}
                      {upload.status === 'error' && upload.error}
                    </span>
                  </div>
                </div>
                
                {upload.status === 'uploading' && (
                  <Progress value={upload.progress} className="h-2" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="images">Images</SelectItem>
              <SelectItem value="documents">Documents</SelectItem>
              <SelectItem value="videos">Videos</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Files Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
        {filteredFiles().map((file) => {
          if (viewMode === 'grid') {
            return (
              <Card key={file.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.file_type, 'lg')}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(file)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(file)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(file)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div>
                    <h4 className="font-medium truncate mb-2">{file.file_name}</h4>
                    
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatTimestamp(file.created_at)}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>{formatFileSize(file.file_size)}</span>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span>{file.download_count}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 mt-2">
                      {file.permissions.public_access && (
                        <Badge variant="outline" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                      {file.permissions.password_protected && (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Protected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          } else {
            return (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.file_type)}
                  
                  <div>
                    <div className="font-medium">{file.file_name}</div>
                    <div className="text-sm text-gray-500">
                      {formatTimestamp(file.created_at)} • {formatFileSize(file.file_size)} • {file.download_count} downloads
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {file.permissions.public_access && (
                    <Badge variant="outline" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  )}
                  {file.permissions.password_protected && (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Protected
                    </Badge>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(file)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDelete(file)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          }
        })}
      </div>

      {filteredFiles().length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'No files match your search.' : 'Upload files to start sharing with your team.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First File
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
            <DialogDescription>
              Share "{selectedFile?.file_name}" with others
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Share Link</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={shareLink} readOnly className="flex-1" />
                <Button size="sm" onClick={handleCopyLink}>
                  {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Public Access</Label>
                <Switch
                  checked={shareSettings.publicAccess}
                  onCheckedChange={(checked) => 
                    setShareSettings(prev => ({ ...prev, publicAccess: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Password Protection</Label>
                <Switch
                  checked={shareSettings.passwordProtected}
                  onCheckedChange={(checked) => 
                    setShareSettings(prev => ({ ...prev, passwordProtected: checked }))
                  }
                />
              </div>
              
              {shareSettings.passwordProtected && (
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={shareSettings.password}
                    onChange={(e) => 
                      setShareSettings(prev => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Enter password"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Label>Allow Download</Label>
                <Switch
                  checked={shareSettings.allowDownload}
                  onCheckedChange={(checked) => 
                    setShareSettings(prev => ({ ...prev, allowDownload: checked }))
                  }
                />
              </div>
              
              <div>
                <Label>Expires At</Label>
                <Input
                  type="datetime-local"
                  value={shareSettings.expiresAt}
                  onChange={(e) => 
                    setShareSettings(prev => ({ ...prev, expiresAt: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
            <Button>
              Update Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileSharing;