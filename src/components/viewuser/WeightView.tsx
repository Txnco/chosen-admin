'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Scale, TrendingUp, TrendingDown } from 'lucide-react';
import { weightTrackingApi, WeightTrackingData } from '@/lib/api';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeightViewProps {
  userId: number;
}

export function WeightView({ userId }: WeightViewProps) {
  const [weights, setWeights] = useState<WeightTrackingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWeightData();
  }, [userId]);

  const loadWeightData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await weightTrackingApi.getAll(userId);
      // Sort by date descending (most recent first)
      const sortedData = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setWeights(sortedData);
    } catch (err: unknown) {
      console.error('Failed to load weight data:', err);
      setError('Failed to load weight tracking data');
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
        <CardContent className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data (sorted chronologically for display)
  const chartData = [...weights]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(w => ({
      date: format(new Date(w.created_at), 'MMM dd'),
      weight: w.weight,
    }));

  const currentWeight = weights[0]?.weight || 0;
  const previousWeight = weights[1]?.weight || 0;
  const weightChange = currentWeight - previousWeight;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Current Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-500" />
              <p className="text-2xl font-bold">{currentWeight} kg</p>
            </div>
            {weights[0]?.created_at && (
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(weights[0].created_at), 'MMM dd, yyyy')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {weightChange > 0 ? (
                <TrendingUp className="h-5 w-5 text-red-500" />
              ) : weightChange < 0 ? (
                <TrendingDown className="h-5 w-5 text-green-500" />
              ) : (
                <Scale className="h-5 w-5 text-gray-400" />
              )}
              <p className="text-2xl font-bold">
                {weightChange > 0 ? '+' : ''}{weightChange} kg
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {weightChange === 0 ? 'No change' : 'From previous entry'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{weights.length}</p>
            <p className="text-xs text-gray-500 mt-1">Weight logs recorded</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weight Trend</CardTitle>
          <CardDescription>Weight tracking over time</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  label={{ value: 'kg', angle: -90, position: 'insideLeft' }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No weight data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weight History</CardTitle>
          <CardDescription>All recorded weight entries</CardDescription>
        </CardHeader>
        <CardContent>
          {weights.length > 0 ? (
            <div className="space-y-2">
              {weights.map((entry, index) => {
                const previousEntry = weights[index + 1];
                const change = previousEntry ? entry.weight - previousEntry.weight : 0;
                
                return (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Scale className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">{entry.weight} kg</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    {index < weights.length - 1 && (
                      <div className="flex items-center gap-1">
                        {change > 0 ? (
                          <TrendingUp className="h-3 w-3 text-red-500" />
                        ) : change < 0 ? (
                          <TrendingDown className="h-3 w-3 text-green-500" />
                        ) : null}
                        <span className={`text-xs font-medium ${
                          change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {change > 0 ? '+' : ''}{change} kg
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No weight entries recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WeightView;