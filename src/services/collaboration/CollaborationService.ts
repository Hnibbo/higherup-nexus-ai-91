import { supabase } from '@/integrations/supabase/client';

/**
 * Collaboration Service
 * 
 * Handles real-time collaborative editing, comments, feedback systems,
 * shared workspaces, file sharing, and team calendar integration.
 */

export interface CollaborativeDocument {
  id: string;
  title: string;
  content: any; // JSON content for rich text editor
  type: 'document' | 'presentation' | 'spreadsheet' | 'whiteboard' | 'form';
  owner_id: string;
  team_id: string;
  permissions: DocumentPermissions;
  collaborators: Collaborator[];
  version: number;
  status: 'draft' | 'review' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  last_edited_by: string;
  metadata: DocumentMetadata;
}

export interface DocumentPermissions {
  public_access: 'none' | 'view' | 'comment' | 'edit';
  team_access: 'none' | 'view' | 'comment' | 'edit';
  specific_users: UserPermission[];
  allow_sharing: boolean;
  allow_downloading: boolean;
  allow_copying: boolean;
}

export interface UserPermission {
  user_id: string;
  permission: 'view' | 'comment' | 'edit' | 'admin';
  granted_by: string;
  granted_at: string;
}

export interface Collaborator {
  user_id: string;
  name: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'away';
  cursor_position?: CursorPosition;
  selection?: TextSelection;
  last_seen: string;
  color: string; // For cursor and selection highlighting
}

export interface CursorPosition {
  line: number;
  column: number;
  block_id?: string;
}

export interface TextSelection {
  start: CursorPosition;
  end: CursorPosition;
  text: string;
}

export interface DocumentMetadata {
  word_count?: number;
  character_count?: number;
  reading_time?: number;
  tags: string[];
  category?: string;
  template_id?: string;
  custom_fields: Record<string, any>;
}

export interface Comment {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  position: CommentPosition;
  thread_id?: string;
  parent_id?: string;
  status: 'open' | 'resolved' | 'deleted';
  reactions: Reaction[];
  mentions: string[];
  created_at: string;
  updated_at: string;
  resolved_by?: string;
  resolved_at?: string;
}

export interface CommentPosition {
  block_id?: string;
  line?: number;
  column?: number;
  selection?: TextSelection;
  coordinates?: { x: number; y: number };
}

export interface Reaction {
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface SharedWorkspace {
  id: string;
  name: string;
  description: string;
  team_id: string;
  owner_id: string;
  members: WorkspaceMember[];
  documents: string[];
  folders: WorkspaceFolder[];
  settings: WorkspaceSettings;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  user_id: string;
  role: 'admin' | 'editor' | 'viewer';
  joined_at: string;
  last_active: string;
}

export interface WorkspaceFolder {
  id: string;
  name: string;
  parent_id?: string;
  documents: string[];
  created_by: string;
  created_at: string;
}

export interface WorkspaceSettings {
  default_permissions: DocumentPermissions;
  allow_guest_access: boolean;
  require_approval_for_sharing: boolean;
  auto_save_interval: number;
  version_history_limit: number;
  notification_settings: NotificationSettings;
}

export interface NotificationSettings {
  new_comments: boolean;
  document_shared: boolean;
  document_updated: boolean;
  mentions: boolean;
  deadline_reminders: boolean;
}

export interface FileShare {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  thumbnail_url?: string;
  uploaded_by: string;
  team_id: string;
  workspace_id?: string;
  document_id?: string;
  permissions: FilePermissions;
  download_count: number;
  expires_at?: string;
  created_at: string;
  metadata: FileMetadata;
}

export interface FilePermissions {
  public_access: boolean;
  team_access: boolean;
  specific_users: string[];
  allow_download: boolean;
  password_protected: boolean;
  password_hash?: string;
}

export interface FileMetadata {
  original_name: string;
  mime_type: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  checksum: string;
  virus_scan_status: 'pending' | 'clean' | 'infected' | 'error';
  tags: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location?: string;
  meeting_url?: string;
  organizer_id: string;
  attendees: EventAttendee[];
  team_id: string;
  workspace_id?: string;
  document_id?: string;
  type: 'meeting' | 'deadline' | 'reminder' | 'event';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  recurrence?: RecurrenceRule;
  reminders: EventReminder[];
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  user_id: string;
  email: string;
  name: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  response_time?: string;
  is_optional: boolean;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  end_date?: string;
  count?: number;
  days_of_week?: number[];
  day_of_month?: number;
}

export interface EventReminder {
  type: 'email' | 'push' | 'sms';
  minutes_before: number;
  sent: boolean;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: any;
  changes_summary: string;
  created_by: string;
  created_at: string;
  size_bytes: number;
  is_major_version: boolean;
}

export interface ChangeOperation {
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
  user_id: string;
  timestamp: string;
}

export class CollaborationService {
  private static instance: CollaborationService;
  private currentUser: any = null;
  private activeDocuments: Map<string, CollaborativeDocument> = new Map();
  private documentSubscriptions: Map<string, any> = new Map();
  private collaboratorColors: string[] = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      console.log('🤝 Initializing Collaboration Service');
      
      // Get current user
      await this.getCurrentUser();
      
      // Set up real-time subscriptions
      await this.setupRealtimeSubscriptions();
      
      console.log('✅ Collaboration Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Collaboration Service:', error);
    }
  }

  private async getCurrentUser(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUser = user;
    } catch (error) {
      console.warn('Could not get current user:', error);
    }
  }

  private async setupRealtimeSubscriptions(): Promise<void> {
    // Subscribe to document changes
    supabase
      .channel('documents')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'collaborative_documents' },
        (payload) => this.handleDocumentChange(payload)
      )
      .subscribe();

    // Subscribe to comments
    supabase
      .channel('comments')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'document_comments' },
        (payload) => this.handleCommentChange(payload)
      )
      .subscribe();

    // Subscribe to collaborator presence
    supabase
      .channel('collaborators')
      .on('presence', { event: 'sync' }, () => this.handlePresenceSync())
      .on('presence', { event: 'join' }, ({ key, newPresences }) => this.handlePresenceJoin(key, newPresences))
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => this.handlePresenceLeave(key, leftPresences))
      .subscribe();
  }

  private handleDocumentChange(payload: any): void {
    console.log('📄 Document change:', payload);
    // Handle real-time document updates
    this.broadcastDocumentChange(payload);
  }

  private handleCommentChange(payload: any): void {
    console.log('💬 Comment change:', payload);
    // Handle real-time comment updates
    this.broadcastCommentChange(payload);
  }

  private handlePresenceSync(): void {
    console.log('👥 Presence sync');
    // Handle collaborator presence sync
  }

  private handlePresenceJoin(key: string, newPresences: any[]): void {
    console.log('👋 User joined:', key, newPresences);
    // Handle user joining document
  }

  private handlePresenceLeave(key: string, leftPresences: any[]): void {
    console.log('👋 User left:', key, leftPresences);
    // Handle user leaving document
  }

  // Document Management
  async createDocument(documentData: Omit<CollaborativeDocument, 'id' | 'created_at' | 'updated_at' | 'version' | 'collaborators'>): Promise<CollaborativeDocument | null> {
    try {
      console.log(`📄 Creating document: ${documentData.title}`);

      const newDocument: Omit<CollaborativeDocument, 'id'> = {
        ...documentData,
        owner_id: this.currentUser?.id,
        version: 1,
        collaborators: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_edited_by: this.currentUser?.id
      };

      const { data, error } = await supabase
        .from('collaborative_documents')
        .insert(newDocument)
        .select()
        .single();

      if (error) {
        console.error('Failed to create document:', error);
        return null;
      }

      console.log('✅ Document created successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to create document:', error);
      return null;
    }
  }

  async getDocument(documentId: string): Promise<CollaborativeDocument | null> {
    try {
      const { data, error } = await supabase
        .from('collaborative_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        console.warn('Could not fetch document:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get document:', error);
      return null;
    }
  }

  async updateDocument(documentId: string, updates: Partial<CollaborativeDocument>): Promise<boolean> {
    try {
      console.log(`📄 Updating document: ${documentId}`);

      const updatedDocument = {
        ...updates,
        updated_at: new Date().toISOString(),
        last_edited_by: this.currentUser?.id,
        version: updates.content ? (updates.version || 1) + 1 : updates.version
      };

      const { error } = await supabase
        .from('collaborative_documents')
        .update(updatedDocument)
        .eq('id', documentId);

      if (error) {
        console.error('Failed to update document:', error);
        return false;
      }

      // Create version history if content changed
      if (updates.content) {
        await this.createDocumentVersion(documentId, updates.content, 'Content updated');
      }

      console.log('✅ Document updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to update document:', error);
      return false;
    }
  }

  async joinDocument(documentId: string): Promise<boolean> {
    try {
      console.log(`🤝 Joining document: ${documentId}`);

      const document = await this.getDocument(documentId);
      if (!document) return false;

      // Check permissions
      if (!await this.checkDocumentPermission(documentId, 'view')) {
        console.error('No permission to access document');
        return false;
      }

      // Add to active documents
      this.activeDocuments.set(documentId, document);

      // Subscribe to document-specific changes
      await this.subscribeToDocument(documentId);

      // Update collaborator presence
      await this.updateCollaboratorPresence(documentId, 'online');

      console.log('✅ Joined document successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to join document:', error);
      return false;
    }
  }

  async leaveDocument(documentId: string): Promise<void> {
    try {
      console.log(`👋 Leaving document: ${documentId}`);

      // Remove from active documents
      this.activeDocuments.delete(documentId);

      // Unsubscribe from document changes
      const subscription = this.documentSubscriptions.get(documentId);
      if (subscription) {
        subscription.unsubscribe();
        this.documentSubscriptions.delete(documentId);
      }

      // Update collaborator presence
      await this.updateCollaboratorPresence(documentId, 'offline');

      console.log('✅ Left document successfully');
    } catch (error) {
      console.error('❌ Failed to leave document:', error);
    }
  }

  private async subscribeToDocument(documentId: string): Promise<void> {
    const channel = supabase
      .channel(`document:${documentId}`)
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'collaborative_documents',
          filter: `id=eq.${documentId}`
        },
        (payload) => this.handleDocumentUpdate(payload)
      )
      .on('broadcast',
        { event: 'cursor_move' },
        (payload) => this.handleCursorMove(payload)
      )
      .on('broadcast',
        { event: 'selection_change' },
        (payload) => this.handleSelectionChange(payload)
      )
      .subscribe();

    this.documentSubscriptions.set(documentId, channel);
  }

  private handleDocumentUpdate(payload: any): void {
    const documentId = payload.new.id;
    const document = this.activeDocuments.get(documentId);
    
    if (document) {
      // Update local document state
      this.activeDocuments.set(documentId, { ...document, ...payload.new });
      
      // Notify listeners
      this.broadcastDocumentChange(payload);
    }
  }

  private handleCursorMove(payload: any): void {
    console.log('🖱️ Cursor moved:', payload);
    // Handle real-time cursor updates
  }

  private handleSelectionChange(payload: any): void {
    console.log('📝 Selection changed:', payload);
    // Handle real-time selection updates
  }

  // Real-time Collaboration
  async broadcastCursorPosition(documentId: string, position: CursorPosition): Promise<void> {
    try {
      const channel = this.documentSubscriptions.get(documentId);
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'cursor_move',
          payload: {
            user_id: this.currentUser?.id,
            position,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.warn('Failed to broadcast cursor position:', error);
    }
  }

  async broadcastTextSelection(documentId: string, selection: TextSelection): Promise<void> {
    try {
      const channel = this.documentSubscriptions.get(documentId);
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'selection_change',
          payload: {
            user_id: this.currentUser?.id,
            selection,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.warn('Failed to broadcast text selection:', error);
    }
  }

  async applyOperation(documentId: string, operation: ChangeOperation): Promise<boolean> {
    try {
      console.log(`🔄 Applying operation to document: ${documentId}`);

      const document = this.activeDocuments.get(documentId);
      if (!document) return false;

      // Check edit permissions
      if (!await this.checkDocumentPermission(documentId, 'edit')) {
        console.error('No permission to edit document');
        return false;
      }

      // Apply operation to document content
      const updatedContent = this.applyOperationToContent(document.content, operation);

      // Update document
      const success = await this.updateDocument(documentId, {
        content: updatedContent,
        version: document.version + 1
      });

      if (success) {
        // Broadcast operation to other collaborators
        await this.broadcastOperation(documentId, operation);
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to apply operation:', error);
      return false;
    }
  }

  private applyOperationToContent(content: any, operation: ChangeOperation): any {
    // Implementation would depend on the content format (e.g., Delta for Quill, JSON for custom editor)
    // This is a simplified example
    
    switch (operation.type) {
      case 'insert':
        // Insert content at position
        return this.insertContentAt(content, operation.position, operation.content || '');
      case 'delete':
        // Delete content at position
        return this.deleteContentAt(content, operation.position, operation.length || 0);
      case 'format':
        // Apply formatting
        return this.formatContentAt(content, operation.position, operation.length || 0, operation.attributes || {});
      default:
        return content;
    }
  }

  private insertContentAt(content: any, position: number, text: string): any {
    // Simplified implementation
    if (typeof content === 'string') {
      return content.slice(0, position) + text + content.slice(position);
    }
    return content;
  }

  private deleteContentAt(content: any, position: number, length: number): any {
    // Simplified implementation
    if (typeof content === 'string') {
      return content.slice(0, position) + content.slice(position + length);
    }
    return content;
  }

  private formatContentAt(content: any, position: number, length: number, attributes: Record<string, any>): any {
    // Simplified implementation - would need proper rich text handling
    return content;
  }

  private async broadcastOperation(documentId: string, operation: ChangeOperation): Promise<void> {
    try {
      const channel = this.documentSubscriptions.get(documentId);
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'operation',
          payload: operation
        });
      }
    } catch (error) {
      console.warn('Failed to broadcast operation:', error);
    }
  }

  private broadcastDocumentChange(payload: any): void {
    // Notify UI components about document changes
    window.dispatchEvent(new CustomEvent('document-changed', { detail: payload }));
  }

  private broadcastCommentChange(payload: any): void {
    // Notify UI components about comment changes
    window.dispatchEvent(new CustomEvent('comment-changed', { detail: payload }));
  }

  // Comments and Feedback
  async addComment(commentData: Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'reactions'>): Promise<Comment | null> {
    try {
      console.log(`💬 Adding comment to document: ${commentData.document_id}`);

      const newComment: Omit<Comment, 'id'> = {
        ...commentData,
        user_id: this.currentUser?.id,
        reactions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('document_comments')
        .insert(newComment)
        .select()
        .single();

      if (error) {
        console.error('Failed to add comment:', error);
        return null;
      }

      // Send notifications for mentions
      if (commentData.mentions.length > 0) {
        await this.sendMentionNotifications(commentData.mentions, data);
      }

      console.log('✅ Comment added successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to add comment:', error);
      return null;
    }
  }

  async getComments(documentId: string): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .select('*')
        .eq('document_id', documentId)
        .eq('status', 'open')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Could not fetch comments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get comments:', error);
      return [];
    }
  }

  async resolveComment(commentId: string): Promise<boolean> {
    try {
      console.log(`✅ Resolving comment: ${commentId}`);

      const { error } = await supabase
        .from('document_comments')
        .update({
          status: 'resolved',
          resolved_by: this.currentUser?.id,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) {
        console.error('Failed to resolve comment:', error);
        return false;
      }

      console.log('✅ Comment resolved successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to resolve comment:', error);
      return false;
    }
  }

  async addReaction(commentId: string, emoji: string): Promise<boolean> {
    try {
      console.log(`😀 Adding reaction to comment: ${commentId}`);

      // Get current comment
      const { data: comment, error: fetchError } = await supabase
        .from('document_comments')
        .select('reactions')
        .eq('id', commentId)
        .single();

      if (fetchError || !comment) {
        console.error('Failed to fetch comment:', fetchError);
        return false;
      }

      // Check if user already reacted with this emoji
      const existingReaction = comment.reactions.find(
        (r: Reaction) => r.user_id === this.currentUser?.id && r.emoji === emoji
      );

      let updatedReactions;
      if (existingReaction) {
        // Remove existing reaction
        updatedReactions = comment.reactions.filter(
          (r: Reaction) => !(r.user_id === this.currentUser?.id && r.emoji === emoji)
        );
      } else {
        // Add new reaction
        updatedReactions = [
          ...comment.reactions,
          {
            user_id: this.currentUser?.id,
            emoji,
            created_at: new Date().toISOString()
          }
        ];
      }

      const { error } = await supabase
        .from('document_comments')
        .update({ reactions: updatedReactions })
        .eq('id', commentId);

      if (error) {
        console.error('Failed to add reaction:', error);
        return false;
      }

      console.log('✅ Reaction added successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to add reaction:', error);
      return false;
    }
  }

  // Shared Workspaces
  async createWorkspace(workspaceData: Omit<SharedWorkspace, 'id' | 'created_at' | 'updated_at'>): Promise<SharedWorkspace | null> {
    try {
      console.log(`🏢 Creating workspace: ${workspaceData.name}`);

      const newWorkspace: Omit<SharedWorkspace, 'id'> = {
        ...workspaceData,
        owner_id: this.currentUser?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('shared_workspaces')
        .insert(newWorkspace)
        .select()
        .single();

      if (error) {
        console.error('Failed to create workspace:', error);
        return null;
      }

      console.log('✅ Workspace created successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to create workspace:', error);
      return null;
    }
  }

  async getWorkspaces(teamId: string): Promise<SharedWorkspace[]> {
    try {
      const { data, error } = await supabase
        .from('shared_workspaces')
        .select('*')
        .eq('team_id', teamId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch workspaces:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get workspaces:', error);
      return [];
    }
  }

  // File Sharing
  async uploadFile(file: File, options: {
    teamId: string;
    workspaceId?: string;
    documentId?: string;
    permissions?: Partial<FilePermissions>;
  }): Promise<FileShare | null> {
    try {
      console.log(`📁 Uploading file: ${file.name}`);

      // Upload file to storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('shared-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Failed to upload file:', uploadError);
        return null;
      }

      // Get file URL
      const { data: urlData } = supabase.storage
        .from('shared-files')
        .getPublicUrl(fileName);

      // Create file share record
      const fileShare: Omit<FileShare, 'id'> = {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: urlData.publicUrl,
        uploaded_by: this.currentUser?.id,
        team_id: options.teamId,
        workspace_id: options.workspaceId,
        document_id: options.documentId,
        permissions: {
          public_access: false,
          team_access: true,
          specific_users: [],
          allow_download: true,
          password_protected: false,
          ...options.permissions
        },
        download_count: 0,
        created_at: new Date().toISOString(),
        metadata: {
          original_name: file.name,
          mime_type: file.type,
          checksum: await this.calculateFileChecksum(file),
          virus_scan_status: 'pending',
          tags: []
        }
      };

      const { data, error } = await supabase
        .from('file_shares')
        .insert(fileShare)
        .select()
        .single();

      if (error) {
        console.error('Failed to create file share:', error);
        return null;
      }

      console.log('✅ File uploaded successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to upload file:', error);
      return null;
    }
  }

  async getSharedFiles(teamId: string, workspaceId?: string): Promise<FileShare[]> {
    try {
      let query = supabase
        .from('file_shares')
        .select('*')
        .eq('team_id', teamId);

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch shared files:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get shared files:', error);
      return [];
    }
  }

  // Calendar Integration
  async createCalendarEvent(eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent | null> {
    try {
      console.log(`📅 Creating calendar event: ${eventData.title}`);

      const newEvent: Omit<CalendarEvent, 'id'> = {
        ...eventData,
        organizer_id: this.currentUser?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('calendar_events')
        .insert(newEvent)
        .select()
        .single();

      if (error) {
        console.error('Failed to create calendar event:', error);
        return null;
      }

      // Send invitations to attendees
      await this.sendEventInvitations(data);

      console.log('✅ Calendar event created successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to create calendar event:', error);
      return null;
    }
  }

  async getCalendarEvents(teamId: string, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('team_id', teamId)
        .gte('start_time', startDate)
        .lte('end_time', endDate)
        .order('start_time', { ascending: true });

      if (error) {
        console.warn('Could not fetch calendar events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get calendar events:', error);
      return [];
    }
  }

  // Additional helper methods for collaboration components
  async getWorkspaceDocuments(workspaceId: string): Promise<CollaborativeDocument[]> {
    try {
      const { data, error } = await supabase
        .from('collaborative_documents')
        .select('*')
        .contains('metadata', { workspace_id: workspaceId })
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch workspace documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get workspace documents:', error);
      return [];
    }
  }

  async createWorkspaceFolder(workspaceId: string, folderData: Omit<WorkspaceFolder, 'id'>): Promise<WorkspaceFolder | null> {
    try {
      console.log(`📁 Creating workspace folder: ${folderData.name}`);

      const newFolder: Omit<WorkspaceFolder, 'id'> = {
        ...folderData,
        id: `folder_${Date.now()}`
      };

      // Update workspace with new folder
      const { data: workspace, error: fetchError } = await supabase
        .from('shared_workspaces')
        .select('folders')
        .eq('id', workspaceId)
        .single();

      if (fetchError || !workspace) {
        console.error('Failed to fetch workspace:', fetchError);
        return null;
      }

      const updatedFolders = [...workspace.folders, newFolder];

      const { error } = await supabase
        .from('shared_workspaces')
        .update({ folders: updatedFolders })
        .eq('id', workspaceId);

      if (error) {
        console.error('Failed to create folder:', error);
        return null;
      }

      console.log('✅ Workspace folder created successfully');
      return newFolder as WorkspaceFolder;
    } catch (error) {
      console.error('❌ Failed to create workspace folder:', error);
      return null;
    }
  }

  async shareDocument(documentId: string, userIds: string[], permission: 'view' | 'comment' | 'edit'): Promise<boolean> {
    try {
      console.log(`🔗 Sharing document: ${documentId}`);

      const document = await this.getDocument(documentId);
      if (!document) return false;

      const newUserPermissions = userIds.map(userId => ({
        user_id: userId,
        permission,
        granted_by: this.currentUser?.id,
        granted_at: new Date().toISOString()
      }));

      const updatedPermissions = {
        ...document.permissions,
        specific_users: [...document.permissions.specific_users, ...newUserPermissions]
      };

      const { error } = await supabase
        .from('collaborative_documents')
        .update({ permissions: updatedPermissions })
        .eq('id', documentId);

      if (error) {
        console.error('Failed to share document:', error);
        return false;
      }

      console.log('✅ Document shared successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to share document:', error);
      return false;
    }
  }

  async incrementDownloadCount(fileId: string): Promise<boolean> {
    try {
      const { data: file, error: fetchError } = await supabase
        .from('file_shares')
        .select('download_count')
        .eq('id', fileId)
        .single();

      if (fetchError || !file) {
        console.error('Failed to fetch file:', fetchError);
        return false;
      }

      const { error } = await supabase
        .from('file_shares')
        .update({ download_count: file.download_count + 1 })
        .eq('id', fileId);

      if (error) {
        console.error('Failed to increment download count:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to increment download count:', error);
      return false;
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting file: ${fileId}`);

      const { error } = await supabase
        .from('file_shares')
        .delete()
        .eq('id', fileId);

      if (error) {
        console.error('Failed to delete file:', error);
        return false;
      }

      console.log('✅ File deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      return false;
    }
  }

  async updateEventAttendeeStatus(eventId: string, userId: string, status: 'accepted' | 'declined' | 'tentative'): Promise<boolean> {
    try {
      console.log(`📅 Updating event attendee status: ${eventId}`);

      const { data: event, error: fetchError } = await supabase
        .from('calendar_events')
        .select('attendees')
        .eq('id', eventId)
        .single();

      if (fetchError || !event) {
        console.error('Failed to fetch event:', fetchError);
        return false;
      }

      const updatedAttendees = event.attendees.map((attendee: EventAttendee) =>
        attendee.user_id === userId
          ? { ...attendee, status, response_time: new Date().toISOString() }
          : attendee
      );

      const { error } = await supabase
        .from('calendar_events')
        .update({ attendees: updatedAttendees })
        .eq('id', eventId);

      if (error) {
        console.error('Failed to update attendee status:', error);
        return false;
      }

      console.log('✅ Event attendee status updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to update event attendee status:', error);
      return false;
    }
  }

  async deleteCalendarEvent(eventId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting calendar event: ${eventId}`);

      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Failed to delete event:', error);
        return false;
      }

      console.log('✅ Calendar event deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete calendar event:', error);
      return false;
    }
  }

  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch document versions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get document versions:', error);
      return [];
    }
  }

  private async checkDocumentPermission(documentId: string, requiredPermission: 'view' | 'comment' | 'edit'): Promise<boolean> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) return false;

      // Owner has all permissions
      if (document.owner_id === this.currentUser?.id) return true;

      // Check team access
      if (document.permissions.team_access === requiredPermission || 
          (document.permissions.team_access === 'edit' && ['view', 'comment'].includes(requiredPermission)) ||
          (document.permissions.team_access === 'comment' && requiredPermission === 'view')) {
        return true;
      }

      // Check specific user permissions
      const userPermission = document.permissions.specific_users.find(
        p => p.user_id === this.currentUser?.id
      );

      if (userPermission) {
        return userPermission.permission === requiredPermission ||
               (userPermission.permission === 'edit' && ['view', 'comment'].includes(requiredPermission)) ||
               (userPermission.permission === 'comment' && requiredPermission === 'view');
      }

      return false;
    } catch (error) {
      console.error('Failed to check document permission:', error);
      return false;
    }
  }

  private async updateCollaboratorPresence(documentId: string, status: 'online' | 'offline'): Promise<void> {
    try {
      const channel = this.documentSubscriptions.get(documentId);
      if (channel && this.currentUser) {
        const presence = {
          user_id: this.currentUser.id,
          name: this.currentUser.email || 'Unknown User',
          status,
          last_seen: new Date().toISOString(),
          color: this.collaboratorColors[Math.floor(Math.random() * this.collaboratorColors.length)]
        };

        if (status === 'online') {
          await channel.track(presence);
        } else {
          await channel.untrack();
        }
      }
    } catch (error) {
      console.warn('Failed to update collaborator presence:', error);
    }
  }

  private async sendMentionNotifications(mentions: string[], comment: Comment): Promise<void> {
    try {
      // This would integrate with a notification service
      console.log('📧 Sending mention notifications:', mentions, comment);
      
      // Implementation would send notifications to mentioned users
      // For now, just log the action
    } catch (error) {
      console.warn('Failed to send mention notifications:', error);
    }
  }

  private async sendEventInvitations(event: CalendarEvent): Promise<void> {
    try {
      console.log('📧 Sending event invitations:', event);
      
      // Implementation would send email invitations to attendees
      // For now, just log the action
    } catch (error) {
      console.warn('Failed to send event invitations:', error);
    }
  }

  private async calculateFileChecksum(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('Failed to calculate file checksum:', error);
      return 'unknown';
    }
  }

  // Version History
  async createDocumentVersion(documentId: string, content: any, changesSummary: string): Promise<DocumentVersion | null> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) return null;

      const version: Omit<DocumentVersion, 'id'> = {
        document_id: documentId,
        version_number: document.version,
        content,
        changes_summary: changesSummary,
        created_by: this.currentUser?.id,
        created_at: new Date().toISOString(),
        size_bytes: JSON.stringify(content).length,
        is_major_version: document.version % 10 === 0 // Every 10th version is major
      };

      const { data, error } = await supabase
        .from('document_versions')
        .insert(version)
        .select()
        .single();

      if (error) {
        console.error('Failed to create document version:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to create document version:', error);
      return null;
    }
  }

  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) {
        console.warn('Could not fetch document versions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get document versions:', error);
      return [];
    }
  }

  // Utility Methods
  private async checkDocumentPermission(documentId: string, permission: 'view' | 'comment' | 'edit'): Promise<boolean> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) return false;

      // Owner has all permissions
      if (document.owner_id === this.currentUser?.id) return true;

      // Check specific user permissions
      const userPermission = document.permissions.specific_users.find(
        up => up.user_id === this.currentUser?.id
      );
      
      if (userPermission) {
        const permissionLevels = ['view', 'comment', 'edit', 'admin'];
        const requiredLevel = permissionLevels.indexOf(permission);
        const userLevel = permissionLevels.indexOf(userPermission.permission);
        return userLevel >= requiredLevel;
      }

      // Check team permissions
      const permissionLevels = ['view', 'comment', 'edit'];
      const requiredLevel = permissionLevels.indexOf(permission);
      const teamLevel = permissionLevels.indexOf(document.permissions.team_access);
      
      return teamLevel >= requiredLevel;
    } catch (error) {
      console.error('Failed to check document permission:', error);
      return false;
    }
  }

  private async updateCollaboratorPresence(documentId: string, status: 'online' | 'offline' | 'away'): Promise<void> {
    try {
      const channel = this.documentSubscriptions.get(documentId);
      if (channel) {
        await channel.track({
          user_id: this.currentUser?.id,
          status,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.warn('Failed to update collaborator presence:', error);
    }
  }

  private async sendMentionNotifications(mentions: string[], comment: Comment): Promise<void> {
    // Implementation would depend on notification service
    console.log(`📧 Sending mention notifications to:`, mentions);
  }

  private async sendEventInvitations(event: CalendarEvent): Promise<void> {
    // Implementation would depend on email service
    console.log(`📧 Sending event invitations for:`, event.title);
  }

  private async calculateFileChecksum(file: File): Promise<string> {
    // Simple checksum calculation
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private assignCollaboratorColor(): string {
    const usedColors = Array.from(this.activeDocuments.values())
      .flatMap(doc => doc.collaborators.map(c => c.color));
    
    const availableColors = this.collaboratorColors.filter(color => !usedColors.includes(color));
    
    return availableColors.length > 0 
      ? availableColors[0] 
      : this.collaboratorColors[Math.floor(Math.random() * this.collaboratorColors.length)];
  }

  // Public API Methods
  async getTeamDocuments(teamId: string): Promise<CollaborativeDocument[]> {
    try {
      const { data, error } = await supabase
        .from('collaborative_documents')
        .select('*')
        .eq('team_id', teamId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch team documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get team documents:', error);
      return [];
    }
  }

  async shareDocument(documentId: string, userIds: string[], permission: 'view' | 'comment' | 'edit'): Promise<boolean> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) return false;

      const updatedPermissions = {
        ...document.permissions,
        specific_users: [
          ...document.permissions.specific_users,
          ...userIds.map(userId => ({
            user_id: userId,
            permission,
            granted_by: this.currentUser?.id,
            granted_at: new Date().toISOString()
          }))
        ]
      };

      return await this.updateDocument(documentId, { permissions: updatedPermissions });
    } catch (error) {
      console.error('❌ Failed to share document:', error);
      return false;
    }
  }

  async duplicateDocument(documentId: string, newTitle?: string): Promise<CollaborativeDocument | null> {
    try {
      const originalDocument = await this.getDocument(documentId);
      if (!originalDocument) return null;

      const duplicatedDocument = {
        ...originalDocument,
        title: newTitle || `${originalDocument.title} (Copy)`,
        status: 'draft' as const,
        collaborators: []
      };

      delete (duplicatedDocument as any).id;
      delete (duplicatedDocument as any).created_at;
      delete (duplicatedDocument as any).updated_at;

      return await this.createDocument(duplicatedDocument);
    } catch (error) {
      console.error('❌ Failed to duplicate document:', error);
      return null;
    }
  }

  cleanup(): void {
    // Clean up subscriptions and active documents
    this.documentSubscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.documentSubscriptions.clear();
    this.activeDocuments.clear();
    
    console.log('🧹 Collaboration Service cleaned up');
  }
}

export default CollaborationService;