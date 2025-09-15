'use client';

import { useEffect, useState } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Activity,
  AlertCircle,
  Eye,
  ArrowUpRight,
} from 'lucide-react';
import { userApi, UserData } from '@/lib/api';
import { format, subDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  adminCount: number;
  clientCount: number;
  recentUsers: UserData[];
  userGrowthPercentage: number;
  weeklyGrowthPercentage: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all users
      const users: UserData[] = await userApi.getAll();
      
      // Calculate date ranges
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const weekAgo = subDays(today, 7);
      const twoWeeksAgo = subDays(today, 14);
      
      // Process user data
      const totalUsers = users.length;
      const adminCount = users.filter(user => user.role_id === 1).length;
      const clientCount = users.filter(user => user.role_id === 2).length;
      
      // Users created today
      const newUsersToday = users.filter(user => {
        const createdDate = new Date(user.created_at);
        return isAfter(createdDate, todayStart) && isBefore(createdDate, todayEnd);
      }).length;
      
      // Users created this week
      const newUsersThisWeek = users.filter(user => {
        const createdDate = new Date(user.created_at);
        return isAfter(createdDate, weekAgo);
      }).length;
      
      // Users created last week (for comparison)
      const newUsersLastWeek = users.filter(user => {
        const createdDate = new Date(user.created_at);
        return isAfter(createdDate, twoWeeksAgo) && isBefore(createdDate, weekAgo);
      }).length;
      
      // Calculate growth percentages
      const userGrowthPercentage = newUsersLastWeek > 0 
        ? ((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100 
        : newUsersThisWeek > 0 ? 100 : 0;
        
      const weeklyGrowthPercentage = totalUsers > newUsersThisWeek 
        ? (newUsersThisWeek / (totalUsers - newUsersThisWeek)) * 100 
        : 0;
      
      // Get 5 most recent users
      const recentUsers = users
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      setStats({
        totalUsers,
        newUsersToday,
        newUsersThisWeek,
        adminCount,
        clientCount,
        recentUsers,
        userGrowthPercentage,
        weeklyGrowthPercentage
      });
      
    } catch (err: unknown) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInitials = (user: UserData) => {
    const first = user.first_name?.charAt(0) || '';
    const last = user.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1: return 'Admin';
      case 2: return 'Client';
      default: return 'User';
    }
  };

  const getRoleBadgeVariant = (roleId: number) => {
    switch (roleId) {
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-3 p-6">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800">Failed to load dashboard</h3>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
                <Button 
                  onClick={loadDashboardData} 
                  variant="outline" 
                  size="sm"
                  className="ml-auto"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back! Here&apos;s what&apos;s happening with your users today.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              // Loading state
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="mt-3">
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mt-2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                {/* Total Users */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
                      <Users className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                      <p className="text-xs text-gray-500">
                        {stats?.adminCount || 0} admins, {stats?.clientCount || 0} clients
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* New Users Today */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <h3 className="text-sm font-medium text-gray-600">New Today</h3>
                      <UserPlus className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gray-900">{stats?.newUsersToday || 0}</p>
                      <p className="text-xs text-gray-500">
                        Users registered today
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Growth */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <h3 className="text-sm font-medium text-gray-600">This Week</h3>
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gray-900">{stats?.newUsersThisWeek || 0}</p>
                      <div className="flex items-center text-xs">
                        {stats && stats.userGrowthPercentage >= 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                            <span className="text-green-600">+{stats.userGrowthPercentage.toFixed(1)}%</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                            <span className="text-red-600">{stats?.userGrowthPercentage.toFixed(1)}%</span>
                          </>
                        )}
                        <span className="text-gray-500 ml-1">from last week</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Score */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <h3 className="text-sm font-medium text-gray-600">Activity</h3>
                      <Activity className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gray-900">
                        {stats ? Math.round((stats.newUsersThisWeek / Math.max(stats.totalUsers, 1)) * 100) : 0}%
                      </p>
                      <p className="text-xs text-gray-500">
                        Weekly activity rate
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Users */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                <div>
                  <CardTitle className="text-lg font-semibold">Recent Users</CardTitle>
                  <CardDescription>Latest registered users in your system</CardDescription>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/users">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : stats?.recentUsers && stats.recentUsers.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentUsers.map((user) => (
                      <div key={user.user_id} className="flex items-center justify-between space-x-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-black text-white font-semibold text-sm">
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </p>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs text-gray-500">{user.email}</p>
                              <Badge className={`text-xs ${getRoleBadgeVariant(user.role_id)}`}>
                                {getRoleName(user.role_id)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {format(new Date(user.created_at), 'MMM dd')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(user.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No users found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/dashboard/users">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                    <ArrowUpRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>
                
                {/* <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/dashboard/questionnaires">
                    <FileText className="h-4 w-4 mr-2" />
                    View Questionnaires
                    <ArrowUpRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button> */}
                
                {/* <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/dashboard/messages">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                    <ArrowUpRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button> */}
                
                {/* <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/dashboard/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                    <ArrowUpRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button> */}
              </CardContent>
            </Card>
          </div>

        
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}