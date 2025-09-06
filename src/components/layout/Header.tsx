'use client';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const pageLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/profile': 'Profile',
  '/dashboard/users': 'Users',
  '/dashboard/questionnaires': 'Questionnaires',
  '/dashboard/messages': 'Messages',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/settings': 'Settings',
};

interface HeaderProps {
  onMobileMenuClick: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getPageTitle = () => {
    return pageLabels[pathname] || 'Dashboard';
  };

  const getUserInitials = () => {
    if (!user) return 'AD';
    const first = user.first_name?.charAt(0) || '';
    const last = user.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'AD';
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b-2 border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Button 
        variant="outline" 
        size="icon" 
        className="lg:hidden border-2 border-gray-200 hover:border-black hover:bg-black hover:text-white transition-colors"
        onClick={onMobileMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open sidebar</span>
      </Button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-300 lg:hidden" />

      {/* Page title */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-black">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Admin badge */}
        <Badge variant="secondary" className="hidden sm:inline-flex bg-gray-100 text-gray-800 font-medium">
          Admin
        </Badge>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-gray-100 transition-colors">
              <Avatar className="h-10 w-10 border-2 border-gray-300 hover:border-black transition-colors">
                <AvatarFallback className="bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-72 mr-4" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarFallback className="bg-black text-white text-base font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-base font-semibold text-black truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      ID: {user?.user_id}
                    </Badge>
                    <Badge 
                      className={cn(
                        "text-xs px-2 py-0.5",
                        user?.role_id === 1 
                          ? "bg-red-100 text-red-800" 
                          : "bg-blue-100 text-blue-800"
                      )}
                    >
                      {user?.role_id === 1 ? 'Administrator' : 'User'}
                    </Badge>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <div className="p-2">
              <DropdownMenuItem className="cursor-pointer rounded-md p-3 hover:bg-gray-100 transition-colors" asChild>
                <Link href="/dashboard/profile" className="flex items-center">
                  <User className="mr-3 h-4 w-4 text-gray-600" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-black">My Profile</span>
                    <p className="text-xs text-gray-500">View and manage your account</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer rounded-md p-3 hover:bg-gray-100 transition-colors">
                <Settings className="mr-3 h-4 w-4 text-gray-600" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-black">Settings</span>
                  <p className="text-xs text-gray-500">System preferences</p>
                </div>
              </DropdownMenuItem>
            </div>
            
            <DropdownMenuSeparator />
            
            <div className="p-2">
              <DropdownMenuItem 
                className="cursor-pointer rounded-md p-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors focus:bg-red-50 focus:text-red-700"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-4 w-4" />
                <div className="flex-1">
                  <span className="text-sm font-medium">Sign Out</span>
                  <p className="text-xs text-red-500">Logout from admin portal</p>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}