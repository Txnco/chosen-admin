'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Settings,
  BarChart3,
  User
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    name: 'Questionnaires',
    href: '/dashboard/questionnaires',
    icon: FileText,
  },
  {
    name: 'Messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r-2 border-gray-200 bg-white px-5 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <h1 
            className="text-2xl font-bold tracking-tight text-black"
            style={{ fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            CHOSEN
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul className="flex flex-1 flex-col gap-y-1">
            <li>
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                          isActive
                            ? 'bg-black text-white shadow-md'
                            : 'text-gray-700 hover:text-black hover:bg-gray-100'
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-0.5 h-6 bg-white rounded-full" />
                        )}
                        <item.icon
                          className={cn(
                            'h-5 w-5 shrink-0 transition-colors',
                            isActive ? 'text-white' : 'text-gray-500 group-hover:text-black'
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs text-gray-400 text-center font-medium">
            CHOSEN Admin
          </div>
        </div>
      </div>
    </div>
  );
}