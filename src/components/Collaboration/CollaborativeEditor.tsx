/**
 * Collaborative Editor Component
 * Real-time collaborative editor with live cursors, presence awareness,
 * conflict resolution, and rich text editing capabilities
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  MessageCircle,
  Users,
  Eye,
  Save,
  History,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { realTimeCollaborationService } from '@/services/collaboration/RealTimeCollaborationService';
import type { 
  CollaborationSession, 
  SessionParticipant, 
  CollaborativeEdit, 
  Comment,
  EditOperation,
  PresenceUpdate
} from '@/services/collaboration/RealTimeCollaborationService';

interface CollaborativeEditorProps {
  documentId: string;
  documentType: 'campaign' | 'funnel' | 'workflow' | 'report' | 'template' | 'custom';
  title: string;
  initialContent?: string;
  currentUserId: string;
  onSave?: (content: string) => void;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
}

interface CursorData {
  userId: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  selection?: { start: number; end: number };
}

interface CommentThread {
  id: string;
  comments: Comment[];
  position: { x: number; y: number };
  isOpen: boolean;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
  documentType,
  title,
  initialContent = '',
  currentUserId,
  onSave,
  onContentChange,
  readOnly = false
}) => {
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [content, setContent] = useState(initialContent);
  const [cursors, setCursors] = useState<CursorData[]>([]);
  const [comments, setComments] = useState<CommentThread[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [selectedText, setSelectedText] = useState<{ start: number; end: number; text: string } | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cursorUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const userColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  useEffect(() => {
    initializeCollaboration();
    return () => {
      if (session) {
        realTimeCollaborationService.leaveSession(session.id, currentUserId);
      }
    };
  }, [documentId]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = content;
    }
  }, [content]);

  const initializeCollaboration = async () => {
    try {
      console.log('🚀 Initializing collaborative editor');
      
      // Create or join session
      const newSession = await realTimeCollaborationService.createSession({
        documentId,
        documentType,
        title,
        owner: currentUserId
      });

      // Join session
      const participant = await realTimeCollaborationService.joinSession(newSession.id, {
        userId: currentUserId,
        name: 'Current User', // Would get from user context
        email: 'user@example.com', // Would get from user context
        role: 'editor'
      });

      setSession(newSession);
      setIsConnected(true);

      // Subscribe to session events
      const unsubscribe = realTimeCollaborationService.subscribeToSession(
        newSession.id,
        handleCollaborationEvent
      );

      // Load session state
      const sessionState = await realTimeCollaborationService.getSessionState(newSession.id);
      setParticipants(sessionState.session.participants);
      
      console.log('✅ Collaborative editor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize collaboration:', error);
    }
  };

  const handleCollaborationEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'user_joined':
        setParticipants(prev => [...prev, event.data.participant]);
        break;
      case 'user_left':
        setParticipants(prev => prev.filter(p => p.userId !== event.userId));
        break;
      case 'edit_applied':
        applyRemoteEdit(event.data.edit);
        break;
      case 'comment_added':
        addCommentToThread(event.data.comment);
        break;
      case 'presence_updated':
        updateParticipantPresence(event.data);
        break;
    }
  }, []);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);
    
    // Debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(newContent);
    }, 2000);
    
    // Send edit operation
    if (session && !readOnly) {
      const operation: EditOperation = {
        type: 'replace',
        target: 'content',
        content: newContent,
        previousValue: content
      };
      
      realTimeCollaborationService.applyEdit(session.id, currentUserId, operation);
    }
  }, [session, currentUserId, content, readOnly]);

  const handleSave = async (contentToSave: string = content) => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      await onSave?.(contentToSave);
      console.log('✅ Content saved');
    } catch (error) {
      console.error('❌ Failed to save content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString();
      
      if (selectedText.length > 0) {
        setSelectedText({
          start: range.startOffset,
          end: range.endOffset,
          text: selectedText
        });
        
        // Update cursor position for other users
        updateCursorPosition();
      } else {
        setSelectedText(null);
      }
    }
  }, []);

  const updateCursorPosition = useCallback(() => {
    if (!session || !contentRef.current) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = contentRef.current.getBoundingClientRect();
      
      const cursorPosition = {
        x: rect.left - editorRect.left,
        y: rect.top - editorRect.top
      };
      
      // Debounce cursor updates
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current);
      }
      
      cursorUpdateTimeoutRef.current = setTimeout(() => {
        realTimeCollaborationService.updatePresence(session.id, currentUserId, {
          cursor: {
            x: cursorPosition.x,
            y: cursorPosition.y,
            timestamp: new Date()
          },
          selection: selectedText ? {
            start: selectedText.start,
            end: selectedText.end,
            elementId: 'content',
            timestamp: new Date()
          } : undefined
        });
      }, 100);
    }
  }, [session, currentUserId, selectedText]);

  const addComment = async () => {
    if (!session || !selectedText || !newComment.trim()) return;
    
    try {
      const comment = await realTimeCollaborationService.addComment(session.id, currentUserId, {
        content: newComment,
        target: 'content',
        position: { x: 0, y: 0 } // Would calculate actual position
      });
      
      setNewComment('');
      setSelectedText(null);
      
      console.log('✅ Comment added');
    } catch (error) {
      console.error('❌ Failed to add comment:', error);
    }
  };

  const applyRemoteEdit = (edit: CollaborativeEdit) => {
    if (edit.userId === currentUserId) return; // Don't apply own edits
    
    // Apply the edit to the content
    if (edit.operation.type === 'replace' && edit.operation.target === 'content') {
      setContent(edit.operation.content);
    }
  };

  const addCommentToThread = (comment: Comment) => {
    setComments(prev => {
      const existingThread = prev.find(t => t.id === comment.target);
      if (existingThread) {
        existingThread.comments.push(comment);
        return [...prev];
      } else {
        return [...prev, {
          id: comment.target,
          comments: [comment],
          position: comment.position || { x: 0, y: 0 },
          isOpen: true
        }];
      }
    });
  };

  const updateParticipantPresence = (presence: PresenceUpdate) => {
    if (presence.userId === currentUserId) return;
    
    const participant = participants.find(p => p.userId === presence.userId);
    if (participant && presence.cursor) {
      const userColorIndex = participants.findIndex(p => p.userId === presence.userId) % userColors.length;
      const cursorData: CursorData = {
        userId: presence.userId,
        name: participant.name,
        color: userColors[userColorIndex],
        position: presence.cursor,
        selection: presence.selection ? {
          start: presence.selection.start,
          end: presence.selection.end
        } : undefined
      };
      
      setCursors(prev => {
        const filtered = prev.filter(c => c.userId !== presence.userId);
        return [...filtered, cursorData];
      });
    }
  };

  const formatText = (command: string, value?: string) => {
    if (readOnly) return;
    
    document.execCommand(command, false, value);
    const newContent = contentRef.current?.innerHTML || '';
    handleContentChange(newContent);
  };

  const getParticipantColor = (userId: string) => {
    const index = participants.findIndex(p => p.userId === userId) % userColors.length;
    return userColors[index];
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                Disconnected
              </Badge>
            )}
            {isSaving && (
              <Badge variant="outline">
                Saving...
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Participants */}
          <TooltipProvider>
            <Popover open={showParticipants} onOpenChange={setShowParticipants}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{participants.length}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <h4 className="font-medium">Participants</h4>
                  {participants.map((participant) => (
                    <div key={participant.userId} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getParticipantColor(participant.userId) }}
                      />
                      <span className="text-sm">{participant.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {participant.role}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${
                        participant.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </TooltipProvider>

          {/* Comments Toggle */}
          <Button
            variant={showComments ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>

          {/* Save Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave()}
            disabled={isSaving || readOnly}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center space-x-1 px-4 py-2 border-b border-gray-200 bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('underline')}
          >
            <Underline className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyLeft')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyCenter')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyRight')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('insertUnorderedList')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('insertOrderedList')}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('createLink', prompt('Enter URL:') || '')}
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('insertImage', prompt('Enter image URL:') || '')}
          >
            <Image className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          {/* Live Cursors */}
          {cursors.map((cursor) => (
            <div
              key={cursor.userId}
              className="absolute pointer-events-none z-10"
              style={{
                left: cursor.position.x,
                top: cursor.position.y,
                transform: 'translate(-1px, -100%)'
              }}
            >
              <div
                className="w-0.5 h-5"
                style={{ backgroundColor: cursor.color }}
              />
              <div
                className="px-2 py-1 text-xs text-white rounded-md whitespace-nowrap"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.name}
              </div>
            </div>
          ))}

          {/* Content Editor */}
          <div
            ref={contentRef}
            className="w-full h-full p-6 outline-none overflow-y-auto"
            contentEditable={!readOnly}
            onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            style={{ minHeight: '100%' }}
            suppressContentEditableWarning={true}
          />

          {/* Selection Comment Button */}
          {selectedText && !readOnly && (
            <div className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-20">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                />
                <Button size="sm" onClick={addComment}>
                  <MessageCircle className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Comments Sidebar */}
        {showComments && (
          <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-4">Comments</h3>
              
              {comments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No comments yet</p>
                  <p className="text-xs">Select text to add a comment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((thread) => (
                    <div key={thread.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      {thread.comments.map((comment) => (
                        <div key={comment.id} className="mb-3 last:mb-0">
                          <div className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                              {comment.userId.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium">User</span>
                                <span className="text-xs text-gray-500">
                                  {comment.createdAt.toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborativeEditor;