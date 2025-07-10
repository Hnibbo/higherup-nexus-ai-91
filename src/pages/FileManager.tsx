import { AdvancedFileManager } from '@/components/FileUpload/AdvancedFileManager';
import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen, Upload, Download, Share, Lock } from 'lucide-react';

export default function FileManager() {
  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Advanced File Manager</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Manage all your files, assets, and documents in one secure, organized workspace. 
          Upload, organize, share, and collaborate on files with your team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Upload className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">Drag & Drop</h3>
            <p className="text-sm text-muted-foreground">
              Easy file uploads with progress tracking
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">Organization</h3>
            <p className="text-sm text-muted-foreground">
              Smart folders and categorization
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Share className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">Sharing</h3>
            <p className="text-sm text-muted-foreground">
              Secure file sharing with permissions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Lock className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">Security</h3>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade file security
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Download className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">Access</h3>
            <p className="text-sm text-muted-foreground">
              Download and preview any file type
            </p>
          </CardContent>
        </Card>
      </div>

      <AdvancedFileManager />
    </div>
  );
}