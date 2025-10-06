'use client';

import { useEffect, useState } from 'react';
import { progressPhotoApi, ProgressPhotoData } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

interface PhotosViewProps {
  userId: number;
}

export function PhotosView({ userId }: PhotosViewProps) {
  const [photos, setPhotos] = useState<ProgressPhotoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAngle, setSelectedAngle] = useState<'front' | 'side' | 'back' | 'all'>('all');

  useEffect(() => {
    loadPhotos();
  }, [userId]);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await progressPhotoApi.getAll(userId);
      setPhotos(data);
    } catch (err) {
      console.error('Failed to load photos:', err);
      setError('Failed to load progress photos');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const filteredPhotos = selectedAngle === 'all'
    ? photos
    : photos.filter(p => p.angle === selectedAngle);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Progress Photos</CardTitle>
          <CardDescription>Track visual progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={(v) => setSelectedAngle(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="front">Front</TabsTrigger>
              <TabsTrigger value="side">Side</TabsTrigger>
              <TabsTrigger value="back">Back</TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.length > 0 ? (
                filteredPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={photo.image_url}
                        alt={`Progress photo - ${photo.angle}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs font-medium text-gray-600 capitalize">{photo.angle}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(photo.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No photos available for this angle
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default PhotosView;