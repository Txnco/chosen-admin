"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Settings,
  BarChart3,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()

  const getUserInitials = () => {
    if (!user || isLoading) return ''
    const first = user.first_name?.charAt(0) || ''
    const last = user.last_name?.charAt(0) || ''
    return (first + last).toUpperCase()
  }

  const getUserName = () => {
    if (!user || isLoading) return ''
    return `${user.first_name || ''} ${user.last_name || ''}`.trim()
  }

  const getUserEmail = () => {
    if (!user || isLoading) return ''
    return user.email || ''
  }

  const getProfileImageUrl = () => {
    if (!user || isLoading) return null;
    return `https://admin.chosen-international.com/public/uploads/profile/${user.profile_picture}`;
  };

  const getUserRole = () => {
    if (!user || isLoading) return ''
    return user.role_id === 1 ? 'Administrator' : 'User'
  }

  // Show loading state or empty data until user is loaded
  const data = {
    user: {
      name: getUserName(),
      email: getUserEmail(),
      profile_picture: getProfileImageUrl(),
      avatar: getUserInitials(),
      role: getUserRole()
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        isActive: pathname === "/dashboard",
      },
      {
        title: "Users", 
        url: "/dashboard/users",
        icon: Users,
        isActive: pathname.startsWith("/dashboard/users"),
      },
      // {
      //   title: "Questionnaires",
      //   url: "/dashboard/questionnaires", 
      //   icon: FileText,
      //   isActive: pathname.startsWith("/dashboard/questionnaires"),
      // },
      // {
      //   title: "Messages",
      //   url: "/dashboard/messages",
      //   icon: MessageSquare,
      //   isActive: pathname.startsWith("/dashboard/messages"),
      // },
      // {
      //   title: "Analytics",
      //   url: "/dashboard/analytics",
      //   icon: BarChart3,
      //   isActive: pathname.startsWith("/dashboard/analytics"),
      // },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
        isActive: pathname.startsWith("/dashboard/settings"),
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className=" text-white flex aspect-square size-8 items-center justify-center rounded-lg">
                   <img
                    src="https://admin.chosen-international.com/public/assets/logo/ChosenLogo.svg"
                    alt="Chosen Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span 
                    className="truncate font-bold text-lg"
                    style={{ fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, sans-serif' }}>CHOSEN
                  </span>
                  <span className="truncate text-xs text-gray-600">Admin Portal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {!isLoading && user && (
          <NavUser user={data.user} />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}