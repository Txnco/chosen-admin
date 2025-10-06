'use client';

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

export function ClientSelector() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<UserData[]>([]);
  const [selectedClient, setSelectedClient] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

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
    return `https://admin.chosen-international.com/public/uploads/profile/${profilePicture}`;
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
          className="w-[300px] justify-between"
        >
          {selectedClient ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {getProfileImageUrl(selectedClient.profile_picture) ? (
                  <AvatarImage src={getProfileImageUrl(selectedClient.profile_picture) || ''} />
                ) : null}
                <AvatarFallback className="text-xs bg-black text-white">
                  {getUserInitials(selectedClient)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {selectedClient.first_name} {selectedClient.last_name}
              </span>
            </div>
          ) : (
            "Select a client..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              {searchQuery ? 'No client found matching your search.' : 'No clients available.'}
            </div>
          ) : (
            <div className="p-1">
              {filteredClients.map((client) => (
                <div
                  key={client.user_id}
                  onClick={() => handleSelectClient(client)}
                  className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      selectedClient?.user_id === client.user_id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Avatar className="h-6 w-6 shrink-0">
                    {getProfileImageUrl(client.profile_picture) ? (
                      <AvatarImage src={getProfileImageUrl(client.profile_picture) || ''} />
                    ) : null}
                    <AvatarFallback className="text-xs bg-black text-white">
                      {getUserInitials(client)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate">
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