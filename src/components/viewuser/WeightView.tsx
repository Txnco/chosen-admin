'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Scale, TrendingUp, TrendingDown } from 'lucide-react';
import { weightApi, WeightTracking } from '@/lib/api';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeightViewProps {
  userId: number;
}

export function WeightView({ userId }: WeightViewProps) {
  const [weights, setWeights] = useState<WeightTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWeightData();
  }, [userId]);

  const loadWeightData = async () => {
    try {
      const data = await weightApi.getUserWeight(userId);
      setWeights(data);
    } catch (err) {
      console.error('Failed to load weight data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const chartData = weights
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(w => ({
      date: format(new Date(w.date), 'MMM dd'),
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
              ) : (
                <TrendingDown className="h-5 w-5 text-green-500" />
              )}
              <p className="text-2xl font-bold">
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{weights.length}</p>
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
                <YAxis label={{ value: 'kg', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} />
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
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {weights.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{entry.weight} kg</p>
                  <p className="text-xs text-gray-500">{format(new Date(entry.date), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default { WeightView };
