'use client';
//src\components\ClientSelector.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { userApi, UserData } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClientSelectorProps {
  currentUserId?: number | null;
}

export function ClientSelector({ currentUserId }: ClientSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<UserData[]>([]);
  const [selectedClient, setSelectedClient] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (currentUserId && clients.length > 0) {
      const current = clients.find(c => c.user_id === currentUserId);
      if (current) {
        setSelectedClient(current);
      }
    }
  }, [currentUserId, clients]);

  const loadClients = async () => {
    try {
      const users = await userApi.getAll();
      const clientUsers = users.filter(u => u.role_id === 2);
      setClients(clientUsers);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClient = (client: UserData) => {
    setSelectedClient(client);
    setOpen(false);
    setSearchQuery('');
    router.push(`/dashboard/viewuser/${client.user_id}/water`);
  };

  const getUserInitials = (user: UserData) => {
    const first = user.first_name?.charAt(0) || '';
    const last = user.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getProfileImageUrl = (profilePicture?: string) => {
    if (!profilePicture) return null;
    return process.env.NEXT_PUBLIC_UPLOADS_PATH +`/uploads/profile/${profilePicture}`;
  };

  const filteredClients = clients.filter(client => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
    const email = client.email.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[340px] h-12 justify-between px-3"
        >
          {selectedClient ? (
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Avatar className="h-8 w-8 shrink-0 border-2 border-gray-200">
                {getProfileImageUrl(selectedClient.profile_picture) ? (
                  <AvatarImage src={getProfileImageUrl(selectedClient.profile_picture) || ''} />
                ) : null}
                <AvatarFallback className="text-xs bg-black text-white font-semibold">
                  {getUserInitials(selectedClient)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-sm font-semibold truncate w-full text-left">
                  {selectedClient.first_name} {selectedClient.last_name}
                </span>
                <span className="text-xs text-gray-500 truncate w-full text-left">
                  {selectedClient.email}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-sm">Select a client...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <div className="p-2.5 border-b">
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <ScrollArea className="h-[320px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              {searchQuery ? 'No client found matching your search.' : 'No clients available.'}
            </div>
          ) : (
            <div className="p-1.5">
              {filteredClients.map((client) => (
                <div
                  key={client.user_id}
                  onClick={() => handleSelectClient(client)}
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer transition-colors",
                    selectedClient?.user_id === client.user_id
                      ? "bg-gray-100"
                      : "hover:bg-gray-50"
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 text-black",
                      selectedClient?.user_id === client.user_id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Avatar className="h-8 w-8 shrink-0 border-2 border-gray-200">
                    {getProfileImageUrl(client.profile_picture) ? (
                      <AvatarImage src={getProfileImageUrl(client.profile_picture) || ''} />
                    ) : null}
                    <AvatarFallback className="text-xs bg-black text-white font-semibold">
                      {getUserInitials(client)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {client.first_name} {client.last_name}
                    </span>
                    <span className="text-xs text-gray-500 truncate">{client.email}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}