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
  MessageSquare, 
  Send, 
  Loader2, 
  AlertCircle,
  Paperclip,
  Search,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { chatApi, ChatThreadData, ChatMessageData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThreadData[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThreadData | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadThreads();
    
    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      loadThreads();
      if (selectedThread) {
        loadMessages(selectedThread.id, true);
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id);
      markThreadAsRead(selectedThread.id);
    }
  }, [selectedThread?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadThreads = async () => {
    try {
      if (!isLoadingThreads) {
        // Silent refresh
        const data = await chatApi.getThreads();
        setThreads(data);
      } else {
        setError('');
        const data = await chatApi.getThreads();
        setThreads(data);
        
        // Auto-select first thread if available
        if (data.length > 0 && !selectedThread) {
          setSelectedThread(data[0]);
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
    if (!selectedThread || !messageInput.trim()) return;

    try {
      setIsSendingMessage(true);
      const newMessage = await chatApi.sendMessage(selectedThread.id, messageInput.trim());
      
      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
      
      setThreads(prev => prev.map(thread => 
        thread.id === selectedThread.id 
          ? { 
              ...thread, 
              last_message: messageInput.trim(), 
              last_message_at: new Date().toISOString() 
            }
          : thread
      ));
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
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
    if (!file || !selectedThread) return;

    try {
      setIsSendingMessage(true);
      const uploadResult = await chatApi.uploadFile(file);
      
      const newMessage = await chatApi.sendMessage(
        selectedThread.id, 
        `📎 File: ${uploadResult.file_name}`
      );
      
      setMessages(prev => [...prev, newMessage]);
    } catch (err: any) {
      console.error('Failed to upload file:', err);
      setError('Failed to upload file');
    } finally {
      setIsSendingMessage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
              {/* Search Header */}
              <div className="p-4 bg-white border-b">
                <div className="relative">
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
                  </div>
                ) : (
                  filteredThreads.map((thread) => {
                    const isTrainer = user?.role_id === 1;
                    const otherPersonName = isTrainer ? thread.client_name : thread.trainer_name;
                    const isSelected = selectedThread?.id === thread.id;

                    return (
                      <button
                        key={thread.id}
                        onClick={() => setSelectedThread(thread)}
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
                              {thread.last_message_text || 'No messages yet'}
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
                                {message.body.startsWith('📎') ? (
                                  <div className="flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    <p className="text-sm font-medium">{message.body.replace('📎 File: ', '')}</p>
                                  </div>
                                ) : (
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
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}