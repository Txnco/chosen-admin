'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { userApi, UserData } from '@/lib/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Import view components (we'll create these next)
import WaterView from '@/components/viewuser/WaterView';
import WeightView from '@/components/viewuser/WeightView';
import RatingView from '@/components/viewuser/RatingView';
import PhotosView from '@/components/viewuser/PhotosView';
import QuestionnaireView from '@/components/viewuser/QuestionnaireView';

type ViewType = 'water' | 'weight' | 'rating' | 'photos' | 'questionnaire';

const validTypes: ViewType[] = ['water', 'weight', 'rating', 'photos', 'questionnaire'];

const tabConfig: Record<ViewType, { label: string; icon: string }> = {
  water: { label: 'Water Tracking', icon: '💧' },
  weight: { label: 'Weight Tracking', icon: '⚖️' },
  rating: { label: 'Daily Ratings', icon: '⭐' },
  photos: { label: 'Progress Photos', icon: '📸' },
  questionnaire: { label: 'Questionnaire', icon: '📋' },
};

function ViewUserPageInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const userId = params.id ? parseInt(params.id as string) : null;
  const viewType = (params.type as ViewType) || 'water';
  
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Validate and redirect if invalid type
  useEffect(() => {
    if (!validTypes.includes(viewType as ViewType)) {
      router.replace(`/dashboard/viewuser/${userId}/water`);
    }
  }, [viewType, userId, router]);

  // Load user data
  useEffect(() => {
    if (!userId) {
      setError('Invalid user ID');
      setIsLoading(false);
      return;
    }

    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError('');
      const userData = await userApi.getById(userId!);
      
      // Check if user is a client (role_id = 2)
      if (userData.role_id !== 2) {
        setError('This view is only available for client users');
        return;
      }
      
      setUser(userData);
    } catch (err: any) {
      console.error('Failed to load user:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
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

  const renderView = () => {
    if (!user) return null;

    switch (viewType) {
      case 'water':
        return <WaterView userId={user.user_id} />;
      case 'weight':
        return <WeightView userId={user.user_id} />;
      case 'rating':
        return <RatingView userId={user.user_id} />;
      case 'photos':
        return <PhotosView userId={user.user_id} />;
      case 'questionnaire':
        return <QuestionnaireView userId={user.user_id} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !user) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col items-center justify-center h-screen gap-4">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'User not found'}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/dashboard/users')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const profileImageUrl = getProfileImageUrl(user.profile_picture);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white sticky top-0 z-40">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            
            {/* Breadcrumb */}
            <Breadcrumb className="flex-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/users">Users</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{user.first_name} {user.last_name}</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{tabConfig[viewType].label}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* User Avatar + Name (Sticky) */}
            <div className="flex items-center gap-3 ml-auto">
              <Avatar className="h-8 w-8 border-2 border-gray-200">
                {profileImageUrl ? (
                  <AvatarImage src={profileImageUrl} alt={`${user.first_name} ${user.last_name}`} />
                ) : null}
                <AvatarFallback className="bg-black text-white text-xs font-bold">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-black">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Client</Badge>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="border-b bg-white sticky top-16 z-30">
          <div className="flex gap-1 px-4 overflow-x-auto">
            {validTypes.map((type) => {
              const isActive = viewType === type;
              return (
                <Link
                  key={type}
                  href={`/dashboard/viewuser/${userId}/${type}`}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    isActive
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
                  )}
                >
                  <span>{tabConfig[type].icon}</span>
                  <span>{tabConfig[type].label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6">
          {renderView()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ViewUserPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
        </div>
      }>
        <ViewUserPageInner />
      </Suspense>
    </ProtectedRoute>
  );
}