import { useEffect, useState } from 'react';
import { questionnaireApi, Questionnaire } from '@/lib/api';

interface QuestionnaireViewProps {
  userId: number;
}

export function QuestionnaireView({ userId }: QuestionnaireViewProps) {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQuestionnaire();
  }, [userId]);

  const loadQuestionnaire = async () => {
    try {
      const data = await questionnaireApi.getUserQuestionnaire(userId);
      setQuestionnaire(data);
    } catch (err) {
      console.error('Failed to load questionnaire:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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

  const fields = [
    { label: 'Weight', value: questionnaire.weight ? `${questionnaire.weight} kg` : 'N/A' },
    { label: 'Height', value: questionnaire.height ? `${questionnaire.height} cm` : 'N/A' },
    { label: 'Age', value: questionnaire.age || 'N/A' },
    { label: 'Health Issues', value: questionnaire.health_issues || 'None' },
    { label: 'Bad Habits', value: questionnaire.bad_habits || 'None' },
    { label: 'Workout Environment', value: questionnaire.workout_environment || 'N/A' },
    { label: 'Work Shift', value: questionnaire.work_shift || 'N/A' },
    { label: 'Wake Up Time', value: questionnaire.wake_up_time || 'N/A' },
    { label: 'Sleep Time', value: questionnaire.sleep_time || 'N/A' },
    { label: 'Morning Routine', value: questionnaire.morning_routine || 'None' },
    { label: 'Evening Routine', value: questionnaire.evening_routine || 'None' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Questionnaire Responses</CardTitle>
          <CardDescription>
            Submitted on {format(new Date(questionnaire.created_at), 'MMM dd, yyyy HH:mm')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-1">{field.label}</p>
                <p className="text-base text-gray-900">{field.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default {  QuestionnaireView };