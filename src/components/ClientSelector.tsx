'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, ChevronsUpDown, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { userApi, UserData } from '@/lib/api';

export function ClientSelector() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<UserData[]>([]);
  const [selectedClient, setSelectedClient] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const users = await userApi.getAll();
      // Filter only clients (role_id = 2)
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
    // Navigate to water view by default
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
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search clients..." />
          <CommandList>
            <CommandEmpty>No client found.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => {
                const searchValue = `${client.first_name} ${client.last_name} ${client.email}`.toLowerCase();
                
                return (
                  <CommandItem
                    key={client.user_id}
                    value={searchValue}
                    onSelect={() => handleSelectClient(client)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClient?.user_id === client.user_id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Avatar className="h-6 w-6 mr-2">
                      {getProfileImageUrl(client.profile_picture) ? (
                        <AvatarImage src={getProfileImageUrl(client.profile_picture) || ''} />
                      ) : null}
                      <AvatarFallback className="text-xs bg-black text-white">
                        {getUserInitials(client)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {client.first_name} {client.last_name}
                      </span>
                      <span className="text-xs text-gray-500">{client.email}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}