import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Upload,
  Share2,
  Settings,
  Users,
  FileText,
  Image,
  Video,
  File,
  MoreVertical,
  Download,
  Trash2,
  Edit,
  Star,
  Clock
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CollaborationService, {
  SharedWorkspace as WorkspaceType,
  WorkspaceFolder,
  FileShare,
  CollaborativeDocument
} from '@/services/collaboration/CollaborationService';

interface SharedWorkspaceProps {
  teamId: string;
  currentUserId: string;
  className?: string;
}

const SharedWorkspace: React.FC<SharedWorkspaceProps> = ({
  teamId,
  currentUserId,
  className
}) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceType[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceType | null>(null);
  const [documents, setDocuments] = useState<CollaborativeDocument[]>([]);
  const [files, setFiles] = useState<FileShare[]>([]);
  const [folders, setFolders] = useState<WorkspaceFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'documents' | 'files' | 'folders'>('all');
  
  // Dialog states
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [uploadFileOpen, setUploadFileOpen] = useState(false);
  const [workspaceSettingsOpen, setWorkspaceSettingsOpen] = useState(false);
  
  // Form states
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  const collaborationService = CollaborationService.getInstance();

  useEffect(() => {
    loadWorkspaces();
  }, [teamId]);

  useEffect(() => {
    if (selectedWorkspace) {
      loadWorkspaceContent();
    }
  }, [selectedWorkspace, currentFolder]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const workspacesData = await collaborationService.getWorkspaces(teamId);
      setWorkspaces(workspacesData);
      
      if (workspacesData.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(workspacesData[0]);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceContent = async () => {
    if (!selectedWorkspace) return;
    
    try {
      // Load documents, files, and folders for the workspace
      const [documentsData, filesData] = await Promise.all([
        collaborationService.getWorkspaceDocuments(selectedWorkspace.id),
        collaborationService.getSharedFiles(teamId, selectedWorkspace.id)
      ]);
      
      setDocuments(documentsData);
      setFiles(filesData);
      setFolders(selectedWorkspace.folders);
    } catch (error) {
      console.error('Failed to load workspace content:', error);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    try {
      const workspaceData = {
        name: newWorkspaceName,
        description: newWorkspaceDescription,
        team_id: teamId,
        members: [{
          user_id: currentUserId,
          role: 'admin' as const,
          joined_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        }],
        documents: [],
        folders: [],
        settings: {
          default_permissions: {
            public_access: 'none' as const,
            team_access: 'edit' as const,
            specific_users: [],
            allow_sharing: true,
            allow_downloading: true,
            allow_copying: true
          },
          allow_guest_access: false,
          require_approval_for_sharing: false,
          auto_save_interval: 30,
          version_history_limit: 50,
          notification_settings: {
            new_comments: true,
            document_shared: true,
            document_updated: true,
            mentions: true,
            deadline_reminders: true
          }
        }
      };

      const newWorkspace = await collaborationService.createWorkspace(workspaceData);
      if (newWorkspace) {
        setWorkspaces(prev => [newWorkspace, ...prev]);
        setSelectedWorkspace(newWorkspace);
        setCreateWorkspaceOpen(false);
        setNewWorkspaceName('');
        setNewWorkspaceDescription('');
      }
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedWorkspace) return;
    
    try {
      const folderData = {
        name: newFolderName,
        parent_id: currentFolder,
        documents: [],
        created_by: currentUserId,
        created_at: new Date().toISOString()
      };

      const newFolder = await collaborationService.createWorkspaceFolder(selectedWorkspace.id, folderData);
      if (newFolder) {
        setFolders(prev => [...prev, newFolder]);
        setCreateFolderOpen(false);
        setNewFolderName('');
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedWorkspace) return;
    
    try {
      setUploadingFile(file);
      
      const uploadedFile = await collaborationService.uploadFile(file, {
        teamId,
        workspaceId: selectedWorkspace.id,
        permissions: {
          team_access: true,
          allow_download: true
        }
      });
      
      if (uploadedFile) {
        setFiles(prev => [uploadedFile, ...prev]);
        setUploadFileOpen(false);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploadingFile(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (fileType.includes('document') || fileType.includes('text')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
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

  const filteredContent = () => {
    let content: any[] = [];
    
    if (filterType === 'all' || filterType === 'folders') {
      content = [...content, ...folders.filter(f => f.parent_id === currentFolder)];
    }
    if (filterType === 'all' || filterType === 'documents') {
      content = [...content, ...documents];
    }
    if (filterType === 'all' || filterType === 'files') {
      content = [...content, ...files];
    }
    
    if (searchQuery) {
      content = content.filter(item => {
        const name = 'title' in item ? item.title : 'name' in item ? item.name : item.file_name;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    
    return content;
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
          <h2 className="text-2xl font-bold">Shared Workspaces</h2>
          
          {/* Workspace Selector */}
          <Select
            value={selectedWorkspace?.id || ''}
            onValueChange={(value) => {
              const workspace = workspaces.find(w => w.id === value);
              setSelectedWorkspace(workspace || null);
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>
                  Create a shared workspace for your team to collaborate
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Workspace Name</Label>
                  <Input
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Enter workspace name"
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newWorkspaceDescription}
                    onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                    placeholder="Describe the workspace purpose"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateWorkspaceOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkspace}>
                  Create Workspace
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedWorkspace && (
        <>
          {/* Workspace Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    {selectedWorkspace.name}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{selectedWorkspace.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {selectedWorkspace.members.slice(0, 3).map((member) => (
                      <Avatar key={member.user_id} className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>
                          {member.user_id.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {selectedWorkspace.members.length > 3 && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                        +{selectedWorkspace.members.length - 3}
                      </div>
                    )}
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Members
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files and documents..."
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="files">Files</SelectItem>
                  <SelectItem value="folders">Folders</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
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
              
              <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  
                  <div>
                    <Label>Folder Name</Label>
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name"
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFolder}>
                      Create Folder
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={uploadFileOpen} onOpenChange={setUploadFileOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload File</DialogTitle>
                    <DialogDescription>
                      Upload a file to share with your team
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Select File</Label>
                      <Input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={!!uploadingFile}
                      />
                    </div>
                    
                    {uploadingFile && (
                      <div className="text-sm text-gray-600">
                        Uploading {uploadingFile.name}...
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setUploadFileOpen(false)}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Content */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
            {filteredContent().map((item) => {
              const isFolder = 'documents' in item && Array.isArray(item.documents);
              const isDocument = 'content' in item;
              const isFile = 'file_url' in item;
              
              if (viewMode === 'grid') {
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {isFolder && <FolderOpen className="h-5 w-5 text-blue-500" />}
                          {isDocument && <FileText className="h-5 w-5 text-green-500" />}
                          {isFile && getFileIcon(item.file_type)}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            {isFile && (
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div>
                        <h4 className="font-medium truncate">
                          {isFolder ? item.name : isDocument ? item.title : item.file_name}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(item.created_at)}
                        </div>
                        
                        {isFile && (
                          <div className="text-sm text-gray-500 mt-1">
                            {formatFileSize(item.file_size)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              } else {
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {isFolder && <FolderOpen className="h-5 w-5 text-blue-500" />}
                      {isDocument && <FileText className="h-5 w-5 text-green-500" />}
                      {isFile && getFileIcon(item.file_type)}
                      
                      <div>
                        <div className="font-medium">
                          {isFolder ? item.name : isDocument ? item.title : item.file_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTimestamp(item.created_at)}
                          {isFile && ` • ${formatFileSize(item.file_size)}`}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        {isFile && (
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              }
            })}
          </div>

          {filteredContent().length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'No items match your search.' : 'This workspace is empty. Start by creating a folder or uploading a file.'}
                </p>
                {!searchQuery && (
                  <div className="flex items-center justify-center gap-2">
                    <Button onClick={() => setCreateFolderOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Folder
                    </Button>
                    <Button variant="outline" onClick={() => setUploadFileOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default SharedWorkspace;