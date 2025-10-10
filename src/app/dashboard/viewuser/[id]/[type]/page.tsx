'use client';
// src\app\dashboard\viewuser\[id]\[type]\page.tsx
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  AlertCircle, 
  Droplets,
  Scale,
  Star,
  Camera,
  ClipboardList,
  Calendar as CalendarIcon
} from 'lucide-react';
import { userApi, UserData } from '@/lib/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ClientSelector } from '@/components/ClientSelector';

// Import view components
import WaterView from '@/components/viewuser/WaterView';
import WeightView from '@/components/viewuser/WeightView';
import RatingView from '@/components/viewuser/RatingView';
import PhotosView from '@/components/viewuser/PhotosView';
import QuestionnaireView from '@/components/viewuser/QuestionnaireView';
import CalendarView from '@/components/viewuser/CalendarView';

type ViewType = 'water' | 'weight' | 'rating' | 'photos' | 'questionnaire' | 'calendar';

const validTypes: ViewType[] = ['water', 'weight', 'rating', 'photos', 'questionnaire', 'calendar'];

const tabConfig: Record<ViewType, { label: string; shortLabel: string; icon: React.ElementType }> = {
  water: { label: 'Water Tracking', shortLabel: 'Water', icon: Droplets },
  weight: { label: 'Weight Tracking', shortLabel: 'Weight', icon: Scale },
  rating: { label: 'Daily Ratings', shortLabel: 'Ratings', icon: Star },
  photos: { label: 'Progress Photos', shortLabel: 'Photos', icon: Camera },
  questionnaire: { label: 'Questionnaire', shortLabel: 'Form', icon: ClipboardList },
  calendar: { label: 'Calendar', shortLabel: 'Calendar', icon: CalendarIcon },
};

function ViewUserPageInner() {
  const router = useRouter();
  const params = useParams();
  
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
      
      setUser(userData);
    } catch (err: unknown) {
      console.error('Failed to load user:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
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
      case 'calendar':
        return <CalendarView userId={user.user_id} />;
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
          <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'User not found'}</AlertDescription>
            </Alert>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b bg-white sticky top-0 z-40">
          <div className="flex items-center gap-2 px-3 md:px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            
            {/* Breadcrumb - Hidden on mobile */}
            <Breadcrumb className="hidden lg:flex flex-1">
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

   

            {/* Client Selector */}
            <div className="flex items-center md:gap-3 ml-auto">
              <div className="hidden sm:block">
                <ClientSelector currentUserId={userId} />
              </div>
              
              {/* Mobile Client Selector - Compact version */}
              <div className="sm:hidden">
                <ClientSelector currentUserId={userId} />
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="border-b bg-white sticky top-14 md:top-16 z-30">
          {/* Desktop Tabs */}
          <div className="hidden md:flex gap-1 px-4 overflow-x-auto scrollbar-hide">
            {validTypes.map((type) => {
              const isActive = viewType === type;
              const Icon = tabConfig[type].icon;
              
              return (
                <Link
                  key={type}
                  href={`/dashboard/viewuser/${userId}/${type}`}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                    isActive
                      ? 'border-black text-black bg-gray-50'
                      : 'border-transparent text-gray-600 hover:text-black hover:border-gray-300 hover:bg-gray-50/50'
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4",
                    isActive ? "text-black" : "text-gray-500"
                  )} />
                  <span>{tabConfig[type].label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Tabs - Compact with icons and short labels */}
          <div className="flex md:hidden justify-around px-2 overflow-x-auto scrollbar-hide">
            {validTypes.map((type) => {
              const isActive = viewType === type;
              const Icon = tabConfig[type].icon;
              
              return (
                <Link
                  key={type}
                  href={`/dashboard/viewuser/${userId}/${type}`}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2.5 text-xs font-medium border-b-2 transition-all min-w-[60px]',
                    isActive
                      ? 'border-black text-black bg-gray-50'
                      : 'border-transparent text-gray-600 active:text-black active:border-gray-300'
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5",
                    isActive ? "text-black" : "text-gray-500"
                  )} />
                  <span className="text-[10px] leading-tight text-center">
                    {tabConfig[type].shortLabel}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 md:p-4 lg:p-6">
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