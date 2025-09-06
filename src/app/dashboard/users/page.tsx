'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  Eye, 
  UserPlus, 
  MoreHorizontal,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Trash2,
  Edit,
  Upload
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { userApi, authApi, UserData, CreateUserData, UpdateUserData } from '@/lib/api';
import { format } from 'date-fns';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

// Utility function to generate secure password
const generatePassword = (): string => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | '1' | '2'>('all');

  // File input refs
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [newUser, setNewUser] = useState<CreateUserData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [newUserProfilePicture, setNewUserProfilePicture] = useState<File | null>(null);
  const [newUserPreviewUrl, setNewUserPreviewUrl] = useState<string>('');

  // Edit User Modal State
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [userToEdit, setUserToEdit] = useState<UserData | null>(null);
  const [editUserData, setEditUserData] = useState<UpdateUserData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role_id: 2,
  });
  const [editUserProfilePicture, setEditUserProfilePicture] = useState<File | null>(null);
  const [editUserPreviewUrl, setEditUserPreviewUrl] = useState<string>('');

  // Delete User Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const router = useRouter();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await userApi.getAll();
      setUsers(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access denied. You need admin privileges to view users.');
      } else {
        setError('Failed to load users. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection for create user
  const handleCreateFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setCreateError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setCreateError('File size must be less than 5MB');
        return;
      }

      setNewUserProfilePicture(file);
      const previewUrl = URL.createObjectURL(file);
      setNewUserPreviewUrl(previewUrl);
      setCreateError('');
    }
  };

  // Handle file selection for edit user
  const handleEditFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUpdateError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUpdateError('File size must be less than 5MB');
        return;
      }

      setEditUserProfilePicture(file);
      const previewUrl = URL.createObjectURL(file);
      setEditUserPreviewUrl(previewUrl);
      setUpdateError('');
    }
  };

  // Remove selected file for create user
  const removeCreateProfilePicture = () => {
      console.log('Removing create profile picture');
      
      // Clean up the object URL to prevent memory leaks
      if (newUserPreviewUrl) {
        URL.revokeObjectURL(newUserPreviewUrl);
      }
      
      // Reset all related state
      setNewUserProfilePicture(null);
      setNewUserPreviewUrl(''); // Always clear this state
      
      // Clear the file input
      if (createFileInputRef.current) {
        createFileInputRef.current.value = '';
      }
      
      // Clear any related errors
      setCreateError('');
    };

  const removeEditProfilePicture = () => {
    console.log('Removing edit profile picture');
    
    // Clean up the object URL to prevent memory leaks
    if (editUserPreviewUrl) {
      URL.revokeObjectURL(editUserPreviewUrl);
    }
    
    // Reset all related state
    setEditUserProfilePicture(null);
    setEditUserPreviewUrl(''); // Always clear this state
    
    // Clear the file input
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
    
    // Clear any related errors
    setUpdateError('');
  };

  const handleCreateUser = async () => {
    try {
      setIsCreatingUser(true);
      setCreateError('');
      setCreateSuccess('');

      // Validate required fields
      if (!newUser.first_name.trim() || !newUser.last_name.trim() || !newUser.email.trim()) {
        setCreateError('Please fill in all required fields');
        return;
      }

      // Generate password if not provided
      const password = newUser.password.trim() || generatePassword();
      
      const userData: CreateUserData = {
        first_name: newUser.first_name.trim(),
        last_name: newUser.last_name.trim(),
        email: newUser.email.trim(),
        password: password,
        profile_picture: newUserProfilePicture || undefined,
      };

      await authApi.register(userData);
      
      setCreateSuccess(`User created successfully! Password: ${password}`);
      
      // Reset form
      setNewUser({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
      });
      removeCreateProfilePicture();

      // Reload users
      await loadUsers();

    } catch (err: any) {
      console.error('Failed to create user:', err);
      if (err.response?.status === 400) {
        setCreateError('A user with this email already exists');
      } else {
        setCreateError('Failed to create user. Please try again.');
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!userToEdit) return;
    
    try {
      setIsUpdatingUser(true);
      setUpdateError('');
      setUpdateSuccess('');

      // Validate required fields
      if (!editUserData.first_name?.trim() || !editUserData.last_name?.trim() || !editUserData.email?.trim()) {
        setUpdateError('Please fill in all required fields');
        return;
      }

      // Prepare update data
      const updateData: UpdateUserData = {
        first_name: editUserData.first_name.trim(),
        last_name: editUserData.last_name.trim(),
        email: editUserData.email.trim(),
        role_id: editUserData.role_id,
        profile_picture: editUserProfilePicture || undefined,
      };

      if (editUserData.password?.trim()) {
        updateData.password = editUserData.password.trim();
      }

      const response = await userApi.updateUser(updateData, userToEdit.user_id);
      
      setUpdateSuccess('User updated successfully!');
      
      // Update user in local state
      setUsers(prev => prev.map(user => 
        user.user_id === userToEdit.user_id 
          ? { ...user, ...updateData, updated_at: new Date().toISOString() }
          : user
      ));

      // Close modal after 2 seconds
      setTimeout(() => {
        setIsEditUserOpen(false);
        setUpdateSuccess('');
        setUserToEdit(null);
      }, 2000);

    } catch (err: any) {
      console.error('Failed to update user:', err);
      if (err.response?.status === 400) {
        setUpdateError('Email already in use or invalid data');
      } else if (err.response?.status === 404) {
        setUpdateError('User not found');
      } else {
        setUpdateError('Failed to update user. Please try again.');
      }
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setIsDeletingUser(true);
      setDeleteError('');
      
      await userApi.deleteUser(userToDelete.user_id);
      
      // Remove user from local state
      setUsers(prev => prev.filter(user => user.user_id !== userToDelete.user_id));
      
      // Close modal
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      if (err.response?.status === 403) {
        setDeleteError('Access denied. You need admin privileges to delete users.');
      } else {
        setDeleteError('Failed to delete user. Please try again.');
      }
    } finally {
      setIsDeletingUser(false);
    }
  };

  const openDeleteModal = (user: UserData) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
    setDeleteError('');
  };

  const openEditModal = (user: UserData) => {
    setUserToEdit(user);
    setEditUserData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: '',
      role_id: user.role_id,
    });
    setIsEditUserOpen(true);
    setUpdateError('');
    setUpdateSuccess('');
    
    // Clear any existing edit state completely
    setEditUserProfilePicture(null);
    setEditUserPreviewUrl('');
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const resetCreateForm = () => {
    setNewUser({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
    });
    setCreateError('');
    setCreateSuccess('');
    removeCreateProfilePicture();
  };

  const resetEditForm = () => {
    setEditUserData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role_id: 2,
    });
    setUpdateError('');
    setUpdateSuccess('');
    setUserToEdit(null);
    removeEditProfilePicture();
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

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1:
        return 'Admin';
      case 2:
        return 'Client';
      default:
        return 'User';
    }
  };

  const getRoleBadgeVariant = (roleId: number) => {
    switch (roleId) {
      case 1:
        return 'bg-red-100 text-red-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewProfile = (userId: number) => {
    router.push(`/dashboard/profile?id=${userId}`);
  };

  const columns: ColumnDef<UserData>[] = [
    {
      accessorKey: 'first_name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 p-0 hover:bg-transparent"
          >
            User
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const user = row.original;
        const profileImageUrl = getProfileImageUrl(user.profile_picture);
        
        return (
          <div className="flex items-center gap-3 pl-3">
            <Avatar className="h-8 w-8">
              {profileImageUrl ? (
                <AvatarImage
                  src={profileImageUrl}
                  alt={`${user.first_name} ${user.last_name}`}
                  className="object-cover w-full h-full rounded-full"
                />
              ) : (
                <AvatarFallback className="bg-black text-white text-xs font-bold">
                  {getUserInitials(user)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="font-medium text-black">
                {user.first_name} {user.last_name}
              </div>
              <div className="text-sm text-gray-500">
                ID: {user.user_id}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 p-0 hover:bg-transparent"
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm text-black">{row.getValue('email')}</div>
      ),
    },
    {
      accessorKey: 'role_id',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 p-0 hover:bg-transparent"
          >
            Role
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const roleId = row.getValue('role_id') as number;
        return (
          <Badge className={`${getRoleBadgeVariant(roleId)} border-0`}>
            {getRoleName(roleId)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        if (value === 'all') return true;
        return row.getValue(id) === parseInt(value);
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 p-0 hover:bg-transparent"
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {format(new Date(row.getValue('created_at')), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'updated_at',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 p-0 hover:bg-transparent"
          >
            Updated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {format(new Date(row.getValue('updated_at')), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        const isAdmin = user.role_id === 1;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewProfile(user.user_id)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="View Profile"
            >
              <Eye className="h-4 w-4 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditModal(user)}
              className="h-8 w-8 p-0 hover:bg-blue-100"
              title="Edit User"
            >
              <Edit className="h-4 w-4 text-gray-600 hover:text-blue-600" />
            </Button>
            {!isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDeleteModal(user)}
                className="h-8 w-8 p-0 hover:bg-red-100"
                title="Delete User"
              >
                <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-600" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const filteredUsers = useMemo(() => {
    if (roleFilter === 'all') return users;
    return users.filter(user => user.role_id === parseInt(roleFilter));
  }, [users, roleFilter]);

  const table = useReactTable({
    data: filteredUsers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: 'includesString',
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (newUserPreviewUrl) URL.revokeObjectURL(newUserPreviewUrl);
      if (editUserPreviewUrl) URL.revokeObjectURL(editUserPreviewUrl);
    };
  }, [newUserPreviewUrl, editUserPreviewUrl]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Button onClick={loadUsers} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">User Management</h2>
            <p className="text-gray-600">
              Manage and monitor all registered users in the system.
            </p>
          </div>
          
          {/* Add User Dialog */}
          <Dialog open={isAddUserOpen} onOpenChange={(open) => {
            setIsAddUserOpen(open);
            if (!open) resetCreateForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-900">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. A password will be generated automatically if not provided.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {createError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{createError}</AlertDescription>
                  </Alert>
                )}
                
                {createSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {createSuccess}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Profile Picture Upload */}
                <div className="space-y-2">
                  <Label>Profile Picture (optional)</Label>
                  <div className="space-y-3">
                        {newUserPreviewUrl && (
                          <div className="flex items-center gap-3">
                            <img
                              src={newUserPreviewUrl}
                              alt="Profile preview"
                              className="w-16 h-16 rounded-full object-cover border"
                            />
                            <p className="text-sm text-gray-600">
                              {newUserProfilePicture?.name}
                            </p>
                          </div>
                        )}

                        <input
                          ref={createFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCreateFileSelect}
                          className="hidden"
                          disabled={isCreatingUser}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => createFileInputRef.current?.click()}
                          disabled={isCreatingUser}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {newUserPreviewUrl ? 'Choose different image' : 'Choose Image'}
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                          PNG, JPG, JPEG up to 5MB
                        </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={newUser.first_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="John"
                      disabled={isCreatingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={newUser.last_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Doe"
                      disabled={isCreatingUser}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john.doe@example.com"
                    disabled={isCreatingUser}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password (optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Leave empty to auto-generate"
                    disabled={isCreatingUser}
                  />
                  <p className="text-xs text-gray-500">
                    If left empty, a secure password will be generated automatically
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddUserOpen(false)}
                  disabled={isCreatingUser}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={isCreatingUser}
                  className="bg-black text-white hover:bg-gray-900"
                >
                  {isCreatingUser ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={(open) => {
          setIsEditUserOpen(open);
          if (!open) resetEditForm();
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information. Leave password empty to keep current password.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {updateError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}
              
              {updateSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {updateSuccess}
                  </AlertDescription>
                </Alert>
              )}

              {/* Profile Picture Upload */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="space-y-3">
                    {(editUserPreviewUrl || userToEdit?.profile_picture) && (
                      <div className="flex items-center gap-3">
                        <img
                          src={editUserPreviewUrl || getProfileImageUrl(userToEdit?.profile_picture) || ''}
                          alt="Profile preview"
                          className="w-16 h-16 rounded-full object-cover border"
                        />
                        <p className="text-sm text-gray-600">
                          {editUserProfilePicture?.name || 'Current profile picture'}
                        </p>
                      </div>
                    )}

                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditFileSelect}
                      className="hidden"
                      disabled={isUpdatingUser}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={isUpdatingUser}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {(editUserPreviewUrl || userToEdit?.profile_picture) ? 'Choose different image' : 'Choose Image'}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      PNG, JPG, JPEG up to 5MB
                    </p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name">First Name *</Label>
                  <Input
                    id="edit_first_name"
                    value={editUserData.first_name || ''}
                    onChange={(e) => setEditUserData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="John"
                    disabled={isUpdatingUser}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name">Last Name *</Label>
                  <Input
                    id="edit_last_name"
                    value={editUserData.last_name || ''}
                    onChange={(e) => setEditUserData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Doe"
                    disabled={isUpdatingUser}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editUserData.email || ''}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.doe@example.com"
                  disabled={isUpdatingUser}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_role">Role</Label>
                <Select
                  value={editUserData.role_id?.toString() || '2'}
                  onValueChange={(value) => setEditUserData(prev => ({ ...prev, role_id: parseInt(value) }))}
                  disabled={isUpdatingUser}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Admin</SelectItem>
                    <SelectItem value="2">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_password">New Password (optional)</Label>
                <Input
                  id="edit_password"
                  type="password"
                  value={editUserData.password || ''}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Leave empty to keep current password"
                  disabled={isUpdatingUser}
                />
                <p className="text-xs text-gray-500">
                  Only enter a new password if you want to change it
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditUserOpen(false)}
                disabled={isUpdatingUser}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={isUpdatingUser}
                className="bg-black text-white hover:bg-gray-900"
              >
                {isUpdatingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update User'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation Dialog */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {userToDelete && (
              <div className="py-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    {getProfileImageUrl(userToDelete.profile_picture) ? (
                      <AvatarImage 
                        src={getProfileImageUrl(userToDelete.profile_picture) || ''} 
                        alt={`${userToDelete.first_name} ${userToDelete.last_name}`} 
                      />
                    ) : null}
                    <AvatarFallback className="bg-black text-white text-sm font-bold">
                      {getUserInitials(userToDelete)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-black">
                      {userToDelete.first_name} {userToDelete.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {userToDelete.email}
                    </div>
                  </div>
                </div>
                
                {deleteError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{deleteError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingUser}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={isDeletingUser}
              >
                {isDeletingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Global Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search all columns..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={(value: 'all' | '1' | '2') => setRoleFilter(value)}>
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="1">Admins</SelectItem>
              <SelectItem value="2">Clients</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(globalFilter || roleFilter !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setGlobalFilter('');
                setRoleFilter('all');
              }}
              className="h-10"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {table.getFilteredRowModel().rows.length} of {users.length} users
        </div>

        {/* Data Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="text-left py-4">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-gray-300" />
                      <span className="text-gray-500">No users found</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Users</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {renderContent()}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}