'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Droplets, TrendingUp, Calendar } from 'lucide-react';
import { waterApi, WaterTrackingData, WaterStatsDaily } from '@/lib/api';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface WaterViewProps {
  userId: number;
}

export default function WaterView({ userId }: WaterViewProps) {
  const [stats, setStats] = useState<WaterStatsDaily | null>(null);
  const [intake, setIntake] = useState<WaterTrackingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWaterData();
  }, [userId]);

  const loadWaterData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get today's stats using admin route
    //   const todayStats = await waterApi.getUserDailyStats(userId);
    //   setStats(todayStats);

      // Get last 30 days of intake
      const endDate = new Date();
      const startDate = subDays(endDate, 30);
      
      // Note: Since there's no admin route to get user's intake history,
      // we'll use the regular getIntakes endpoint
      // You may need to add an admin endpoint in your API for this
      const intakeData = await waterApi.getIntakes({
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        limit: 100,
        order: 'desc'
      });
      setIntake(intakeData);
    } catch (err: unknown) {
      console.error('Failed to load water data:', err);
      setError('Failed to load water tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data - group by date and sum intake
  const groupedData = intake.reduce((acc, entry) => {
    const date = format(new Date(entry.created_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += entry.water_intake;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(groupedData)
    .map(([date, totalIntake]) => ({
      date: format(new Date(date), 'MMM dd'),
      intake: totalIntake,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14); // Last 14 days

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Today&apos;s Intake</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              <p className="text-2xl font-bold">{stats?.total_intake_ml || 0} ml</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Goal: {stats?.goal_ml || 0} ml
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <p className="text-2xl font-bold">
                {Math.round(stats?.progress_percentage || 0)}%
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.goal_reached ? 'Goal reached! 🎉' : `${stats?.remaining_ml || 0} ml remaining`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Entries Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <p className="text-2xl font-bold">{stats?.entry_count || 0}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">Times logged today</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Last 14 Days</CardTitle>
          <CardDescription>Daily water intake tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIntake" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'ml', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="intake"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorIntake)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No water intake data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Logs</CardTitle>
          <CardDescription>Latest water intake entries</CardDescription>
        </CardHeader>
        <CardContent>
          {intake.length > 0 ? (
            <div className="space-y-2">
              {intake.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">{entry.water_intake} ml</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No logs available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}