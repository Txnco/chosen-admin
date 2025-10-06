// src/app/dashboard/messages/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  AlertCircle,
  Paperclip,
  Search,
  X,
  Plus,
  UserPlus
} from 'lucide-react';
import { chatApi, ChatThreadData, ChatMessageData, AvailableClientData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThreadData[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null); // Changed to store ID
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState('');
  
  // New conversation modal state
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [availableClients, setAvailableClients] = useState<AvailableClientData[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [createThreadError, setCreateThreadError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Derived value: get the actual selected thread object
  const selectedThread = threads.find(t => t.id === selectedThreadId) || null;

  useEffect(() => {
    loadThreads();
    
    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      loadThreads();
      if (selectedThreadId) {
        loadMessages(selectedThreadId, true);
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedThreadId]); // Add selectedThreadId to dependencies

  useEffect(() => {
    if (selectedThreadId) {
      loadMessages(selectedThreadId);
      markThreadAsRead(selectedThreadId);
    }
  }, [selectedThreadId]); // Use selectedThreadId instead of selectedThread?.id

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isNewConversationOpen) {
      loadAvailableClients();
    }
  }, [isNewConversationOpen, clientSearchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadThreads = async () => {
    try {
      if (!isLoadingThreads) {
        // Silent refresh - preserve selection
        const data = await chatApi.getThreads();
        setThreads(data);
      } else {
        setError('');
        const data = await chatApi.getThreads();
        setThreads(data);
        
        // Auto-select first thread if available and nothing is selected
        if (data.length > 0 && !selectedThreadId) {
          setSelectedThreadId(data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load threads:', err);
      if (isLoadingThreads) {
        setError('Failed to load conversations');
      }
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const loadMessages = async (threadId: number, silent: boolean = false) => {
    try {
      if (!silent) {
        setIsLoadingMessages(true);
      }
      const data = await chatApi.getMessages(threadId, 1, 100);
      setMessages(data.messages);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      if (!silent) {
        setError('Failed to load messages');
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const markThreadAsRead = async (threadId: number) => {
    try {
      const unreadMessages = messages
        .filter(msg => !msg.read_at && msg.user_id !== user?.user_id)
        .map(msg => msg.id);
      
      if (unreadMessages.length > 0) {
        await chatApi.markMessagesRead(threadId, unreadMessages);
        loadThreads();
      }
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedThreadId || !messageInput.trim()) return;

    try {
      setIsSendingMessage(true);
      setError('');
      
      const newMessage = await chatApi.sendMessage(selectedThreadId, messageInput.trim());
      
      setMessages(prev => [...prev, newMessage]);
      const messageTrimmed = messageInput.trim();
      setMessageInput('');
      
      setThreads(prev => prev.map(thread => 
        thread.id === selectedThreadId 
          ? { 
              ...thread, 
              last_message: messageTrimmed,
              last_message_text: messageTrimmed,
              last_message_at: new Date().toISOString() 
            }
          : thread
      ));
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedThreadId) return;

    try {
      setIsSendingMessage(true);
      setError('');
      
      // Upload file first
      const uploadResult = await chatApi.uploadFile(file);
      
      // Create message body based on file type
      let messageBody = `📎 ${uploadResult.file_name}`;
      
      // Send message with file URL
      const newMessage = await chatApi.sendMessage(
        selectedThreadId, 
        messageBody,
        uploadResult.file_url  // Pass the file URL
      );
      
      setMessages(prev => [...prev, newMessage]);
      
      // Update thread with last message
      setThreads(prev => prev.map(thread => 
        thread.id === selectedThreadId 
          ? { 
              ...thread, 
              last_message: messageBody,
              last_message_text: messageBody,
              last_message_at: new Date().toISOString() 
            }
          : thread
      ));
    } catch (err: any) {
      console.error('Failed to upload file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsSendingMessage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const loadAvailableClients = async () => {
    try {
      setIsLoadingClients(true);
      setCreateThreadError('');
      const data = await chatApi.getAvailableClients(clientSearchQuery || undefined);
      setAvailableClients(data);
    } catch (err: any) {
      console.error('Failed to load available clients:', err);
      setCreateThreadError('Failed to load available clients');
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleStartConversation = async (clientId: number) => {
    try {
      setIsCreatingThread(true);
      setCreateThreadError('');
      
      const newThread = await chatApi.createThread(clientId);
      
      // Add new thread to list
      setThreads(prev => [newThread, ...prev]);
      
      // Select the new thread by ID
      setSelectedThreadId(newThread.id);
      
      // Close modal
      setIsNewConversationOpen(false);
      setClientSearchQuery('');
    } catch (err: any) {
      console.error('Failed to create thread:', err);
      if (err.response?.status === 400) {
        setCreateThreadError('Conversation already exists with this client');
      } else {
        setCreateThreadError('Failed to start conversation');
      }
    } finally {
      setIsCreatingThread(false);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatMessageTime = (dateString: string) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const formatThreadTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd');
    }
  };

  const isImageFile = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  const getFileIcon = (contentType?: string) => {
    if (!contentType) return '📄';
    
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.startsWith('audio/')) return '🎵';
    if (contentType.includes('pdf')) return '📕';
    if (contentType.includes('word') || contentType.includes('document')) return '📝';
    
    return '📄';
  };

  const filteredThreads = threads.filter(thread => {
    const clientName = user?.role_id === 1 ? thread.client_name : thread.trainer_name;
    return clientName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Messages</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          <div className="flex h-[calc(100vh-4rem)]">
            {/* Left Sidebar - Threads List */}
            <div className="w-80 border-r flex flex-col bg-gray-50">
              {/* Search Header with New Conversation Button */}
              <div className="p-4 bg-white border-b space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {user?.role_id === 1 && (
                    <Button
                      onClick={() => setIsNewConversationOpen(true)}
                      className="bg-black text-white hover:bg-gray-900 h-10 w-10 p-0"
                      title="Start new conversation"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Threads List */}
              <div className="flex-1 overflow-y-auto">
                {isLoadingThreads ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500 p-4">
                    <MessageSquare className="h-8 w-8 mb-2 text-gray-300" />
                    <p className="text-sm text-center">
                      {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </p>
                    {user?.role_id === 1 && !searchQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsNewConversationOpen(true)}
                        className="mt-3"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Start conversation
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredThreads.map((thread) => {
                    const isTrainer = user?.role_id === 1;
                    const otherPersonName = isTrainer ? thread.client_name : thread.trainer_name;
                    const isSelected = selectedThreadId === thread.id;
                    
                    // Get last message - check both fields for compatibility
                    const lastMessage = thread.last_message_text || thread.last_message || 'No messages yet';

                    return (
                      <button
                        key={thread.id}
                        onClick={() => setSelectedThreadId(thread.id)}
                        className={cn(
                          "w-full p-4 flex items-start gap-3 hover:bg-white transition-colors border-b text-left",
                          isSelected && "bg-white border-l-4 border-l-black"
                        )}
                      >
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarFallback className="bg-black text-white font-semibold text-sm">
                            {getUserInitials(otherPersonName || '')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-sm truncate pr-2">
                              {otherPersonName || 'User'}
                            </h3>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatThreadTime(thread.last_message_at)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-gray-600 truncate flex-1">
                              {lastMessage}
                            </p>
                            {thread.unread_count > 0 && (
                              <Badge className="bg-black text-white rounded-full h-5 min-w-5 px-1.5 text-xs flex-shrink-0">
                                {thread.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Side - Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
              {error && (
                <Alert variant="destructive" className="m-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {selectedThread ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center gap-3 bg-white">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-black text-white font-semibold">
                        {getUserInitials(
                          (user?.role_id === 1 ? selectedThread.client_name : selectedThread.trainer_name) || ''
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">
                        {user?.role_id === 1 ? selectedThread.client_name : selectedThread.trainer_name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {user?.role_id === 1 ? 'Client' : 'Trainer'}
                      </p>
                    </div>
                  </div>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
                        <p className="text-base font-medium mb-1">No messages yet</p>
                        <p className="text-sm text-gray-400">Start the conversation!</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message, index) => {
                          const isOwnMessage = message.user_id === user?.user_id;
                          const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;
                          const hasAttachment = !!message.image_url;
                          
                          return (
                            <div
                              key={message.id}
                              className={cn(
                                "flex items-end gap-2",
                                isOwnMessage ? "justify-end" : "justify-start"
                              )}
                            >
                              {!isOwnMessage && (
                                <div className="w-8 h-8 flex-shrink-0">
                                  {showAvatar && (
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-gray-300 text-gray-700 text-xs font-semibold">
                                        {getUserInitials(
                                          (user?.role_id === 1 ? selectedThread.client_name : selectedThread.trainer_name) || ''
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              )}
                              
                              <div
                                className={cn(
                                  "max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm",
                                  isOwnMessage
                                    ? "bg-black text-white rounded-br-md"
                                    : "bg-white text-gray-900 rounded-bl-md border border-gray-200"
                                )}
                              >
                                {hasAttachment ? (
                                  <div className="space-y-2">
                                    {isImageFile(message.image_url!) ? (
                                      // Image preview
                                      <a 
                                        href={chatApi.getFileUrl(message.image_url!)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block"
                                      >
                                        <img
                                          src={chatApi.getFileUrl(message.image_url!)}
                                          alt="Attachment"
                                          className="rounded-lg max-w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          onError={(e) => {
                                            // Fallback if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                          }}
                                        />
                                      </a>
                                    ) : (
                                      // File attachment (non-image)
                                      <a 
                                        href={chatApi.getFileUrl(message.image_url!)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={cn(
                                          "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                          isOwnMessage 
                                            ? "bg-white/10 hover:bg-white/20" 
                                            : "bg-gray-50 hover:bg-gray-100"
                                        )}
                                      >
                                        <div className={cn(
                                          "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
                                          isOwnMessage ? "bg-white/20" : "bg-gray-200"
                                        )}>
                                          <Paperclip className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">
                                            {message.body.replace('📎 ', '')}
                                          </p>
                                          <p className={cn(
                                            "text-xs",
                                            isOwnMessage ? "text-gray-300" : "text-gray-500"
                                          )}>
                                            Click to view
                                          </p>
                                        </div>
                                      </a>
                                    )}
                                    
                                    {/* Show body text if it's not just the attachment indicator */}
                                    {message.body && !message.body.startsWith('📎') && (
                                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                        {message.body}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  // Regular text message
                                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                    {message.body}
                                  </p>
                                )}
                                
                                <p
                                  className={cn(
                                    "text-xs mt-1.5",
                                    isOwnMessage ? "text-gray-300" : "text-gray-500"
                                  )}
                                >
                                  {formatMessageTime(message.created_at)}
                                </p>
                              </div>
                              
                              {isOwnMessage && <div className="w-8 h-8 flex-shrink-0" />}
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 bg-white border-t">
                    <div className="flex items-end gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSendingMessage}
                        className="flex-shrink-0 h-10 w-10 hover:bg-gray-100"
                        title="Attach file"
                      >
                        <Paperclip className="h-5 w-5 text-gray-600" />
                      </Button>

                      <div className="flex-1">
                        <Input
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          disabled={isSendingMessage}
                          className="h-10 resize-none"
                        />
                      </div>

                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || isSendingMessage}
                        className="bg-black text-white hover:bg-gray-900 flex-shrink-0 h-10 px-6"
                      >
                        {isSendingMessage ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-50">
                  <MessageSquare className="h-20 w-20 mb-6 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-700">Select a conversation</h3>
                  <p className="text-sm text-gray-500">Choose a conversation from the list to start messaging</p>
                </div>
              )}
            </div>
          </div>

          {/* New Conversation Modal */}
          <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Start New Conversation
                </DialogTitle>
                <DialogDescription>
                  Search for a client to start a new conversation with
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {createThreadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{createThreadError}</AlertDescription>
                  </Alert>
                )}

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search clients by name or email..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {clientSearchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setClientSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Available Clients List */}
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  {isLoadingClients ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : availableClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <UserPlus className="h-12 w-12 mb-3 text-gray-300" />
                      <p className="text-sm font-medium">No clients found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {clientSearchQuery 
                          ? 'Try a different search term' 
                          : 'All clients already have conversations'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {availableClients.map((client) => (
                        <button
                          key={client.user_id}
                          onClick={() => handleStartConversation(client.user_id)}
                          disabled={isCreatingThread}
                          className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-black text-white font-semibold text-sm">
                              {getUserInitials(`${client.first_name} ${client.last_name}`)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {client.first_name} {client.last_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {client.email}
                            </p>
                          </div>

                          {isCreatingThread ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400 flex-shrink-0" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}