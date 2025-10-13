'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Calendar,
  Shield,
  ArrowLeft,
  Edit,
  Clock,
  AlertCircle,
  KeyRound,
  UserMinus,
  Activity,
  Settings
} from 'lucide-react';
import { userApi, UserData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

function ProfileSkeleton() {
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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Profile</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ProfilePageInner() {
  const [profileUser, setProfileUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCurrentUser, setIsCurrentUser] = useState(true);

  const { user: currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const targetUserId = userId ? parseInt(userId) : undefined;
      const profileData = await userApi.getProfile(targetUserId);
      setProfileUser(profileData);
      setIsCurrentUser(!targetUserId || targetUserId === currentUser?.user_id);
    } catch (error: unknown) {
      console.error('Failed to load profile:', error);
      if (typeof error === 'object' && error && 'response' in error) {
        const e = error as { response?: { status?: number } };
        if (e.response?.status === 404) {
          setError('User not found');
        } else if (e.response?.status === 403) {
          setError('Access denied');
        } else {
          setError('Failed to load profile. Please try again.');
        }
      } else {
        setError('Failed to load profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentUser?.user_id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const getUserInitials = (user: UserData) => {
    const first = user.first_name?.charAt(0) || '';
    const last = user.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getProfileImageUrl = (profilePicture?: string) => {
    if (!profilePicture) return null;
    return process.env.NEXT_PUBLIC_UPLOADS_PATH +`/uploads/profile/${profilePicture}`;
  };

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1: return 'Administrator';
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

  const handleResetPassword = () => {
    console.log('Reset password for user:', profileUser?.user_id);
  };

  const handleSuspendAccount = () => {
    console.log('Suspend account for user:', profileUser?.user_id);
  };

  const handleEditProfile = () => {
    console.log('Edit profile for user:', profileUser?.user_id);
  };

  // Error state
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
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Profile</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <h2 className="text-2xl font-bold text-black">Profile</h2>
              </div>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (isLoading || !profileUser) {
    return <ProfileSkeleton />;
  }

  const profileImageUrl = getProfileImageUrl(profileUser.profile_picture);

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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                {!isCurrentUser && (
                  <>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/dashboard/users">Users</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </>
                )}
                <BreadcrumbItem>
                  <BreadcrumbPage>Profile</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!isCurrentUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {isCurrentUser ? 'My Profile' : 'User Profile'}
                  </h1>
                  <p className="text-gray-600">
                    {isCurrentUser
                      ? 'Manage your account settings'
                      : `Profile for ${profileUser.first_name} ${profileUser.last_name}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isCurrentUser && (
                  <Button onClick={handleEditProfile} className="bg-black text-white hover:bg-gray-900">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

          {/* Main Profile Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Card */}
            <Card className="lg:col-span-1 h-fit">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="w-24 h-24 border-4 border-gray-100">
                    {profileImageUrl ? (
                      <AvatarImage
                        src={profileImageUrl}
                        alt={`${profileUser.first_name} ${profileUser.last_name}`}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-black text-white text-2xl font-bold">
                      {getUserInitials(profileUser)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {profileUser.first_name} {profileUser.last_name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{profileUser.email}</span>
                    </div>
                    <Badge className={`${getRoleBadgeVariant(profileUser.role_id)} border`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {getRoleName(profileUser.role_id)}
                    </Badge>
                  </div>

                  <div className="w-full pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">User ID</span>
                      <span className="font-medium">#{profileUser.user_id}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Joined</span>
                      <span className="font-medium">
                        {format(new Date(profileUser.created_at), 'MMM yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
                <CardDescription>Basic account details and timestamps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">First Name</label>
                    <p className="text-gray-900 font-medium">{profileUser.first_name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Last Name</label>
                    <p className="text-gray-900 font-medium">{profileUser.last_name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-gray-900 font-medium">{profileUser.email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <Badge className={`${getRoleBadgeVariant(profileUser.role_id)} border w-fit ml-2`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {getRoleName(profileUser.role_id)}
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Account Timeline</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Created</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(profileUser.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Updated</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(profileUser.updated_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {!isCurrentUser && currentUser?.role_id === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <Settings className="w-5 h-5" />
                  Administrative Actions
                </CardTitle>
                <CardDescription>Manage this user&apos;s account and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={handleResetPassword}
                    className="flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    Reset Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSuspendAccount}
                    className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200"
                  >
                    <UserMinus className="w-4 h-4" />
                    Suspend Account
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    View Activity Log
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfilePageInner />
      </Suspense>
    </ProtectedRoute>
  );
}