'use client';

import { useEffect, useState } from 'react';
import { questionnaireApi, QuestionnaireData } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Activity, Clock, Home, Briefcase, Calendar } from 'lucide-react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface QuestionnaireViewProps {
  userId: number;
}

export function QuestionnaireView({ userId }: QuestionnaireViewProps) {
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuestionnaire();
  }, [userId]);

  const loadQuestionnaire = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await questionnaireApi.getByUserId(userId);
      setQuestionnaire(data);
    } catch (err) {
      console.error('Failed to load questionnaire:', err);
      setError('Failed to load questionnaire data');
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

  if (!questionnaire) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">User has not completed the questionnaire yet</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate age from birthday
  const getAgeDisplay = () => {
    if (!questionnaire.birthday) return 'N/A';
    
    try {
      const birthDate = parseISO(questionnaire.birthday.toString());
      const age = differenceInYears(new Date(), birthDate);
      const formattedDate = format(birthDate, 'MMM dd, yyyy');
      return (
        <div>
          <span className="text-2xl font-semibold text-gray-900">{age} years old</span>
          <span className="text-sm text-gray-500 block mt-1">Born: {formattedDate}</span>
        </div>
      );
    } catch {
      return questionnaire.age;
    }
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Questionnaire Responses
          </CardTitle>
          <CardDescription>
            {questionnaire.created_at && (
              <>Submitted {format(new Date(questionnaire.created_at), 'MMM dd, yyyy \'at\' HH:mm')}</>
            )}
            {questionnaire.updated_at && questionnaire.created_at !== questionnaire.updated_at && (
              <> • Updated {format(new Date(questionnaire.updated_at), 'MMM dd, yyyy \'at\' HH:mm')}</>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Physical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Physical Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Weight</label>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {questionnaire.weight ? `${questionnaire.weight} kg` : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Height</label>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {questionnaire.height ? `${questionnaire.height} cm` : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Age & Birthday</label>
              <div className="mt-1">
                {getAgeDisplay()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health & Lifestyle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health & Lifestyle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Health Issues</label>
            <p className="text-base text-gray-900 mt-1 p-3 bg-gray-50 rounded-md">
              {questionnaire.health_issues || 'None reported'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Habits to Improve</label>
            <p className="text-base text-gray-900 mt-1 p-3 bg-gray-50 rounded-md">
              {questionnaire.bad_habits || 'None reported'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Training & Work Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Training & Work Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Home className="h-4 w-4" />
                Workout Environment
              </label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {questionnaire.workout_environment 
                  ? capitalizeFirst(questionnaire.workout_environment)
                  : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Work Shift
              </label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {questionnaire.work_shift 
                  ? capitalizeFirst(questionnaire.work_shift)
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-500">Wake Up Time</label>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {questionnaire.wake_up_time || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Sleep Time</label>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {questionnaire.sleep_time || 'N/A'}
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Morning Routine</label>
              <p className="text-base text-gray-900 mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                {questionnaire.morning_routine || 'Not specified'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Evening Routine</label>
              <p className="text-base text-gray-900 mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                {questionnaire.evening_routine || 'Not specified'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuestionnaireView;