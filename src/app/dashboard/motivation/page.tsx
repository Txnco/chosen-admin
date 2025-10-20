"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, RefreshCw } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { motivationalQuoteApi, MotivationalQuoteData } from '@/lib/api';
import { toast } from 'sonner';

export default function MotivationalQuotesPage() {
  const [quotes, setQuotes] = useState<MotivationalQuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<MotivationalQuoteData | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    quote: '',
    author: '',
    is_active: true,
  });

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const data = await motivationalQuoteApi.getAll();
      setQuotes(data);
    } catch (err) {
      toast.error('Failed to fetch quotes', {
        description: 'Please try again later.',
      });
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.quote.trim()) {
        toast.error('Quote text is required', {
          description: 'Please enter a quote before creating.',
        });
        return;
      }

      await motivationalQuoteApi.create({
        quote: formData.quote,
        author: formData.author || undefined,
        is_active: formData.is_active,
      });

      toast.success('Quote created successfully!', {
        description: 'The new quote has been added to the system.',
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      fetchQuotes();
    } catch (err) {
      toast.error('Failed to create quote', {
        description: 'Please try again later.',
      });
      console.error('Error creating quote:', err);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!selectedQuote || !formData.quote.trim()) {
        toast.error('Quote text is required', {
          description: 'Please enter a quote before updating.',
        });
        return;
      }

      await motivationalQuoteApi.update(selectedQuote.id, {
        quote: formData.quote,
        author: formData.author || undefined,
        is_active: formData.is_active,
      });

      toast.success('Quote updated successfully!', {
        description: 'Your changes have been saved.',
      });
      
      setIsEditDialogOpen(false);
      resetForm();
      fetchQuotes();
    } catch (err) {
      toast.error('Failed to update quote', {
        description: 'Please try again later.',
      });
      console.error('Error updating quote:', err);
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedQuote) return;

      await motivationalQuoteApi.delete(selectedQuote.id);
      
      toast.success('Quote deleted successfully!', {
        description: 'The quote has been removed from the system.',
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedQuote(null);
      fetchQuotes();
    } catch (err) {
      toast.error('Failed to delete quote', {
        description: 'Please try again later.',
      });
      console.error('Error deleting quote:', err);
    }
  };

  const openEditDialog = (quote: MotivationalQuoteData) => {
    setSelectedQuote(quote);
    setFormData({
      quote: quote.quote,
      author: quote.author || '',
      is_active: quote.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (quote: MotivationalQuoteData) => {
    setSelectedQuote(quote);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      quote: '',
      author: '',
      is_active: true,
    });
    setSelectedQuote(null);
  };

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.quote.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
                    <BreadcrumbPage>Motivational Quotes</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Motivational Quotes</h1>
              <p className="text-gray-600">
                Manage motivational quotes that appear to users
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search quotes or authors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={fetchQuotes}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Quote
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Times Shown</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Shown</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-500">Loading quotes...</p>
                        </td>
                      </tr>
                    ) : filteredQuotes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center">
                          <p className="text-gray-500">
                            {searchTerm ? 'No quotes found matching your search.' : 'No quotes yet. Create your first one!'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredQuotes.map((quote) => (
                        <tr key={quote.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 max-w-md">
                            <p className="line-clamp-2 text-sm text-gray-900">{quote.quote}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {quote.author || <span className="text-gray-400 italic">Unknown</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={quote.is_active ? 'default' : 'secondary'}>
                              {quote.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.times_shown}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {quote.last_shown_at 
                              ? formatDate(quote.last_shown_at)
                              : <span className="text-gray-400 italic">Never</span>
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(quote.created_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(quote)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(quote)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Quote</DialogTitle>
                  <DialogDescription>
                    Create a new motivational quote for users
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-quote">Quote *</Label>
                    <Textarea
                      id="create-quote"
                      placeholder="Enter the motivational quote..."
                      value={formData.quote}
                      onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-author">Author</Label>
                    <Input
                      id="create-author"
                      placeholder="Enter author name (optional)"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="create-active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="create-active">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>Create Quote</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit Quote</DialogTitle>
                  <DialogDescription>
                    Update the motivational quote
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-quote">Quote *</Label>
                    <Textarea
                      id="edit-quote"
                      placeholder="Enter the motivational quote..."
                      value={formData.quote}
                      onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-author">Author</Label>
                    <Input
                      id="edit-author"
                      placeholder="Enter author name (optional)"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="edit-active">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsEditDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate}>Update Quote</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the quote: "{selectedQuote?.quote}".
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedQuote(null);
                  }}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}