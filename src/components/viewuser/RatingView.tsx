import { useEffect, useState } from 'react';
import { ratingApi, DayRating } from '@/lib/api';
import { Star } from 'lucide-react';

interface RatingViewProps {
  userId: number;
}

export function RatingView({ userId }: RatingViewProps) {
  const [ratings, setRatings] = useState<DayRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRatings();
  }, [userId]);

  const loadRatings = async () => {
    try {
      const data = await ratingApi.getUserRatings(userId);
      setRatings(data);
    } catch (err) {
      console.error('Failed to load ratings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const averageScore = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + (r.score || 0), 0) / ratings.length
    : 0;

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <p className="text-2xl font-bold">{averageScore.toFixed(1)} / 5</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{ratings.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rating History</CardTitle>
          <CardDescription>Daily mood and progress ratings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ratings.length > 0 ? (
              ratings.map((rating) => (
                <div key={rating.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-1">{renderStars(rating.score || 0)}</div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(rating.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {rating.note && (
                    <p className="text-sm text-gray-700 mt-2">{rating.note}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No ratings available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default { RatingView };